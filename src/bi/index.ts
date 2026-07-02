/**
 * ROWAD Enterprise Semantic Layer — BI Foundation v1 (Sprint 5.0, frozen)
 * proven end-to-end in Sprint 5.1. Nothing inside src/bi depends on UI
 * components. Consumers (future Power BI feed, Executive Dashboard, Excel
 * Export, REST APIs, AI Insights, mobile) import from here.
 *
 * Status after Sprint 5.1:
 *   - ExecutivePortfolioDataset — PROVEN. DTO, builder, 4 calculators,
 *     service, filter engine all have real logic (Sprint 5.0), and
 *     PortfolioDatasetValidator (Sprint 5.1 Phase 6) independently confirms
 *     row-count integrity, no duplicates, no missing IDs, correct monetary
 *     normalization, setup readiness parity with ProjectActivationPolicy,
 *     and lifecycle/workflow/status parity with the Operational Layer. See
 *     docs/bi/EXECUTIVE_PORTFOLIO_VALIDATION_REPORT.md for the captured run.
 *   - core/{BusinessDatasetType, DatasetMetadata, IBusinessDataset,
 *     DatasetRegistry} and exporters/{ExportFormat, IExporter, ExcelExporter,
 *     CsvExporter, PowerBIExporter, ApiExporter} — STILL CONTRACTS ONLY.
 *     Sprint 5.1 explicitly excluded DatasetRegistry wiring, Excel export,
 *     and Power BI integration ("STOP. Do not start Excel export. Do not
 *     start Power BI.") — that remains a future sprint decision.
 *   - mappers/ — still reserved, empty.
 *   - validation/ — Sprint 5.1 Phase 6 dataset-proof tooling. Not a generic
 *     contract; scoped to proving ExecutivePortfolioDataset only.
 */
export * from './core';
export * from './dto';
export * from './datasets';
export * from './calculators';
export * from './builders';
export * from './filters';
export * from './services';
export * from './exporters';
export * from './validation';
