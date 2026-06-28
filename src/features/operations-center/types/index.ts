export enum EventModuleType {
  PRE_AWARD = 'pre-award',
  PROJECT_CONTROLS = 'project-controls',
  DOCUMENT_CONTROL = 'document-control',
  MANUAL = 'manual'
}

export enum EventCategory {
  TECH_SUBMISSION = 'tech_submission',
  COMM_SUBMISSION = 'comm_submission',
  RISK_ASSESSMENT = 'risk_assessment',
  QUALIFICATION_DUE = 'qualification_due',
  ALIGNMENT_MEETING = 'alignment_meeting',
  CLIENT_MEETING = 'client_meeting',
  NEGOTIATION = 'negotiation',
  KICK_OFF = 'kick_off',
  IPC_DEADLINE = 'ipc_deadline',
  CLAIM_DEADLINE = 'claim_deadline',
  VO_DEADLINE = 'vo_deadline',
  NOC_DEADLINE = 'noc_deadline',
  SUBMITTAL_REVIEW = 'submittal_review',
  INTERNAL_MEETING = 'internal_meeting',
  REMINDER = 'reminder'
}

export enum EventPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum EventStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_ME = 'waiting_for_me',
  WAITING_FOR_OTHERS = 'waiting_for_others',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}

export interface EventNote {
  id: string;
  authorName: string;
  timestamp: string;
  text: string;
}

export interface EventAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadDate: string;
  downloadUrl: string;
}

export interface CalendarEvent {
  id: string;
  title: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  projectCode: string;
  projectName: {
    en: string;
    ar: string;
  };
  module: EventModuleType;
  eventType: EventCategory;
  ownerId: string;
  ownerName: string;
  assignedToIds: string[];
  assignedToNames: string[];
  priority: EventPriority;
  status: EventStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  
  // Dependency DAG Mapping
  predecessorIds: string[];
  successorIds: string[];
  lagDays?: number;
  
  // Deep Linking Metadata
  sourceId: string;
  deepLinkPath: string;
  deepLinkLabel: {
    en: string;
    ar: string;
  };
  
  // Interactive Elements
  notes: EventNote[];
  attachments: EventAttachment[];
  hasConflict: boolean;
  
  // Custom Scheduling Engine Enhancements (Milestones vs Meetings)
  calendarEventType?: CalendarEventType;
  durationMinutes?: number;
  meetingType?: 'online' | 'physical';
  meetingLink?: string;
  meetingRoom?: string;
  attendees?: string[];

  colorTheme: {
    bg: string;
    border: string;
    text: string;
    iconColor: string;
  };
  lucideIconName: string;
}

export enum CalendarEventType {
  MILESTONE = 'milestone',
  DEADLINE = 'deadline',
  REMINDER = 'reminder',
  MEETING = 'meeting',
  WORKSHOP = 'workshop',
  SITE_VISIT = 'site_visit',
  CLIENT_VISIT = 'client_visit',
  NEGOTIATION_SESSION = 'negotiation_session'
}

