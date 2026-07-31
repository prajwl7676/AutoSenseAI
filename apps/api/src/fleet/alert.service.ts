import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { AlertSeverity, AlertStatus } from './entities/enums';

interface ListAlertsFilter {
  vehicleId?: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
}

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
  ) {}

  findAll(filter: ListAlertsFilter): Promise<Alert[]> {
    const where: FindOptionsWhere<Alert> = {};
    if (filter.vehicleId) where.vehicleId = filter.vehicleId;
    if (filter.status) where.status = filter.status;
    if (filter.severity) where.severity = filter.severity;
    return this.alertRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: { vehicle: true },
    });
  }

  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    const alert = await this.alertRepo.findOneBy({ id });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    alert.status = status;
    return this.alertRepo.save(alert);
  }
}
