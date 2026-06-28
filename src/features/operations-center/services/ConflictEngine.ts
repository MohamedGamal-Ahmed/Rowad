import { CalendarEvent, EventStatus, CalendarEventType } from '../types';
import { Settings } from '../../../domain/administration/Settings';

export interface ConflictResult {
  id: string;
  type: 'double_booking' | 'chronological_violation' | 'lag_buffer_violation' | 'transition_warning' | 'sequential_schedule';
  severity: 'critical' | 'high' | 'warning' | 'info';
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  affectedEvents: CalendarEvent[];
}

export interface ConflictRule {
  name: string;
  evaluate(
    eventA: CalendarEvent,
    eventB: CalendarEvent,
    settings: Settings
  ): ConflictResult | null;
}

/**
 * Helper to check if an event is an eligible meeting event type
 */
function isMeetingType(e: CalendarEvent): boolean {
  const type = e.calendarEventType;
  return (
    type === CalendarEventType.MEETING ||
    type === CalendarEventType.WORKSHOP ||
    type === CalendarEventType.SITE_VISIT ||
    type === CalendarEventType.CLIENT_VISIT ||
    type === CalendarEventType.NEGOTIATION_SESSION
  );
}

/**
 * 1. Resource Overlap Rule (Same Employee Check)
 * - Only compare schedules assigned to the SAME employee.
 * - Same Project Exception: No conflict/warning if events belong to the same project.
 * - Back-to-Back: No overlap, ends exactly when next starts.
 * - Travel/Buffer Warning: Gap is less than configured minimum gap.
 * - Real Conflict: Genuine overlap (EndTime > StartTime).
 */
export class ResourceOverlapRule implements ConflictRule {
  name = 'ResourceOverlapRule';

