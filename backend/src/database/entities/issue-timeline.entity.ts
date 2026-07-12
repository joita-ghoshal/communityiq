import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Issue } from './issue.entity';

export enum TimelineAction {
  CREATED = 'created',
  AI_ANALYSIS_STARTED = 'ai_analysis_started',
  AI_ANALYSIS_COMPLETED = 'ai_analysis_completed',
  AI_DUPLICATE_DETECTED = 'ai_duplicate_detected',
  AI_SEVERITY_ASSIGNED = 'ai_severity_assigned',
  COMMUNITY_VERIFICATION_STARTED = 'community_verification_started',
  COMMUNITY_VERIFIED = 'community_verified',
  COMMUNITY_DISPUTED = 'community_disputed',
  VERIFIED = 'verified',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  DEPARTMENT_CHANGED = 'department_changed',
  WORK_STARTED = 'work_started',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  PROGRESS_UPDATED = 'progress_updated',
  PARTIALLY_RESOLVED = 'partially_resolved',
  EVIDENCE_UPLOADED = 'evidence_uploaded',
  AI_VERIFICATION_STARTED = 'ai_verification_started',
  AI_VERIFICATION_PASSED = 'ai_verification_passed',
  AI_VERIFICATION_FAILED = 'ai_verification_failed',
  CITIZEN_CONFIRMATION_REQUESTED = 'citizen_confirmation_requested',
  CITIZEN_CONFIRMED = 'citizen_confirmed',
  CITIZEN_REJECTED = 'citizen_rejected',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
  REOPENED = 'reopened',
  COMMENTED = 'commented',
  MEDIA_UPLOADED = 'media_uploaded',
  UPVOTED = 'upvoted',
  DOWNVOTED = 'downvoted',
  ESCALATED = 'escalated',
  SLA_WARNING = 'sla_warning',
  SLA_BREACHED = 'sla_breached',
}

@Entity('issue_timeline')
export class IssueTimeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  issueId: string;

  @ManyToOne(() => Issue, (issue) => issue.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @Column({ type: 'enum', enum: TimelineAction })
  action: TimelineAction;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  performedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  performedByName: string;

  @Column({ nullable: true })
  performedByRole: string;

  @CreateDateColumn()
  createdAt: Date;
}
