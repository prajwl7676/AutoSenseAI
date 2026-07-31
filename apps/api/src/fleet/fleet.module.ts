import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fleet } from './entities/fleet.entity';
import { Vehicle } from './entities/vehicle.entity';
import { TelemetryReading } from './entities/telemetry-reading.entity';
import { Alert } from './entities/alert.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { FleetController } from './fleet.controller';
import { VehicleController } from './vehicle.controller';
import { AlertController } from './alert.controller';
import { FleetService } from './fleet.service';
import { VehicleService } from './vehicle.service';
import { AlertService } from './alert.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fleet,
      Vehicle,
      TelemetryReading,
      Alert,
      MaintenanceLog,
    ]),
  ],
  controllers: [FleetController, VehicleController, AlertController],
  providers: [FleetService, VehicleService, AlertService],
  exports: [TypeOrmModule, FleetService, VehicleService, AlertService],
})
export class FleetModule {}
