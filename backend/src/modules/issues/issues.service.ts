import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Issue, IssueStatus, IssuePriority, IssueCategory } from '../../database/entities/issue.entity';
import { IssueMedia } from '../../database/entities/issue-media.entity';
import { IssueTimeline, TimelineAction } from '../../database/entities/issue-timeline.entity';
import { Comment } from '../../database/entities/comment.entity';
import { IssueLifecycleService } from './issue-lifecycle.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { QueryIssueDto } from './dto/query-issue.dto';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueMedia)
    private readonly mediaRepository: Repository<IssueMedia>,
    @InjectRepository(IssueTimeline)
    private readonly timelineRepository: Repository<IssueTimeline>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly lifecycleService: IssueLifecycleService,
  ) {}

  async findAll(queryDto: QueryIssueDto) {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      priority,
      city,
      ward,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      lat,
      lng,
      radiusKm,
      startDate,
      endDate,
    } = queryDto;

    const queryBuilder = this.issueRepository.createQueryBuilder('issue');
    queryBuilder.leftJoinAndSelect('issue.reporter', 'reporter');
    queryBuilder.leftJoinAndSelect('issue.department', 'department');
    queryBuilder.leftJoinAndSelect('issue.assignedTo', 'assignedTo');

    if (category) {
      queryBuilder.andWhere('issue.category = :category', { category });
    }

    if (status) {
      queryBuilder.andWhere('issue.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('issue.priority = :priority', { priority });
    }

    if (city) {
      queryBuilder.andWhere('issue.city ILIKE :city', { city: `%${city}%` });
    }

    if (ward) {
      queryBuilder.andWhere('issue.ward ILIKE :ward', { ward: `%${ward}%` });
    }

    if (search) {
      queryBuilder.andWhere(
        '(issue.title ILIKE :search OR issue.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (lat && lng && radiusKm) {
      queryBuilder.andWhere(
        `ST_DWithin(issue.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
        { lat, lng, radius: radiusKm * 1000 },
      );
    }

    if (startDate) {
      queryBuilder.andWhere('issue.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('issue.createdAt <= :endDate', { endDate });
    }

    const validSortColumns = ['createdAt', 'updatedAt', 'priority', 'communityScore', 'upvotes', 'riskScore'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`issue.${sortColumn}`, sortOrder === 'ASC' ? 'ASC' : 'DESC');

    const [issues, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: issues,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: ['reporter', 'assignedTo', 'department'],
    });

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    await this.issueRepository.increment({ id }, 'viewCount', 1);

    return issue;
  }

  async create(createIssueDto: CreateIssueDto, userId: string) {
    const issue = this.issueRepository.create({
      ...createIssueDto,
      reporterId: userId,
      location: undefined as any,
    } as any);

    const saved = await this.issueRepository.save(issue) as any;

    if (createIssueDto.latitude && createIssueDto.longitude) {
      await this.issueRepository.query(
        `UPDATE issues SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        [createIssueDto.longitude, createIssueDto.latitude, saved.id],
      );
    }

    await this.addTimelineEvent(saved.id, TimelineAction.CREATED, userId, {
      title: saved.title,
      category: saved.category,
    });

    return this.findOne(saved.id);
  }

  async update(id: string, updateIssueDto: UpdateIssueDto, userId: string) {
    const issue = await this.issueRepository.findOne({ where: { id } });

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    if (updateIssueDto.latitude && updateIssueDto.longitude) {
      (updateIssueDto as any).location = () =>
        `ST_SetSRID(ST_MakePoint(${updateIssueDto.longitude}, ${updateIssueDto.latitude}), 4326)`;
    }

    Object.assign(issue, updateIssueDto);
    await this.issueRepository.save(issue);

    await this.addTimelineEvent(id, TimelineAction.STATUS_CHANGED, userId, updateIssueDto);

    return this.findOne(id);
  }

  async remove(id: string, userId: string) {
    const issue = await this.issueRepository.findOne({ where: { id } });

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    await this.issueRepository.remove(issue);
    return { message: 'Issue deleted successfully' };
  }

  async upvote(id: string, userId: string) {
    const issue = await this.issueRepository.findOne({ where: { id } });

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    await this.issueRepository.increment({ id }, 'upvotes', 1);

    const communityScore = Math.min(100, (issue.communityScore || 0) + 2);
    await this.issueRepository.update(id, { communityScore });

    await this.addTimelineEvent(id, TimelineAction.UPVOTED, userId);

    return this.findOne(id);
  }

  async downvote(id: string, userId: string) {
    const issue = await this.issueRepository.findOne({ where: { id } });

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    await this.issueRepository.increment({ id }, 'downvotes', 1);

    const communityScore = Math.max(0, (issue.communityScore || 0) - 1);
    await this.issueRepository.update(id, { communityScore });

    await this.addTimelineEvent(id, TimelineAction.DOWNVOTED, userId);

    return this.findOne(id);
  }

  async updateStatus(id: string, status: string, userId: string) {
    return this.lifecycleService.transitionStatus(id, status as IssueStatus, userId);
  }

  async assign(id: string, departmentId: string, assignedToId: string, userId: string) {
    const issue = await this.issueRepository.findOne({ where: { id } });

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    issue.departmentId = departmentId;
    issue.assignedToId = assignedToId;
    issue.status = IssueStatus.IN_PROGRESS;

    await this.issueRepository.save(issue);

    await this.addTimelineEvent(id, TimelineAction.ASSIGNED, userId, {
      departmentId,
      assignedToId,
    });

    return this.findOne(id);
  }

  async getStats() {
    const totalIssues = await this.issueRepository.count();
    const openIssues = await this.issueRepository.count({ where: { status: IssueStatus.REPORTED } });
    const inProgressIssues = await this.issueRepository.count({ where: { status: IssueStatus.IN_PROGRESS } });
    const resolvedIssues = await this.issueRepository.count({ where: { status: IssueStatus.RESOLVED } });

    const categoryStats = await this.issueRepository
      .createQueryBuilder('issue')
      .select('issue.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('issue.category')
      .getRawMany();

    const priorityStats = await this.issueRepository
      .createQueryBuilder('issue')
      .select('issue.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('issue.priority')
      .getRawMany();

    const statusStats = await this.issueRepository
      .createQueryBuilder('issue')
      .select('issue.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('issue.status')
      .getRawMany();

    return {
      total: totalIssues,
      open: openIssues,
      inProgress: inProgressIssues,
      resolved: resolvedIssues,
      resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(2) : 0,
      byCategory: categoryStats,
      byPriority: priorityStats,
      byStatus: statusStats,
    };
  }

  async findNearby(lat: number, lng: number, radiusKm: number) {
    const issues = await this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .addSelect(
        `ST_Distance(issue.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`,
        'distance',
      )
      .where(
        `ST_DWithin(issue.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
        { lat, lng, radius: radiusKm * 1000 },
      )
      .orderBy('distance', 'ASC')
      .limit(50)
      .getMany();

    return issues;
  }

  async getTimeline(id: string) {
    const timeline = await this.timelineRepository.find({
      where: { issueId: id },
      order: { createdAt: 'DESC' },
    });

    return timeline;
  }

  async getComments(id: string, page = 1, limit = 20) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { issueId: id },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addComment(id: string, content: string, userId: string, parentId?: string) {
    const issue = await this.issueRepository.findOne({ where: { id } });

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    const comment = this.commentRepository.create({
      issueId: id,
      userId,
      content,
      parentId,
    });

    const saved = await this.commentRepository.save(comment);

    await this.issueRepository.increment({ id }, 'commentCount', 1);

    await this.addTimelineEvent(id, TimelineAction.COMMENTED, userId, {
      commentId: saved.id,
      content: content.substring(0, 100),
    });

    return saved;
  }

  private async addTimelineEvent(
    issueId: string,
    action: TimelineAction,
    performedBy: string,
    metadata?: Record<string, any>,
  ) {
    const event = this.timelineRepository.create({
      issueId,
      action,
      performedBy,
      metadata,
    });

    return this.timelineRepository.save(event);
  }
}
