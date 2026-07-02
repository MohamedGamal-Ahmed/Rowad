import { ExportFormat } from './ExportFormat';

/** Result shape every exporter returns — contract only, never populated yet. */
export interface ExportResult {
  format: ExportFormat;
  success: boolean;
  fileName?: string;
  payload?: unknown;
  errors?: string[];
}

/**
 * IExporter — contract every export target (Excel, CSV, Power BI, a future
 * REST API) implements. Generic over the row type so any current or future
 * dataset (ExecutivePortfolioRow, PreAwardRow, ClaimsRow, ...) can be handed
 * to any exporter without the exporter needing to know which dataset it is.
 *
 * Sprint 5.0 BI Foundation freeze: contracts only. No exporter is called by
 * anything yet — that wiring is explicitly Sprint 5.1+ scope.
 */
export interface IExporter<TRow = unknown> {
  readonly format: ExportFormat;
  export(rows: TRow[], datasetName: string): Promise<ExportResult>;
}
