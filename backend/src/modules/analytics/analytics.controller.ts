import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview' })
  async getDashboard(@Query('city') city?: string) {
    return this.analyticsService.getDashboard(city);
  }

  @Get('department-performance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN)
  @ApiOperation({ summary: 'Get department performance metrics' })
  async getDepartmentPerformance() {
    return this.analyticsService.getDepartmentPerformance();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get issue trends over time' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  @ApiQuery({ name: 'city', required: false })
  async getTrends(@Query('period') period = 'month', @Query('city') city?: string) {
    return this.analyticsService.getTrends(period, city);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get key performance indicators' })
  async getKpis(@Query('city') city?: string) {
    return this.analyticsService.getKpis(city);
  }

  @Get('executive-report')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get executive summary report' })
  async getExecutiveReport(@Query('days') days = 30) {
    return this.analyticsService.getExecutiveReport(days);
  }

  @Get('community-health')
  @ApiOperation({ summary: 'Get community engagement health metrics' })
  async getCommunityHealth(@Query('city') city?: string) {
    return this.analyticsService.getCommunityHealth(city);
  }
}
