import { ExportFormat } from './ExportFormat';
import { IExporter, ExportResult } from './IExporter';

/**
 * CsvExporter — empty contract. Sprint 5.0 BI Foundation freeze: no export
 * logic implemented. Exists only for DatasetRegistry / consumers to
 * reference a concrete type. Do not implement without separate CTO approval.
 */
export class CsvExporter implements IExporter<unknown> {
  public readonly format = ExportFormat.CSV;

  public async export(_rows: unknown[], _datasetName: string): Promise<ExportResult> {
    throw new Error(
      'CsvExporter.export() is not implemented — out of scope for Sprint 5.0 (BI Foundation). ' +
      'Deferred to a future export-focused sprint.'
    );
  }
}
