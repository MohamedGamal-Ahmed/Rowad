import { Milestone } from '../domain/common/Milestone';
import { MilestoneTemplate } from '../domain/common/MilestoneTemplate';
import { MilestoneWorkflowState } from '../enums/MilestoneWorkflowState';
import { TimelineCalculator } from './TimelineCalculator';
import { TimelineRules } from '../domain/administration/TimelineRules';
import { BusinessCalendar } from '../domain/administration/Settings';
import { Clock } from '../services/Clock';

/**
 * Milestone Auto Status
 * 
 * NEVER persisted. Always calculated dynamically from:
 *   today, dueDate, completedDate
 */
export type MilestoneAutoStatus =
  | 'Pending'
  | 'Completed Early'
  | 'Completed On Time'
  | 'Completed Late'
  | 'Overdue';

/**
 * Computed Milestone View
 * 
 * Combines stored Milestone data with dynamically calculated fields.
 * Used by UI and service layers - never persisted.
 */
export interface ComputedMilestone {
  /** The stored milestone data */
  milestone: Milestone;

  /** The template that defines this milestone's behavior */
  template: MilestoneTemplate;

  /** Calculated due date from submissionDate + template offset */
  dueDate: string | null;

  /** Calculated auto-status: Pending | Completed Early | On Time | Late | Overdue */
  autoStatus: MilestoneAutoStatus;

  /** Calculated: completedDate - dueDate (negative = early, positive = late) */
  daysDifference: number | null;

  /** Human-readable delay display: "-3 Days", "On Time", "+5 Days", "Pending" */
  delayDisplay: string;
}

/**
 * Health Score Result
 * 
 * Weighted health score calculated from milestone compliance.
 */
export interface MilestoneHealthScore {
  /** Overall score 0–100 */
  score: number;

  /** Healthy | Warning | Critical */
  level: 'Healthy' | 'Warning' | 'Critical';

  /** Number of completed milestones */
  completedCount: number;

  /** Number of overdue milestones */
  overdueCount: number;

  /** Total mandatory milestones */
  totalMandatory: number;

  /** Overall compliance percentage */
  compliancePercentage: number;
}

/**
 * Dependency Validation Result
 */
export interface DependencyValidationResult {
  isValid: boolean;
  blockedBy: string[];
  messages: string[];
}

/**
 * Workflow Transition Validation Result
 */
export interface WorkflowTransitionResult {
  isValid: boolean;
  errors: string[];
}

/**
 * MilestoneBusinessRules
 * 
 * Pure business logic for the Milestone Engine.
 * Stateless. No side effects. No persistence.
 * 
 * Reusable by: Tenders, Projects, Claims, IPC, VO, NOC,
 * Risk Register, Procurement, RFI, and any future module.
 */
export class MilestoneBusinessRules {

  // ══════════════════════════════════════════════════════════════════
  // § 2. CALCULATED DUE DATES
  // ══════════════════════════════════════════════════════════════════

  /**
   * Calculates the due date for a milestone based on submission date and template offset.
   * Returns null if the template has no offset (manual milestone).
   */
  public static calculateMilestoneDueDate(
    submissionDate: string,
    template: MilestoneTemplate,
    calendar?: BusinessCalendar
  ): string | null {
    if (!submissionDate || template.offsetFromSubmission === null) {
      return null;
    }
    return TimelineCalculator.addDays(submissionDate, template.offsetFromSubmission, calendar);
  }

  /**
   * Convenience: calculates Risk Assessment due date.
   */
  public static calculateRiskDueDate(
    submissionDate: string,
    riskTemplate: MilestoneTemplate,
    calendar?: BusinessCalendar
  ): string | null {
    return this.calculateMilestoneDueDate(submissionDate, riskTemplate, calendar);
  }

  /**
   * Convenience: calculates Contract Qualification due date.
   */
  public static calculateQualificationDueDate(
    submissionDate: string,
    qualTemplate: MilestoneTemplate,
    calendar?: BusinessCalendar
  ): string | null {
    return this.calculateMilestoneDueDate(submissionDate, qualTemplate, calendar);
  }

  // ══════════════════════════════════════════════════════════════════
  // § 3. DYNAMIC STATUS ENGINE
  // ══════════════════════════════════════════════════════════════════

