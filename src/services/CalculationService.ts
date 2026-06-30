import { Tender } from '../domain/pre-award/Tender';
import { FinancialsCalculator } from '../business-rules/FinancialsCalculator';
import { Currency } from '../enums/Currency';
import { Money } from '../domain/common/Money';
import { Project, ProjectIPC, ProjectVariationOrder } from '../domain/projects/Project';
import { FinancialSettings } from '../domain/administration/Settings';

export interface DashboardMetricsSummary {
  grandTotalValue: Money;
  criticalTendersCount: number;
  totalActiveBidsCount: number;
}

export class CalculationService {
  // ====================================================
  // TENDER CALCULATIONS
  // ====================================================

  /**
   * Summarizes all pre-award tenders into standard KPI values for the dashboard,
   * converting money sums in real-time.
   */
  public aggregateDashboardMetrics(
    tenders: Tender[],
    targetCurrency: Currency = Currency.AED
  ): DashboardMetricsSummary {
    const activeValues: Money[] = tenders.map(t => t.financials.estimatedValue);
    
    // Safely sum multi-currency bid values using standard weights
    const combinedValue = FinancialsCalculator.sumAmounts(activeValues, targetCurrency);

    // Filter tenders identified as High or Critical priority
    const criticalCount = tenders.filter(t => {
      const p = t.general.priority;
      return p === 'Critical' || p === 'High';
    }).length;

    return {
      grandTotalValue: combinedValue,
      criticalTendersCount: criticalCount,
      totalActiveBidsCount: tenders.length
    };
  }

  // ====================================================
  // PROJECT CALCULATIONS
  // ====================================================

  /**
   * Recalculates the Project Commercial Baseline based on all approved variation orders,
   * updating original contract value, approved VO totals, approved EOT days, and revised contract value.
   * 
   * @param project The Project record.
   * @param vos All variation orders for the project.
   */
  public calculateProjectChangeBaseline(
    project: Project,
    vos: ProjectVariationOrder[]
  ): Project {
    const updatedProject = { ...project };

    // Business Invariant 1: signedContractValue is established at award and is completely immutable
    if (project.signedContractValue === undefined || project.signedContractValue === null || project.signedContractValue === 0) {
      // Fallback for edge cases, but signedContractValue must be initialized
      updatedProject.signedContractValue = 0;
    } else {
      updatedProject.signedContractValue = project.signedContractValue;
    }

    // Business Invariant 2: Cumulative Approved Variation Total (Approved / Implemented only)
    let approvedVariationTotal = 0;
    let approvedEotDays = 0;

    for (const vo of vos) {
      if (vo.status === 'Approved' || vo.status === 'Implemented') {
        const approvedAmt = vo.approval?.approvedAmount ?? 0;
        const type = vo.technicalDescription?.additionOrOmission || vo.costImpactType;

        if (type === 'Addition') {
          approvedVariationTotal += approvedAmt;
        } else if (type === 'Omission') {
          approvedVariationTotal -= approvedAmt;
        }

        approvedEotDays += vo.approval?.approvedEotDays ?? vo.scheduleImpactDays ?? 0;
      }
    }

    updatedProject.approvedVariationTotal = Math.round(approvedVariationTotal * 100) / 100;
    updatedProject.approvedEotDays = approvedEotDays;

    // Business Invariant 3: Revised Contract Value = signedContractValue + approvedVariationTotal
    updatedProject.revisedContractValue = Math.round((updatedProject.signedContractValue + approvedVariationTotal) * 100) / 100;

    return updatedProject;
  }

  // ====================================================
  // COMMERCIAL CALCULATIONS
  // ====================================================

