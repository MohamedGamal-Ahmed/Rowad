import { Project, ProjectIPC, ProjectClaim, ProjectVariationOrder, ProjectSubcontract } from '../../domain/projects/Project';
import { RecordStatus } from '../../enums/RecordStatus';
import { Currency } from '../../enums/Currency';
import { FinancialsCalculator } from '../../business-rules/FinancialsCalculator';
import { MultiCurrencyValue } from '../core/BIMonetaryValue';

/**
 * PortfolioValueCalculator — Sprint 5.0 Phase 6 Step 3.
 *
 * Independent calculator (CTO correction #4 — no calculator depends on
 * another). Owns every monetary rollup on ExecutivePortfolioRow.
 *
 * Reuse decisions:
 *   - Currency normalization uses FinancialsCalculator.sumAmounts exclusively
 *     (the existing multi-currency conversion table). Never reimplemented here.
 *   - Certified/outstanding IPC math is NOT recomputed via CalculationService.
 *     ProjectIPC already stores the computed commercial fields (certifiedGrossValue,
 *     netCertifiedAmount, retentionDeduction, etc.) once the operational layer
 *     (IPCsPanel → CalculationService.calculateIpcCommercials) saves them. This
 *     calculator only sums those already-persisted RAW fields — it never
 *     re-derives retention/advance/withholding tax math. This also keeps the
 *     calculator dependency-free, matching the existing business-rules/
 *     convention (FinancialsCalculator/HealthCalculator/TimelineCalculator never
 *     import from services/) — a Calculator should not depend on a Service.
 *   - Archived sub-records (recordStatus === ARCHIVED) are excluded from every
 *     total, consistent with the exclusion CalculationService.calculateIpcCommercials
 *     already applies elsewhere.
 */
export interface PortfolioValueCalculatorInput {
  project: Project;
  ipcs: ProjectIPC[];
  claims: ProjectClaim[];
  variationOrders: ProjectVariationOrder[];
  subcontracts: ProjectSubcontract[];
  /** Enterprise reporting base currency to normalize into. Defaults to Currency.AED (matches FinancialsCalculator's own default). */
  baseCurrency?: string;
}

export interface PortfolioValueCalculatorOutput {
  normalizedContractValue?: MultiCurrencyValue;
  totalCertifiedIpcValue?: MultiCurrencyValue;
  totalOutstandingIpcValue?: MultiCurrencyValue;
  totalApprovedClaimValue?: MultiCurrencyValue;
  totalApprovedVoValue?: MultiCurrencyValue;
  totalSubcontractInvoicedValue?: MultiCurrencyValue;
}

/** IPC statuses considered "certified" for portfolio rollups — matches the status set CalculationService.calculateIpcCommercials already treats as certified. */
const CERTIFIED_IPC_STATUSES = new Set(['Certified', 'Paid', 'Partially Paid']);

export class PortfolioValueCalculator {
  public static calculate(input: PortfolioValueCalculatorInput): PortfolioValueCalculatorOutput {
    const { project, ipcs, claims, variationOrders, subcontracts } = input;
    const baseCurrency = (input.baseCurrency as Currency) || Currency.AED;
    const contractCurrency = (project.commercialSettings?.contractCurrency || project.currency || baseCurrency) as Currency;

    const activeIpcs = ipcs.filter(i => i.recordStatus !== RecordStatus.ARCHIVED);
    const activeClaims = claims.filter(c => c.recordStatus !== RecordStatus.ARCHIVED);
    const activeVos = variationOrders.filter(v => v.recordStatus !== RecordStatus.ARCHIVED);
    const activeSubs = subcontracts.filter(s => s.recordStatus !== RecordStatus.ARCHIVED);

    const certifiedIpcs = activeIpcs.filter(i => CERTIFIED_IPC_STATUSES.has(i.status));

    const totalCertified = certifiedIpcs.reduce(
      (sum, i) => sum + (i.certifiedGrossValue ?? i.certifiedAmount ?? 0),
      0
    );

    const totalOutstanding = certifiedIpcs.reduce((sum, i) => {
      const netCertified = i.netCertifiedAmount ?? i.certifiedAmount ?? 0;
      const totalPaid = (i.payments || [])
        .filter(p => p.recordStatus !== 'Archived' && p.status !== 'Rejected')
        .reduce((paidSum, p) => paidSum + p.paymentAmount, 0);
      return sum + Math.max(0, netCertified - totalPaid);
    }, 0);

    const totalApprovedClaims = activeClaims
      .filter(c => c.status === 'Approved')
      .reduce((sum, c) => sum + (c.approvedAmount ?? 0), 0);

    const totalApprovedVos = activeVos
      .filter(v => v.status === 'Approved' || v.status === 'Implemented')
      .reduce((sum, v) => sum + (v.approval?.approvedAmount ?? 0), 0);

    const totalSubInvoiced = activeSubs.reduce(
      (sum, s) => sum + (s.tillDateInvoicedAmount ?? 0),
      0
    );

    const contractValueRaw = project.revisedContractValue ?? project.signedContractValue ?? 0;

    return {
      normalizedContractValue: this.toMultiCurrencyValue(contractValueRaw, contractCurrency, baseCurrency),
      totalCertifiedIpcValue: this.toMultiCurrencyValue(totalCertified, contractCurrency, baseCurrency),
      totalOutstandingIpcValue: this.toMultiCurrencyValue(totalOutstanding, contractCurrency, baseCurrency),
      totalApprovedClaimValue: this.toMultiCurrencyValue(totalApprovedClaims, contractCurrency, baseCurrency),
      totalApprovedVoValue: this.toMultiCurrencyValue(totalApprovedVos, contractCurrency, baseCurrency),
      totalSubcontractInvoicedValue: this.toMultiCurrencyValue(totalSubInvoiced, contractCurrency, baseCurrency)
    };
  }

  /** Wraps a raw amount + FinancialsCalculator.sumAmounts' normalized result into a MultiCurrencyValue. */
  private static toMultiCurrencyValue(amount: number, currency: Currency, baseCurrency: Currency): MultiCurrencyValue {
    const normalized = FinancialsCalculator.sumAmounts([{ amount, currency }], baseCurrency);
    return {
      amount,
      currency,
      baseCurrency,
      amountInBaseCurrency: normalized.amount
    };
  }
}
