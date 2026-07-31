import { Module } from '@nestjs/common';
import { FleetModule } from '../fleet/fleet.module';
import { RiskController } from './risk.controller';
import { RiskScoringService } from './risk-scoring.service';

@Module({
  imports: [FleetModule],
  controllers: [RiskController],
  providers: [RiskScoringService],
  exports: [RiskScoringService],
})
export class RiskModule {}
