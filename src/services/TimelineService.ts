import { TimelineRules } from '../domain/administration/TimelineRules';
import { TimelineCalculator } from '../business-rules/TimelineCalculator';
import { CalculatedTimeline } from '../domain/pre-award/TimelineInformation';
import { AppConstants } from '../constants/AppConstants';

export class TimelineService {
  /**
   * Loads current persistent PMO rules or defaults.
   */
  public getMergedRules(): TimelineRules {
    try {
      const storedRules = localStorage.getItem('preaward_timeline_rules');
      if (storedRules) {
        return JSON.parse(storedRules);
      }
    } catch (e) {
      console.error('Failed reading PMO offsets from LocalStorage:', e);
    }

    return {
      kickOffOffset: AppConstants.OFFSETS.DEFAULT_KICKOFF,
      riskAssessmentOffset: AppConstants.OFFSETS.DEFAULT_RISK,
      contractQualificationOffset: AppConstants.OFFSETS.DEFAULT_QUALIFICATION,
      alignmentOffset: AppConstants.OFFSETS.DEFAULT_ALIGNMENT,
      intermediateFollowUpOffset: AppConstants.OFFSETS.DEFAULT_FOLLOW_UP
    };
  }

  /**
   * Solves relative dates and enforces validation that all milestones precede deadlines.
   */
  public generateTimeline(techSubmissionDate: string): CalculatedTimeline {
    const rules = this.getMergedRules();
    return TimelineCalculator.calculateMilestones(techSubmissionDate, rules);
  }
}
