export interface OrganizationSettings {
  name: string;
  timezone: string;
  supportEmail: string;
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  slaWarnings: boolean;
  assignments: boolean;
  mentions: boolean;
}

export interface AiSettings {
  suggestReplies: boolean;
  autoClassify: boolean;
  autoSentiment: boolean;
  minConfidence: number;
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastSeenAt: string;
  current: boolean;
}
