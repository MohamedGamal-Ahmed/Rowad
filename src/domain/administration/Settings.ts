import { TimelineRules } from './TimelineRules';

export interface BusinessCalendar {
  country: string;
  region: string;
  weekendDays: number[]; // e.g. [5, 6] for Fri-Sat, [0, 6] for Sun-Sat (0 is Sunday, 6 is Saturday)
  holidayDates: string[]; // ISO format string "YYYY-MM-DD"
  workingHoursStart: string; // e.g. "08:00"
  workingHoursEnd: string; // e.g. "17:00"
  halfWorkingDays: number[]; // days of the week, e.g. []
  specialClosures: string[]; // ISO format strings
}

export interface FinancialSettings {
  bidBondPercentage: number; // e.g. 2.0 (for 2%)
  performanceBondPercentage: number; // e.g. 10.0 (for 10%)
  retentionPercentage: number; // e.g. 10.0 (for 10%)
  vatPercentage: number; // e.g. 15.0 (for 15%)
  advancePaymentPercentage: number; // e.g. 10.0 (for 10%)
  defaultCurrency: string; // e.g. "AED"
  currencyDisplayMode: 'individual' | 'converted';
}

export interface TimelineSettings extends TimelineRules {
  reminderDays: number;
  followUpDays: number;
  escalationDays: number;
}

export interface NumberingSettings {
  projectFormat: string; // e.g. "PRJ-{YEAR}-{SEQ}"
  tenderFormat: string; // e.g. "PA-{YEAR}-{SEQ}"
  ipcFormat: string; // e.g. "IPC-{PROJECT}-{SEQ}"
  claimFormat: string; // e.g. "CLM-{PROJECT}-{SEQ}"
  voFormat: string; // e.g. "VO-{PROJECT}-{SEQ}"
  nocFormat: string; // e.g. "NOC-{PROJECT}-{SEQ}"
  documentFormat: string; // e.g. "DOC-{TYPE}-{SEQ}"
}

export interface WorkloadSettings {
  maxTasksPerEngineer: number; // e.g. 5
  warningThreshold: number; // e.g. 80 (for 80%)
}

export interface HealthSettings {
  dueSoonThresholdDays: number; // e.g. 7
  overdueThresholdDays: number; // e.g. 0
}

export interface ConflictSettings {
  minGapBetweenMeetings: number; // e.g. 30 (minutes)
  travelBuffer: number;          // e.g. 15 (minutes)
  conflictThreshold: number;     // e.g. 0 (minutes)
  allowBackToBack: boolean;      // true or false
}

export interface Settings {
  id: string;
  userId: string;
  preferredLanguage: 'en' | 'ar';
  timelineRules: TimelineSettings;
  financialSettings: FinancialSettings;
  businessCalendar: BusinessCalendar;
  numberingSettings: NumberingSettings;
  workloadSettings: WorkloadSettings;
  healthSettings: HealthSettings;
  conflictSettings: ConflictSettings;
}
