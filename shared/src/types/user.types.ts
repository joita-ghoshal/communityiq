export enum UserRole {
  CITIZEN = 'citizen',
  VOLUNTEER = 'volunteer',
  GOVERNMENT_OFFICIAL = 'government_official',
  DEPARTMENT_MANAGER = 'department_manager',
  ADMINISTRATOR = 'administrator',
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  privacy: {
    showProfile: boolean;
    showLocation: boolean;
    showActivity: boolean;
  };
  defaultLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  profile: UserProfile;
  preferences: UserPreferences;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  points: number;
  badges: string[];
  reportedIssues: number;
  verifiedIssues: number;
  volunteerHours?: number;
}