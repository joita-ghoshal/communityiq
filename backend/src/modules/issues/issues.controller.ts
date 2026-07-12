import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { IssueLifecycleService } from './issue-lifecycle.service';
import { IssueStatus } from '../../database/entities/issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Issues')
@Controller('issues')
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService,
    private readonly lifecycleService: IssueLifecycleService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all issues with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Issues retrieved' })
  async findAll(@Query() queryDto: QueryIssueDto) {
    return this.issuesService.findAll(queryDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get issue statistics' })
  async getStats() {
    return this.issuesService.getStats();
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get issues near a location' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radius', type: Number, description: 'Radius in km' })
  async findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius = 5,
  ) {
    return this.issuesService.findNearby(lat, lng, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Report a new issue' })
  @ApiResponse({ status: 201, description: 'Issue created' })
  async create(
    @Body() createIssueDto: CreateIssueDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.issuesService.create(createIssueDto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update issue' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() updateIssueDto: UpdateIssueDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.issuesService.update(id, updateIssueDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete issue' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.issuesService.remove(id, userId);
  }

  @Post(':id/upvote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upvote an issue' })
  async upvote(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.issuesService.upvote(id, userId);
  }

  @Post(':id/downvote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Downvote an issue' })
  async downvote(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.issuesService.downvote(id, userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update issue status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.issuesService.updateStatus(id, status, userId);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Assign issue to department/user' })
  async assign(
    @Param('id') id: string,
    @Body('departmentId') departmentId: string,
    @Body('assignedToId') assignedToId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.issuesService.assign(id, departmentId, assignedToId, userId);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get issue timeline' })
  async getTimeline(@Param('id') id: string) {
    return this.issuesService.getTimeline(id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get issue comments' })
  async getComments(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.issuesService.getComments(id, page, limit);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add comment to issue' })
  async addComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser('id') userId: string,
    @Body('parentId') parentId?: string,
  ) {
    return this.issuesService.addComment(id, content, userId, parentId);
  }

  @Patch(':id/transition')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Transition issue status with validation' })
  async transitionStatus(
    @Param('id') id: string,
    @Body('status') status: IssueStatus,
    @CurrentUser('id') userId: string,
    @CurrentUser('firstName') firstName?: string,
    @CurrentUser('lastName') lastName?: string,
    @CurrentUser('role') userRole?: string,
  ) {
    const userName = [firstName, lastName].filter(Boolean).join(' ');
    return this.lifecycleService.transitionStatus(id, status, userId, userName, userRole);
  }

  @Patch(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update issue progress' })
  async updateProgress(
    @Param('id') id: string,
    @Body('percentage') percentage: number,
    @Body('pendingWork') pendingWork?: string,
    @Body('completedWork') completedWork?: string,
    @Body('remainingTasks') remainingTasks?: string,
    @Body('estimatedCompletion') estimatedCompletion?: Date,
    @Body('responsibleTeam') responsibleTeam?: string,
    @CurrentUser('id') userId?: string,
    @CurrentUser('name') userName?: string,
    @CurrentUser('role') userRole?: string,
  ) {
    return this.lifecycleService.updateProgress(
      id, percentage, pendingWork, completedWork, remainingTasks,
      estimatedCompletion, responsibleTeam, userId, userName, userRole,
    );
  }

  @Post(':id/evidence')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload before/after evidence' })
  async uploadEvidence(
    @Param('id') id: string,
    @Body('beforePhotos') beforePhotos: string[],
    @Body('afterPhotos') afterPhotos: string[],
    @Body('workNotes') workNotes: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('name') userName: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.lifecycleService.uploadEvidence(id, userId, userName, userRole, { beforePhotos, afterPhotos, workNotes });
  }

  @Post(':id/citizen-confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Citizen confirm or reject resolution' })
  async citizenConfirm(
    @Param('id') id: string,
    @Body('confirmed') confirmed: boolean,
    @CurrentUser('id') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.lifecycleService.confirmCitizenResolution(id, confirmed, userId, userName);
  }

  @Post(':id/escalate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Escalate issue' })
  async escalate(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('name') userName?: string,
    @CurrentUser('role') userRole?: string,
  ) {
    return this.lifecycleService.escalateIssue(id, reason, userId, userName, userRole);
  }

  @Get(':id/valid-transitions')
  @ApiOperation({ summary: 'Get valid next statuses' })
  async getValidTransitions(@Param('id') id: string) {
    const issue = await this.issuesService.findOne(id);
    return this.lifecycleService.getValidTransitions(issue.status);
  }
}
