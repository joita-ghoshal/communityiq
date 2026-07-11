export enum EmergencyType {
  FIRE = 'fire',
  FLOOD = 'flood',
  GAS_LEAK = 'gas_leak',
  FALLEN_WIRE = 'fallen_wire',
  ACCIDENT = 'accident',
  BUILDING_COLLAPSE = 'building_collapse',
  MEDICAL = 'medical',
  NATURAL_DISASTER = 'natural_disaster',
}

export interface EmergencyAlert {
  id: string;
  type: EmergencyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    ward?: string;
    zone?: string;
  };
  affectedArea: {
    radius: number;
    center: {
      latitude: number;
      longitude: number;
    };
  };
  reportedBy: string;
  reportedAt: string;
  status: 'active' | 'responding' | 'contained' | 'resolved' | 'false_alarm';
  responders: Array<{
    userId: string;
    name: string;
    role: string;
    assignedAt: string;
    status: 'dispatched' | 'en_route' | 'on_scene' | 'completed';
  }>;
  resources: Array<{
    type: string;
    description: string;
    quantity: number;
    status: 'requested' | 'dispatched' | 'on_scene' | 'depleted';
  }>;
  instructions: EmergencyInstructions;
  evacuationRequired: boolean;
  evacuationRoutes?: EvacuationRoute[];
  casualties?: {
    injured: number;
    displaced: number;
    missing: number;
  };
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
  updates: Array<{
    timestamp: string;
    message: string;
    author: string;
  }>;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  availability: '24/7' | 'business_hours' | 'on_call';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  responseTime: number;
  specialization?: string[];
  isActive: boolean;
}

export interface EvacuationRoute {
  id: string;
  name: string;
  description: string;
  startLocation: {
    latitude: number;
    longitude: number;
    name: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    name: string;
  };
  waypoints: Array<{
    latitude: number;
    longitude: number;
    name: string;
  }>;
  distance: number;
  estimatedTime: number;
  capacity: number;
  currentUsage: number;
  transportationMode: 'walking' | 'vehicle' | 'boat' | 'helicopter';
  accessibility: boolean;
  hazards?: string[];
  isActive: boolean;
  lastUpdated: string;
}

export interface EmergencyInstructions {
  immediateActions: string[];
  safetyGuidelines: string[];
  doNotActions: string[];
  emergencyNumbers: Array<{
    name: string;
    number: string;
    description: string;
  }>;
  shelterLocations?: Array<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    capacity: number;
    currentOccupancy: number;
    amenities: string[];
  }>;
  supplyChecklist?: string[];
  firstAidSteps?: string[];
}