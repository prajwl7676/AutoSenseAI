import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Fleet } from './fleet.entity';
import { TelemetryReading } from './telemetry-reading.entity';
import { Alert } from './alert.entity';
import { MaintenanceLog } from './maintenance-log.entity';
import { VehicleStatus } from './enums';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  vin!: string;

  @Column()
  model!: string;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'int', default: 0 })
  mileage!: number;

  @Index()
  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.ACTIVE })
  status!: VehicleStatus;

  /** 0-100, computed by the risk scoring service (Phase 0.4) */
  @Column({ type: 'float', default: 0 })
  riskScore!: number;

  @ManyToOne(() => Fleet, (fleet) => fleet.vehicles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'fleetId' })
  fleet!: Fleet | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  fleetId!: string | null;

  @OneToMany(() => TelemetryReading, (reading) => reading.vehicle)
  telemetryReadings!: TelemetryReading[];

  @OneToMany(() => Alert, (alert) => alert.vehicle)
  alerts!: Alert[];

  @OneToMany(() => MaintenanceLog, (log) => log.vehicle)
  maintenanceLogs!: MaintenanceLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