  /**
   * Calculates milestone auto-status dynamically.
   * NEVER persisted. Calculated on every render/evaluation.
   * 
   * Logic:
   *   - If not completed and dueDate is past → Overdue
   *   - If not completed → Pending
   *   - If completed and completedDate < dueDate → Completed Early
   *   - If completed and completedDate === dueDate → Completed On Time
   *   - If completed and completedDate > dueDate → Completed Late
   */
  public static calculateAutoStatus(
    milestone: Milestone,
    dueDate: string | null
  ): MilestoneAutoStatus {
    const today = Clock.todayISO();

    if (!milestone.isCompleted) {
      if (dueDate && today > dueDate) {
        return 'Overdue';
      }
      return 'Pending';
    }

    // Milestone is completed
    if (!dueDate || !milestone.completedDate) {
      return 'Completed On Time';
    }

    if (milestone.completedDate < dueDate) {
      return 'Completed Early';
    }
    if (milestone.completedDate === dueDate) {
      return 'Completed On Time';
    }
    return 'Completed Late';
  }

  // ══════════════════════════════════════════════════════════════════
  // § 4. DAYS DIFFERENCE
  // ══════════════════════════════════════════════════════════════════

  /**
   * Calculates days difference: completedDate - dueDate.
   * Negative = early, Zero = on time, Positive = late.
   * Returns null if either date is missing.
   */
  public static calculateDaysDifference(
    completedDate: string | null,
    dueDate: string | null
  ): number | null {
    if (!completedDate || !dueDate) {
      return null;
    }
    return Clock.diffInDays(completedDate, dueDate);
  }

  /**
   * Formats days difference for display.
   * Examples: "-3 Days", "On Time", "+5 Days", "Pending"
   */
  public static formatDaysDifference(daysDiff: number | null, isCompleted: boolean): string {
    if (!isCompleted) {
      return 'Pending';
    }
    if (daysDiff === null) {
      return 'N/A';
    }
    if (daysDiff === 0) {
      return 'On Time';
    }
    if (daysDiff < 0) {
      return `${daysDiff} Days`;
    }
    return `+${daysDiff} Days`;
  }

  // ══════════════════════════════════════════════════════════════════
  // § 8. DEPENDENCY ENGINE
  // ══════════════════════════════════════════════════════════════════

