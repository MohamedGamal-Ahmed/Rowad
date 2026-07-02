import { ExportFormat } from './ExportFormat';
import { IExporter, ExportResult } from './IExporter';

/**
 * ExcelExporter — empty contract. Sprint 5.0 explicitly excludes building
 * Excel export ("DO NOT build Excel export"). This class exists only so
 * DatasetRegistry / consumers have a concrete, typed reference to compile
 * against. Do not implement without separate CTO approval.
 */
export class ExcelExporter implements IExporter<unknown> {
  public readonly format = ExportFormat.EXCEL;

  public async export(_rows: unknown[], _datasetName: string): Promise<ExportResult> {
    throw new Error(
      'ExcelExporter.export() is not implemented — out of scope for Sprint 5.0 (BI Foundation). ' +
      'Deferred to a future export-focused sprint.'
    );
  }
}
