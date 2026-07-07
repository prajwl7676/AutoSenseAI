import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fleet } from './entities/fleet.entity';
import { CreateFleetDto, UpdateFleetDto } from './dto/fleet.dto';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Fleet)
    private readonly fleetRepo: Repository<Fleet>,
  ) {}

  create(dto: CreateFleetDto): Promise<Fleet> {
    return this.fleetRepo.save(this.fleetRepo.create(dto));
  }

  findAll(): Promise<Fleet[]> {
    return this.fleetRepo.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Fleet> {
    const fleet = await this.fleetRepo.findOne({
      where: { id },
      relations: { vehicles: true },
    });
    if (!fleet) throw new NotFoundException(`Fleet ${id} not found`);
    return fleet;
  }

  async update(id: string, dto: UpdateFleetDto): Promise<Fleet> {
    const fleet = await this.findOne(id);
    Object.assign(fleet, dto);
    return this.fleetRepo.save(fleet);
  }

  async remove(id: string): Promise<void> {
    const fleet = await this.findOne(id);
    await this.fleetRepo.remove(fleet);
  }
}
