/**
 * Telemetry simulator — seeds fleets/vehicles and generates realistic
 * sensor time-series with injected degradation patterns. This is the
 * ground-truth dataset every AI feature (risk scoring, RAG, agent, evals)
 * runs on, so generation is DETERMINISTIC: same seed → same data.
 *
 * Usage (from apps/api, with Postgres up):
 *   pnpm simulate                  # seed + 7-day backfill at 5-min intervals
 *   pnpm simulate --days=3         # shorter backfill
 *   pnpm simulate --reset          # wipe simulated readings/alerts first
 *   pnpm simulate --live           # stream readings via POST /telemetry
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Fleet } from '../src/fleet/entities/fleet.entity';
import { Vehicle } from '../src/fleet/entities/vehicle.entity';
import { TelemetryReading } from '../src/fleet/entities/telemetry-reading.entity';
import { Alert } from '../src/fleet/entities/alert.entity';
import { MaintenanceLog } from '../src/fleet/entities/maintenance-log.entity';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type FaultProfile = 'healthy' | 'overheating' | 'battery_decay' | 'rpm_spikes';

interface VehicleSpec {
  vin: string;
  model: string;
  year: number;
  fleet: string;
  profile: FaultProfile;
}

const FLEET_NAMES = ['North Logistics', 'City Delivery'];

// Fixed roster: 15 vehicles, 5 with injected faults. VINs are stable so
// reruns are idempotent and eval questions have deterministic answers.
const VEHICLE_SPECS: VehicleSpec[] = [
  {
    vin: 'ASAI0001NL',
    model: 'Volvo FH16',
    year: 2021,
    fleet: 'North Logistics',
    profile: 'healthy',
  },
  {
    vin: 'ASAI0002NL',
    model: 'Volvo FH16',
    year: 2019,
    fleet: 'North Logistics',
    profile: 'healthy',
  },
  {
    vin: 'ASAI0003NL',
    model: 'Scania R450',
    year: 2020,
    fleet: 'North Logistics',
    profile: 'overheating',
  },
  {
    vin: 'ASAI0004NL',
    model: 'Scania R450',
    year: 2022,
    fleet: 'North Logistics',
    profile: 'healthy',
  },
  {
    vin: 'ASAI0005NL',
    model: 'MAN TGX',
    year: 2018,
    fleet: 'North Logistics',
    profile: 'healthy',
  },
  {
    vin: 'ASAI0006NL',
    model: 'MAN TGX',
    year: 2017,
    fleet: 'North Logistics',
    profile: 'battery_decay',
  },
  {
    vin: 'ASAI0007NL',
    model: 'Mercedes Actros',
    year: 2023,
    fleet: 'North Logistics',
    profile: 'healthy',
  },
  {
    vin: 'ASAI0008NL',
    model: 'Mercedes Actros',
    year: 2020,
    fleet: 'North Logistics',
    profile: 'rpm_spikes',
  },
  {
    vin: 'ASAI0009CD',
    model: 'Ford Transit',
    year: 2022,
    fleet: 'City Delivery',
    profile: 'healthy',
  },
  {
    vin: 'ASAI0010CD',
    model: 'Ford Transit',
    year: 2019,
    fleet: 'City Delivery',
    profile: 'overheating',
  },
  {
    vin: 'ASAI0011CD',
    model: 'Mercedes Sprinter',
    year: 2021,
    fleet: 'City Delivery',
    profile: 'healthy',
  },
  {
    vin: 'ASAI0012CD',
    model: 'Mercedes Sprinter',
    year: 2018,
    fleet: 'City Delivery',
    profile: 'battery_decay',
  },
  {
    vin: 'ASAI0013CD',
    model: 'Iveco Daily',
    year: 2020,
    fleet: 'City Delivery',
    profile: 'healthy',
  },
  {
    vin: 'ASAI0014CD',
    model: 'Iveco Daily',
    year: 2023,
    fleet: 'City Delivery',
    profile: 'healthy',
  },
  {
    vin: 'ASAI0015CD',
    model: 'Renault Master',
    year: 2021,
    fleet: 'City Delivery',
    profile: 'healthy',
  },
];

const RNG_SEED = 42;

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Reading generator
// ---------------------------------------------------------------------------

interface SimState {
  fuelLevel: number;
  odometerKm: number;
}

interface GeneratedReading {
  engineTemp: number;
  batteryVoltage: number;
  rpm: number;
  speed: number;
  fuelLevel: number;
  recordedAt: Date;
}

/**
 * One reading for one vehicle at time `t`. `progress` (0→1 across the
 * simulated window) drives fault severity so degradation trends emerge.
 */
