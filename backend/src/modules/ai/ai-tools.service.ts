import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from '../../database/entities/issue.entity';
import { Department } from '../../database/entities/department.entity';
import { Volunteer } from '../../database/entities/volunteer.entity';
import { EmergencyAlert } from '../../database/entities/emergency-alert.entity';

export interface ToolContext {
  blocks: string[];
  toolsUsed: string[];
}

export interface ToolUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

const CIVIC_SERVICES = [
  'Emergency: dial 112 (all-in-one national emergency number), 100 (police), 101 (fire), 102 or 108 (ambulance), 1091 (women helpline), 1098 (childline), 1078 (disaster management).',
  'Report an issue: open the Report Issue page, add photos, category and location; our AI analyses it and it is routed to the right department.',
  'Track progress: issues move through Reported → AI Analyzing → Verifying → Assigned → Work Started → In Progress → Awaiting Confirmation → Resolved → Closed. You can follow the status in the Live Map, issue detail, and this assistant.',
  'Live Map: shows all nearby issues, AI risk zones, heatmaps and live GPS tracking.',
  'Community verification: verified citizens can confirm issues, which raises their AI trust score.',
  'Volunteers / Community Heroes: join to earn points by verifying issues and helping with cleanups.',
  'Analytics dashboard: view city-wide statistics, trends, department performance and AI insights.',
];

