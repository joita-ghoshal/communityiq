export interface VolunteerProfile {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  skills: string[];
  availability: {
    weekday: boolean;
    weekend: boolean;
    evenings: boolean;
    emergency: boolean;
  };
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    ward?: string;
  };
  stats: {
    issuesReported: number;
    issuesVerified: number;
    volunteerHours: number;
    eventsAttended: number;
    peopleHelped: number;
  };
  endorsements: number;
  rating: number;
  reviewCount: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'reporting' | 'verification' | 'community' | 'leadership' | 'emergency' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirement: {
    type: 'count' | 'streak' | 'special' | 'time';
    value: number;
    unit?: string;
  };
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedBy: number;
  isLimitedEdition: boolean;
  expiresAt?: string;
  createdAt: string;
}

export enum HeroLevel {
  NEWCOMER = 'newcomer',
  ACTIVE_CITIZEN = 'active_citizen',
  COMMUNITY_GUARDIAN = 'community_guardian',
  NEIGHBORHOOD_HERO = 'neighborhood_hero',
  CITY_CHAMPION = 'city_champion',
  LEGEND = 'legend',
}

export interface Contribution {
  id: string;
  userId: string;
  type: 'report' | 'verification' | 'volunteer' | 'donation' | 'event' | 'mentorship';
  description: string;
  points: number;
  metadata?: {
    issueId?: string;
    eventId?: string;
    duration?: number;
    amount?: number;
  };
  verifiedBy?: string;
  verifiedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Leaderboard {
  id: string;
  name: string;
  type: 'global' | 'ward' | 'category' | 'time_period';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  entries: Array<{
    rank: number;
    userId: string;
    username: string;
    displayName: string;
    avatar?: string;
    score: number;
    change: number;
    level: HeroLevel;
    badges: string[];
  }>;
  lastUpdated: string;
  metadata?: {
    totalParticipants: number;
    averageScore: number;
    topScore: number;
  };
}

export interface CommunityPoints {
  userId: string;
  totalPoints: number;
  level: HeroLevel;
  pointsToNextLevel: number;
  breakdown: {
    reporting: number;
    verification: number;
    volunteering: number;
    community: number;
    special: number;
  };
  streaks: {
    current: number;
    longest: number;
    lastActivity: string;
  };
  multiplier: number;
  achievements: Array<{
    id: string;
    name: string;
    earnedAt: string;
    points: number;
  }>;
  history: Array<{
    date: string;
    points: number;
    source: string;
  }>;
  lastUpdated: string;
}