  /**
   * Performs advanced commercial calculations for Interim Payment Certificates (IPC),
   * computing retention, advance recovery, withholding tax, net values, and outstanding balances.
   * 
   * @param ipc The current IPC record.
   * @param previousIpcs All other IPC records for the project.
   * @param financialSettings Settings for percentages.
   * @param projectContractValue Value of the parent project.
   */
  public calculateIpcCommercials(
    ipc: ProjectIPC,
    previousIpcs: ProjectIPC[],
    financialSettings?: FinancialSettings,
    projectContractValue = 0
  ) {
    // 1. Filter active previous IPCs chronologically
    const activePrevIpcs = previousIpcs
      .filter(i => i.id !== ipc.id && i.recordStatus !== 'Archived')
      .sort((a, b) => new Date(a.workTill || '').getTime() - new Date(b.workTill || '').getTime());

    // 2. Sum previous certified values
    const previousGrossCumulative = activePrevIpcs
      .filter(i => i.status === 'Certified' || i.status === 'Paid' || i.status === 'Partially Paid')
      .reduce((sum, i) => sum + (i.certifiedGrossValue ?? 0), 0);

    const previousNetCumulative = activePrevIpcs
      .filter(i => i.status === 'Certified' || i.status === 'Paid' || i.status === 'Partially Paid')
      .reduce((sum, i) => sum + (i.netCertifiedAmount ?? 0), 0);

    const previousRetentionCumulative = activePrevIpcs
      .filter(i => i.status === 'Certified' || i.status === 'Paid' || i.status === 'Partially Paid')
      .reduce((sum, i) => sum + (i.retentionDeduction ?? 0), 0);

    // 3. Compute deductions based on Certified Gross Value
    const grossCertified = ipc.certifiedGrossValue ?? 0;
    const retentionRate = (financialSettings?.retentionPercentage ?? 10) / 100;
    const advanceRate = (financialSettings?.advancePaymentPercentage ?? 10) / 100;

    // Retention deduction with dynamic cap percentage (if specified in settings, otherwise uncapped)
    let retentionDeduction = grossCertified * retentionRate;
    const retentionCapPercentage = financialSettings?.retentionCapPercentage;
    if (projectContractValue > 0 && retentionCapPercentage !== undefined && retentionCapPercentage > 0) {
      const retentionCap = projectContractValue * (retentionCapPercentage / 100);
      if (previousRetentionCumulative + retentionDeduction > retentionCap) {
        retentionDeduction = Math.max(0, retentionCap - previousRetentionCumulative);
      }
    }

    // Advance Payment Recovery deduction
    const advanceRecovery = grossCertified * advanceRate;

    // Withholding Tax deduction (if specified in settings, otherwise 0%)
    const withholdingTaxPercentage = financialSettings?.withholdingTaxPercentage;
    const taxRate = (withholdingTaxPercentage !== undefined) ? (withholdingTaxPercentage / 100) : 0;
    const withholdingTax = grossCertified * taxRate;

    // Net Certified Amount
    const netCertifiedAmount = Math.max(0, grossCertified - retentionDeduction - advanceRecovery - withholdingTax);

    // 4. Sum received payments
    const totalPaid = (ipc.payments || [])
      .filter(p => p.recordStatus !== 'Archived' && p.status !== 'Rejected')
      .reduce((sum, p) => sum + p.paymentAmount, 0);

    // Outstanding Balance
    const outstandingAmount = Math.max(0, netCertifiedAmount - totalPaid);

    // 5. Suggest status based on financial amounts
    let status = ipc.status;
    if (ipc.status === 'Certified' || ipc.status === 'Paid' || ipc.status === 'Partially Paid') {
      if (totalPaid === 0) {
        status = 'Certified';
      } else if (totalPaid > 0 && totalPaid < netCertifiedAmount) {
        status = 'Partially Paid';
      } else if (totalPaid >= netCertifiedAmount && netCertifiedAmount > 0) {
        status = 'Paid';
      }
    }

    return {
      previousGrossCumulative: Math.round(previousGrossCumulative * 100) / 100,
      previousNetCumulative: Math.round(previousNetCumulative * 100) / 100,
      retentionDeduction: Math.round(retentionDeduction * 100) / 100,
      advanceRecovery: Math.round(advanceRecovery * 100) / 100,
      withholdingTax: Math.round(withholdingTax * 100) / 100,
      netCertifiedAmount: Math.round(netCertifiedAmount * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstandingAmount: Math.round(outstandingAmount * 100) / 100,
      status
    };
  }
}