function generateReading(
  profile: FaultProfile,
  t: Date,
  progress: number,
  stepMinutes: number,
  state: SimState,
  rng: () => number,
): GeneratedReading {
  const hour = t.getUTCHours();
  const workHours = hour >= 6 && hour < 20;
  const driving = workHours && rng() < 0.65;
  const idling = !driving && workHours && rng() < 0.3;

  let speed = 0;
  let rpm = 0;
  if (driving) {
    speed = 30 + rng() * 60;
    rpm = 1100 + (speed / 90) * 1800 + rng() * 200;
  } else if (idling) {
    rpm = 750 + rng() * 100;
  }

  if (profile === 'rpm_spikes' && driving && rng() < 0.06) {
    rpm = 5200 + rng() * 1300; // transmission/sensor fault: implausible spikes
  }

  const ambient = 20 + 4 * Math.sin(((hour - 14) / 24) * 2 * Math.PI);
  let engineTemp: number;
  if (driving || idling) {
    engineTemp = 88 + (rpm / 1000) * 2 + (rng() - 0.5) * 4;
    if (profile === 'overheating') engineTemp += progress * 28; // coolant degradation ramp
  } else {
    engineTemp = ambient + (rng() - 0.5) * 3;
  }

  let batteryVoltage =
    driving || idling
      ? 13.9 + (rng() - 0.5) * 0.5
      : 12.55 + (rng() - 0.5) * 0.2;
  if (profile === 'battery_decay') batteryVoltage -= progress * 1.6; // aging cell voltage drift

  if (driving) {
    const distanceKm = (speed * stepMinutes) / 60;
    state.odometerKm += distanceKm;
    state.fuelLevel -= 0.02 * stepMinutes * (0.5 + speed / 100);
    if (state.fuelLevel < 10) state.fuelLevel = 95 + rng() * 5; // refuel stop
  } else if (idling) {
    state.fuelLevel -= 0.005 * stepMinutes;
  }
  state.fuelLevel = Math.max(0, Math.min(100, state.fuelLevel));

  const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  return {
    engineTemp: round(engineTemp),
    batteryVoltage: round(batteryVoltage),
    rpm: Math.round(Math.max(0, rpm)),
    speed: round(speed, 1),
    fuelLevel: round(state.fuelLevel),
    recordedAt: t,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name: string, fallback: number) => {
    const raw = args.find((a) => a.startsWith(`--${name}=`));
    return raw ? Number(raw.split('=')[1]) : fallback;
  };
  return {
    days: get('days', 7),
    intervalMin: get('interval', 5),
    liveIntervalSec: get('live-interval', 10),
    reset: args.includes('--reset'),
    live: args.includes('--live'),
    apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  };
}

