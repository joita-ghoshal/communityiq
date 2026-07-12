import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>): Promise<AuditLog> {
    try {
      const entry = this.auditRepo.create(data);
      return await this.auditRepo.save(entry);
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`);
      return null;
    }
  }

  async getLogs(options: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 50, userId, action, entity, startDate, endDate } = options;
    
    const qb = this.auditRepo.createQueryBuilder('log');

    if (userId) qb.andWhere('log.userId = :userId', { userId });
    if (action) qb.andWhere('log.action = :action', { action });
    if (entity) qb.andWhere('log.entity = :entity', { entity });
    if (startDate) qb.andWhere('log.createdAt >= :startDate', { startDate });
    if (endDate) qb.andWhere('log.createdAt <= :endDate', { endDate });

    qb.orderBy('log.createdAt', 'DESC');

    const total = await qb.getCount();
    const logs = await qb.skip((page - 1) * limit).take(limit).getMany();

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getStats(): Promise<any> {
    const totalLogs = await this.auditRepo.count();
    
    const recentLogs = await this.auditRepo
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt > NOW() - INTERVAL \'7 days\'')
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .getRawMany();

    const failedActions = await this.auditRepo
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.status = :status', { status: 'error' })
      .andWhere('log.createdAt > NOW() - INTERVAL \'24 hours\'')
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .getRawMany();

    const topUsers = await this.auditRepo
      .createQueryBuilder('log')
      .select('log.userEmail', 'email')
      .addSelect('log.userRole', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt > NOW() - INTERVAL \'7 days\'')
      .andWhere('log.userId IS NOT NULL')
      .groupBy('log.userEmail')
      .addGroupBy('log.userRole')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return { totalLogs, recentLogs, failedActions, topUsers };
  }
}
