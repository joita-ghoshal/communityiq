import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GisService } from './gis.service';

@ApiTags('GIS')
@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @Get('nearby')
  @ApiOperation({ summary: 'Get issues near a point' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radius', type: Number, required: false })
  @ApiQuery({ name: 'category', type: String, required: false })
  async nearby(@Query('lat') lat: number, @Query('lng') lng: number, @Query('radius') radius = 5, @Query('category') category?: string) {
    return this.gisService.findNearby(lat, lng, radius, category);
  }

  @Get(['cluster', 'clusters'])
  @ApiOperation({ summary: 'Get issue clusters for map' })
  @ApiQuery({ name: 'sw_lat', type: Number })
  @ApiQuery({ name: 'sw_lng', type: Number })
  @ApiQuery({ name: 'ne_lat', type: Number })
  @ApiQuery({ name: 'ne_lng', type: Number })
  @ApiQuery({ name: 'zoom', type: Number, required: false })
  async cluster(@Query('sw_lat') swLat: number, @Query('sw_lng') swLng: number, @Query('ne_lat') neLat: number, @Query('ne_lng') neLng: number, @Query('zoom') zoom = 10) {
    return this.gisService.getClusters(swLat, swLng, neLat, neLng, zoom);
  }

  @Get(['heatmap', 'heatmap-data'])
  @ApiOperation({ summary: 'Get heatmap data' })
  @ApiQuery({ name: 'city', type: String, required: false })
  @ApiQuery({ name: 'category', type: String, required: false })
  async heatmap(@Query('city') city?: string, @Query('category') category?: string) {
    return this.gisService.getHeatmapData(city, category);
  }

  @Get('risk-zones')
  @ApiOperation({ summary: 'Get high-risk zones' })
  @ApiQuery({ name: 'city', type: String, required: false })
  async riskZones(@Query('city') city?: string) {
    return this.gisService.getRiskZones(city);
  }

  @Get('wards')
  @ApiOperation({ summary: 'Get ward-wise statistics' })
  @ApiQuery({ name: 'city', type: String, required: false })
  async wards(@Query('city') city?: string) {
    return this.gisService.getWardStats(city);
  }

  @Get('geofence')
  @ApiOperation({ summary: 'Check if point is within affected area' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  async geofence(@Query('lat') lat: number, @Query('lng') lng: number) {
    return this.gisService.checkGeofence(lat, lng);
  }

  @Get('reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode coordinates to address (OpenStreetMap)' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  async reverseGeocode(@Query('lat') lat: number, @Query('lng') lng: number) {
    return this.gisService.reverseGeocode(lat, lng);
  }

  @Get('geocode')
  @ApiOperation({ summary: 'Forward geocode a free-text address/landmark query (OpenStreetMap)' })
  @ApiQuery({ name: 'q', type: String })
  async geocode(@Query('q') q: string) {
    return this.gisService.forwardGeocode(q);
  }

  @Get('search')
  @ApiOperation({ summary: 'Smart search: addresses, landmarks, wards, PIN codes, departments, issues' })
  @ApiQuery({ name: 'q', type: String })
  @ApiQuery({ name: 'type', enum: ['address', 'landmark', 'ward', 'pincode', 'department'], required: false })
  async search(@Query('q') q: string, @Query('type') type?: string) {
    return this.gisService.searchAll(q, type);
  }

  @Get('explore')
  @ApiOperation({ summary: 'Issues around a point with filters, distance, reporter & AI verification' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radius', type: Number, required: false })
  @ApiQuery({ name: 'category', type: String, required: false })
  @ApiQuery({ name: 'priority', type: String, required: false })
  @ApiQuery({ name: 'status', type: String, required: false })
  @ApiQuery({ name: 'departmentId', type: String, required: false })
  @ApiQuery({ name: 'aiVerified', type: String, required: false })
  async explore(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius = 20,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('aiVerified') aiVerified?: string,
  ) {
    return this.gisService.explore(lat, lng, radius, { category, priority, status, departmentId, aiVerified });
  }

  @Get('ai-overlay')
  @ApiOperation({ summary: 'AI overlays: risk zones, predicted hotspots, community health, duplicates' })
  @ApiQuery({ name: 'city', type: String, required: false })
  async aiOverlay(@Query('city') city?: string) {
    return this.gisService.aiOverlays(city);
  }

  @Get('nearby-similar')
  @ApiOperation({ summary: 'Find similar issues near an issue (duplicate detection)' })
  @ApiQuery({ name: 'issueId', type: String })
  @ApiQuery({ name: 'radiusKm', type: Number, required: false })
  async nearbySimilar(@Query('issueId') issueId: string, @Query('radiusKm') radiusKm?: number) {
    return this.gisService.nearbySimilar(issueId, radiusKm);
  }
}
