import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../../database/entities/issue.entity';
import { EmergencyAlert } from '../../database/entities/emergency-alert.entity';
import { Department } from '../../database/entities/department.entity';

interface CacheEntry {
  data: any;
  expires: number;
}

@Injectable()
export class GisService {
  private readonly logger = new Logger(GisService.name);
  private readonly geocodeCache = new Map<string, CacheEntry>();
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
  private readonly USER_AGENT = 'CommunityIQ/1.0 (civic-platform; contact@communityiq.local)';

  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(EmergencyAlert)
    private readonly alertRepo: Repository<EmergencyAlert>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  private async nominatimFetch(path: string): Promise<any | null> {
    const cached = this.geocodeCache.get(path);
    if (cached && cached.expires > Date.now()) return cached.data;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.NOMINATIM_URL}${path}`, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept-Language': 'en',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
      const data = await res.json();
      if (this.geocodeCache.size > 200) this.geocodeCache.clear();
      this.geocodeCache.set(path, { data, expires: Date.now() + 60 * 60 * 1000 });
      return data;
    } catch (e: any) {
      this.logger.warn(`Nominatim request failed: ${e.message}`);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    const data = await this.nominatimFetch(
      `/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    );
    if (!data) return null;
    const a = data.address || {};
    return {
      lat,
      lng,
      displayName: data.display_name || '',
      address: a.road || a.neighbourhood || a.suburb || a.residential || '',
      city: a.city || a.town || a.village || a.municipality || '',
      state: a.state || '',
      country: a.country || '',
      pincode: a.postcode || '',
      ward: a.ward || '',
      suburb: a.suburb || '',
      district: a.suburb || a.district || a.county || '',
    };
  }

  async forwardGeocode(query: string) {
    const data = await this.nominatimFetch(
      `/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
    );
    if (!Array.isArray(data)) return [];
    return data.map((r: any) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: r.display_name || '',
      type: r.type || 'address',
      city: r.address?.city || r.address?.town || r.address?.village || '',
      pincode: r.address?.postcode || '',
    }));
  }

  async searchIssues(query: string, type?: string) {
    const q = `%${(query || '').toLowerCase()}%`;
    const qb = this.issueRepo
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.department', 'department')
      .where('issue.location IS NOT NULL')
      .andWhere(
        '(LOWER(issue.title) ILIKE :q OR LOWER(issue.address) ILIKE :q OR LOWER(issue.ward) ILIKE :q OR issue.pincode ILIKE :q)',
        { q },
      );

    if (type === 'ward') {
      qb.andWhere('LOWER(issue.ward) ILIKE :q', { q });
    } else if (type === 'pincode') {
      qb.andWhere('issue.pincode ILIKE :q', { q });
    } else if (type === 'department') {
      qb.andWhere('LOWER(department.name) ILIKE :q', { q });
    } else if (type === 'address' || type === 'landmark') {
      qb.andWhere('(LOWER(issue.address) ILIKE :q OR LOWER(issue.title) ILIKE :q)', { q });
    }

    const issues = await qb.orderBy('issue.updatedAt', 'DESC').limit(20).getMany();
    return issues.map((i) => ({
      id: i.id,
      title: i.title,
      address: i.address,
      ward: i.ward,
      pincode: i.pincode,
      category: i.category,
      priority: i.priority,
      status: i.status,
      department: (i.department as any)?.name || undefined,
      location: this.parseLocation(i.location),
    })).filter((i) => i.location);
  }

  async searchAll(query: string, type?: string) {
    const [geocoded, issues, departments] = await Promise.all([
      this.forwardGeocode(query),
      this.searchIssues(query, type),
      this.deptRepo
        .createQueryBuilder('d')
        .where('LOWER(d.name) ILIKE :q', { q: `%${(query || '').toLowerCase()}%` })
        .limit(10)
        .getMany(),
    ]);
    return {
      geocoded,
      issues,
      departments: departments.map((d) => ({ id: d.id, name: d.name, code: d.code })),
    };
  }

  async wards() {
    const rows = await this.issueRepo
      .createQueryBuilder('issue')
      .select('DISTINCT issue.ward as ward')
      .where('issue.ward IS NOT NULL')
      .andWhere('issue.ward != \'\'')
      .orderBy('ward')
      .getRawMany();
    return rows.map((r) => r.ward);
  }

  parseLocation(location: any): { lat: number; lng: number } | null {
    if (!location) return null;
    if (typeof location === 'string') {
      const m = location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
      if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
      return null;
    }
    if (typeof location === 'object') {
      if (location.type === 'Point' && Array.isArray(location.coordinates)) {
        return { lat: location.coordinates[1], lng: location.coordinates[0] };
      }
      if (location.latitude != null && location.longitude != null) {
        return { lat: location.latitude, lng: location.longitude };
      }
    }
    return null;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async explore(
    lat: number,
    lng: number,
    radiusKm: number,
    filters: { category?: string; priority?: string; status?: string; departmentId?: string; aiVerified?: string },
  ) {
    const qb = this.issueRepo
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.department', 'department')
      .where('issue.location IS NOT NULL')
      .andWhere(
        `ST_DWithin(issue.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
      )
      .setParameter('lat', lat)
      .setParameter('lng', lng)
      .setParameter('radius', radiusKm * 1000);

    if (filters.category) qb.andWhere('issue.category = :category', { category: filters.category });
    if (filters.priority) qb.andWhere('issue.priority = :priority', { priority: filters.priority });
    if (filters.status) qb.andWhere('issue.status = :status', { status: filters.status });
    if (filters.departmentId) qb.andWhere('issue.departmentId = :departmentId', { departmentId: filters.departmentId });
    if (filters.aiVerified === 'true') {
      qb.andWhere(`issue.verificationData->>'aiVerified' = 'true'`);
    }

    const issues = await qb.orderBy('issue.createdAt', 'DESC').limit(500).getMany();

    const items = issues.map((issue: any) => {
      const loc = this.parseLocation(issue.location);
      const distanceKm = loc ? this.haversine(lat, lng, loc.lat, loc.lng) : null;
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        priority: issue.priority,
        status: issue.status,
        address: issue.address,
        city: issue.city,
        ward: issue.ward,
        pincode: issue.pincode,
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
        distanceKm: distanceKm ? Math.round(distanceKm * 100) / 100 : null,
        riskScore: issue.riskScore,
        communityScore: issue.communityScore,
        impactScore: issue.impactScore,
        upvotes: issue.upvotes,
        downvotes: issue.downvotes,
        isUrgent: issue.isUrgent,
        completionPercentage: issue.completionPercentage,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        department: issue.department ? { id: issue.department.id, name: issue.department.name, code: issue.department.code } : null,
        reporter: issue.reporter
          ? { id: issue.reporter.id, name: `${issue.reporter.firstName || ''} ${issue.reporter.lastName || ''}`.trim() || issue.reporter.email }
          : null,
        aiAnalysis: issue.aiAnalysis
          ? {
              severity: issue.aiAnalysis?.severity,
              summary: issue.aiAnalysis?.summary,
              duplicateProbability: issue.aiAnalysis?.duplicateProbability,
              fakeProbability: issue.aiAnalysis?.fakeProbability,
              recommendedDepartment: issue.aiAnalysis?.recommendedDepartment,
            }
          : null,
        verification: issue.verificationData
          ? {
              aiVerified: issue.verificationData?.aiVerified ?? false,
              aiConfidence: issue.verificationData?.aiConfidence ?? null,
              citizenConfirmed: issue.verificationData?.citizenConfirmed ?? null,
            }
          : null,
      };
    });

    return { count: items.length, issues: items };
  }

  async aiOverlays(city?: string) {
    const qb = this.issueRepo
      .createQueryBuilder('issue')
      .select(`ST_Y(issue.location::geometry) as lat, ST_X(issue.location::geometry) as lng`)
      .addSelect('issue.category as category')
      .addSelect('issue.riskScore as riskScore')
      .addSelect('issue.communityScore as communityScore')
      .addSelect('issue.status as status')
      .where('issue.location IS NOT NULL');

    if (city) qb.andWhere('issue.city ILIKE :city', { city: `%${city}%` });

    const rows = await qb.getRawMany();

    const riskZones: Record<string, { lat: number; lng: number; count: number; totalRisk: number; totalCommunity: number }> = {};
    for (const r of rows) {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      const zone = riskZones[key] || { lat, lng, count: 0, totalRisk: 0, totalCommunity: 0 };
      zone.count += 1;
      zone.totalRisk += parseFloat(r.riskScore) || 0;
      zone.totalCommunity += parseFloat(r.communityScore) || 0;
      riskZones[key] = zone;
    }

    const zones = Object.values(riskZones).map((z) => ({
      lat: z.lat,
      lng: z.lng,
      issueCount: z.count,
      avgRisk: Math.round((z.totalRisk / z.count) * 10) / 10,
      avgCommunity: Math.round((z.totalCommunity / z.count) * 10) / 10,
    }));

    const highRisk = zones.filter((z) => z.avgRisk >= 60);
    const predictedHotspots = highRisk
      .filter((z) => z.issueCount >= 2)
      .map((z) => ({
        lat: z.lat,
        lng: z.lng,
        predictedRisk: Math.min(100, z.avgRisk + z.issueCount * 2),
        issueCount: z.issueCount,
      }))
      .sort((a, b) => b.predictedRisk - a.predictedRisk)
      .slice(0, 30);

    const closedStatuses = ['resolved', 'closed', 'archived', 'duplicate', 'invalid'];
    const rawRows = await this.issueRepo
      .createQueryBuilder('issue')
      .select(`issue.id, issue.title, issue.category`)
      .addSelect(`ST_Y(issue.location::geometry) as lat, ST_X(issue.location::geometry) as lng`)
      .where('issue.location IS NOT NULL')
      .andWhere('issue.status NOT IN (:...closed)', { closed: closedStatuses })
      .limit(500)
      .getRawMany();

    const points = rawRows
      .map((r: any) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
      }))
      .filter((p: any) => !Number.isNaN(p.lat) && !Number.isNaN(p.lng));

    const duplicateGroups: { id: string; title: string; category: string; lat: number; lng: number; similarCount: number }[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      let similarCount = 0;
      for (let j = 0; j < points.length; j++) {
        if (i === j || a.category !== points[j].category) continue;
        if (this.haversine(a.lat, a.lng, points[j].lat, points[j].lng) <= 0.5) similarCount++;
      }
      if (similarCount >= 1) {
        duplicateGroups.push({ ...a, similarCount });
        if (duplicateGroups.length >= 60) break;
      }
    }

    return {
      riskZones: zones.filter((z) => z.avgRisk >= 40),
      highRiskZones: highRisk,
      predictedHotspots,
      communityHealth: zones.filter((z) => z.avgCommunity > 0),
      duplicateGroups,
    };
  }

  async nearbySimilar(issueId: string, radiusKm = 1) {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) return { issueId, similar: [] };
    const loc = this.parseLocation(issue.location);
    if (!loc) return { issueId, similar: [] };

    const rows = await this.issueRepo
      .createQueryBuilder('i')
      .select('i.id, i.title, i.category, i.priority, i.status')
      .addSelect(`ST_Distance(i.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`, 'distance')
      .addSelect(`ST_Y(i.location::geometry) as lat, ST_X(i.location::geometry) as lng`)
      .where(`ST_DWithin(i.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`)
      .setParameter('lat', loc.lat)
      .setParameter('lng', loc.lng)
      .setParameter('radius', radiusKm * 1000)
      .getRawMany();

    return {
      issueId,
      similar: rows
        .filter((r: any) => r.id !== issueId && parseFloat(r.distance) < radiusKm * 1000)
        .slice(0, 10)
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          priority: r.priority,
          status: r.status,
          distanceMeters: Math.round(parseFloat(r.distance)),
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lng),
        })),
    };
  }

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
        ROUND(CAST(ST_X(ST_Centroid(issue.location::geometry)) AS NUMERIC), ${gridSize}) as lng,
        ROUND(CAST(ST_Y(ST_Centroid(issue.location::geometry)) AS NUMERIC), ${gridSize}) as lat
      `)
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(issue.riskScore)', 'avgRisk')
      .addSelect('AVG(issue.communityScore)', 'avgCommunityScore')
      .where(`ST_Within(issue.location::geometry, ST_MakeEnvelope(:swLng, :swLat, :neLng, :neLat, 4326))`)
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
      .select(`ST_Y(issue.location::geometry) as lat, ST_X(issue.location::geometry) as lng`)
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
        ST_Y(issue.location::geometry) as lat, ST_X(issue.location::geometry) as lng,
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
