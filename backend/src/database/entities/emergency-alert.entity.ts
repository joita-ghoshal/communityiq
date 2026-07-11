import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AlertType {
  NATURAL_DISASTER = 'natural_disaster',
  INFRASTRUCTURE_FAILURE = 'infrastructure_failure',
  PUBLIC_HEALTH = 'public_health',
  SAFETY_HAZARD = 'safety_hazard',
  WEATHER = 'weather',
  CIVIL_EMERGENCY = 'civil_emergency',
}

export enum AlertSeverity {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  SEVERE = 'severe',
  EXTREME = 'extreme',
}

@Entity('emergency_alerts')
export class EmergencyAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity: AlertSeverity;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  affectedArea: {
    type: string;
    coordinates: number[][][];
    radius?: number;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  reportedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  evacuationRequired: boolean;

  @Column({ nullable: true })
  contactNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;
}
