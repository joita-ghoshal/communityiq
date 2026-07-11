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
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  DEPARTMENT_CHANGED = 'department_changed',
  COMMENTED = 'commented',
  VERIFIED = 'verified',
  MEDIA_UPLOADED = 'media_uploaded',
  UPVOTED = 'upvoted',
  DOWNVOTED = 'downvoted',
  RESOLVED = 'resolved',
  REOPENED = 'reopened',
  DUPLICATE_MARKED = 'duplicate_marked',
  AI_ANALYSIS_COMPLETED = 'ai_analysis_completed',
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

  @CreateDateColumn()
  createdAt: Date;
}
