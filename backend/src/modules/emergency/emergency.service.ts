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

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

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

  async getAllAlerts() {
    return this.alertRepo.find({
      order: { createdAt: 'DESC' },
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

  async findNearbyAlerts(latitude: number, longitude: number, radiusKm: number = 10) {
    const activeAlerts = await this.alertRepo.find({
      where: { isActive: true },
      order: { severity: 'DESC', createdAt: 'DESC' },
    });

    const alertsWithDistance = activeAlerts
      .map((alert) => {
        let alertLat: number | null = null;
        let alertLng: number | null = null;

        if (alert.location) {
          const loc = alert.location as any;
          if (typeof loc === 'object' && loc.coordinates) {
            alertLng = loc.coordinates[0];
            alertLat = loc.coordinates[1];
          } else if (typeof loc === 'string') {
            const match = loc.match(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/);
            if (match) {
              alertLng = parseFloat(match[1]);
              alertLat = parseFloat(match[2]);
            }
          }
        }

        if (alertLat === null || alertLng === null) {
          if (alert.affectedArea?.coordinates?.[0]?.[0]) {
            const coords = alert.affectedArea.coordinates[0][0];
            alertLng = coords[0];
            alertLat = coords[1];
          }
        }

        if (alertLat === null || alertLng === null) {
          return { ...alert, distance: Infinity };
        }

        const distance = this.haversine(latitude, longitude, alertLat, alertLng);
        return { ...alert, distance: Math.round(distance * 100) / 100 };
      })
      .filter((alert) => alert.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return {
      alerts: alertsWithDistance,
      count: alertsWithDistance.length,
    };
  }

  async checkProximityAlerts(latitude: number, longitude: number, radiusKm: number = 0.5) {
    const activeAlerts = await this.alertRepo.find({
      where: { isActive: true },
      order: { severity: 'DESC', createdAt: 'DESC' },
    });

    const nearbyAlerts = activeAlerts
      .map((alert) => {
        let alertLat: number | null = null;
        let alertLng: number | null = null;

        if (alert.location) {
          const loc = alert.location as any;
          if (typeof loc === 'object' && loc.coordinates) {
            alertLng = loc.coordinates[0];
            alertLat = loc.coordinates[1];
          } else if (typeof loc === 'string') {
            const match = loc.match(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/);
            if (match) {
              alertLng = parseFloat(match[1]);
              alertLat = parseFloat(match[2]);
            }
          }
        }

        if (alertLat === null || alertLng === null) {
          if (alert.affectedArea?.coordinates?.[0]?.[0]) {
            const coords = alert.affectedArea.coordinates[0][0];
            alertLng = coords[0];
            alertLat = coords[1];
          }
        }

        if (alertLat === null || alertLng === null) {
          return null;
        }

        const distance = this.haversine(latitude, longitude, alertLat, alertLng);
        return { ...alert, distance: Math.round(distance * 1000) / 1000 };
      })
      .filter((alert): alert is NonNullable<typeof alert> => alert !== null && alert.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return {
      latitude,
      longitude,
      radiusKm,
      alerts: nearbyAlerts,
      count: nearbyAlerts.length,
    };
  }
}
