import { Project } from '../../domain/projects/Project';
import { ActivationPolicyResult } from '../../domain/projects/policies/ProjectActivationPolicy';
import { Currency } from '../../enums/Currency';
import { FinancialsCalculator } from '../../business-rules/FinancialsCalculator';
import { ExecutivePortfolioRow } from '../dto/ExecutivePortfolioRow';
import { MultiCurrencyValue } from '../core/BIMonetaryValue';
import { BusinessDatasetType } from '../core/BusinessDatasetType';

/**
 * PortfolioDatasetValidator — Sprint 5.1 Phase 6.
 *
 * Proves ExecutivePortfolioDataset correctness against the Operational Layer.
 * This is NOT a domain Validator (validators/ = input validation against
 * business rules for writes). This is a QA/proof instrument: it takes the
 * dataset the service already produced plus the operational-layer source
 * data it was built from, and cross-checks them independently. It never
 * mutates anything and it never recomputes a business formula itself — where
 * a check needs a formula (monetary normalization), it calls the same
 * calculator the builder used (FinancialsCalculator.sumAmounts), it does not
 * re-derive one. Where a check needs an independent authority
 * (setup readiness), the caller supplies the ProjectSetupService-produced
 * ActivationPolicyResult per project — this file never talks to a
 * Repository or Service directly, keeping it dependency-free like the other
 * bi/calculators.
 *
 * Kept out of src/bi/core (frozen contracts) and out of src/validators/
 * (domain input validation) deliberately — this is dataset-proof tooling
 * scoped to Sprint 5.1's one deliverable, not a generic "IValidator"
 * abstraction for datasets that do not exist yet.
 */

export interface PortfolioValidationCheck {
  id: string;
  description: string;
  passed: boolean;
  /** Human-readable detail — counts, offending IDs, or "OK". Never empty. */
  details: string;
}

export interface PortfolioValidationReport {
  datasetId: BusinessDatasetType;
  generatedAt: string;
  totalProjectsInOperationalLayer: number;
  totalRowsInDataset: number;
  checks: PortfolioValidationCheck[];
  /** True only if every check passed. */
  passed: boolean;
}

export interface PortfolioDatasetValidatorInput {
  rows: ExecutivePortfolioRow[];
  projects: Project[];
  /** projectId -> the ActivationPolicyResult ProjectSetupService.evaluatePolicy(projectId) returned. Computed by the caller — this validator never calls a Service. */
  setupPolicyResults: Map<string, ActivationPolicyResult>;
  /** Must match the baseCurrency the builder normalized into, or the monetary check will legitimately fail. Defaults to Currency.AED (PortfolioValueCalculator's default). */
  baseCurrency?: Currency;
}

const MONETARY_TOLERANCE = 0.01;

export class PortfolioDatasetValidator {
  public static validate(input: PortfolioDatasetValidatorInput): PortfolioValidationReport {
    const { rows, projects } = input;
    const baseCurrency = input.baseCurrency ?? Currency.AED;

    const checks: PortfolioValidationCheck[] = [
      this.checkRowCountMatchesProjectCount(rows, projects),
      this.checkNoDuplicateRows(rows),
      this.checkNoMissingProjectIds(rows, projects),
      this.checkNoDuplicateProjectCodes(rows),
      this.checkMonetaryFieldsNormalizedCorrectly(rows, baseCurrency),
      this.checkSetupReadinessMatchesPolicy(rows, input.setupPolicyResults),
      this.checkLifecycleWorkflowStatusMatchOperationalLayer(rows, projects)
    ];

    return {
      datasetId: BusinessDatasetType.EXECUTIVE_PORTFOLIO,
      generatedAt: new Date().toISOString(),
      totalProjectsInOperationalLayer: projects.length,
      totalRowsInDataset: rows.length,
      checks,
      passed: checks.every(c => c.passed)
    };
  }

  private static checkRowCountMatchesProjectCount(
    rows: ExecutivePortfolioRow[],
    projects: Project[]
  ): PortfolioValidationCheck {
    const passed = rows.length === projects.length;
    return {
      id: 'ROW_COUNT_MATCHES_PROJECT_COUNT',
      description: 'Every Project in the Operational Layer generates exactly one dataset row.',
      passed,
      details: passed
        ? `OK — ${rows.length} row(s) for ${projects.length} project(s).`
        : `MISMATCH — ${rows.length} row(s) for ${projects.length} project(s).`
    };
  }

