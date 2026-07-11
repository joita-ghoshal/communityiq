import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Emergency')
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post('alerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create emergency alert' })
  async createAlert(
    @Body() body: { type: string; severity: string; title: string; description: string; latitude?: number; longitude?: number; affectedArea?: any; evacuationRequired?: boolean; contactNumber?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.emergencyService.createAlert(body, userId);
  }

  @Patch('alerts/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Resolve emergency alert' })
  @ApiParam({ name: 'id', type: String })
  async resolve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.emergencyService.resolveAlert(id, userId);
  }

  @Get('alerts/active')
  @ApiOperation({ summary: 'Get all active alerts' })
  async activeAlerts() {
    return this.emergencyService.getActiveAlerts();
  }

  @Get('alerts/nearby')
  @ApiOperation({ summary: 'Get alerts near a location' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radius', type: Number, required: false })
  async nearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius = 10,
  ) {
    return this.emergencyService.getNearbyAlerts(lat, lng, radius);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find emergency alerts within radius using geofencing (haversine)' })
  @ApiQuery({ name: 'latitude', type: Number })
  @ApiQuery({ name: 'longitude', type: Number })
  @ApiQuery({ name: 'radius', type: Number, required: false, description: 'Radius in km (default: 10)' })
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius = 10,
  ) {
    return this.emergencyService.findNearbyAlerts(latitude, longitude, radius);
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.emergencyService.findOne(id);
  }
}