  evaluate(
    eventA: CalendarEvent,
    eventB: CalendarEvent,
    settings: Settings
  ): ConflictResult | null {
    // Only evaluate scheduled meeting types
    if (!isMeetingType(eventA) || !isMeetingType(eventB)) {
      return null;
    }

    // Only compare schedules assigned to the SAME employee on the SAME day
    if (!eventA.ownerName || !eventB.ownerName || eventA.ownerName !== eventB.ownerName) {
      return null;
    }

    if (!eventA.startDate || !eventB.startDate || eventA.startDate !== eventB.startDate) {
      return null;
    }

    // Ignore completed tasks
    if (eventA.status === EventStatus.COMPLETED || eventB.status === EventStatus.COMPLETED) {
      return null;
    }

    // Must have start and end times configured
    if (!eventA.startTime || !eventA.endTime || !eventB.startTime || !eventB.endTime) {
      return null;
    }

    try {
      const startA = new Date(`${eventA.startDate}T${eventA.startTime}:00`);
      const endA = new Date(`${eventA.startDate}T${eventA.endTime}:00`);
      const startB = new Date(`${eventB.startDate}T${eventB.startTime}:00`);
      const endB = new Date(`${eventB.startDate}T${eventB.endTime}:00`);

      // Determine chronological order
      const isAFirst = startA <= startB;
      const e1 = isAFirst ? eventA : eventB;
      const e2 = isAFirst ? eventB : eventA;
      const start1 = isAFirst ? startA : startB;
      const end1 = isAFirst ? endA : endB;
      const start2 = isAFirst ? startB : startA;
      const end2 = isAFirst ? endB : endA;

      // Same Project Exception:
      // If two consecutive activities belong to the same project, do not classify as conflict or warning.
      if (e1.projectCode === e2.projectCode) {
        return null;
      }

      // Check conflict settings
      const minGap = settings.conflictSettings?.minGapBetweenMeetings ?? 30;
      const allowBackToBack = settings.conflictSettings?.allowBackToBack ?? true;

      // 1. Real Overlap (Real Conflict)
      if (end1 > start2) {
        return {
          id: `conflict-db-${e1.id}-${e2.id}`,
          type: 'double_booking',
          severity: 'critical',
          title: {
            en: `Resource Dual-Booking: ${e1.ownerName}`,
            ar: `حجز مزدوج للموظف: ${e1.ownerName}`
          },
          description: {
            en: `Overlap on ${e1.startDate} between "${e1.title.en}" (${e1.startTime}-${e1.endTime}) and "${e2.title.en}" (${e2.startTime}-${e2.endTime}).`,
            ar: `تداخل في التاريخ ${e1.startDate} بين "${e1.title.ar}" (${e1.startTime}-${e1.endTime}) و "${e2.title.ar}" (${e2.startTime}-${e2.endTime}).`
          },
          affectedEvents: [e1, e2]
        };
      }

      // 2. Back-to-Back (End time equal to start time of successor)
      if (end1.getTime() === start2.getTime()) {
        if (allowBackToBack) {
          return {
            id: `back-to-back-${e1.id}-${e2.id}`,
            type: 'sequential_schedule',
            severity: 'info',
            title: {
              en: `Sequential Schedule`,
              ar: `جدول متتابع (متتالي)`
            },
            description: {
              en: `"${e2.title.en}" starts exactly when "${e1.title.en}" ends.`,
              ar: `المرحلة "${e2.title.ar}" تبدأ فوراً عند انتهاء "${e1.title.ar}".`
            },
            affectedEvents: [e1, e2]
          };
        } else {
          return {
            id: `conflict-gap-${e1.id}-${e2.id}`,
            type: 'transition_warning',
            severity: 'warning',
            title: {
              en: `Insufficient Transition Time`,
              ar: `وقت انتقال غير كافٍ`
            },
            description: {
              en: `Back-to-back meetings are disabled in Settings. Needs transition buffer.`,
              ar: `الاجتماعات المتتالية مباشرة معطلة في الإعدادات. تتطلب فاصلاً انتقالياً.`
            },
            affectedEvents: [e1, e2]
          };
        }
      }

      // 3. Gap check for Travel / Buffer Warning
      const gapMs = start2.getTime() - end1.getTime();
      const gapMin = Math.round(gapMs / (1000 * 60));

      if (gapMin < minGap) {
        return {
          id: `conflict-gap-${e1.id}-${e2.id}`,
          type: 'transition_warning',
          severity: 'warning',
          title: {
            en: `Insufficient Transition Time`,
            ar: `وقت انتقال غير كافٍ`
          },
          description: {
            en: `Only ${gapMin} minutes of buffer between "${e1.title.en}" and "${e2.title.en}" (Required: ${minGap}m).`,
            ar: `يوجد ${gapMin} دقيقة فقط فاصلة بين "${e1.title.ar}" و "${e2.title.ar}" (المطلوب: ${minGap} دقيقة).`
          },
          affectedEvents: [e1, e2]
        };
      }
    } catch (e) {
      console.error('Error in ResourceOverlapRule evaluation:', e);
    }

    return null;
  }
}

/**
 * 2. Chronological & Lag Dependency Rule
 * - Successor starts before Predecessor ends -> Chronological Order Violation.
 * - Gap is less than predecessor's required lagDays buffer -> Lag Buffer Violation.
 */
export class DependencyConflictRule implements ConflictRule {
  name = 'DependencyConflictRule';

