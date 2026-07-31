import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TelemetryReading } from '../fleet/entities/telemetry-reading.entity';
import { Vehicle } from '../fleet/entities/vehicle.entity';
import { RiskScoringService } from '../risk/risk-scoring.service';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    @InjectRepository(TelemetryReading)
    private readonly readingRepo: Repository<TelemetryReading>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly riskScoring: RiskScoringService,
  ) {}

  async ingest(dto: IngestTelemetryDto): Promise<{ ingested: number }> {
    const vehicleIds = [...new Set(dto.readings.map((r) => r.vehicleId))];
    const known = await this.vehicleRepo.find({
      where: { id: In(vehicleIds) },
      select: { id: true },
    });
    const knownIds = new Set(known.map((v) => v.id));
    const unknown = vehicleIds.filter((id) => !knownIds.has(id));
    if (unknown.length > 0) {
      // Reject the whole batch so the sender can fix its vehicle mapping —
      // silently dropping readings would corrupt trend analysis downstream.
      throw new BadRequestException(
        `Unknown vehicle ids: ${unknown.join(', ')}`,
      );
    }

    const rows = dto.readings.map((r) =>
      this.readingRepo.create({
        ...r,
        recordedAt: r.recordedAt ? new Date(r.recordedAt) : new Date(),
      }),
    );
    await this.readingRepo.insert(rows);

    // Re-score off the ingest path; never fail ingestion on a scoring error.
    void this.riskScoring.computeForVehicles(vehicleIds).catch((err) => {
      this.logger.error(
        `Risk scoring after ingest failed: ${(err as Error).message}`,
      );
    });

    return { ingested: rows.length };
  }

  /** Most recent readings for one vehicle, newest first. */
  findRecent(vehicleId: string, limit = 100): Promise<TelemetryReading[]> {
    return this.readingRepo.find({
      where: { vehicleId },
      order: { recordedAt: 'DESC' },
      take: Math.min(limit, 1000),
    });
  }
}