const EMERGENCY_GUIDANCE = [
  'If this is a life-threatening emergency, immediately call 112 (or 100 police / 101 fire / 108 ambulance) before anything else.',
  'Use the Emergency section in the app to raise an alert with your live location so responders can reach you.',
  'Do not wait for an online response in a genuine emergency — call first.',
  'If you are reporting a flood, fire, medical, or safety hazard, include your exact location and nearest landmark.',
];

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  constructor(
    @InjectRepository(Issue) private readonly issueRepo: Repository<Issue>,
    @InjectRepository(Department) private readonly deptRepo: Repository<Department>,
    @InjectRepository(Volunteer) private readonly volunteerRepo: Repository<Volunteer>,
    @InjectRepository(EmergencyAlert) private readonly alertRepo: Repository<EmergencyAlert>,
  ) {}

  private matches(text: string, patterns: RegExp[]): boolean {
    return patterns.some((re) => re.test(text));
  }

  private async formatIssue(issue: Issue, extra: string[] = []): Promise<string> {
    const d = issue.department ? ` dept:${issue.department.name}` : '';
    const r = issue.resolvedAt ? ` resolved:${issue.resolvedAt.toISOString().slice(0, 10)}` : '';
    const w = issue.ward ? ` ward:${issue.ward}` : '';
    return `#${issue.externalRef || issue.id.slice(0, 8)} "${issue.title}" status:${issue.status} priority:${issue.priority}${d}${r}${w} created:${issue.createdAt ? issue.createdAt.toISOString().slice(0, 10) : 'n/a'}${extra.length ? ' ' + extra.join(' ') : ''}`;
  }

  async buildContext(message: string, user: ToolUser, location?: { lat: number; lng: number }): Promise<ToolContext> {
    const blocks: string[] = [];
    const toolsUsed: string[] = [];
    const text = ` ${message.toLowerCase()} `;

    const hasMyReports = this.matches(text, [/\b(my|mine|i filed|i reported|i submitted|i raised|my)\b.*\b(report|issue|complaint|ticket|submission)s?\b/]);
    const hasStatus = this.matches(text, [/\b(status|track|update|where is|progress)\b/]) && this.matches(text, [/\b(issue|report|complaint|ticket|request)\b/]);
    const hasDepartments = this.matches(text, [/\bdepartment(s)?\b/, /\bwhich (department|office|authority)\b/, /\bwho handles\b/, /\bwhom\b/]);
    const hasVolunteers = this.matches(text, [/\bvolunteer(s)?\b/, /\bheroes\b/, /\bjoin community\b/]);
    const hasCommunity = this.matches(text, [/\bcommunity\b/, /\btrust|credib|verified\b/, /\bhealth of\b/]);
    const hasAnalytics = this.matches(text, [/\b(analytics|statistics|stats|kpi|dashboard|trend|summary|total|how many|count)\b/]);
    const hasNearby = this.matches(text, [/\bnear(by)?\b/, /\baround me\b/, /\bwithin \d/, /\bclose( to me)?\b/, /\bnearest\b/, /\bnear me\b/]);
    const hasEmergency = this.matches(text, [/\bemergency\b/, /\burgent\b/, /\bfire\b/, /\bflood(ing)?\b/, /\bmedical|ambulance|hospital\b/, /\bpolice\b/, /\baccident\b/, /\brescue\b/, /\bgas leak\b/, /\bcollapse\b/]);
    const hasCivic = this.matches(text, [/\bhelpline\b/, /\bservice(s)?\b/, /\bhow do i\b/, /\bhow to\b/, /\bkmc\b/, /\bward office\b/, /\bgrievance\b/, /\bwater\b/, /\bgarbage|trash|waste\b/, /\belectricity|power\b/]);

    if (hasMyReports) {
      try {
        const issues = await this.issueRepo.find({
          where: { reporterId: user.id },
          relations: ['department'],
          order: { createdAt: 'DESC' },
          take: 15,
        });
        if (issues.length) {
          const lines = await Promise.all(issues.map((i) => this.formatIssue(i)));
          blocks.push(`CIVIC-DATA my_reports (${issues.length} total, showing latest ${lines.length}):\n${lines.join('\n')}`);
        } else {
          blocks.push('CIVIC-DATA my_reports: user has no reported issues yet.');
        }
        toolsUsed.push('my_reports');
      } catch (e: any) {
        this.logger.error(`tools my_reports: ${e.message}`);
      }
    }

    if (hasStatus || hasMyReports) {
      try {
        const keywords = message
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .map((w) => w.toLowerCase())
          .filter((w) => w.length > 3 && !['what', 'where', 'when', 'which', 'there', 'about', 'issue', 'report', 'status', 'track', 'progress', 'update', 'complaint', 'ticket', 'request', 'latest'].includes(w));
        let issues: Issue[] = [];
        if (keywords.length) {
          const where = keywords.map((k) => ({ title: `%${k}%` } as any));
          issues = await this.issueRepo.find({
            where: where.length ? where : undefined,
            relations: ['department'],
            order: { createdAt: 'DESC' },
            take: 6,
          });
        }
        if (!issues.length) {
          issues = await this.issueRepo.find({
            where: { reporterId: user.id },
            relations: ['department'],
            order: { createdAt: 'DESC' },
            take: 3,
          });
        }
        if (issues.length) {
          const lines = await Promise.all(issues.map((i) => this.formatIssue(i)));
          blocks.push(`CIVIC-DATA issue_status (matched ${issues.length}):\n${lines.join('\n')}`);
          toolsUsed.push('issue_status');
        }
      } catch (e: any) {
        this.logger.error(`tools issue_status: ${e.message}`);
      }
    }

    if (hasDepartments) {
      try {
        const depts = await this.deptRepo.find({ where: { isActive: true } });
        const lines: string[] = [];
        for (const d of depts) {
          const open = await this.issueRepo.count({ where: { departmentId: d.id, status: IssueStatus.REPORTED } });
          lines.push(`- ${d.name} (${d.code})${d.contactPhone ? ` phone:${d.contactPhone}` : ''}${d.contactEmail ? ` email:${d.contactEmail}` : ''} openIssues:${open}`);
        }
        blocks.push(`CIVIC-DATA departments (${lines.length}):\n${lines.join('\n')}`);
        toolsUsed.push('departments');
      } catch (e: any) {
        this.logger.error(`tools departments: ${e.message}`);
      }
    }

    if (hasVolunteers) {
      try {
        const active = await this.volunteerRepo.count({ where: { isActive: true } });
        const top = await this.volunteerRepo.find({ relations: ['user'], order: { points: 'DESC' }, take: 5 });
        const lines = top.map((v, idx) => `${idx + 1}. ${v.user?.firstName || 'Volunteer'} ${v.user?.lastName || ''} — ${v.points} pts, ${v.verifiedContributions} verified contributions`);
        blocks.push(`CIVIC-DATA volunteers: ${active} active volunteers. Top by points:\n${lines.join('\n')}`);
        toolsUsed.push('volunteers');
      } catch (e: any) {
        this.logger.error(`tools volunteers: ${e.message}`);
      }
    }

    if (hasCommunity) {
      try {
        const total = await this.issueRepo.count();
        const aiVerifiedRow = await this.issueRepo
          .createQueryBuilder('issue')
          .select('COUNT(*)', 'count')
          .where(`issue."verificationData" @> '{"aiVerified": true}'::jsonb`)
          .getRawOne();
        const aiVerified = Number(aiVerifiedRow?.count || 0);
        const topWards = await this.issueRepo
          .createQueryBuilder('issue')
          .select('issue.ward', 'ward')
          .addSelect('COUNT(*)', 'count')
          .addSelect('ROUND(AVG(issue.communityScore)::numeric, 1)', 'avgScore')
          .where('issue.ward IS NOT NULL')
          .groupBy('issue.ward')
          .orderBy('avgScore', 'DESC')
          .take(5)
          .getRawMany();
        const wards = topWards.map((w) => `- Ward ${w.ward}: avg community score ${w.avgScore}/100 (${w.count} issues)`).join('\n');
        blocks.push(`CIVIC-DATA community_health: ${total} total issues, ${aiVerified} AI-verified. Top wards by community score:\n${wards}`);
        toolsUsed.push('community');
      } catch (e: any) {
        this.logger.error(`tools community: ${e.message}`);
      }
    }

    if (hasAnalytics) {
      try {
        const total = await this.issueRepo.count();
        const open = await this.issueRepo.count({ where: { status: IssueStatus.REPORTED } });
        const resolved = await this.issueRepo.count({ where: { status: IssueStatus.RESOLVED } });
        const closed = await this.issueRepo.count({ where: { status: IssueStatus.CLOSED } });
        const byCategory = await this.issueRepo
          .createQueryBuilder('issue')
          .select('issue.category', 'category')
          .addSelect('COUNT(*)', 'count')
          .groupBy('issue.category')
          .orderBy('count', 'DESC')
          .take(5)
          .getRawMany();
        const byPriority = await this.issueRepo
          .createQueryBuilder('issue')
          .select('issue.priority', 'priority')
          .addSelect('COUNT(*)', 'count')
          .groupBy('issue.priority')
          .orderBy('count', 'DESC')
          .getRawMany();
        const avgDays = await this.issueRepo
          .createQueryBuilder('issue')
          .select('ROUND(AVG(EXTRACT(EPOCH FROM (issue.resolvedAt - issue.createdAt)) / 86400)::numeric, 1)', 'days')
          .where('issue.resolvedAt IS NOT NULL AND issue.createdAt IS NOT NULL')
          .getRawOne();
        const cats = byCategory.map((c) => `${c.category}: ${c.count}`).join(', ');
        const prios = byPriority.map((p) => `${p.priority}: ${p.count}`).join(', ');
        blocks.push(
          `CIVIC-DATA analytics: total=${total}, open=${open}, resolved=${resolved}, closed=${closed}, avgResolutionDays=${avgDays?.days ?? 'n/a'}. Top categories: ${cats}. By priority: ${prios}.`,
        );
        toolsUsed.push('analytics');
      } catch (e: any) {
        this.logger.error(`tools analytics: ${e.message}`);
      }
    }

    if (hasNearby) {
      try {
        if (location && location.lat != null && location.lng != null) {
          const rows: any[] = await this.issueRepo.query(
            `SELECT i.id, i.title, i.status, i.priority, i.ward,
                    ST_Distance(i.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS dist_m
             FROM issues i
             WHERE i.location IS NOT NULL
             ORDER BY dist_m ASC
             LIMIT 10`,
            [location.lng, location.lat],
          );
          if (rows.length) {
            const lines = rows.map((r) => `#${String(r.id).slice(0, 8)} "${r.title}" status:${r.status} priority:${r.priority}${r.ward ? ` ward:${r.ward}` : ''} distance:${Math.round(Number(r.dist_m))}m`);
            blocks.push(`CIVIC-DATA nearby_issues (within ~${Math.round(rows[rows.length - 1].dist_m)}m):\n${lines.join('\n')}`);
          } else {
            blocks.push('CIVIC-DATA nearby_issues: no issues found near the user location.');
          }
        } else {
          blocks.push('CIVIC-DATA nearby_issues: the user did not share their location; ask them to enable location or open the Live Map page.');
        }
        toolsUsed.push('nearby_issues');
      } catch (e: any) {
        this.logger.error(`tools nearby: ${e.message}`);
      }
    }

    if (hasEmergency) {
      try {
        const alerts = await this.alertRepo.find({ where: { isActive: true }, order: { createdAt: 'DESC' }, take: 5 });
        if (alerts.length) {
          const lines = alerts.map((a) => `- ${a.severity.toUpperCase()}: ${a.title}${a.contactNumber ? ` contact:${a.contactNumber}` : ''}`);
          blocks.push(`CIVIC-DATA active_emergency_alerts (${alerts.length}):\n${lines.join('\n')}`);
        } else {
          blocks.push('CIVIC-DATA active_emergency_alerts: none currently active.');
        }
        toolsUsed.push('emergency_alerts');
      } catch (e: any) {
        this.logger.error(`tools emergency: ${e.message}`);
      }
      blocks.push(`EMERGENCY_GUIDANCE:\n${EMERGENCY_GUIDANCE.join('\n')}`);
    }

    if (hasCivic) {
      blocks.push(`CIVIC_SERVICES:\n${CIVIC_SERVICES.join('\n')}`);
      toolsUsed.push('civic_services');
    }

    return { blocks, toolsUsed };
  }
}
