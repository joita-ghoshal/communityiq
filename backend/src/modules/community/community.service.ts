import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityVerification } from '../../database/entities/community-verification.entity';
import { Issue, IssueStatus } from '../../database/entities/issue.entity';
import { Comment } from '../../database/entities/comment.entity';
import { Volunteer, HeroLevel } from '../../database/entities/volunteer.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunityVerification)
    private readonly verificationRepo: Repository<CommunityVerification>,
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Volunteer)
    private readonly volunteerRepo: Repository<Volunteer>,
  ) {}

  async verifyIssue(issueId: string, userId: string, data: { isVerified: boolean; confidence?: number; comment?: string; voteType?: string; evidence?: Record<string, any> }) {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');

    const existing = await this.verificationRepo.findOne({ where: { issueId, userId } });
    if (existing) throw new ConflictException('You have already verified this issue');

    const verification = this.verificationRepo.create({
      issueId,
      userId,
      isVerified: data.isVerified,
      confidence: data.confidence,
      comment: data.comment,
      voteType: data.voteType || (data.isVerified ? 'confirm' : 'dispute'),
      evidence: data.evidence,
    });

    const saved = await this.verificationRepo.save(verification);

    const verificationCount = await this.verificationRepo.count({ where: { issueId, isVerified: true } });
    const totalVotes = await this.verificationRepo.count({ where: { issueId } });
    const communityScore = totalVotes > 0 ? Math.round((verificationCount / totalVotes) * 100) : 0;

    await this.issueRepo.update(issueId, { communityScore });

    await this.incrementVolunteerPoints(userId, 5, 'verification');

    return saved;
  }

  async vote(issueId: string, userId: string, direction: 'up' | 'down') {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');

    if (direction === 'up') {
      await this.issueRepo.increment({ id: issueId }, 'upvotes', 1);
      await this.issueRepo.update(issueId, {
        communityScore: Math.min(100, (issue.communityScore || 0) + 2),
      });
      await this.incrementVolunteerPoints(userId, 2, 'vote');
    } else {
      await this.issueRepo.increment({ id: issueId }, 'downvotes', 1);
      await this.issueRepo.update(issueId, {
        communityScore: Math.max(0, (issue.communityScore || 0) - 1),
      });
    }

    return { direction, message: `Vote recorded: ${direction}vote` };
  }

  async addComment(issueId: string, userId: string, content: string, parentId?: string) {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content is required');
    }

    const comment = this.commentRepo.create({ issueId, userId, content: content.trim(), parentId });
    const saved = await this.commentRepo.save(comment);

    await this.issueRepo.increment({ id: issueId }, 'commentCount', 1);
    await this.incrementVolunteerPoints(userId, 3, 'comment');

    return saved;
  }

  async getNearbyIssues(lat: number, lng: number, radiusKm: number) {
    return this.issueRepo
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .addSelect(`ST_Distance(issue.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`, 'distance')
      .where(`ST_DWithin(issue.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`)
      .setParameter('lat', lat)
      .setParameter('lng', lng)
      .setParameter('radius', radiusKm * 1000)
      .orderBy('distance', 'ASC')
      .limit(50)
      .getMany();
  }

  async getLeaderboard(period: string) {
    let dateFilter: Date;
    const now = new Date();
    switch (period) {
      case 'week': dateFilter = new Date(now.getTime() - 7 * 86400000); break;
      case 'month': dateFilter = new Date(now.getTime() - 30 * 86400000); break;
      case 'year': dateFilter = new Date(now.getTime() - 365 * 86400000); break;
      default: dateFilter = new Date(0);
    }

    const volunteers = await this.volunteerRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.user', 'user')
      .where('v.createdAt >= :dateFilter', { dateFilter })
      .orderBy('v.points', 'DESC')
      .limit(50)
      .getMany();

    return volunteers.map((v, index) => ({
      rank: index + 1,
      userId: v.userId,
      name: v.user ? `${v.user.firstName} ${v.user.lastName}` : 'Unknown',
      avatar: v.user?.avatar,
      points: v.points,
      heroLevel: v.heroLevel,
      totalContributions: v.totalContributions,
      verifiedContributions: v.verifiedContributions,
    }));
  }

  async getIssueStats(issueId: string) {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');

    const verifications = await this.verificationRepo.count({ where: { issueId } });
    const confirmed = await this.verificationRepo.count({ where: { issueId, isVerified: true } });
    const disputes = await this.verificationRepo.count({ where: { issueId, isVerified: false } });
    const comments = await this.commentRepo.count({ where: { issueId } });

    return {
      issueId,
      upvotes: issue.upvotes,
      downvotes: issue.downvotes,
      communityScore: issue.communityScore,
      verificationCount: verifications,
      confirmedCount: confirmed,
      disputeCount: disputes,
      commentCount: comments,
      verificationRate: verifications > 0 ? Math.round((confirmed / verifications) * 100) : 0,
    };
  }

  private async incrementVolunteerPoints(userId: string, points: number, type: string) {
    let volunteer = await this.volunteerRepo.findOne({ where: { userId } });
    if (!volunteer) {
      volunteer = this.volunteerRepo.create({ userId, points: 0, totalContributions: 0, verifiedContributions: 0 });
    }

    volunteer.points += points;
    volunteer.totalContributions += 1;
    if (type === 'verification') volunteer.verifiedContributions += 1;

    volunteer.heroLevel = this.calculateHeroLevel(volunteer.points);
    await this.volunteerRepo.save(volunteer);
  }

  private calculateHeroLevel(points: number): HeroLevel {
    if (points >= 1000) return HeroLevel.LEGENDARY_HERO;
    if (points >= 500) return HeroLevel.CITY_CHAMPION;
    if (points >= 250) return HeroLevel.COMMUNITY_GUARDIAN;
    if (points >= 100) return HeroLevel.ACTIVE_CITIZEN;
    if (points >= 30) return HeroLevel.CONTRIBUTOR;
    return HeroLevel.NEWCOMER;
  }
}