async function main() {
  const opts = parseArgs();
  const dataSource = new DataSource({
    type: 'postgres',
    url:
      process.env.DATABASE_URL ??
      'postgres://postgres:postgres@localhost:5432/autosense',
    entities: [Fleet, Vehicle, TelemetryReading, Alert, MaintenanceLog],
    synchronize: true,
  });
  await dataSource.initialize();
  console.log('Connected to database.');

  const fleetRepo = dataSource.getRepository(Fleet);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const readingRepo = dataSource.getRepository(TelemetryReading);

  // --- Seed fleets & vehicles (idempotent by name/VIN) ---
  const fleets = new Map<string, Fleet>();
  for (const name of FLEET_NAMES) {
    let fleet = await fleetRepo.findOneBy({ name });
    if (!fleet)
      fleet = await fleetRepo.save(
        fleetRepo.create({ name, description: `${name} fleet (simulated)` }),
      );
    fleets.set(name, fleet);
  }

  const vehicles = new Map<string, Vehicle>();
  for (const spec of VEHICLE_SPECS) {
    let vehicle = await vehicleRepo.findOneBy({ vin: spec.vin });
    if (!vehicle) {
      vehicle = await vehicleRepo.save(
        vehicleRepo.create({
          vin: spec.vin,
          model: spec.model,
          year: spec.year,
          mileage: 40000 + (2024 - spec.year) * 30000,
          fleetId: fleets.get(spec.fleet)!.id,
        }),
      );
    }
    vehicles.set(spec.vin, vehicle);
  }
  console.log(`Seeded ${fleets.size} fleets, ${vehicles.size} vehicles.`);

  if (opts.reset) {
    const ids = [...vehicles.values()].map((v) => v.id);
    await readingRepo
      .createQueryBuilder()
      .delete()
      .where('vehicleId IN (:...ids)', { ids })
      .execute();
    await dataSource
      .getRepository(Alert)
      .createQueryBuilder()
      .delete()
      .where('vehicleId IN (:...ids)', { ids })
      .execute();
    console.log(
      'Reset: cleared existing readings and alerts for simulated vehicles.',
    );
  }

  // --- Backfill historical readings ---
  const end = new Date();
  const start = new Date(end.getTime() - opts.days * 24 * 60 * 60 * 1000);
  const stepMs = opts.intervalMin * 60 * 1000;

  for (const spec of VEHICLE_SPECS) {
    const vehicle = vehicles.get(spec.vin)!;
    const existing = await readingRepo.countBy({ vehicleId: vehicle.id });
    if (existing > 0) {
      console.log(
        `  ${spec.vin}: ${existing} readings already present, skipping (use --reset to regenerate).`,
      );
      continue;
    }

    const rng = mulberry32(RNG_SEED + VEHICLE_SPECS.indexOf(spec));
    const state: SimState = {
      fuelLevel: 60 + rng() * 35,
      odometerKm: vehicle.mileage,
    };
    const rows: Partial<TelemetryReading>[] = [];

    for (let ts = start.getTime(); ts <= end.getTime(); ts += stepMs) {
      const progress =
        (ts - start.getTime()) / (end.getTime() - start.getTime());
      const reading = generateReading(
        spec.profile,
        new Date(ts),
        progress,
        opts.intervalMin,
        state,
        rng,
      );
      rows.push({ ...reading, vehicleId: vehicle.id });
    }

    for (let i = 0; i < rows.length; i += 1000) {
      await readingRepo.insert(rows.slice(i, i + 1000));
    }
    await vehicleRepo.update(vehicle.id, {
      mileage: Math.round(state.odometerKm),
    });
    console.log(
      `  ${spec.vin} (${spec.profile.padEnd(13)}): ${rows.length} readings over ${opts.days}d.`,
    );
  }

  console.log('\nInjected fault ground truth:');
  for (const spec of VEHICLE_SPECS.filter((s) => s.profile !== 'healthy')) {
    console.log(`  ${spec.vin} ${spec.model.padEnd(18)} → ${spec.profile}`);
  }

  // --- Live mode: stream through the real ingestion endpoint ---
  if (opts.live) {
    console.log(
      `\nLive mode: POSTing to ${opts.apiUrl}/telemetry every ${opts.liveIntervalSec}s (Ctrl+C to stop).`,
    );
    const liveRng = mulberry32(Date.now() % 2 ** 31);
    const liveStates = new Map<string, SimState>(
      VEHICLE_SPECS.map((s) => [
        s.vin,
        { fuelLevel: 50 + liveRng() * 40, odometerKm: 0 },
      ]),
    );
    const tick = async () => {
      const readings = VEHICLE_SPECS.map((spec) => {
        const r = generateReading(
          spec.profile,
          new Date(),
          1,
          opts.liveIntervalSec / 60,
          liveStates.get(spec.vin)!,
          liveRng,
        );
        return {
          ...r,
          vehicleId: vehicles.get(spec.vin)!.id,
          recordedAt: r.recordedAt.toISOString(),
        };
      });
      try {
        const res = await fetch(`${opts.apiUrl}/telemetry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ readings }),
        });
        console.log(
          `  ${new Date().toISOString()} → ${res.status} (${readings.length} readings)`,
        );
      } catch (err) {
        console.error('  ingestion failed:', (err as Error).message);
      }
      setTimeout(() => void tick(), opts.liveIntervalSec * 1000);
    };
    await tick();
    return; // keep process alive for timers
  }

  await dataSource.destroy();
  console.log('\nDone.');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
