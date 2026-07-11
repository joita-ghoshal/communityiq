import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus, IssuePriority, IssueCategory } from '../../database/entities/issue.entity';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { Volunteer } from '../../database/entities/volunteer.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Issue) private readonly issueRepo: Repository<Issue>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Department) private readonly deptRepo: Repository<Department>,
    @InjectRepository(Volunteer) private readonly volRepo: Repository<Volunteer>,
  ) {}

  async getDashboard(city?: string) {
    const qb = this.issueRepo.createQueryBuilder('issue');
    if (city) qb.where('issue.city ILIKE :city', { city: `%${city}%` });

    const totalIssues = await qb.getCount();
    const openCount = await qb.clone().andWhere('issue.status = :s', { s: IssueStatus.OPEN }).getCount();
    const inProgressCount = await qb.clone().andWhere('issue.status = :s', { s: IssueStatus.IN_PROGRESS }).getCount();
    const resolvedCount = await qb.clone().andWhere('issue.status = :s', { s: IssueStatus.RESOLVED }).getCount();
    const criticalCount = await qb.clone().andWhere("issue.priority IN ('critical', 'emergency')").getCount();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCount = await qb.clone().andWhere('issue.createdAt >= :d', { d: todayStart }).getCount();
    const totalUsers = await this.userRepo.count();
    const totalVolunteers = await this.volRepo.count();

    const recentIssues = await this.issueRepo.find({ order: { createdAt: 'DESC' }, take: 10, relations: ['reporter'] });

    return {
      totalIssues,
      openIssues: openCount,
      inProgressIssues: inProgressCount,
      resolvedIssues: resolvedCount,
      criticalIssues: criticalCount,
      todayNewIssues: todayCount,
      resolutionRate: totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0,
      totalUsers,
      totalVolunteers,
      recentIssues,
    };
  }

  async getDepartmentPerformance() {
    const departments = await this.deptRepo.find({ where: { isActive: true } });

    const performance = await Promise.all(
      departments.map(async (dept) => {
        const total = await this.issueRepo.count({ where: { departmentId: dept.id } });
        const resolved = await this.issueRepo.count({ where: { departmentId: dept.id, status: IssueStatus.RESOLVED } });
        const open = await this.issueRepo.count({ where: { departmentId: dept.id, status: IssueStatus.OPEN } });
        const critical = await this.issueRepo.createQueryBuilder('i')
          .where('i.departmentId = :did', { did: dept.id })
          .andWhere("i.priority IN ('critical', 'emergency')")
          .getCount();

        const avgResult = await this.issueRepo.createQueryBuilder('i')
          .select('AVG(EXTRACT(EPOCH FROM (i.resolvedAt - i.createdAt)) / 86400)', 'avgDays')
          .where('i.departmentId = :did', { did: dept.id })
          .andWhere('i.resolvedAt IS NOT NULL')
          .getRawOne();

        return {
          departmentId: dept.id,
          name: dept.name,
          code: dept.code,
          totalIssues: total,
          resolvedIssues: resolved,
          openIssues: open,
          criticalIssues: critical,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
          avgResolutionDays: avgResult?.avgDays ? parseFloat(parseFloat(avgResult.avgDays).toFixed(1)) : null,
        };
      }),
    );

    return performance.sort((a, b) => b.resolutionRate - a.resolutionRate);
  }

  async getTrends(period: string, city?: string) {
    let interval: string;
    let dateFormat: string;
    let lookbackDays: number;

    switch (period) {
      case 'week': interval = 'day'; dateFormat = 'YYYY-MM-DD'; lookbackDays = 7; break;
      case 'quarter': interval = 'week'; dateFormat = 'YYYY-"W"WW'; lookbackDays = 91; break;
      case 'year': interval = 'month'; dateFormat = 'YYYY-MM'; lookbackDays = 365; break;
      default: interval = 'day'; dateFormat = 'YYYY-MM-DD'; lookbackDays = 30;
    }

    const qb = this.issueRepo.createQueryBuilder('issue')
      .select(`TO_CHAR(issue.createdAt, '${dateFormat}')`, 'period')
      .addSelect('COUNT(*)', 'total')
      .addSelect("COUNT(CASE WHEN issue.status = 'resolved' THEN 1 END)", 'resolved')
      .where(`issue.createdAt >= :start`, { start: new Date(Date.now() - lookbackDays * 86400000) });

    if (city) qb.andWhere('issue.city ILIKE :city', { city: `%${city}%` });

    const data = await qb.groupBy('period').orderBy('period', 'ASC').getRawMany();

    return data.map((d) => ({
      period: d.period,
      total: parseInt(d.total, 10),
      resolved: parseInt(d.resolved, 10),
      resolutionRate: parseInt(d.total, 10) > 0 ? Math.round((parseInt(d.resolved, 10) / parseInt(d.total, 10)) * 100) : 0,
    }));
  }

  async getKpis(city?: string) {
    const qb = this.issueRepo.createQueryBuilder('issue');
    if (city) qb.where('issue.city ILIKE :city', { city: `%${city}%` });

    const total = await qb.getCount();
    const resolved = await qb.clone().andWhere('issue.status = :s', { s: IssueStatus.RESOLVED }).getCount();
    const avgDays = await qb.clone()
      .select('AVG(EXTRACT(EPOCH FROM (issue.resolvedAt - issue.createdAt)) / 86400)', 'avg')
      .andWhere('issue.resolvedAt IS NOT NULL')
      .getRawOne();
    const avgCommunity = await qb.clone().select('AVG(issue.communityScore)', 'avg').getRawOne();
    const avgRisk = await qb.clone().select('AVG(issue.riskScore)', 'avg').getRawOne();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = await qb.clone().andWhere('issue.createdAt >= :d', { d: today }).getCount();
    const lastWeek = new Date(Date.now() - 7 * 86400000);
    const lastWeekCount = await qb.clone().andWhere('issue.createdAt >= :d', { d: lastWeek }).getCount();

    return {
      totalIssues: total,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      avgResolutionDays: avgDays?.avg ? parseFloat(parseFloat(avgDays.avg).toFixed(1)) : null,
      avgCommunityScore: avgCommunity?.avg ? parseFloat(parseFloat(avgCommunity.avg).toFixed(1)) : 0,
      avgRiskScore: avgRisk?.avg ? parseFloat(parseFloat(avgRisk.avg).toFixed(1)) : 0,
      todayNewIssues: todayCount,
      weeklyNewIssues: lastWeekCount,
      totalUsers: await this.userRepo.count(),
      activeVolunteers: await this.volRepo.count({ where: { isActive: true } }),
    };
  }

  async getExecutiveReport(days: number) {
    const startDate = new Date(Date.now() - days * 86400000);

    const total = await this.issueRepo.createQueryBuilder('i')
      .where('i.createdAt >= :sd', { sd: startDate }).getCount();
    const resolved = await this.issueRepo.createQueryBuilder('i')
      .where('i.createdAt >= :sd', { sd: startDate }).andWhere('i.status = :s', { s: IssueStatus.RESOLVED }).getCount();
    const categoryBreakdown = await this.issueRepo.createQueryBuilder('i')
      .select('i.category', 'category').addSelect('COUNT(*)', 'count')
      .where('i.createdAt >= :sd', { sd: startDate })
      .groupBy('i.category').getRawMany();
    const priorityBreakdown = await this.issueRepo.createQueryBuilder('i')
      .select('i.priority', 'priority').addSelect('COUNT(*)', 'count')
      .where('i.createdAt >= :sd', { sd: startDate })
      .groupBy('i.priority').getRawMany();

    return {
      period: `${days} days`,
      summary: { total, resolved, resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0 },
      byCategory: categoryBreakdown,
      byPriority: priorityBreakdown,
      generatedAt: new Date().toISOString(),
    };
  }

  async getCommunityHealth(city?: string) {
    const totalVolunteers = await this.volRepo.count();
    const activeVolunteers = await this.volRepo.createQueryBuilder('v').where('v.isActive = true').getCount();
    const totalPoints = await this.volRepo.createQueryBuilder('v').select('SUM(v.points)', 'sum').getRawOne();
    const avgContributions = await this.volRepo.createQueryBuilder('v').select('AVG(v.totalContributions)', 'avg').getRawOne();

    const qb = this.issueRepo.createQueryBuilder('issue');
    if (city) qb.where('issue.city ILIKE :city', { city: `%${city}%` });
    const avgCommunity = await qb.select('AVG(issue.communityScore)', 'avg').getRawOne();

    return {
      totalVolunteers,
      activeVolunteers,
      totalPoints: parseInt(totalPoints?.sum || '0', 10),
      avgContributions: avgContributions?.avg ? parseFloat(parseFloat(avgContributions.avg).toFixed(1)) : 0,
      avgCommunityScore: avgCommunity?.avg ? parseFloat(parseFloat(avgCommunity.avg).toFixed(1)) : 0,
      engagementRate: totalVolunteers > 0 ? Math.round((activeVolunteers / totalVolunteers) * 100) : 0,
    };
  }
}
