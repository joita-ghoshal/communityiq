import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus, IssuePriority } from '../../database/entities/issue.entity';
import { IssueTimeline, TimelineAction } from '../../database/entities/issue-timeline.entity';

const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  [IssueStatus.REPORTED]: [IssueStatus.AI_ANALYZING, IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.INVALID],
  [IssueStatus.AI_ANALYZING]: [IssueStatus.COMMUNITY_VERIFICATION, IssueStatus.VERIFIED, IssueStatus.DUPLICATE, IssueStatus.INVALID, IssueStatus.REPORTED],
  [IssueStatus.COMMUNITY_VERIFICATION]: [IssueStatus.VERIFIED, IssueStatus.REPORTED, IssueStatus.INVALID],
  [IssueStatus.VERIFIED]: [IssueStatus.ASSIGNED, IssueStatus.CLOSED, IssueStatus.INVALID],
  [IssueStatus.ASSIGNED]: [IssueStatus.WORK_STARTED, IssueStatus.REPORTED, IssueStatus.VERIFIED],
  [IssueStatus.WORK_STARTED]: [IssueStatus.IN_PROGRESS, IssueStatus.ASSIGNED],
  [IssueStatus.IN_PROGRESS]: [IssueStatus.PARTIALLY_RESOLVED, IssueStatus.RESOLVED, IssueStatus.AWAITING_AI_VERIFICATION],
  [IssueStatus.PARTIALLY_RESOLVED]: [IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.AWAITING_AI_VERIFICATION],
  [IssueStatus.AWAITING_AI_VERIFICATION]: [IssueStatus.AWAITING_CITIZEN_CONFIRMATION, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED],
  [IssueStatus.AWAITING_CITIZEN_CONFIRMATION]: [IssueStatus.CLOSED, IssueStatus.IN_PROGRESS, IssueStatus.REOPENED],
  [IssueStatus.RESOLVED]: [IssueStatus.CLOSED, IssueStatus.REOPENED, IssueStatus.ARCHIVED],
  [IssueStatus.CLOSED]: [IssueStatus.ARCHIVED, IssueStatus.REOPENED],
  [IssueStatus.ARCHIVED]: [],
  [IssueStatus.DUPLICATE]: [IssueStatus.REOPENED],
  [IssueStatus.REOPENED]: [IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.CLOSED],
  [IssueStatus.INVALID]: [IssueStatus.REPORTED],
};

const STATUS_STEP_MAP: Record<IssueStatus, number> = {
  [IssueStatus.REPORTED]: 0,
  [IssueStatus.AI_ANALYZING]: 8,
  [IssueStatus.COMMUNITY_VERIFICATION]: 16,
  [IssueStatus.VERIFIED]: 25,
  [IssueStatus.ASSIGNED]: 33,
  [IssueStatus.WORK_STARTED]: 42,
  [IssueStatus.IN_PROGRESS]: 58,
  [IssueStatus.PARTIALLY_RESOLVED]: 70,
  [IssueStatus.AWAITING_AI_VERIFICATION]: 80,
  [IssueStatus.AWAITING_CITIZEN_CONFIRMATION]: 90,
  [IssueStatus.RESOLVED]: 95,
  [IssueStatus.CLOSED]: 100,
  [IssueStatus.ARCHIVED]: 100,
  [IssueStatus.DUPLICATE]: 0,
  [IssueStatus.REOPENED]: 42,
  [IssueStatus.INVALID]: 0,
};

