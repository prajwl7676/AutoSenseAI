import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { AlertSeverity, AlertStatus } from './enums';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.alerts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle;

  @Index()
  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity!: AlertSeverity;

  @Index()
  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  status!: AlertStatus;

  /** Short machine-generated cause, e.g. "engineTemp above threshold" */
  @Column()
  reason!: string;

  /** Vehicle risk score at the time the alert fired */
  @Column({ type: 'float', nullable: true })
  riskScore!: number | null;

  /** LLM-generated root-cause explanation (populated in Phase 4) */
  @Column({ type: 'text', nullable: true })
  explanation!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
