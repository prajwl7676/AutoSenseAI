import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('telemetry_readings')
@Index(['vehicleId', 'recordedAt'])
export class TelemetryReading {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.telemetryReadings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  /** °C */
  @Column({ type: 'float' })
  engineTemp!: number;

  /** Volts */
  @Column({ type: 'float' })
  batteryVoltage!: number;

  @Column({ type: 'int' })
  rpm!: number;

  /** km/h */
  @Column({ type: 'float' })
  speed!: number;

  /** Percent 0-100 */
  @Column({ type: 'float' })
  fuelLevel!: number;

  @Column({ type: 'timestamptz' })
  recordedAt!: Date;
}
