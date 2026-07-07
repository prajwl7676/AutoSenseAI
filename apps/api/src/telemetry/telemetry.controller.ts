import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { TelemetryService } from './telemetry.service';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * Batch ingestion endpoint for vehicle sensors / the simulator.
   * MVP tradeoff: marked @Public because devices don't carry Keycloak user
   * tokens. Device auth (per-device API keys) is deferred — see workplan.
   */
  @Public()
  @Post()
  ingest(@Body() dto: IngestTelemetryDto) {
    return this.telemetryService.ingest(dto);
  }

  @Get('vehicles/:vehicleId')
  findRecent(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.telemetryService.findRecent(vehicleId, limit);
  }
}
