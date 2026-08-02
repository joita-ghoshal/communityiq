import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyAlert, AlertType, AlertSeverity } from '../../database/entities/emergency-alert.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AiEngineService } from '../ai/ai-engine.service';

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);
  private readonly AI_VERIFY_TTL_MS = 10 * 60 * 1000;
  private readonly AI_CRITICAL_RADIUS_KM = 0.5;
  private readonly AI_CONFIDENCE_THRESHOLD = 0.5;
  private readonly AI_VERIFY_SEVERITIES = [AlertSeverity.HIGH, AlertSeverity.SEVERE, AlertSeverity.EXTREME];

  constructor(
    @InjectRepository(EmergencyAlert)
    private readonly alertRepo: Repository<EmergencyAlert>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly aiEngine: AiEngineService,
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

    this.notificationsGateway.sendEmergencyAlert({
      id: saved.id,
      type: saved.type,
      severity: saved.severity,
      title: saved.title,
      description: saved.description,
      latitude: data.latitude,
      longitude: data.longitude,
      isActive: true,
      createdAt: saved.createdAt,
    });

    return saved;
  }

  async resolveAlert(id: string, userId: string) {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');

    alert.isActive = false;
    alert.resolvedAt = new Date();
    await this.alertRepo.save(alert);

    this.notificationsGateway.sendEmergencyAlert({
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      isActive: false,
      resolvedAt: alert.resolvedAt,
    });

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

  private alertGeoPoint(
    alert: EmergencyAlert,
  ): { lat: number; lng: number } | null {
    if (alert.location) {
      const loc = alert.location as any;
      if (typeof loc === 'object' && Array.isArray(loc.coordinates)) {
        return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
      }
      if (typeof loc === 'string') {
        const match = loc.match(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/);
        if (match) {
          return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
        }
      }
    }
    return null;
  }

  private alertMinDistanceKm(
    userLat: number,
    userLng: number,
    alert: EmergencyAlert,
  ): { lat: number; lng: number; distanceKm: number } | null {
    const point = this.alertGeoPoint(alert);
    let min = point ? this.haversine(userLat, userLng, point.lat, point.lng) : Infinity;
    let refLat = point?.lat ?? 0;
    let refLng = point?.lng ?? 0;

    const rings = alert.affectedArea?.coordinates;
    if (Array.isArray(rings)) {
      for (const ring of rings) {
        if (!Array.isArray(ring)) continue;
        for (const coord of ring) {
          if (!Array.isArray(coord) || coord.length < 2) continue;
          const d = this.haversine(userLat, userLng, coord[1], coord[0]);
          if (d < min) {
            min = d;
            refLat = coord[1];
            refLng = coord[0];
          }
        }
      }
    }

    if (!isFinite(min) || refLat === 0 && refLng === 0 && !point) return null;
    return { lat: refLat, lng: refLng, distanceKm: min };
  }

  private parseAiJson(content: string): any | null {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0].replace(/```json|```/g, ''));
    } catch {
      return null;
    }
  }

  private async aiVerifyAlert(
    alert: EmergencyAlert,
    distanceKm: number,
  ): Promise<{ critical: boolean; confidence: number }> {
    const meta = alert.metadata || {};

    if (typeof meta.aiCritical === 'boolean' && meta.aiVerifiedAt) {
      const verifiedAt = new Date(meta.aiVerifiedAt).getTime();
      if (!isNaN(verifiedAt) && Date.now() - verifiedAt < this.AI_VERIFY_TTL_MS) {
        return {
          critical: meta.aiCritical,
          confidence: typeof meta.aiConfidence === 'number' ? meta.aiConfidence : 0,
        };
      }
    }

    let critical = false;
    let confidence = 0;
    let aiRan = false;

    if (this.aiEngine.isConfigured) {
      try {
        const result = await this.aiEngine.generate(
          [
            {
              role: 'system',
              content:
                'You are an AI public-safety verifier for a civic emergency alert system. ' +
                'A citizen is within 500 meters of an active emergency alert. ' +
                'Decide whether this alert is CRITICAL: an immediate, life-safety emergency ' +
                '(e.g. active fire, flood, earthquake, chemical or gas leak, structural collapse, ' +
                'active security threat, severe weather with danger to life) that warrants an ' +
                'automatic full-screen emergency alert with sound to nearby citizens. ' +
                'Non-critical notices (routine maintenance, advisories, minor incidents) must NOT be critical. ' +
                'Reply with STRICT JSON only, no markdown, no commentary: ' +
                '{"critical": true or false, "confidence": number between 0 and 1, "reason": "short justification"}.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                title: alert.title,
                type: alert.type,
                severity: alert.severity,
                description: alert.description,
                evacuationRequired: alert.evacuationRequired === true,
                distanceMeters: Math.round(distanceKm * 1000),
                dangerZoneRadiusMeters: alert.affectedArea?.radius ?? null,
              }),
            },
          ],
          { temperature: 0, maxTokens: 120 },
        );
        aiRan = true;
        const verdict = this.parseAiJson(result.content);
        if (verdict && typeof verdict.critical === 'boolean') {
          critical = verdict.critical;
          confidence =
            typeof verdict.confidence === 'number'
              ? Math.min(1, Math.max(0, verdict.confidence))
              : 0;
        } else {
          this.logger.warn(`AI proximity verdict unparseable for alert ${alert.id}`);
        }
      } catch (e: any) {
        this.logger.warn(`AI proximity verification failed for alert ${alert.id}: ${e?.message}`);
      }
    }

    if (!aiRan) {
      critical = alert.severity === AlertSeverity.SEVERE || alert.severity === AlertSeverity.EXTREME;
      confidence = 0.85;
      this.logger.warn(`AI unavailable for alert ${alert.id} — using heuristic fallback`);
    }

    try {
      alert.metadata = {
        ...meta,
        aiCritical: critical,
        aiConfidence: confidence,
        aiVerifiedAt: new Date().toISOString(),
      };
      await this.alertRepo.save(alert);
    } catch (e: any) {
      this.logger.warn(`Could not persist AI verdict for alert ${alert.id}: ${e?.message}`);
    }

    return { critical, confidence };
  }

  async checkAiProximityAlerts(latitude: number, longitude: number, radiusKm: number = 2) {
    const activeAlerts = await this.alertRepo.find({
      where: { isActive: true },
      order: { severity: 'DESC', createdAt: 'DESC' },
    });

    const nearbyAlerts: any[] = [];

    for (const alert of activeAlerts) {
      const geo = this.alertMinDistanceKm(latitude, longitude, alert);
      if (!geo || geo.distanceKm > radiusKm) continue;

      let critical = false;
      let confidence = 0;
      if (this.AI_VERIFY_SEVERITIES.includes(alert.severity)) {
        const verdict = await this.aiVerifyAlert(alert, geo.distanceKm);
        critical = verdict.critical;
        confidence = verdict.confidence;
      }

      nearbyAlerts.push({
        ...alert,
        distance: Math.round(geo.distanceKm * 1000) / 1000,
        distanceKm: Math.round(geo.distanceKm * 1000) / 1000,
        latitude: geo.lat,
        longitude: geo.lng,
        aiCritical: critical,
        aiConfidence: confidence,
      });
    }

    nearbyAlerts.sort(
      (a, b) => Number(b.aiCritical) - Number(a.aiCritical) || a.distance - b.distance,
    );

    const criticalAlert =
      nearbyAlerts.find(
        (a) =>
          a.aiCritical === true &&
          a.aiConfidence >= this.AI_CONFIDENCE_THRESHOLD &&
          a.distanceKm <= this.AI_CRITICAL_RADIUS_KM,
      ) || null;

    return {
      latitude,
      longitude,
      radiusKm,
      alerts: nearbyAlerts,
      count: nearbyAlerts.length,
      criticalAlert,
    };
  }
}
