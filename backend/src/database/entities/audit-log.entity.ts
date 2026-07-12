import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['entity'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: true })
  userRole: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  entity: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  endpoint: string;

  @Column({ nullable: true })
  method: string;

  @Column({ type: 'int', nullable: true })
  statusCode: number;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ default: 'success' })
  status: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
