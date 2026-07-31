import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AlertSeverity, AlertStatus } from '../entities/enums';

export class ListAlertsQueryDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;
}

export class UpdateAlertStatusDto {
  @IsEnum(AlertStatus)
  status!: AlertStatus;
}
