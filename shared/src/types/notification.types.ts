export enum NotificationType {
  ISSUE_REPORTED = 'issue_reported',
  ISSUE_ASSIGNED = 'issue_assigned',
  ISSUE_UPDATED = 'issue_updated',
  ISSUE_RESOLVED = 'issue_resolved',
  ISSUE_VERIFIED = 'issue_verified',
  VERIFICATION_REQUEST = 'verification_request',
  COMMENT_ADDED = 'comment_added',
  VOTE_RECEIVED = 'vote_received',
  BADGE_EARNED = 'badge_earned',
  POINTS_UPDATED = 'points_updated',
  EMERGENCY_ALERT = 'emergency_alert',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  PROFILE_UPDATE = 'profile_update',
  REMINDER = 'reminder',
  ACHIEVEMENT = 'achievement',
  COMMUNITY_UPDATE = 'community_update',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  recipientId: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  data?: {
    issueId?: string;
    issueTitle?: string;
    category?: string;
    priority?: string;
    status?: string;
    actionUrl?: string;
    [key: string]: unknown;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string;
  isSeen: boolean;
  seenAt?: string;
  delivered: {
    inApp: boolean;
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    campaign?: string;
    source?: string;
    version?: string;
  };
}