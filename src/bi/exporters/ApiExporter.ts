import { ExportFormat } from './ExportFormat';
import { IExporter, ExportResult } from './IExporter';

/**
 * ApiExporter — empty contract for a future REST API serialization path
 * (e.g. GET /portfolio). Sprint 5.0 BI Foundation freeze: no logic
 * implemented. Do not implement without separate CTO approval.
 */
export class ApiExporter implements IExporter<unknown> {
  public readonly format = ExportFormat.API;

  public async export(_rows: unknown[], _datasetName: string): Promise<ExportResult> {
    throw new Error(
      'ApiExporter.export() is not implemented — out of scope for Sprint 5.0 (BI Foundation). ' +
      'Deferred to a future export-focused sprint.'
    );
  }
}
