export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: string;
}

export interface BoundingBox {
  northEast: GeoPoint;
  southWest: GeoPoint;
}

export interface MapFilter {
  categories: string[];
  statuses: string[];
  priorities: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  radius?: {
    center: GeoPoint;
    radiusKm: number;
  };
  departments?: string[];
  reporters?: string[];
}

export interface MapCluster {
  id: string;
  center: GeoPoint;
  pointCount: number;
  issues: string[];
  avgPriority: string;
  dominantCategory: string;
  boundingBox: BoundingBox;
}

export interface HeatMapData {
  points: Array<{
    latitude: number;
    longitude: number;
    weight: number;
    intensity: number;
  }>;
  gradient: {
    [key: number]: string;
  };
  radius: number;
  maxIntensity: number;
}

export interface GeoFence {
  id: string;
  name: string;
  description?: string;
  type: 'circle' | 'polygon';
  center?: GeoPoint;
  radius?: number;
  coordinates?: GeoPoint[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface WardBoundary {
  id: string;
  name: string;
  wardNumber: string;
  coordinates: GeoPoint[];
  center: GeoPoint;
  area: number;
  population?: number;
  representative?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    office?: string;
  };
  stats?: {
    totalIssues: number;
    resolvedIssues: number;
    pendingIssues: number;
    avgResolutionTime: number;
  };
}

export interface RouteInfo {
  distance: number;
  duration: number;
  startLocation: GeoPoint;
  endLocation: GeoPoint;
  waypoints: GeoPoint[];
  instructions: string[];
  transportationMode: 'driving' | 'walking' | 'cycling' | 'transit';
}

export interface RiskZone {
  id: string;
  name: string;
  type: 'flood' | 'fire' | 'chemical' | 'structural' | 'electrical' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  boundaries: GeoPoint[];
  center: GeoPoint;
  radius?: number;
  affectedPopulation?: number;
  riskFactors: string[];
  mitigationMeasures: string[];
  lastAssessed: string;
  isActive: boolean;
  responsibleDepartment: string;
}