  /**
   * Validates whether a milestone can be completed based on dependency chain.
   * A milestone cannot be completed before all mandatory predecessors are completed.
   */
  public static validateDependencies(
    targetMilestone: Milestone,
    targetTemplate: MilestoneTemplate,
    allMilestones: Milestone[],
    allTemplates: MilestoneTemplate[]
  ): DependencyValidationResult {
    const blockedBy: string[] = [];
    const messages: string[] = [];

    for (const depTemplateId of targetTemplate.dependsOn) {
      const depTemplate = allTemplates.find(t => t.id === depTemplateId);
      if (!depTemplate) continue;

      const depMilestone = allMilestones.find(m => m.templateId === depTemplateId);

      if (!depMilestone || !depMilestone.isCompleted) {
        blockedBy.push(depTemplateId);
        messages.push(
          `Cannot complete "${targetTemplate.displayName.en}" before "${depTemplate.displayName.en}" is completed.`
        );
      }
    }

    return {
      isValid: blockedBy.length === 0,
      blockedBy,
      messages,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // § 9. HEALTH SCORING (Weighted)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Calculates weighted health score from milestone compliance.
   * 
   * Score is 0–100 based on milestone template health weights.
   * Only mandatory milestones with healthWeight > 0 contribute.
   * 
   * Scoring:
   *   - Completed (early/on-time) = full weight
   *   - Completed late = 50% weight
   *   - Overdue (not completed) = 0% weight
   *   - Pending (not yet due) = full weight (not penalized)
   */
  public static calculateHealthScore(
    milestones: Milestone[],
    templates: MilestoneTemplate[],
    submissionDate: string,
    calendar?: BusinessCalendar
  ): MilestoneHealthScore {
    const mandatoryTemplates = templates.filter(t => t.isMandatory && t.healthWeight > 0);

    if (mandatoryTemplates.length === 0) {
      return {
        score: 100,
        level: 'Healthy',
        completedCount: 0,
        overdueCount: 0,
        totalMandatory: 0,
        compliancePercentage: 100,
      };
    }

    let totalWeight = 0;
    let earnedWeight = 0;
    let completedCount = 0;
    let overdueCount = 0;

    for (const template of mandatoryTemplates) {
      totalWeight += template.healthWeight;
      const milestone = milestones.find(m => m.templateId === template.id);
      const dueDate = this.calculateMilestoneDueDate(submissionDate, template, calendar);

      if (!milestone) {
        // Milestone doesn't exist - check if overdue
        if (dueDate && Clock.todayISO() > dueDate) {
          overdueCount++;
          // No weight earned
        } else {
          earnedWeight += template.healthWeight; // Not yet due
        }
        continue;
      }

      const autoStatus = this.calculateAutoStatus(milestone, dueDate);

      if (autoStatus === 'Completed Early' || autoStatus === 'Completed On Time') {
        earnedWeight += template.healthWeight;
        completedCount++;
      } else if (autoStatus === 'Completed Late') {
        earnedWeight += template.healthWeight * 0.5;
        completedCount++;
      } else if (autoStatus === 'Overdue') {
        overdueCount++;
        // No weight earned
      } else {
        // Pending - not yet due, full weight
        earnedWeight += template.healthWeight;
      }
    }

    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;
    const compliancePercentage = mandatoryTemplates.length > 0
      ? Math.round((completedCount / mandatoryTemplates.length) * 100)
      : 100;

    let level: 'Healthy' | 'Warning' | 'Critical';
    if (score >= 80) {
      level = 'Healthy';
    } else if (score >= 50) {
      level = 'Warning';
    } else {
      level = 'Critical';
    }

    return {
      score,
      level,
      completedCount,
      overdueCount,
      totalMandatory: mandatoryTemplates.length,
      compliancePercentage,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // § 10. WORKFLOW TRANSITIONS
  // ══════════════════════════════════════════════════════════════════

  /**
   * Validates a workflow state transition.
   * 
   * Valid transitions:
   *   PENDING → STARTED
   *   STARTED → COMPLETED
   *   COMPLETED → VERIFIED
   * 
   * Future transitions (reserved):
   *   VERIFIED → REOPENED
   *   ANY → CANCELLED
   */
  public static validateWorkflowTransition(
    from: MilestoneWorkflowState,
    to: MilestoneWorkflowState
  ): WorkflowTransitionResult {
    const validTransitions: Record<MilestoneWorkflowState, MilestoneWorkflowState[]> = {
      [MilestoneWorkflowState.PENDING]: [MilestoneWorkflowState.STARTED],
      [MilestoneWorkflowState.STARTED]: [MilestoneWorkflowState.COMPLETED],
      [MilestoneWorkflowState.COMPLETED]: [MilestoneWorkflowState.VERIFIED],
      [MilestoneWorkflowState.VERIFIED]: [],
    };

    const allowed = validTransitions[from] || [];
    if (!allowed.includes(to)) {
      return {
        isValid: false,
        errors: [`Invalid workflow transition: ${from} → ${to}. Allowed from ${from}: [${allowed.join(', ')}]`],
      };
    }

    return { isValid: true, errors: [] };
  }

  // ══════════════════════════════════════════════════════════════════
  // § COMPUTED MILESTONE BUILDER
  // ══════════════════════════════════════════════════════════════════

  /**
   * Builds a fully computed milestone view from stored data.
   * This is the primary interface for UI and service layers.
   */
  public static computeMilestone(
    milestone: Milestone,
    template: MilestoneTemplate,
    submissionDate: string,
    calendar?: BusinessCalendar
  ): ComputedMilestone {
    const dueDate = this.calculateMilestoneDueDate(submissionDate, template, calendar);
    const autoStatus = this.calculateAutoStatus(milestone, dueDate);
    const daysDifference = this.calculateDaysDifference(milestone.completedDate, dueDate);
    const delayDisplay = this.formatDaysDifference(daysDifference, milestone.isCompleted);

    return {
      milestone,
      template,
      dueDate,
      autoStatus,
      daysDifference,
      delayDisplay,
    };
  }

  /**
   * Computes all milestones for a parent entity.
   * Returns milestones sorted by template displayOrder.
   */
  public static computeAllMilestones(
    milestones: Milestone[],
    templates: MilestoneTemplate[],
    submissionDate: string,
    calendar?: BusinessCalendar
  ): ComputedMilestone[] {
    return milestones
      .map(m => {
        const template = templates.find(t => t.id === m.templateId);
        if (!template) return null;
        return this.computeMilestone(m, template, submissionDate, calendar);
      })
      .filter((cm): cm is ComputedMilestone => cm !== null)
      .sort((a, b) => a.template.displayOrder - b.template.displayOrder);
  }
}
