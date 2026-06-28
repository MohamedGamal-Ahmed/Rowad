import { Tender } from '../domain/pre-award/Tender';
import { FinancialsCalculator } from '../business-rules/FinancialsCalculator';
import { Currency } from '../enums/Currency';
import { Money } from '../domain/common/Money';

export interface DashboardMetricsSummary {
  grandTotalValue: Money;
  criticalTendersCount: number;
  totalActiveBidsCount: number;
}

export class CalculationService {
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
}