  private static checkNoDuplicateRows(rows: ExecutivePortfolioRow[]): PortfolioValidationCheck {
    const seen = new Map<string, number>();
    for (const row of rows) {
      seen.set(row.projectId, (seen.get(row.projectId) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([id]) => id);
    const passed = duplicates.length === 0;
    return {
      id: 'NO_DUPLICATE_ROWS',
      description: 'No projectId appears in more than one dataset row.',
      passed,
      details: passed ? 'OK — no duplicate projectId rows.' : `DUPLICATES — projectId(s): ${duplicates.join(', ')}`
    };
  }

  private static checkNoMissingProjectIds(
    rows: ExecutivePortfolioRow[],
    projects: Project[]
  ): PortfolioValidationCheck {
    const projectIds = new Set(projects.map(p => p.id));
    const rowsMissingId = rows.filter(r => !r.projectId || r.projectId.trim().length === 0);
    const rowsWithUnknownId = rows.filter(r => r.projectId && !projectIds.has(r.projectId));
    const passed = rowsMissingId.length === 0 && rowsWithUnknownId.length === 0;
    const problems: string[] = [];
    if (rowsMissingId.length > 0) problems.push(`${rowsMissingId.length} row(s) with empty projectId`);
    if (rowsWithUnknownId.length > 0) {
      problems.push(`row(s) with projectId not present in Operational Layer: ${rowsWithUnknownId.map(r => r.projectId).join(', ')}`);
    }
    return {
      id: 'NO_MISSING_PROJECT_IDS',
      description: 'Every row carries a non-empty projectId that traces back to a real Project.',
      passed,
      details: passed ? 'OK — every row has a valid, traceable projectId.' : problems.join('; ')
    };
  }

  private static checkNoDuplicateProjectCodes(rows: ExecutivePortfolioRow[]): PortfolioValidationCheck {
    const seen = new Map<string, number>();
    for (const row of rows) {
      seen.set(row.projectCode, (seen.get(row.projectCode) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([code]) => code);
    const passed = duplicates.length === 0;
    return {
      id: 'NO_DUPLICATE_PROJECT_CODES',
      description: 'No projectCode is reused across two different rows.',
      passed,
      details: passed
        ? 'OK — no duplicate projectCode values.'
        : `DUPLICATES — projectCode(s) reused: ${duplicates.join(', ')} (Operational Layer data issue, not a dataset build defect — codes are copied RAW from Project.code).`
    };
  }

  /** Recomputes each populated MultiCurrencyValue via the same FinancialsCalculator.sumAmounts the calculator used, and compares — proves normalization, does not re-derive a new formula. */
  private static checkMonetaryFieldsNormalizedCorrectly(
    rows: ExecutivePortfolioRow[],
    baseCurrency: Currency
  ): PortfolioValidationCheck {
    const monetaryFields: (keyof ExecutivePortfolioRow)[] = [
      'normalizedContractValue',
      'totalCertifiedIpcValue',
      'totalOutstandingIpcValue',
      'totalApprovedClaimValue',
      'totalApprovedVoValue',
      'totalSubcontractInvoicedValue'
    ];

    const mismatches: string[] = [];
    let checkedCount = 0;

    for (const row of rows) {
      for (const field of monetaryFields) {
        const value = row[field] as MultiCurrencyValue | undefined;
        if (!value) continue;
        checkedCount++;

        if (value.baseCurrency !== baseCurrency) {
          mismatches.push(`${row.projectCode}.${field}: baseCurrency is "${value.baseCurrency}", expected "${baseCurrency}"`);
          continue;
        }
        if (typeof value.amountInBaseCurrency !== 'number') {
          mismatches.push(`${row.projectCode}.${field}: amountInBaseCurrency is missing`);
          continue;
        }

        const recomputed = FinancialsCalculator.sumAmounts(
          [{ amount: value.amount, currency: value.currency as Currency }],
          baseCurrency
        );
        const delta = Math.abs(recomputed.amount - value.amountInBaseCurrency);
        if (delta > MONETARY_TOLERANCE) {
          mismatches.push(
            `${row.projectCode}.${field}: stored amountInBaseCurrency=${value.amountInBaseCurrency}, recomputed=${recomputed.amount} (delta=${delta.toFixed(2)})`
          );
        }
      }
    }

    const passed = mismatches.length === 0;
    return {
      id: 'MONETARY_FIELDS_NORMALIZED_CORRECTLY',
      description: 'Every populated MultiCurrencyValue.amountInBaseCurrency matches FinancialsCalculator.sumAmounts recomputed from its raw amount+currency.',
      passed,
      details: passed
        ? `OK — ${checkedCount} monetary value(s) checked across ${rows.length} row(s), all normalized correctly.`
        : `MISMATCHES (${mismatches.length}/${checkedCount}): ${mismatches.join(' | ')}`
    };
  }

  /** Independently compares row.setupReadinessScore/setupStepsPassed against the ProjectSetupService/ProjectActivationPolicy result supplied by the caller. */
  private static checkSetupReadinessMatchesPolicy(
    rows: ExecutivePortfolioRow[],
    setupPolicyResults: Map<string, ActivationPolicyResult>
  ): PortfolioValidationCheck {
    const mismatches: string[] = [];
    let checkedCount = 0;

    for (const row of rows) {
      const policy = setupPolicyResults.get(row.projectId);
      if (!policy) {
        mismatches.push(`${row.projectCode}: no ActivationPolicyResult supplied for cross-check`);
        continue;
      }
      checkedCount++;

      if (row.setupReadinessScore !== policy.readinessScore) {
        mismatches.push(`${row.projectCode}: row.setupReadinessScore=${row.setupReadinessScore}, policy.readinessScore=${policy.readinessScore}`);
      }

      if (row.setupStepsPassed) {
        const expected = {
          commercial: policy.stepResults.commercial.pass,
          schedule: policy.stepResults.schedule.pass,
          office: policy.stepResults.office.pass,
          documents: policy.stepResults.documents.pass
        };
        (Object.keys(expected) as (keyof typeof expected)[]).forEach(step => {
          if (row.setupStepsPassed![step] !== expected[step]) {
            mismatches.push(`${row.projectCode}: setupStepsPassed.${step}=${row.setupStepsPassed![step]}, policy=${expected[step]}`);
          }
        });
      }
    }

    const passed = mismatches.length === 0;
    return {
      id: 'SETUP_READINESS_MATCHES_POLICY',
      description: 'row.setupReadinessScore and row.setupStepsPassed match ProjectActivationPolicy.evaluate() (via ProjectSetupService.evaluatePolicy) for the same project.',
      passed,
      details: passed
        ? `OK — ${checkedCount} project(s) cross-checked against ProjectSetupService, all matched.`
        : `MISMATCHES (${mismatches.length}): ${mismatches.join(' | ')}`
    };
  }

  private static checkLifecycleWorkflowStatusMatchOperationalLayer(
    rows: ExecutivePortfolioRow[],
    projects: Project[]
  ): PortfolioValidationCheck {
    const projectsById = new Map(projects.map(p => [p.id, p]));
    const mismatches: string[] = [];

    for (const row of rows) {
      const project = projectsById.get(row.projectId);
      if (!project) continue; // already reported by NO_MISSING_PROJECT_IDS

      if (row.status !== project.status) {
        mismatches.push(`${row.projectCode}: row.status="${row.status}" !== project.status="${project.status}"`);
      }
      if (row.lifecycleStage !== project.lifecycleStage) {
        mismatches.push(`${row.projectCode}: row.lifecycleStage="${row.lifecycleStage}" !== project.lifecycleStage="${project.lifecycleStage}"`);
      }
      if (row.workflowState !== project.workflowState) {
        mismatches.push(`${row.projectCode}: row.workflowState="${row.workflowState}" !== project.workflowState="${project.workflowState}"`);
      }
    }

    const passed = mismatches.length === 0;
    return {
      id: 'LIFECYCLE_WORKFLOW_STATUS_MATCH_OPERATIONAL_LAYER',
      description: 'row.status, row.lifecycleStage, and row.workflowState are copied verbatim (RAW) from the source Project — no drift, no recomputation.',
      passed,
      details: passed
        ? 'OK — status/lifecycleStage/workflowState match the Operational Layer for every row.'
        : `MISMATCHES (${mismatches.length}): ${mismatches.join(' | ')}`
    };
  }
}
