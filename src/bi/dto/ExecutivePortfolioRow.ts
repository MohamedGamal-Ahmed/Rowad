import {
  ProjectStatus,
  ProjectLifecycleStage,
  ProjectWorkflowState,
  ContractType,
  DeliveryMethod
} from '../../domain/projects/Project';
import { RecordStatus } from '../../enums/RecordStatus';
import { HealthStatus } from '../../enums/HealthStatus';
import { MultiCurrencyValue } from '../core/BIMonetaryValue';

/**
 * ExecutivePortfolioRow — one row per Project.
 *
 * This is the first dataset of the ROWAD Enterprise Semantic Layer (Sprint 5.0).
 * It is NOT a report DTO — it is the single source of truth every future
 * consumer (Power BI, Executive Dashboard, Excel Export, REST APIs, AI
 * Insights, future mobile app) reads from. Consequences of that:
 *
 *  - Presentation-independent: no formatted strings, no BilingualString display
 *    concatenation, no LocalStorage or Repository internals. Formatting is a
 *    consumer concern (CTO correction #9).
 *  - Every field is tagged RAW or CALCULATED in the comments below (CTO
 *    correction #2). RAW fields are copied as-is from the operational layer.
 *    CALCULATED fields are produced exclusively by the calculators/ in this
 *    module — never invented inline here or in the builder.
 *  - Fields with no legitimate calculation yet (execution progress inside
 *    "Execution" stage, health score, risk score) are `undefined` rather than
 *    fabricated (CTO corrections #5, #6, #7).
 */
export interface ExecutivePortfolioRow {
  // ───────────────────────── Project Identity [RAW] ─────────────────────────
  projectId: string;
  projectCode: string;
  nameEn: string;
  nameAr?: string;
  sourceTenderId?: string;
  sourceTenderNumber?: string;
  country: string;
  city: string;
  /** Free-text on Project today — not FK'd to MasterData.Client yet (QA #29). */
  client: string;
  employer: string;
  consultant: string;
  mainContractor: string;
  department: string;
  businessUnit: string;
  /** Free-text on Project today — not FK'd to MasterData.Employee yet (QA #8/#28). */
  coordinator: string;
  projectManager: string;

  // ───────────────────────── Lifecycle [RAW] ────────────────────────────────
  recordStatus: RecordStatus;
  status: ProjectStatus;
  lifecycleStage: ProjectLifecycleStage;
  workflowState?: ProjectWorkflowState;
  isSetupComplete: boolean;

  // ───────────────────────── Commercial [RAW + CALCULATED] ──────────────────
  contractType: ContractType;
  deliveryMethod?: DeliveryMethod;
  /** RAW — contract currency code. */
  currency: string;
  /** RAW — from project.commercialSettings.exchangeRate. */
  exchangeRate?: number;
  /** RAW — immutable at award (Business Invariant, CalculationService). */
  signedContractValue: number;
  /** RAW — persisted by CalculationService.calculateProjectChangeBaseline, not recomputed here. */
  revisedContractValue?: number;
  /** RAW — project.approvedVariationTotal. */
  approvedVariationValue?: number;
  retentionPercentage?: number;
  advancePaymentPercentage?: number;
  vatPercentage?: number;
  /** CALCULATED — PortfolioValueCalculator; contract value normalized to the portfolio base currency. */
  normalizedContractValue?: MultiCurrencyValue;

  // ───────────────────────── Important Dates [RAW] ──────────────────────────
  awardedAt?: string;
  startDate?: string;
  mobilizationDate?: string;
  contractDurationDays?: number;
  mobilizationPeriodDays?: number;
  approvedEotDays?: number;
  contractualCompletionDate?: string;
  revisedCompletionDate?: string;
  forecastCompletionDate?: string;
  completionDate?: string;

  // ───────────────────────── Setup Progress [CALCULATED] ────────────────────
  // Sourced from the existing ProjectActivationPolicy — not a new formula.
  setupReadinessScore?: number;
  setupStepsPassed?: {
    commercial: boolean;
    schedule: boolean;
    office: boolean;
    documents: boolean;
  };

  // ───────────────────────── Execution Summary ──────────────────────────────
  // Counts are RAW — array lengths collected by the builder, not a business
  // calculation (distinct from the monetary rollups below).
  meetingsCount: number;
  ipcsCount: number;
  claimsCount: number;
  variationOrdersCount: number;
  nocsCount: number;
  subcontractsCount: number;
  documentsCount: number;
  attachmentsCount: number;
  wbsPackageCount: number;
  // Monetary rollups are CALCULATED — PortfolioValueCalculator only.
  totalCertifiedIpcValue?: MultiCurrencyValue;
  totalOutstandingIpcValue?: MultiCurrencyValue;
  totalApprovedClaimValue?: MultiCurrencyValue;
  totalApprovedVoValue?: MultiCurrencyValue;
  totalSubcontractInvoicedValue?: MultiCurrencyValue;

  // ───────────────────────── Management KPIs [CALCULATED] ───────────────────
  // Never fabricated. undefined means "not legitimately computable yet", not zero.
  /** PortfolioProgressCalculator — see rule table in that file. */
  executionProgressPercentage?: number;
  /** PortfolioHealthCalculator — undefined until a legitimate project-health formula is approved. */
  healthScore?: HealthStatus;
  /** PortfolioRiskCalculator — undefined until the Risk Register module exists. */
  riskScore?: number;
}
