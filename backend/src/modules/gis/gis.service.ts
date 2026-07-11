import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../../database/entities/issue.entity';
import { EmergencyAlert } from '../../database/entities/emergency-alert.entity';

@Injectable()
export class GisService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(EmergencyAlert)
    private readonly alertRepo: Repository<EmergencyAlert>,
  ) {}

  async findNearby(lat: number, lng: number, radiusKm: number, category?: string) {
    const qb = this.issueRepo
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .addSelect(`ST_Distance(issue.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`, 'distance')
      .where(`ST_DWithin(issue.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`)
      .setParameter('lat', lat)
      .setParameter('lng', lng)
      .setParameter('radius', radiusKm * 1000);

    if (category) {
      qb.andWhere('issue.category = :category', { category });
    }

    return qb.orderBy('distance', 'ASC').limit(100).getMany();
  }

  async getClusters(swLat: number, swLng: number, neLat: number, neLng: number, zoom: number) {
    const gridSize = this.getGridSize(zoom);

    const clusters = await this.issueRepo
      .createQueryBuilder('issue')
      .select(`
        ROUND(CAST(ST_X(ST_Centroid(issue.location)) AS NUMERIC), ${gridSize}) as lng,
        ROUND(CAST(ST_Y(ST_Centroid(issue.location)) AS NUMERIC), ${gridSize}) as lat
      `)
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(issue.riskScore)', 'avgRisk')
      .addSelect('AVG(issue.communityScore)', 'avgCommunityScore')
      .where(`ST_Within(issue.location, ST_MakeEnvelope(:swLng, :swLat, :neLng, :neLat, 4326))`)
      .setParameter('swLat', swLat)
      .setParameter('swLng', swLng)
      .setParameter('neLat', neLat)
      .setParameter('neLng', neLng)
      .groupBy('lat, lng')
      .having('COUNT(*) > 0')
      .getRawMany();

    return {
      type: 'FeatureCollection',
      features: clusters.map((c) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [parseFloat(c.lng), parseFloat(c.lat)] },
        properties: {
          count: parseInt(c.count, 10),
          avgRisk: parseFloat(c.avgRisk) || 0,
          avgCommunityScore: parseFloat(c.avgCommunityScore) || 0,
        },
      })),
    };
  }

  async getHeatmapData(city?: string, category?: string) {
    const qb = this.issueRepo
      .createQueryBuilder('issue')
      .select(`ST_Y(issue.location) as lat, ST_X(issue.location) as lng`)
      .addSelect('COUNT(*) as weight')
      .where('issue.location IS NOT NULL');

    if (city) qb.andWhere('issue.city ILIKE :city', { city: `%${city}%` });
    if (category) qb.andWhere('issue.category = :category', { category });

    const points = await qb.groupBy('lat, lng').getRawMany();

    return {
      type: 'heatmap',
      data: points.map((p) => ({
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lng),
        weight: parseInt(p.weight, 10),
      })),
    };
  }

  async getRiskZones(city?: string) {
    const qb = this.issueRepo
      .createQueryBuilder('issue')
      .select(`
        ST_Y(issue.location) as lat, ST_X(issue.location) as lng,
        issue.category as category
      `)
      .addSelect('AVG(issue.riskScore) as avgRisk')
      .addSelect('COUNT(*) as issueCount')
      .where('issue.location IS NOT NULL')
      .andWhere('issue.riskScore > 50');

    if (city) qb.andWhere('issue.city ILIKE :city', { city: `%${city}%` });

    const zones = await qb.groupBy('lat, lng, issue.category').getRawMany();

    return zones.map((z) => ({
      lat: parseFloat(z.lat),
      lng: parseFloat(z.lng),
      category: z.category,
      avgRisk: parseFloat(z.avgRisk),
      issueCount: parseInt(z.issueCount, 10),
    }));
  }

  async getWardStats(city?: string) {
    const qb = this.issueRepo
      .createQueryBuilder('issue')
      .select('issue.ward as ward')
      .addSelect('COUNT(*) as totalIssues')
      .addSelect("COUNT(CASE WHEN issue.status = 'resolved' THEN 1 END) as resolvedIssues")
      .addSelect("COUNT(CASE WHEN issue.priority IN ('critical', 'emergency') THEN 1 END) as criticalIssues")
      .addSelect('AVG(issue.riskScore) as avgRisk')
      .where('issue.ward IS NOT NULL');

    if (city) qb.andWhere('issue.city ILIKE :city', { city: `%${city}%` });

    const wards = await qb.groupBy('issue.ward').getRawMany();

    return wards.map((w) => ({
      ward: w.ward,
      totalIssues: parseInt(w.totalIssues, 10),
      resolvedIssues: parseInt(w.resolvedIssues, 10),
      criticalIssues: parseInt(w.criticalIssues, 10),
      resolutionRate: parseInt(w.totalIssues, 10) > 0
        ? Math.round((parseInt(w.resolvedIssues, 10) / parseInt(w.totalIssues, 10)) * 100)
        : 0,
      avgRisk: parseFloat(w.avgRisk) || 0,
    }));
  }

  async checkGeofence(lat: number, lng: number) {
    const activeAlerts = await this.alertRepo
      .createQueryBuilder('alert')
      .where('alert.isActive = true')
      .andWhere(
        `ST_DWithin(alert.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, COALESCE((alert.affectedArea->>'radius')::numeric, 1000))`,
        { lat, lng },
      )
      .getMany();

    return {
      lat,
      lng,
      inAffectedArea: activeAlerts.length > 0,
      activeAlerts: activeAlerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
      })),
    };
  }

  private getGridSize(zoom: number): number {
    if (zoom >= 14) return 4;
    if (zoom >= 12) return 3;
    if (zoom >= 10) return 2;
    return 1;
  }
}
