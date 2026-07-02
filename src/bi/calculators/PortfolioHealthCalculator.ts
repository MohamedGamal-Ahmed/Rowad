import { Project, ProjectNOC, ProjectClaim, ProjectVariationOrder } from '../../domain/projects/Project';
import { HealthStatus } from '../../enums/HealthStatus';

/**
 * PortfolioHealthCalculator — Sprint 5.0 Phase 6 Step 5.
 *
 * Independent calculator (CTO correction #4). Owns healthScore on
 * ExecutivePortfolioRow.
 *
 * CTO correction #6 — do not invent a project health formula. The existing
 * business-rules/HealthCalculator strategies are shaped for Tender health
 * (daysRemaining / milestones / submissionDate), which Project does not carry
 * in that shape — there is no legitimate reuse path today. Per instruction,
 * this returns undefined unconditionally. Inputs are still accepted (not
 * calculated from) so the signature is ready the day a real formula is
 * approved, without another contract change.
 */
export interface PortfolioHealthCalculatorInput {
  project: Project;
  nocs: ProjectNOC[];
  claims: ProjectClaim[];
  variationOrders: ProjectVariationOrder[];
}

export interface PortfolioHealthCalculatorOutput {
  healthScore?: HealthStatus;
}

export class PortfolioHealthCalculator {
  public static calculate(_input: PortfolioHealthCalculatorInput): PortfolioHealthCalculatorOutput {
    return { healthScore: undefined };
  }
}
