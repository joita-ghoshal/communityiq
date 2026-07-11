import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { VolunteersService } from './volunteers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Volunteers')
@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get volunteer profile for current user' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.volunteersService.getProfile(userId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get volunteer leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year', 'all'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async leaderboard(@Query('period') period = 'all', @Query('limit') limit = 20) {
    return this.volunteersService.getLeaderboard(period, limit);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get available badges' })
  async getBadges() {
    return this.volunteersService.getAvailableBadges();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get volunteer profile by user ID' })
  @ApiParam({ name: 'userId', type: String })
  async getVolunteerProfile(@Param('userId') userId: string) {
    return this.volunteersService.getProfile(userId);
  }

  @Post('assign-badge/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Assign badge to volunteer (admin)' })
  @ApiParam({ name: 'userId', type: String })
  async assignBadge(
    @Param('userId') userId: string,
    @Query('badgeId') badgeId: string,
  ) {
    return this.volunteersService.assignBadge(userId, badgeId);
  }

  @Get('contributions/:userId')
  @ApiOperation({ summary: 'Get volunteer contribution history' })
  @ApiParam({ name: 'userId', type: String })
  async getContributions(@Param('userId') userId: string) {
    return this.volunteersService.getContributions(userId);
  }
}
