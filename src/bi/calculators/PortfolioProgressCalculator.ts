import { Project, ProjectLifecycleStage, ProjectStatus } from '../../domain/projects/Project';
import { ActivationPolicyResult } from '../../domain/projects/policies/ProjectActivationPolicy';

/**
 * PortfolioProgressCalculator — Sprint 5.0 Phase 6 Step 4.
 *
 * Independent calculator (CTO correction #4). Owns Setup Progress and
 * Execution Progress on ExecutivePortfolioRow.
 *
 * CTO's rule (correction #5) is implemented exactly, no more:
 *   Pre-Award              → 0
 *   Pending Project Setup  → Setup Readiness % (from ProjectActivationPolicy, passed in — not recomputed here)
 *   Ready for Mobilization → 100
 *   Execution               → undefined (Not Implemented)
 *   Completed               → 100
 *   Closed                  → 100
 *
 * Note on the underlying model: Project carries two separate axes —
 * `lifecycleStage` (Pre-Award / Pending Project Setup / Ready for Mobilization /
 * Execution / Closing / Archived) and `status` (Inactive / Mobilizing / Active /
 * Suspended / Completed / Closed / Archived) — see ADR-014. The CTO's table
 * names "Completed" and "Closed" literally, which only exist on `status`, not
 * `lifecycleStage`. This implementation checks `lifecycleStage` for the first
 * four rows (their exact names live there) and falls back to `status` for the
 * Completed/Closed rows (their exact names live there). Flagged for CTO
 * confirmation in the Phase 6 report — this is an interpretation of a table
 * written against business language, not a fabricated rule.
 */
export interface PortfolioProgressCalculatorInput {
  project: Project;
  /** Result of ProjectActivationPolicy.evaluate(...) — computed upstream (via ProjectSetupService), not here. */
  setupPolicyResult?: ActivationPolicyResult;
}

export interface PortfolioProgressCalculatorOutput {
  executionProgressPercentage?: number;
  setupReadinessScore?: number;
  setupStepsPassed?: {
    commercial: boolean;
    schedule: boolean;
    office: boolean;
    documents: boolean;
  };
}

export class PortfolioProgressCalculator {
  public static calculate(input: PortfolioProgressCalculatorInput): PortfolioProgressCalculatorOutput {
    const { project, setupPolicyResult } = input;

    const setupReadinessScore = setupPolicyResult?.readinessScore;
    const setupStepsPassed = setupPolicyResult
      ? {
          commercial: setupPolicyResult.stepResults.commercial.pass,
          schedule: setupPolicyResult.stepResults.schedule.pass,
          office: setupPolicyResult.stepResults.office.pass,
          documents: setupPolicyResult.stepResults.documents.pass
        }
      : undefined;

    let executionProgressPercentage: number | undefined;

    switch (project.lifecycleStage) {
      case ProjectLifecycleStage.PRE_AWARD:
        executionProgressPercentage = 0;
        break;
      case ProjectLifecycleStage.PENDING_PROJECT_SETUP:
        executionProgressPercentage = setupReadinessScore;
        break;
      case ProjectLifecycleStage.READY_FOR_MOBILIZATION:
        executionProgressPercentage = 100;
        break;
      case ProjectLifecycleStage.EXECUTION:
        executionProgressPercentage = undefined; // Not Implemented — execution engine pending
        break;
      default:
        // CLOSING / ARCHIVED / undefined lifecycleStage — fall back to `status`
        // for the CTO's literal "Completed" / "Closed" rows.
        if (project.status === ProjectStatus.COMPLETED || project.status === ProjectStatus.CLOSED) {
          executionProgressPercentage = 100;
        } else {
          executionProgressPercentage = undefined;
        }
    }

    return { executionProgressPercentage, setupReadinessScore, setupStepsPassed };
  }
}
