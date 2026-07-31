import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../fleet/entities/alert.entity';
import { Vehicle } from '../fleet/entities/vehicle.entity';
import { AlertSeverity, AlertStatus } from '../fleet/entities/enums';

interface WindowStats {
  total: number;
  runningCount: number;
  avgRunningTemp: number | null;
  p95Temp: number | null;
  avgRunningVoltage: number | null;
  rpmSpikes: number;
}

interface FiredRule {
  category: string;
  points: number;
  severity: AlertSeverity;
  reason: string;
}

export interface VehicleRiskResult {
  vehicleId: string;
  vin: string;
  riskScore: number;
  firedRules: FiredRule[];
  alertsCreated: number;
}

@Injectable()
export class RiskScoringService {
  private readonly logger = new Logger(RiskScoringService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
  ) {}

  async computeForVehicles(vehicleIds: string[]): Promise<VehicleRiskResult[]> {
    const results: VehicleRiskResult[] = [];
    for (const id of vehicleIds) {
      const result = await this.computeForVehicle(id);
      if (result) results.push(result);
    }
    return results;
  }

  async computeAll(): Promise<VehicleRiskResult[]> {
    const vehicles = await this.vehicleRepo.find({ select: { id: true } });
    return this.computeForVehicles(vehicles.map((v) => v.id));
  }

  async computeForVehicle(
    vehicleId: string,
  ): Promise<VehicleRiskResult | null> {
    const vehicle = await this.vehicleRepo.findOneBy({ id: vehicleId });
    if (!vehicle) return null;

    const stats = await this.windowStats(vehicleId);
    const firedRules = stats ? this.evaluateRules(stats) : [];
    const riskScore = Math.min(
      100,
      firedRules.reduce((sum, r) => sum + r.points, 0),
    );

    await this.vehicleRepo.update(vehicleId, { riskScore });
    const alertsCreated = await this.createMissingAlerts(
      vehicleId,
      riskScore,
      firedRules,
    );
    if (alertsCreated > 0) {
      this.logger.log(
        `Vehicle ${vehicle.vin}: risk ${riskScore}, ${alertsCreated} new alert(s)`,
      );
    }

    return {
      vehicleId,
      vin: vehicle.vin,
      riskScore,
      firedRules,
      alertsCreated,
    };
  }

  /** Aggregate the last 24h of readings (relative to newest reading). */
  private async windowStats(vehicleId: string): Promise<WindowStats | null> {
    const rows: Array<Record<string, unknown>> = await this.alertRepo.query(
      `
      WITH latest AS (
        SELECT MAX("recordedAt") AS max_ts
        FROM telemetry_readings WHERE "vehicleId" = $1
      )
      SELECT
        COUNT(*)::int                                            AS total,
        COUNT(*) FILTER (WHERE rpm > 500)::int                   AS running_count,
        AVG("engineTemp") FILTER (WHERE rpm > 500)               AS avg_running_temp,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "engineTemp")
          FILTER (WHERE rpm > 500)                               AS p95_temp,
        AVG("batteryVoltage") FILTER (WHERE rpm > 500)           AS avg_running_voltage,
        COUNT(*) FILTER (WHERE rpm > 4800)::int                  AS rpm_spikes
      FROM telemetry_readings, latest
      WHERE "vehicleId" = $1
        AND "recordedAt" >= latest.max_ts - interval '24 hours'
      `,
      [vehicleId],
    );
    const row = rows[0];
    if (!row || Number(row.total) === 0) return null;
    const num = (v: unknown) => (v === null ? null : Number(v));
    return {
      total: Number(row.total),
      runningCount: Number(row.running_count),
      avgRunningTemp: num(row.avg_running_temp),
      p95Temp: num(row.p95_temp),
      avgRunningVoltage: num(row.avg_running_voltage),
      rpmSpikes: Number(row.rpm_spikes),
    };
  }

  private evaluateRules(stats: WindowStats): FiredRule[] {
    const rules: FiredRule[] = [];
    const fmt = (n: number) => n.toFixed(1);

    // Engine overheating — normal running temp is ~88-96°C.
    if (stats.p95Temp !== null && stats.runningCount >= 5) {
      const t = stats.p95Temp;
      if (t >= 110) {
        rules.push({
          category: 'overheating',
          points: 65,
          severity: AlertSeverity.HIGH,
          reason: `overheating: p95 engine temp ${fmt(t)}°C in last 24h (critical, normal <96°C)`,
        });
      } else if (t >= 102) {
        rules.push({
          category: 'overheating',
          points: 35,
          severity: AlertSeverity.MEDIUM,
          reason: `overheating: p95 engine temp ${fmt(t)}°C in last 24h (elevated, normal <96°C)`,
        });
      } else if (t >= 96) {
        rules.push({
          category: 'overheating',
          points: 15,
          severity: AlertSeverity.LOW,
          reason: `overheating: p95 engine temp ${fmt(t)}°C in last 24h (slightly elevated)`,
        });
      }
    }

    // Charging system — healthy alternator holds ~13.5-14.2V while running.
    if (stats.avgRunningVoltage !== null && stats.runningCount >= 5) {
      const v = stats.avgRunningVoltage;
      if (v < 12.6) {
        rules.push({
          category: 'battery',
          points: 65,
          severity: AlertSeverity.HIGH,
          reason: `battery: avg running voltage ${fmt(v)}V in last 24h (critical, expected >13.5V)`,
        });
      } else if (v < 13.0) {
        rules.push({
          category: 'battery',
          points: 35,
          severity: AlertSeverity.MEDIUM,
          reason: `battery: avg running voltage ${fmt(v)}V in last 24h (weak charging, expected >13.5V)`,
        });
      } else if (v < 13.4) {
        rules.push({
          category: 'battery',
          points: 15,
          severity: AlertSeverity.LOW,
          reason: `battery: avg running voltage ${fmt(v)}V in last 24h (slightly low)`,
        });
      }
    }

    // RPM anomalies — spikes above 4800rpm indicate transmission/sensor faults.
    if (stats.runningCount >= 20 && stats.rpmSpikes > 0) {
      const ratio = stats.rpmSpikes / stats.runningCount;
      if (ratio >= 0.03) {
        rules.push({
          category: 'rpm',
          points: 40,
          severity: AlertSeverity.MEDIUM,
          reason: `rpm: ${stats.rpmSpikes} abnormal spikes >4800rpm in last 24h (${(ratio * 100).toFixed(1)}% of running readings)`,
        });
      } else if (ratio >= 0.01) {
        rules.push({
          category: 'rpm',
          points: 20,
          severity: AlertSeverity.LOW,
          reason: `rpm: ${stats.rpmSpikes} abnormal spikes >4800rpm in last 24h (${(ratio * 100).toFixed(1)}% of running readings)`,
        });
      }
    }

    return rules;
  }

  private async createMissingAlerts(
    vehicleId: string,
    riskScore: number,
    firedRules: FiredRule[],
  ): Promise<number> {
    if (firedRules.length === 0) return 0;
    const active = await this.alertRepo.find({
      where: { vehicleId, status: AlertStatus.ACTIVE },
      select: { reason: true },
    });
    const activeCategories = new Set(active.map((a) => a.reason.split(':')[0]));

    let created = 0;
    for (const rule of firedRules) {
      if (activeCategories.has(rule.category)) continue;
      await this.alertRepo.save(
        this.alertRepo.create({
          vehicleId,
          severity: rule.severity,
          status: AlertStatus.ACTIVE,
          reason: rule.reason,
          riskScore,
        }),
      );
      created++;
    }
    return created;
  }
}
