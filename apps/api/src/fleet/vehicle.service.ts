import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Fleet } from './entities/fleet.entity';
import { Vehicle } from './entities/vehicle.entity';
import {
  CreateVehicleDto,
  ListVehiclesQueryDto,
  UpdateVehicleDto,
} from './dto/vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Fleet)
    private readonly fleetRepo: Repository<Fleet>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    if (dto.fleetId) await this.assertFleetExists(dto.fleetId);
    return this.vehicleRepo.save(this.vehicleRepo.create(dto));
  }

  findAll(query: ListVehiclesQueryDto): Promise<Vehicle[]> {
    const where: FindOptionsWhere<Vehicle> = {};
    if (query.fleetId) where.fleetId = query.fleetId;
    if (query.status) where.status = query.status;
    return this.vehicleRepo.find({
      where,
      order: { riskScore: 'DESC' },
      relations: { fleet: true },
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id },
      relations: { fleet: true, alerts: true, maintenanceLogs: true },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (dto.fleetId) await this.assertFleetExists(dto.fleetId);
    Object.assign(vehicle, dto);
    return this.vehicleRepo.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepo.remove(vehicle);
  }

  private async assertFleetExists(fleetId: string): Promise<void> {
    const exists = await this.fleetRepo.existsBy({ id: fleetId });
    if (!exists) throw new BadRequestException(`Fleet ${fleetId} not found`);
  }
}
