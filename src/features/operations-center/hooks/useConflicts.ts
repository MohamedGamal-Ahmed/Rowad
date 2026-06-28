import { useMemo } from 'react';
import { CalendarEvent } from '../types';
import { ConflictDetectionEngine, ConflictResult } from '../services/ConflictEngine';
import { Settings } from '../../../domain/administration/Settings';

export type ScheduleConflict = ConflictResult;

export function useConflicts(events: CalendarEvent[]): ScheduleConflict[] {
  const conflicts = useMemo(() => {
    // Read the current settings from localStorage to ensure real-time reaction to settings updates
    let settings: Settings | null = null;
    try {
      const saved = localStorage.getItem('pmo_enterprise_settings');
      if (saved) {
        settings = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error parsing settings in useConflicts hook:', e);
    }

    // Default fallback settings
    const finalSettings: Settings = settings || {
      id: 'admin-settings',
      userId: 'admin',
      preferredLanguage: 'ar',
      timelineRules: {
        kickOffOffset: -30,
        riskAssessmentOffset: -21,
        contractQualificationOffset: -14,
        alignmentOffset: -10,
        intermediateFollowUpOffset: -5,
        reminderDays: 3,
        followUpDays: 5,
        escalationDays: 7
      },
      financialSettings: {
        bidBondPercentage: 2.0,
        performanceBondPercentage: 10.0,
        retentionPercentage: 10.0,
        vatPercentage: 15.0,
        advancePaymentPercentage: 10.0,
        defaultCurrency: 'AED',
        currencyDisplayMode: 'individual'
      },
      businessCalendar: {
        country: 'Saudi Arabia',
        region: 'Riyadh',
        weekendDays: [5, 6],
        holidayDates: ['2026-09-23', '2026-02-22'],
        workingHoursStart: '08:00',
        workingHoursEnd: '17:00',
        halfWorkingDays: [],
        specialClosures: []
      },
      numberingSettings: {
        projectFormat: 'PRJ-{YEAR}-{SEQ}',
        tenderFormat: 'PA-{YEAR}-{SEQ}',
        ipcFormat: 'IPC-{PROJECT}-{SEQ}',
        claimFormat: 'CLM-{PROJECT}-{SEQ}',
        voFormat: 'VO-{PROJECT}-{SEQ}',
        nocFormat: 'NOC-{PROJECT}-{SEQ}',
        documentFormat: 'DOC-{TYPE}-{SEQ}'
      },
      workloadSettings: {
        maxTasksPerEngineer: 5,
        warningThreshold: 80
      },
      healthSettings: {
        dueSoonThresholdDays: 7,
        overdueThresholdDays: 0
      },
      conflictSettings: {
        minGapBetweenMeetings: 30,
        travelBuffer: 15,
        conflictThreshold: 0,
        allowBackToBack: true
      }
    };

    const engine = new ConflictDetectionEngine();
    return engine.evaluateAll(events, finalSettings);
  }, [events]);

  return conflicts;
}
