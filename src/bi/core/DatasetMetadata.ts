import { BusinessDatasetType } from './BusinessDatasetType';
import { ExportFormat } from '../exporters/ExportFormat';

/** How a dataset refreshes. 'on-demand' matches ADR-011 (computed live, never persisted). */
export type DatasetRefreshStrategy = 'on-demand' | 'cached' | 'scheduled';

/** Describes one filterable field a dataset exposes — for a consumer (UI, REST, Power BI) to build a filter form from, without hardcoding field names. */
export interface DatasetFilterDescriptor {
  field: string;
  label: string;
  type: 'string' | 'string[]' | 'enum' | 'enum[]' | 'dateRange' | 'text';
}

/**
 * DatasetMetadata — Enterprise documentation for a dataset, not UI (CTO
 * correction, Sprint 5.0 round 3). Every current and future BI dataset
 * (ExecutivePortfolio, PreAward, Commercial, Financial, Planning, Claims,
 * VariationOrders, IPC, Meetings, Procurement, ...) exposes exactly one of
 * these, whether or not the dataset itself is implemented yet.
 */
export interface DatasetMetadata {
  id: BusinessDatasetType;
  name: string;
  description: string;
  version: string;
  owner: string;
  /** ISO date (YYYY-MM-DD) this dataset's contract was first catalogued. */
  createdDate: string;
  refreshStrategy: DatasetRefreshStrategy;
  supportedFilters: DatasetFilterDescriptor[];
  /** Export formats this dataset is intended to support. Empty until an exporter actually exists for it — never fabricated. */
  supportedExports: ExportFormat[];
}
