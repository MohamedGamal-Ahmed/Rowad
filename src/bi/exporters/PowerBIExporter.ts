import { ExportFormat } from './ExportFormat';
import { IExporter, ExportResult } from './IExporter';

/**
 * PowerBIExporter — empty contract. Sprint 5.0 explicitly excludes building
 * Power BI integration ("DO NOT build Power BI"). Exists only so
 * DatasetRegistry / consumers have a concrete, typed reference. Do not
 * implement without separate CTO approval — this is planned for Sprint 5.1
 * ("Executive Portfolio Dataset Implementation and Power BI Integration").
 */
export class PowerBIExporter implements IExporter<unknown> {
  public readonly format = ExportFormat.POWER_BI;

  public async export(_rows: unknown[], _datasetName: string): Promise<ExportResult> {
    throw new Error(
      'PowerBIExporter.export() is not implemented — out of scope for Sprint 5.0 (BI Foundation). ' +
      'Planned for Sprint 5.1.'
    );
  }
}
