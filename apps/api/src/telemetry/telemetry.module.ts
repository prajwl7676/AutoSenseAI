import { Module } from '@nestjs/common';
import { FleetModule } from '../fleet/fleet.module';
import { RiskModule } from '../risk/risk.module';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [FleetModule, RiskModule],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
