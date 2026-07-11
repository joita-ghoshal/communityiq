import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum HeroLevel {
  NEWCOMER = 'newcomer',
  CONTRIBUTOR = 'contributor',
  ACTIVE_CITIZEN = 'active_citizen',
  COMMUNITY_GUARDIAN = 'community_guardian',
  CITY_CHAMPION = 'city_champion',
  LEGENDARY_HERO = 'legendary_hero',
}

@Entity('volunteers')
export class Volunteer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    earnedAt: Date;
  }>;

  @Column({ type: 'enum', enum: HeroLevel, default: HeroLevel.NEWCOMER })
  heroLevel: HeroLevel;

  @Column({ type: 'int', default: 0 })
  totalContributions: number;

  @Column({ type: 'int', default: 0 })
  verifiedContributions: number;

  @Column({ type: 'int', default: 0 })
  issuesReported: number;

  @Column({ type: 'int', default: 0 })
  issuesVerified: number;

  @Column({ type: 'int', default: 0 })
  commentsAdded: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  accuracyScore: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