  evaluate(
    eventA: CalendarEvent,
    eventB: CalendarEvent,
    _settings: Settings
  ): ConflictResult | null {
    // Only evaluate scheduled meeting types for timeline conflicts
    if (!isMeetingType(eventA) || !isMeetingType(eventB)) {
      return null;
    }

    // Check if eventB depends on eventA (is a successor)
    if (!eventB.predecessorIds || !eventB.predecessorIds.includes(eventA.id)) {
      return null;
    }

    try {
      const predEnd = new Date(eventA.endDate);
      const succStart = new Date(eventB.startDate);

      if (predEnd > succStart) {
        return {
          id: `conflict-seq-${eventA.id}-${eventB.id}`,
          type: 'chronological_violation',
          severity: 'high',
          title: {
            en: `Chronological Order Violation: ${eventB.projectCode}`,
            ar: `خطأ في الترتيب الزمني للمراحل: ${eventB.projectCode}`
          },
          description: {
            en: `Successor task "${eventB.title.en}" is scheduled on ${eventB.startDate}, which is BEFORE predecessor "${eventA.title.en}" ends on ${eventA.endDate}.`,
            ar: `المرحلة اللاحقة "${eventB.title.ar}" تبدأ في ${eventB.startDate}، وهو قبل نهاية المرحلة السابقة "${eventA.title.ar}" في ${eventA.endDate}.`
          },
          affectedEvents: [eventA, eventB]
        };
      } else if (eventB.lagDays) {
        const diffTime = succStart.getTime() - predEnd.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < eventB.lagDays) {
          return {
            id: `conflict-lag-${eventA.id}-${eventB.id}`,
            type: 'lag_buffer_violation',
            severity: 'warning',
            title: {
              en: `Lag Buffer Violation: ${eventB.projectCode}`,
              ar: `تجاوز الحد الأدنى للمهلة الزمنية: ${eventB.projectCode}`
            },
            description: {
              en: `Successor "${eventB.title.en}" has only a ${diffDays}-day gap from "${eventA.title.en}", which violates the minimum ${eventB.lagDays}-day lag requirement.`,
              ar: `الفاصل الزمني بين "${eventA.title.ar}" و "${eventB.title.ar}" هو ${diffDays} أيام فقط، وهو يقل عن الحد الأدنى للمهلة (${eventB.lagDays} أيام).`
            },
            affectedEvents: [eventA, eventB]
          };
        }
      }
    } catch (e) {
      console.error('Error in DependencyConflictRule evaluation:', e);
    }

    return null;
  }
}

/**
 * 3. Future Extensibility Stubs (Strategy Pattern / Rule Engine demo)
 */
export class RoomConflictRule implements ConflictRule {
  name = 'RoomConflictRule (Future Extensibility)';
  evaluate() { return null; }
}

export class EquipmentConflictRule implements ConflictRule {
  name = 'EquipmentConflictRule (Future Extensibility)';
  evaluate() { return null; }
}

export class VehicleConflictRule implements ConflictRule {
  name = 'VehicleConflictRule (Future Extensibility)';
  evaluate() { return null; }
}

export class ClientAvailabilityRule implements ConflictRule {
  name = 'ClientAvailabilityRule (Future Extensibility)';
  evaluate() { return null; }
}

export class DocumentApprovalRule implements ConflictRule {
  name = 'DocumentApprovalRule (Future Extensibility)';
  evaluate() { return null; }
}

/**
 * Engine Orchestrator
 */
export class ConflictDetectionEngine {
  private rules: ConflictRule[] = [];

  constructor() {
    this.rules = [
      new ResourceOverlapRule(),
      new DependencyConflictRule(),
      new RoomConflictRule(),
      new EquipmentConflictRule(),
      new VehicleConflictRule(),
      new ClientAvailabilityRule(),
      new DocumentApprovalRule(),
    ];
  }

  public evaluateAll(events: CalendarEvent[], settings: Settings): ConflictResult[] {
    const results: ConflictResult[] = [];
    const seenConflictIds = new Set<string>();

    // Filter events to only evaluate those that are meeting-class (i.e. with scheduled times and meeting types)
    const interactiveEvents = events.filter(e => isMeetingType(e));

    for (let i = 0; i < interactiveEvents.length; i++) {
      for (let j = i + 1; j < interactiveEvents.length; j++) {
        const eA = interactiveEvents[i];
        const eB = interactiveEvents[j];

        for (const rule of this.rules) {
          const res = rule.evaluate(eA, eB, settings);
          if (res) {
            if (!seenConflictIds.has(res.id)) {
              results.push(res);
              seenConflictIds.add(res.id);
            }
          }
        }
      }
    }

    return results;
  }
}
