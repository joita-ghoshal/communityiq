export interface DashboardMetrics {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  averageResolutionTime: number;
  citizenSatisfaction: number;
  activeVolunteers: number;
  totalReports: number;
  reportsToday: number;
  resolutionRate: number;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
  }>;
}

export interface DepartmentPerformance {
  departmentId: string;
  departmentName: string;
  totalAssigned: number;
  resolved: number;
  pending: number;
  inProgress: number;
  averageResolutionTime: number;
  efficiency: number;
  satisfaction: number;
  issuesByCategory: Array<{
    category: string;
    count: number;
    avgTime: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    assigned: number;
    resolved: number;
  }>;
}

export interface CategoryAnalysis {
  category: string;
  totalIssues: number;
  resolved: number;
  pending: number;
  averageResolutionTime: number;
  severityDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    emergency: number;
  };
  locationHotspots: Array<{
    latitude: number;
    longitude: number;
    count: number;
  }>;
  timePattern: Array<{
    hour: number;
    count: number;
  }>;
  reporterDemographics: {
    citizens: number;
    volunteers: number;
    officials: number;
  };
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  target: number;
  status: 'on_track' | 'at_risk' | 'behind';
  trend: TrendData[];
  lastUpdated: string;
}

export interface AIInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'recommendation' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: string;
  data: Record<string, unknown>;
  actionable: boolean;
  suggestedActions?: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface CommunityHealthScore {
  overallScore: number;
  components: {
    civicEngagement: number;
    issueResolution: number;
    citizenSatisfaction: number;
    volunteerActivity: number;
    governmentResponsiveness: number;
  };
  trends: TrendData[];
  benchmarks: {
    nationalAverage: number;
    stateAverage: number;
    similarCities: number;
  };
  recommendations: string[];
  lastCalculated: string;
}

export interface ResolutionMetrics {
  averageTime: number;
  medianTime: number;
  targetTime: number;
  onTimeRate: number;
  escalationRate: number;
  reopenRate: number;
  byCategory: Array<{
    category: string;
    averageTime: number;
    onTimeRate: number;
  }>;
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    averageTime: number;
    onTimeRate: number;
  }>;
  monthlyTrend: TrendData[];
}

export interface ExecutiveReport {
  id: string;
  title: string;
  period: {
    start: string;
    end: string;
  };
  generatedAt: string;
  generatedBy: string;
  summary: {
    totalIssues: number;
    resolvedIssues: number;
    resolutionRate: number;
    averageResolutionTime: number;
    citizenSatisfaction: number;
    budgetUtilization: number;
  };
  highlights: string[];
  challenges: string[];
  recommendations: string[];
  departmentPerformance: DepartmentPerformance[];
  categoryAnalysis: CategoryAnalysis[];
  aiInsights: AIInsight[];
  communityHealth: CommunityHealthScore;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}