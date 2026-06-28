import { BilingualString } from './BilingualString';
import { MilestoneWorkflowState } from '../../enums/MilestoneWorkflowState';

/**
 * Milestone Template Definition
 * 
 * Generic, reusable template that defines HOW a milestone behaves.
 * Templates are module-agnostic: Tenders, Projects, Claims, IPC, VO, NOC,
 * Risk Register, Procurement, and RFI can all register their own templates
 * without changing code.
 * 
 * CRITICAL: Templates define the RULES. Milestone instances hold the DATA.
 * Due dates, auto-status, and days-difference are NEVER stored - always
 * calculated from submission date + template offset at runtime.
 */
export interface MilestoneTemplate {
  /** Unique template identifier (e.g., 'RISK_ASSESSMENT', 'TECHNICAL_SUBMISSION') */
  id: string;

  /** Internal machine name for programmatic references */
  name: string;

  /** Bilingual display name for UI rendering */
  displayName: BilingualString;

  /** Controls rendering order in timeline views and detail panels */
  displayOrder: number;

  /**
   * Offset in working/calendar days from the parent entity's submission date.
   * Negative = before submission, Positive = after submission, null = manual entry.
   */
  offsetFromSubmission: number | null;

  /** Whether this milestone is mandatory for compliance */
  isMandatory: boolean;

  /**
   * Restricts template to specific tender types (by tenderType.en value).
   * Empty array = applicable to ALL types.
   */
  applicableTenderTypes: string[];

  /**
   * Health weight (0–100) used by weighted health scoring.
   * Total weights across all mandatory milestones should sum to 100.
   */
  healthWeight: number;

  /** Whether this milestone can be explicitly skipped without completing */
  canBeSkipped: boolean;

  /** The initial workflow state when a milestone instance is created */
  defaultWorkflow: MilestoneWorkflowState;

  /**
   * Template IDs that must be completed before this milestone can be completed.
   * Enforced by MilestoneBusinessRules dependency engine.
   */
  dependsOn: string[];
}
