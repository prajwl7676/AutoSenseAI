import { Controller, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/user.types';
import { RiskScoringService } from './risk-scoring.service';

@Controller('risk')
export class RiskController {
  constructor(private readonly riskScoring: RiskScoringService) {}

  @Post('recompute')
  @Roles(Role.ADMIN, Role.FLEET_MANAGER)
  async recompute() {
    const results = await this.riskScoring.computeAll();
    const atRisk = results.filter((r) => r.riskScore > 0);
    return {
      scored: results.length,
      atRisk: atRisk.length,
      alertsCreated: results.reduce((sum, r) => sum + r.alertsCreated, 0),
      vehicles: atRisk
        .sort((a, b) => b.riskScore - a.riskScore)
        .map((r) => ({
          vin: r.vin,
          riskScore: r.riskScore,
          reasons: r.firedRules.map((rule) => rule.reason),
        })),
    };
  }
}
