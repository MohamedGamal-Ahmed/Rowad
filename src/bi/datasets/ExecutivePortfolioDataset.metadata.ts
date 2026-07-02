import { DatasetMetadata } from '../core/DatasetMetadata';
import { BusinessDatasetType } from '../core/BusinessDatasetType';

/**
 * Concrete DatasetMetadata for ExecutivePortfolioDataset — the first real
 * entry in the Dataset Catalog. Populating this is enterprise documentation,
 * not logic (CTO correction #4, Sprint 5.0 round 3). Not yet registered with
 * DatasetRegistry — that wiring is Sprint 5.1 scope.
 *
 * `owner` is a role placeholder, not a fabricated named individual — assign
 * a real owner before this metadata is used outside the BI layer.
 */
export const EXECUTIVE_PORTFOLIO_DATASET_METADATA: DatasetMetadata = {
  id: BusinessDatasetType.EXECUTIVE_PORTFOLIO,
  name: 'Executive Portfolio Dataset',
  description:
    'One row per Project — combines Tender-to-Award lineage, Project Setup ' +
    'progress, Commercial values, and Execution Summary counts/totals into a ' +
    'single executive-level read model for portfolio reporting. Read-only, ' +
    'computed on demand (ADR-011) — never persisted.',
  version: '1.0.0',
  owner: 'PMO / Contracts Administration — BI Foundation',
  createdDate: '2026-07-01',
  refreshStrategy: 'on-demand',
  supportedFilters: [
    { field: 'country', label: 'Country', type: 'string[]' },
    { field: 'client', label: 'Client', type: 'string[]' },
    { field: 'businessUnit', label: 'Business Unit', type: 'string[]' },
    { field: 'coordinator', label: 'Coordinator', type: 'string[]' },
    { field: 'status', label: 'Project Status', type: 'enum[]' },
    { field: 'workflowState', label: 'Workflow State', type: 'enum[]' },
    { field: 'lifecycleStage', label: 'Lifecycle Stage', type: 'enum[]' },
    { field: 'currency', label: 'Currency', type: 'string[]' },
    { field: 'dateRange', label: 'Date Range', type: 'dateRange' },
    { field: 'searchText', label: 'Search', type: 'text' }
  ],
  // Honest per CTO rules #6/#7 (never fabricate): nothing is actually export-capable yet.
  supportedExports: []
};
