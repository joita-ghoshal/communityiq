import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  ISSUE_UPDATE = 'issue_update',
  ISSUE_VERIFIED = 'issue_verified',
  ISSUE_RESOLVED = 'issue_resolved',
  ASSIGNMENT = 'assignment',
  COMMENT = 'comment',
  MENTION = 'mention',
  BADGE_EARNED = 'badge_earned',
  EMERGENCY_ALERT = 'emergency_alert',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[\"in_app\"]'" })
  channels: string[];

  @Column({ nullable: true })
  entityUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
