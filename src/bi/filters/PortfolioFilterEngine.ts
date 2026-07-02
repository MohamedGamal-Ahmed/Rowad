import { ExecutivePortfolioRow } from '../dto/ExecutivePortfolioRow';
import { PortfolioFilterCriteria } from './PortfolioFilterCriteria';

/**
 * PortfolioFilterEngine — Sprint 5.0 Phase 6 Step 6.
 *
 * Generic, pure business logic (CTO correction #8): takes
 * ExecutivePortfolioRow[] + PortfolioFilterCriteria, returns
 * ExecutivePortfolioRow[]. No React, no UI, no framework dependency of any
 * kind — safe to reuse from the Executive Dashboard, a future REST endpoint,
 * or a CLI export script alike.
 */
export class PortfolioFilterEngine {
  public static apply(rows: ExecutivePortfolioRow[], criteria?: PortfolioFilterCriteria): ExecutivePortfolioRow[] {
    if (!criteria) {
      return rows;
    }
    return rows.filter(row => PortfolioFilterEngine.matches(row, criteria));
  }

  private static matches(row: ExecutivePortfolioRow, c: PortfolioFilterCriteria): boolean {
    if (c.country && c.country.length > 0 && !c.country.includes(row.country)) return false;
    if (c.client && c.client.length > 0 && !c.client.includes(row.client)) return false;
    if (c.businessUnit && c.businessUnit.length > 0 && !c.businessUnit.includes(row.businessUnit)) return false;
    if (c.coordinator && c.coordinator.length > 0 && !c.coordinator.includes(row.coordinator)) return false;
    if (c.status && c.status.length > 0 && !c.status.includes(row.status)) return false;
    if (c.workflowState && c.workflowState.length > 0) {
      if (!row.workflowState || !c.workflowState.includes(row.workflowState)) return false;
    }
    if (c.lifecycleStage && c.lifecycleStage.length > 0 && !c.lifecycleStage.includes(row.lifecycleStage)) return false;
    if (c.currency && c.currency.length > 0 && !c.currency.includes(row.currency)) return false;

    if (c.dateRange) {
      const value = row[c.dateRange.field];
      if (!PortfolioFilterEngine.isWithinRange(value, c.dateRange.from, c.dateRange.to)) return false;
    }

    if (c.searchText && c.searchText.trim().length > 0) {
      if (!PortfolioFilterEngine.matchesSearchText(row, c.searchText.trim().toLowerCase())) return false;
    }

    return true;
  }

  /** ISO YYYY-MM-DD strings compare correctly with plain string comparison — no Date parsing needed. */
  private static isWithinRange(value: string | undefined, from?: string, to?: string): boolean {
    if (!value) return false;
    if (from && value < from) return false;
    if (to && value > to) return false;
    return true;
  }

  private static matchesSearchText(row: ExecutivePortfolioRow, needle: string): boolean {
    const haystack = [
      row.projectCode,
      row.nameEn,
      row.nameAr,
      row.client,
      row.employer,
      row.consultant,
      row.coordinator,
      row.projectManager,
      row.sourceTenderNumber
    ]
      .filter((part): part is string => Boolean(part))
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  }
}
