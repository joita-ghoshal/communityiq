import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';

export enum IssueCategory {
  ROAD_DAMAGE = 'road_damage',
  WATER_SUPPLY = 'water_supply',
  SANITATION = 'sanitation',
  ELECTRICITY = 'electricity',
  GARBAGE = 'garbage',
  DRAINAGE = 'drainage',
  STREET_LIGHTING = 'street_lighting',
  PUBLIC_SAFETY = 'public_safety',
  NOISE_POLLUTION = 'noise_pollution',
  AIR_POLLUTION = 'air_pollution',
  PARKS_GREEN = 'parks_green',
  TRAFFIC = 'traffic',
  BUILDING_SAFETY = 'building_safety',
  FLOODING = 'flooding',
  ANIMAL_CONTROL = 'animal_control',
  OTHER = 'other',
}

export enum IssueStatus {
  REPORTED = 'reported',
  AI_ANALYZING = 'ai_analyzing',
  COMMUNITY_VERIFICATION = 'community_verification',
  VERIFIED = 'verified',
  ASSIGNED = 'assigned',
  WORK_STARTED = 'work_started',
  IN_PROGRESS = 'in_progress',
  PARTIALLY_RESOLVED = 'partially_resolved',
  AWAITING_AI_VERIFICATION = 'awaiting_ai_verification',
  AWAITING_CITIZEN_CONFIRMATION = 'awaiting_citizen_confirmation',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
  DUPLICATE = 'duplicate',
  REOPENED = 'reopened',
  INVALID = 'invalid',
}

export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: IssueCategory })
  category: IssueCategory;

  @Column({ type: 'enum', enum: IssueStatus, default: IssueStatus.REPORTED })
  status: IssueStatus;

  @Column({ type: 'enum', enum: IssuePriority, default: IssuePriority.MEDIUM })
  priority: IssuePriority;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ nullable: true })
  ward: string;

  @Column({ type: 'uuid', nullable: true })
  reporterId: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ type: 'uuid', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true, eager: false })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ type: 'jsonb', nullable: true })
  aiAnalysis: {
    category?: string;
    severity?: number;
    sentiment?: string;
    keywords?: string[];
    summary?: string;
    duplicateProbability?: number;
    fakeProbability?: number;
    estimatedResolutionTime?: string;
    recommendedDepartment?: string;
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  communityScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  impactScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  riskScore: number;

  @Column({ type: 'int', default: 0 })
  upvotes: number;

  @Column({ type: 'int', default: 0 })
  downvotes: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ nullable: true })
  externalRef: string;

  @Column({ type: 'int', default: 0 })
  completionPercentage: number;

  @Column({ type: 'text', nullable: true })
  pendingWork: string;

  @Column({ type: 'text', nullable: true })
  completedWork: string;

  @Column({ type: 'text', nullable: true })
  remainingTasks: string;

  @Column({ nullable: true })
  estimatedCompletion: Date;

  @Column({ nullable: true })
  currentResponsibleTeam: string;

  @Column({ type: 'jsonb', nullable: true })
  verificationData: {
    beforePhotos?: string[];
    afterPhotos?: string[];
    workNotes?: string;
    aiVerified?: boolean;
    aiConfidence?: number;
    aiVerificationResult?: string;
    citizenConfirmed?: boolean;
    citizenConfirmationDate?: Date;
    evidenceUploadedBy?: string;
    evidenceUploadedAt?: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  slaData: {
    deadline?: Date;
    warningAt?: Date;
    breachedAt?: Date;
    slaStatus?: string;
    escalationLevel?: number;
  };

  @Column({ type: 'int', nullable: true })
  slaDays: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get isActive(): boolean {
    return ![IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.ARCHIVED, IssueStatus.INVALID].includes(this.status);
  }

  get isVisibleOnMap(): boolean {
    return ![IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.ARCHIVED, IssueStatus.DUPLICATE, IssueStatus.INVALID].includes(this.status);
  }
}
