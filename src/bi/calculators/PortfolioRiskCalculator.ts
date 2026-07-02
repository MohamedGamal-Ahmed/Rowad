import { Project, ProjectClaim, ProjectVariationOrder, ProjectNOC } from '../../domain/projects/Project';

/**
 * PortfolioRiskCalculator — Sprint 5.0 Phase 6 Step 5.
 *
 * Independent calculator (CTO correction #4). Owns riskScore on
 * ExecutivePortfolioRow.
 *
 * CTO correction #7 — no fake scoring. Returns undefined until a Risk
 * Register module exists (CLAUDE.md §12, Future Architecture — not yet
 * built). Inputs are accepted but intentionally unused for the same reason
 * as PortfolioHealthCalculator — signature stability for the day this is
 * approved.
 */
export interface PortfolioRiskCalculatorInput {
  project: Project;
  claims: ProjectClaim[];
  variationOrders: ProjectVariationOrder[];
  nocs: ProjectNOC[];
}

export interface PortfolioRiskCalculatorOutput {
  riskScore?: number;
}

export class PortfolioRiskCalculator {
  public static calculate(_input: PortfolioRiskCalculatorInput): PortfolioRiskCalculatorOutput {
    return { riskScore: undefined };
  }
}
