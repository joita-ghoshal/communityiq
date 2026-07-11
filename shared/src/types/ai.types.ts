export interface AIResponse {
  success: boolean;
  data: Record<string, unknown>;
  confidence: number;
  processingTime: number;
  modelVersion: string;
  timestamp: string;
  metadata?: {
    tokensUsed?: number;
    apiVersion?: string;
    latency?: number;
  };
}

export interface Prediction {
  id: string;
  type: 'issue_occurrence' | 'resolution_time' | 'resource_need' | 'risk_level' | 'demand_forecast';
  target: {
    category?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    timeframe: {
      start: string;
      end: string;
    };
  };
  prediction: {
    value: number;
    unit: string;
    confidence: number;
    range?: {
      min: number;
      max: number;
    };
  };
  factors: Array<{
    name: string;
    importance: number;
    direction: 'positive' | 'negative';
    description: string;
  }>;
  accuracy: number;
  lastUpdated: string;
  expiresAt: string;
}

export interface RiskAssessment {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    ward?: string;
  };
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: Array<{
    category: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    description: string;
    mitigation?: string;
  }>;
  historicalData: Array<{
    date: string;
    riskScore: number;
    incidents: number;
  }>;
  recommendations: string[];
  lastAssessed: string;
  nextAssessment: string;
  dataSources: string[];
}

export interface SentimentAnalysis {
  id: string;
  text: string;
  overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentimentScore: number;
  confidence: number;
  emotions: Array<{
    emotion: 'anger' | 'joy' | 'sadness' | 'fear' | 'surprise' | 'disgust';
    score: number;
  }>;
  aspects: Array<{
    aspect: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    mentions: number;
  }>;
  keywords: Array<{
    word: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    frequency: number;
  }>;
  language: string;
  processedAt: string;
}

export interface ClassificationResult {
  id: string;
  input: {
    text?: string;
    imageUrl?: string;
    audioUrl?: string;
  };
  primaryClassification: {
    category: string;
    subcategory?: string;
    confidence: number;
  };
  alternativeClassifications: Array<{
    category: string;
    subcategory?: string;
    confidence: number;
  }>;
  tags: string[];
  severity: {
    level: string;
    score: number;
    factors: string[];
  };
  department: {
    id: string;
    name: string;
    confidence: number;
  };
  processingTime: number;
  modelVersion: string;
  timestamp: string;
}

export interface DuplicateDetectionResult {
  id: string;
  inputIssueId: string;
  isDuplicate: boolean;
  overallConfidence: number;
  similarIssues: Array<{
    issueId: string;
    title: string;
    similarityScore: number;
    matchType: 'exact' | 'near' | 'potential';
    matchingFactors: Array<{
      factor: string;
      weight: number;
      score: number;
    }>;
    location?: {
      latitude: number;
      longitude: number;
      distance?: number;
    };
    timeDifference?: number;
  }>;
  analysis: {
    textSimilarity: number;
    locationSimilarity: number;
    categorySimilarity: number;
    temporalSimilarity: number;
  };
  recommendation: 'merge' | 'keep_separate' | 'review';
  reasoning: string;
  processedAt: string;
}