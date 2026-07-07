import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class TelemetryReadingDto {
  @IsUUID()
  vehicleId!: string;

  /** °C — sensor sanity range, readings outside it are rejected */
  @IsNumber()
  @Min(-40)
  @Max(200)
  engineTemp!: number;

  /** Volts */
  @IsNumber()
  @Min(0)
  @Max(20)
  batteryVoltage!: number;

  @IsInt()
  @Min(0)
  @Max(10000)
  rpm!: number;

  /** km/h */
  @IsNumber()
  @Min(0)
  @Max(300)
  speed!: number;

  /** Percent */
  @IsNumber()
  @Min(0)
  @Max(100)
  fuelLevel!: number;

  /** Defaults to server time when omitted */
  @IsOptional()
  @IsISO8601()
  recordedAt?: string;
}

export class IngestTelemetryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => TelemetryReadingDto)
  readings!: TelemetryReadingDto[];
}
