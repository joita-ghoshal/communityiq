export enum IssueCategory {
  ROAD_DAMAGE = 'road_damage',
  WATER_LEAKAGE = 'water_leakage',
  GARBAGE = 'garbage',
  ELECTRICITY = 'electricity',
  DRAINAGE = 'drainage',
  NOISE = 'noise',
  PUBLIC_SAFETY = 'public_safety',
  STREET_LIGHTING = 'street_lighting',
  ENCROACHMENT = 'encroachment',
  ENVIRONMENTAL = 'environmental',
  OTHER = 'other',
}

export enum IssueStatus {
  REPORTED = 'reported',
  AI_ANALYZING = 'ai_analyzing',
  COMMUNITY_VERIFYING = 'community_verifying',
  VERIFIED = 'verified',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
}

export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

export interface IssueMedia {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  caption?: string;
  uploadedAt: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    format?: string;
  };
}

export interface IssueLocation {
  latitude: number;
  longitude: number;
  address?: string;
  ward?: string;
  zone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  landmark?: string;
  gpsAccuracy?: number;
}

export interface AIAnalysis {
  classification: {
    category: IssueCategory;
    subcategory?: string;
    confidence: number;
  };
  severity: {
    level: IssuePriority;
    score: number;
    factors: string[];
  };
  confidence: number;
  duplicateCheck: {
    isDuplicate: boolean;
    similarIssues?: string[];
    similarityScore?: number;
  };
  fakeDetection: {
    isFake: boolean;
    confidence: number;
    reasons?: string[];
  };
  departmentRecommendation: {
    departmentId: string;
    departmentName: string;
    reasons: string[];
  };
  estimatedResolutionTime: {
    value: number;
    unit: 'hours' | 'days' | 'weeks';
  };
}

export interface CommunityVerification {
  id: string;
  verifierId: string;
  verifierName: string;
  rating: number;
  comment?: string;
  verifiedAt: string;
  isReliable: boolean;
}

export interface IssueTimeline {
  id: string;
  status: IssueStatus;
  timestamp: string;
  actorId?: string;
  actorName?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  reporterId: string;
  reporterName: string;
  location: IssueLocation;
  media: IssueMedia[];
  aiAnalysis?: AIAnalysis;
  communityVerifications: CommunityVerification[];
  timeline: IssueTimeline[];
  assignedTo?: string;
  assignedDepartment?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  upvotes: number;
  downvotes: number;
  viewCount: number;
  isUrgent: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}