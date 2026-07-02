import { DatasetMetadata } from './DatasetMetadata';

/**
 * IBusinessDataset — the contract every BI dataset (ExecutivePortfolio,
 * PreAward, Commercial, Financial, Planning, Claims, VariationOrders, IPC,
 * Meetings, Procurement, ...) satisfies, so the Dataset Registry, a future
 * REST layer, Power BI connector, and Excel exporter can all treat any
 * dataset identically without importing its concrete service.
 *
 * TRow — the dataset's row DTO (e.g. ExecutivePortfolioRow).
 * TFilter — the dataset's filter criteria DTO (e.g. PortfolioFilterCriteria).
 *
 * Contract only (Sprint 5.0 BI Foundation freeze) — no existing service is
 * required to implement this yet. Wiring ExecutivePortfolioService against
 * this interface is deliberately deferred to Sprint 5.1 so this freeze's
 * diff stays limited to new files.
 */
export interface IBusinessDataset<TRow = unknown, TFilter = unknown> {
  getMetadata(): DatasetMetadata;
  getRows(filter?: TFilter): Promise<TRow[]>;
}
