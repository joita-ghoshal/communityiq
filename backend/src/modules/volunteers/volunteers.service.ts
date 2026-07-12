import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Volunteer, HeroLevel } from '../../database/entities/volunteer.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class VolunteersService {
  private readonly badges = [
    { id: 'first_report', name: 'First Responder', icon: 'report', description: 'Reported your first issue' },
    { id: 'verifier', name: 'Truth Seeker', icon: 'verify', description: 'Verified 10 issues' },
    { id: 'commenter', name: 'Voice of Community', icon: 'comment', description: 'Added 50 comments' },
    { id: 'streak_7', name: 'Week Warrior', icon: 'streak', description: '7-day contribution streak' },
    { id: 'streak_30', name: 'Monthly Champion', icon: 'streak', description: '30-day contribution streak' },
    { id: 'reports_10', name: 'Issue Hunter', icon: 'report', description: 'Reported 10 issues' },
    { id: 'reports_50', name: 'City Guardian', icon: 'report', description: 'Reported 50 issues' },
    { id: 'accuracy_90', name: 'Precision Expert', icon: 'accuracy', description: '90%+ verification accuracy' },
  ];

  constructor(
    @InjectRepository(Volunteer)
    private readonly volRepo: Repository<Volunteer>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    let volunteer = await this.volRepo.findOne({ where: { userId }, relations: ['user'] });

    if (!volunteer) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      volunteer = this.volRepo.create({
        userId,
        points: 0,
        badges: [],
        heroLevel: HeroLevel.NEWCOMER,
        totalContributions: 0,
        verifiedContributions: 0,
        issuesReported: 0,
        issuesVerified: 0,
        commentsAdded: 0,
        accuracyScore: 0,
        isActive: true,
      });
      volunteer = await this.volRepo.save(volunteer);
    }

    return {
      userId,
      name: volunteer.user ? `${volunteer.user.firstName} ${volunteer.user.lastName}` : 'Unknown',
      points: volunteer.points,
      heroLevel: volunteer.heroLevel,
      badges: volunteer.badges,
      totalContributions: volunteer.totalContributions,
      verifiedContributions: volunteer.verifiedContributions,
      issuesReported: volunteer.issuesReported,
      issuesVerified: volunteer.issuesVerified,
      commentsAdded: volunteer.commentsAdded,
      accuracyScore: volunteer.accuracyScore,
      nextLevel: this.getNextLevel(volunteer.heroLevel),
      pointsToNextLevel: this.getPointsToNextLevel(volunteer.heroLevel, volunteer.points),
    };
  }

  async getLeaderboard(period: string, limit: number) {
    let dateFilter: Date;
    const now = new Date();
    switch (period) {
      case 'week': dateFilter = new Date(now.getTime() - 7 * 86400000); break;
      case 'month': dateFilter = new Date(now.getTime() - 30 * 86400000); break;
      case 'year': dateFilter = new Date(now.getTime() - 365 * 86400000); break;
      default: dateFilter = new Date(0);
    }

    const volunteers = await this.volRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.user', 'user')
      .where('v.createdAt >= :df', { df: dateFilter })
      .orderBy('v.points', 'DESC')
      .limit(limit)
      .getMany();

    return volunteers.map((v, i) => ({
      rank: i + 1,
      userId: v.userId,
      name: v.user ? `${v.user.firstName} ${v.user.lastName}` : 'Unknown',
      avatar: v.user?.avatar,
      points: v.points,
      heroLevel: v.heroLevel,
      badges: v.badges?.length || 0,
      totalContributions: v.totalContributions,
    }));
  }

  async getAvailableBadges() {
    return this.badges;
  }

  async assignBadge(userId: string, badgeId: string) {
    const volunteer = await this.volRepo.findOne({ where: { userId } });
    if (!volunteer) throw new NotFoundException('Volunteer not found');

    const badge = this.badges.find((b) => b.id === badgeId);
    if (!badge) throw new NotFoundException('Badge not found');

    const alreadyHas = volunteer.badges?.some((b) => b.id === badgeId);
    if (alreadyHas) return { message: 'Badge already assigned' };

    const newBadge = { ...badge, earnedAt: new Date() };
    volunteer.badges = [...(volunteer.badges || []), newBadge];
    volunteer.points += 25;

    await this.volRepo.save(volunteer);
    return { message: 'Badge assigned', badge: newBadge };
  }

  async getStats() {
    const totalVolunteers = await this.volRepo.count();
    const activeVolunteers = await this.volRepo.count({ where: { isActive: true } });
    const result = await this.volRepo
      .createQueryBuilder('v')
      .select('SUM(v.points)', 'totalPoints')
      .addSelect('AVG(v.totalContributions)', 'avgContributions')
      .addSelect('AVG(v.accuracyScore)', 'avgAccuracy')
      .getRawOne();

    return {
      totalVolunteers,
      activeVolunteers,
      totalPoints: Number(result?.totalPoints) || 0,
      avgContributions: Number(result?.avgcontributions) || Number(result?.avgContributions) || 0,
      avgAccuracy: Number(result?.avgaccuracy) || Number(result?.avgAccuracy) || 0,
    };
  }

  async getContributions(userId: string) {
    const volunteer = await this.volRepo.findOne({ where: { userId } });
    if (!volunteer) throw new NotFoundException('Volunteer not found');

    return {
      userId,
      totalContributions: volunteer.totalContributions,
      verifiedContributions: volunteer.verifiedContributions,
      issuesReported: volunteer.issuesReported,
      issuesVerified: volunteer.issuesVerified,
      commentsAdded: volunteer.commentsAdded,
      accuracyScore: volunteer.accuracyScore,
      points: volunteer.points,
      badges: volunteer.badges,
      heroLevel: volunteer.heroLevel,
    };
  }

  private getNextLevel(level: HeroLevel): string | null {
    const levels = Object.values(HeroLevel);
    const idx = levels.indexOf(level);
    return idx < levels.length - 1 ? levels[idx + 1] : null;
  }

  private getPointsToNextLevel(level: HeroLevel, currentPoints: number): number {
    const thresholds: Record<string, number> = {
      newcomer: 30,
      contributor: 100,
      active_citizen: 250,
      community_guardian: 500,
      city_champion: 1000,
      legendary_hero: 0,
    };
    const next = this.getNextLevel(level);
    if (!next) return 0;
    return Math.max(0, thresholds[next] - currentPoints);
  }
}