@Injectable()
export class IssueLifecycleService {
  private readonly logger = new Logger(IssueLifecycleService.name);

  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(IssueTimeline)
    private readonly timelineRepo: Repository<IssueTimeline>,
  ) {}

  async transitionStatus(
    issueId: string,
    newStatus: IssueStatus,
    userId: string,
    userName?: string,
    userRole?: string,
    metadata?: Record<string, any>,
  ): Promise<Issue> {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) throw new BadRequestException('Issue not found');

    const allowed = VALID_TRANSITIONS[issue.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${issue.status}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`
      );
    }

    const oldStatus = issue.status;
    issue.status = newStatus;
    issue.completionPercentage = STATUS_STEP_MAP[newStatus] || issue.completionPercentage;

    if (newStatus === IssueStatus.RESOLVED) {
      issue.resolvedAt = new Date();
    } else if (newStatus === IssueStatus.CLOSED) {
      issue.closedAt = new Date();
      issue.completionPercentage = 100;
    } else if (newStatus === IssueStatus.ARCHIVED) {
      issue.archivedAt = new Date();
      issue.completionPercentage = 100;
    }

    await this.issueRepo.save(issue);

    await this.addTimelineEvent(issueId, TimelineAction.STATUS_CHANGED, userId, userName, userRole, {
      from: oldStatus,
      to: newStatus,
      ...metadata,
    });

    return issue;
  }

  async updateProgress(
    issueId: string,
    percentage: number,
    pendingWork?: string,
    completedWork?: string,
    remainingTasks?: string,
    estimatedCompletion?: Date,
    responsibleTeam?: string,
    userId?: string,
    userName?: string,
    userRole?: string,
  ): Promise<Issue> {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) throw new BadRequestException('Issue not found');

    issue.completionPercentage = Math.max(0, Math.min(100, percentage));
    if (pendingWork) issue.pendingWork = pendingWork;
    if (completedWork) issue.completedWork = completedWork;
    if (remainingTasks) issue.remainingTasks = remainingTasks;
    if (estimatedCompletion) issue.estimatedCompletion = estimatedCompletion;
    if (responsibleTeam) issue.currentResponsibleTeam = responsibleTeam;

    await this.issueRepo.save(issue);

    if (userId) {
      await this.addTimelineEvent(issueId, TimelineAction.PROGRESS_UPDATED, userId, userName, userRole, {
        percentage,
        pendingWork,
        completedWork,
        remainingTasks,
      });
    }

    return issue;
  }

  async uploadEvidence(
    issueId: string,
    userId: string,
    userName: string,
    userRole: string,
    evidence: {
      beforePhotos?: string[];
      afterPhotos?: string[];
      workNotes?: string;
    },
  ): Promise<Issue> {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) throw new BadRequestException('Issue not found');

    issue.verificationData = {
      ...(issue.verificationData as any || {}),
      beforePhotos: evidence.beforePhotos || (issue.verificationData as any)?.beforePhotos,
      afterPhotos: evidence.afterPhotos || (issue.verificationData as any)?.afterPhotos,
      workNotes: evidence.workNotes || (issue.verificationData as any)?.workNotes,
      evidenceUploadedBy: userId,
      evidenceUploadedAt: new Date(),
    };

    issue.status = IssueStatus.AWAITING_AI_VERIFICATION;
    issue.completionPercentage = 80;

    await this.issueRepo.save(issue);

    await this.addTimelineEvent(issueId, TimelineAction.EVIDENCE_UPLOADED, userId, userName, userRole, {
      beforePhotosCount: evidence.beforePhotos?.length || 0,
      afterPhotosCount: evidence.afterPhotos?.length || 0,
      hasWorkNotes: !!evidence.workNotes,
    });

    await this.addTimelineEvent(issueId, TimelineAction.AI_VERIFICATION_STARTED, userId, userName, userRole);

    return issue;
  }

  async confirmCitizenResolution(
    issueId: string,
    confirmed: boolean,
    userId: string,
    userName: string,
  ): Promise<Issue> {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) throw new BadRequestException('Issue not found');

    if (issue.status !== IssueStatus.AWAITING_CITIZEN_CONFIRMATION) {
      throw new BadRequestException('Issue is not awaiting citizen confirmation');
    }

    issue.verificationData = {
      ...(issue.verificationData as any || {}),
      citizenConfirmed: confirmed,
      citizenConfirmationDate: new Date(),
    };

    if (confirmed) {
      issue.status = IssueStatus.CLOSED;
      issue.closedAt = new Date();
      issue.completionPercentage = 100;
    } else {
      issue.status = IssueStatus.IN_PROGRESS;
      issue.completionPercentage = 58;
    }

    await this.issueRepo.save(issue);

    await this.addTimelineEvent(
      issueId,
      confirmed ? TimelineAction.CITIZEN_CONFIRMED : TimelineAction.CITIZEN_REJECTED,
      userId,
      userName,
      undefined,
      { confirmed },
    );

    return issue;
  }

  async escalateIssue(
    issueId: string,
    reason: string,
    userId: string,
    userName?: string,
    userRole?: string,
  ): Promise<Issue> {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) throw new BadRequestException('Issue not found');

    const currentLevel = (issue.slaData as any)?.escalationLevel || 0;
    issue.slaData = {
      ...(issue.slaData as any || {}),
      escalationLevel: currentLevel + 1,
    };

    if (issue.priority !== IssuePriority.EMERGENCY && issue.priority !== IssuePriority.CRITICAL) {
      const priorities = ['low', 'medium', 'high', 'critical', 'emergency'] as const;
      const currentIdx = priorities.indexOf(issue.priority as any);
      if (currentIdx < priorities.length - 1) {
        issue.priority = priorities[currentIdx + 1] as any;
      }
    }

    await this.issueRepo.save(issue);

    await this.addTimelineEvent(issueId, TimelineAction.ESCALATED, userId, userName, userRole, {
      reason,
      escalationLevel: currentLevel + 1,
    });

    return issue;
  }

  getValidTransitions(currentStatus: IssueStatus): IssueStatus[] {
    return VALID_TRANSITIONS[currentStatus] || [];
  }

  getProgressPercentage(status: IssueStatus): number {
    return STATUS_STEP_MAP[status] || 0;
  }

  private async addTimelineEvent(
    issueId: string,
    action: TimelineAction,
    performedBy: string,
    performedByName?: string,
    performedByRole?: string,
    metadata?: Record<string, any>,
  ) {
    const event = this.timelineRepo.create({
      issueId,
      action,
      performedBy,
      performedByName,
      performedByRole,
      metadata,
    });
    return this.timelineRepo.save(event);
  }
}
