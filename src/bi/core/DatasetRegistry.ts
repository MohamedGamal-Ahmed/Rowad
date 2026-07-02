import { BusinessDatasetType } from './BusinessDatasetType';
import { DatasetMetadata } from './DatasetMetadata';
import { IBusinessDataset } from './IBusinessDataset';

/**
 * One catalog entry. Per CTO correction #2 (Sprint 5.0 round 3), the
 * registry knows: dataset id + display name + description + owner +
 * refresh strategy + export capabilities (all via `metadata`), plus the
 * `createDataset` factory — the "builder" the registry is meant to hold.
 */
export interface DatasetRegistryEntry<TRow = unknown, TFilter = unknown> {
  id: BusinessDatasetType;
  metadata: DatasetMetadata;
  /** Factory returning this dataset's IBusinessDataset implementation. Not invoked by anything yet. */
  createDataset: () => IBusinessDataset<TRow, TFilter>;
}

/**
 * DatasetRegistry — Sprint 5.0 BI Foundation freeze. CONTRACT ONLY.
 *
 * Central catalog every future consumer (Power BI, Excel Export, REST API,
 * AI Insights) will be able to query to discover which datasets exist
 * without importing each one directly. No registration/lookup logic is
 * implemented — every method throws. Registering the real
 * ExecutivePortfolioDataset entry (and building the second dataset that
 * actually justifies this registry) is Sprint 5.1+ scope.
 */
export class DatasetRegistry {
  public static register<TRow, TFilter>(_entry: DatasetRegistryEntry<TRow, TFilter>): void {
    throw new Error('DatasetRegistry.register() is not implemented — contract-only per Sprint 5.0 BI Foundation freeze.');
  }

  public static get(_id: BusinessDatasetType): DatasetRegistryEntry | undefined {
    throw new Error('DatasetRegistry.get() is not implemented — contract-only per Sprint 5.0 BI Foundation freeze.');
  }

  public static list(): DatasetRegistryEntry[] {
    throw new Error('DatasetRegistry.list() is not implemented — contract-only per Sprint 5.0 BI Foundation freeze.');
  }
}
