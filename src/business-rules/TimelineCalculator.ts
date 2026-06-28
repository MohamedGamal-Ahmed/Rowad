import { BusinessCalendar } from '../domain/administration/Settings';
import { TimelineRules } from '../domain/administration/TimelineRules';
import { CalculatedTimeline } from '../domain/pre-award/TimelineInformation';

export class TimelineCalculator {
  /**
   * Helper to check if a specific Date is an active working day.
   */
  public static isWorkingDay(date: Date, calendar: BusinessCalendar): boolean {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (calendar.weekendDays.includes(dayOfWeek)) {
      return false;
    }

    const isoString = date.toISOString().split('T')[0];
    if (calendar.holidayDates.includes(isoString)) {
      return false;
    }

    if (calendar.specialClosures && calendar.specialClosures.includes(isoString)) {
      return false;
    }

    return true;
  }

  /**
   * Safely offsets a starting date string by a specific number of working/calendar days.
   */
  public static addDays(dateStr: string, days: number, calendar?: BusinessCalendar): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }

    if (!calendar) {
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    }

    let count = Math.abs(days);
    const direction = days >= 0 ? 1 : -1;

    // Advance date step-by-step counting working days only
    while (count > 0) {
      date.setDate(date.getDate() + direction);
      if (this.isWorkingDay(date, calendar)) {
        count--;
      }
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * Calculates dynamic milestones based on Technical Submission Date, PMO offsets, and Business Calendar.
   */
  public static calculateMilestones(
    techSubmissionDate: string,
    rules: TimelineRules,
    calendar?: BusinessCalendar
  ): CalculatedTimeline {
    if (!techSubmissionDate) {
      return {};
    }

    return {
      kickOffDate: this.addDays(techSubmissionDate, rules.kickOffOffset, calendar),
      riskDueDate: this.addDays(techSubmissionDate, rules.riskAssessmentOffset, calendar),
      contractQualsDueDate: this.addDays(techSubmissionDate, rules.contractQualificationOffset, calendar),
      alignmentDate: this.addDays(techSubmissionDate, rules.alignmentOffset, calendar),
      followUpDate: this.addDays(techSubmissionDate, rules.intermediateFollowUpOffset, calendar)
    };
  }
}
