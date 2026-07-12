import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { Issue, IssueStatus } from '../../database/entities/issue.entity';

@Injectable()
export class NotificationHelperService {
  private readonly logger = new Logger(NotificationHelperService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Issue) private readonly issueRepo: Repository<Issue>,
  ) {}

  async notifyIssueAssigned(issueId: string, assigneeId: string, assignedByName: string) {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) return;

    await this.notificationsService.create({
      userId: assigneeId,
      type: NotificationType.ISSUE_UPDATE,
      title: 'New Issue Assigned',
      message: `You have been assigned to issue: ${issue.title}`,
      data: { issueId, status: 'assigned' },
      entityUrl: `/issues/${issueId}`,
      channels: ['in_app', 'push'],
    });
  }

  async notifyStatusChanged(issueId: string, oldStatus: string, newStatus: string, reporterId?: string) {
    if (!reporterId) return;
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) return;

    const statusMessages: Record<string, string> = {
      [IssueStatus.WORK_STARTED]: 'Work has started on your reported issue',
      [IssueStatus.IN_PROGRESS]: 'Your issue is being worked on',
      [IssueStatus.PARTIALLY_RESOLVED]: 'Your issue is partially resolved',
      [IssueStatus.RESOLVED]: 'Your issue has been marked as resolved',
      [IssueStatus.AWAITING_CITIZEN_CONFIRMATION]: 'Please confirm if the issue has been resolved',
      [IssueStatus.CLOSED]: 'Your issue has been closed',
    };

    const message = statusMessages[newStatus] || `Issue status changed to ${newStatus}`;

    await this.notificationsService.create({
      userId: reporterId,
      type: NotificationType.ISSUE_UPDATE,
      title: 'Issue Status Updated',
      message: `${issue.title}: ${message}`,
      data: { issueId, oldStatus, newStatus },
      entityUrl: `/issues/${issueId}`,
      channels: ['in_app', 'push'],
    });
  }

  async notifyEvidenceUploaded(issueId: string, reporterId?: string) {
    if (!reporterId) return;
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) return;

    await this.notificationsService.create({
      userId: reporterId,
      type: NotificationType.ISSUE_UPDATE,
      title: 'Evidence Submitted',
      message: `Resolution evidence has been uploaded for: ${issue.title}. AI is verifying...`,
      data: { issueId, status: 'awaiting_verification' },
      entityUrl: `/issues/${issueId}`,
      channels: ['in_app'],
    });
  }

  async notifyAIVerificationResult(issueId: string, passed: boolean, reporterId?: string) {
    if (!reporterId) return;
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) return;

    await this.notificationsService.create({
      userId: reporterId,
      type: NotificationType.ISSUE_UPDATE,
      title: passed ? 'AI Verification Passed' : 'AI Verification Failed',
      message: passed
        ? `Please confirm resolution for: ${issue.title}`
        : `AI could not verify resolution for: ${issue.title}. Work will continue.`,
      data: { issueId, aiVerified: passed },
      entityUrl: `/issues/${issueId}`,
      channels: ['in_app', 'push'],
    });
  }

  async notifyCitizenConfirmationRequired(issueId: string, reporterId?: string) {
    if (!reporterId) return;
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) return;

    await this.notificationsService.create({
      userId: reporterId,
      type: NotificationType.ISSUE_UPDATE,
      title: 'Confirmation Required',
      message: `Please confirm if the issue has been resolved: ${issue.title}`,
      data: { issueId, status: 'awaiting_citizen_confirmation' },
      entityUrl: `/issues/${issueId}`,
      channels: ['in_app', 'push'],
    });
  }

  async notifyIssueClosed(issueId: string, reporterId?: string, assignedToId?: string) {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) return;

    const userIds = [reporterId, assignedToId].filter(Boolean);

    for (const userId of userIds) {
      await this.notificationsService.create({
        userId,
        type: NotificationType.ISSUE_UPDATE,
        title: 'Issue Closed',
        message: `Issue has been closed: ${issue.title}`,
        data: { issueId, status: 'closed' },
        entityUrl: `/issues/${issueId}`,
        channels: ['in_app'],
      });
    }
  }

  async notifyEscalation(issueId: string, escalationLevel: number, userIds: string[]) {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) return;

    for (const userId of userIds) {
      await this.notificationsService.create({
        userId,
        type: NotificationType.ISSUE_UPDATE,
        title: `Escalation Level ${escalationLevel}`,
        message: `Issue escalated: ${issue.title} - Priority: ${issue.priority}`,
        data: { issueId, escalationLevel, priority: issue.priority },
        entityUrl: `/issues/${issueId}`,
        channels: ['in_app', 'push'],
      });
    }
  }

  async notifyEmergencyAlert(alertData: { title: string; severity: string; type: string }, userIds: string[]) {
    for (const userId of userIds) {
      await this.notificationsService.create({
        userId,
        type: NotificationType.EMERGENCY_ALERT,
        title: `🚨 ${alertData.title}`,
        message: `Emergency Alert (${alertData.severity}): ${alertData.type}`,
        data: alertData,
        channels: ['in_app', 'push'],
      });
    }
  }

  async broadcastNotification(title: string, message: string, userIds: string[]) {
    const notifications = userIds.map(userId => ({
      userId,
      type: NotificationType.SYSTEM as NotificationType,
      title,
      message,
      channels: ['in_app'] as string[],
    }));

    await this.notificationsService.createBulk(notifications);
  }
}
