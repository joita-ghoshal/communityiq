import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyAlert, AlertType, AlertSeverity } from '../../database/entities/emergency-alert.entity';

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository(EmergencyAlert)
    private readonly alertRepo: Repository<EmergencyAlert>,
  ) {}

  async createAlert(data: any, userId: string) {
    const alert = this.alertRepo.create({
      type: data.type as AlertType,
      severity: data.severity as AlertSeverity,
      title: data.title,
      description: data.description,
      location: undefined as any,
      affectedArea: data.affectedArea,
      reportedBy: userId,
      evacuationRequired: data.evacuationRequired || false,
      contactNumber: data.contactNumber,
      expiresAt: data.expiresAt,
      isActive: true,
    } as any);

    const saved = await this.alertRepo.save(alert) as any;

    if (data.latitude && data.longitude) {
      await this.alertRepo.query(
        `UPDATE emergency_alerts SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        [data.longitude, data.latitude, saved.id],
      );
    }

    return saved;
  }

  async resolveAlert(id: string, userId: string) {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');

    alert.isActive = false;
    alert.resolvedAt = new Date();
    await this.alertRepo.save(alert);

    return { message: 'Alert resolved', id, resolvedAt: alert.resolvedAt };
  }

  async getActiveAlerts() {
    return this.alertRepo.find({
      where: { isActive: true },
      order: { severity: 'DESC', createdAt: 'DESC' },
    });
  }

  async getNearbyAlerts(lat: number, lng: number, radiusKm: number) {
    return this.alertRepo
      .createQueryBuilder('alert')
      .where('alert.isActive = true')
      .andWhere(
        `ST_DWithin(alert.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
        { lat, lng, radius: radiusKm * 1000 },
      )
      .orderBy('alert.severity', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }
}
