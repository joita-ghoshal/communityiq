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

  @Get('cluster')
  @ApiOperation({ summary: 'Get issue clusters for map' })
  @ApiQuery({ name: 'sw_lat', type: Number })
  @ApiQuery({ name: 'sw_lng', type: Number })
  @ApiQuery({ name: 'ne_lat', type: Number })
  @ApiQuery({ name: 'ne_lng', type: Number })
  @ApiQuery({ name: 'zoom', type: Number, required: false })
  async cluster(@Query('sw_lat') swLat: number, @Query('sw_lng') swLng: number, @Query('ne_lat') neLat: number, @Query('ne_lng') neLng: number, @Query('zoom') zoom = 10) {
    return this.gisService.getClusters(swLat, swLng, neLat, neLng, zoom);
  }

  @Get('heatmap')
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
}
