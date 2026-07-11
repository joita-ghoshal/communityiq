import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('verify/:issueId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Verify or dispute an issue' })
  @ApiParam({ name: 'issueId', type: String })
  async verify(
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { isVerified: boolean; confidence?: number; comment?: string; voteType?: string; evidence?: Record<string, any> },
  ) {
    return this.communityService.verifyIssue(issueId, userId, body);
  }

  @Post('vote/:issueId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upvote or downvote an issue' })
  @ApiParam({ name: 'issueId', type: String })
  async vote(
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @Body('direction') direction: 'up' | 'down',
  ) {
    return this.communityService.vote(issueId, userId, direction);
  }

  @Post('comment/:issueId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add comment to an issue' })
  async comment(
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
    @Body('parentId') parentId?: string,
  ) {
    return this.communityService.addComment(issueId, userId, content, parentId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby community-verified issues' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radius', type: Number, required: false })
  async nearbyIssues(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius = 5,
  ) {
    return this.communityService.getNearbyIssues(lat, lng, radius);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get community leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year', 'all'] })
  async leaderboard(@Query('period') period = 'all') {
    return this.communityService.getLeaderboard(period);
  }

  @Get('stats/:issueId')
  @ApiOperation({ summary: 'Get community stats for an issue' })
  async getStats(@Param('issueId') issueId: string) {
    return this.communityService.getIssueStats(issueId);
  }
}
