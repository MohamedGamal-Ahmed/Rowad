import { ProjectStatus, ProjectLifecycleStage, ProjectWorkflowState } from '../../domain/projects/Project';

/**
 * PortfolioFilterCriteria — the input contract for the future Filter Engine
 * (CTO correction #8: generic, React-free, operates on
 * ExecutivePortfolioRow[] + this DTO → ExecutivePortfolioRow[]).
 *
 * This file defines ONLY the filter shape so ExecutivePortfolioService's
 * signature can compile against it. The engine itself (filters/PortfolioFilterEngine.ts)
 * is explicitly out of scope for Sprint 5.0 Phases 1-5 — do not implement it yet.
 */
export interface PortfolioDateRangeFilter {
  field: 'startDate' | 'awardedAt' | 'contractualCompletionDate' | 'revisedCompletionDate';
  from?: string;
  to?: string;
}

export interface PortfolioFilterCriteria {
  country?: string[];
  client?: string[];
  businessUnit?: string[];
  coordinator?: string[];
  status?: ProjectStatus[];
  workflowState?: ProjectWorkflowState[];
  lifecycleStage?: ProjectLifecycleStage[];
  currency?: string[];
  dateRange?: PortfolioDateRangeFilter;
  /** Free-text search across identity fields (code, nameEn/Ar, client, coordinator, etc.). */
  searchText?: string;
}
