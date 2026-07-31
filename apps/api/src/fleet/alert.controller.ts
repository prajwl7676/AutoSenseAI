import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/user.types';
import { AlertService } from './alert.service';
import { ListAlertsQueryDto, UpdateAlertStatusDto } from './dto/alert.dto';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  findAll(@Query() query: ListAlertsQueryDto) {
    return this.alertService.findAll(query);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.FLEET_MANAGER, Role.MECHANIC)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlertStatusDto,
  ) {
    return this.alertService.updateStatus(id, dto.status);
  }
}
