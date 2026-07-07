import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/user.types';
import { FleetService } from './fleet.service';
import { CreateFleetDto, UpdateFleetDto } from './dto/fleet.dto';

@Controller('fleets')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Post()
  @Roles(Role.ADMIN, Role.FLEET_MANAGER)
  create(@Body() dto: CreateFleetDto) {
    return this.fleetService.create(dto);
  }

  @Get()
  findAll() {
    return this.fleetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fleetService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.FLEET_MANAGER)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFleetDto) {
    return this.fleetService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.FLEET_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fleetService.remove(id);
  }
}
