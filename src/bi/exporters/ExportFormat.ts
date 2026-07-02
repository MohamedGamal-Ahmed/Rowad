/**
 * ExportFormat — the closed set of export targets the BI layer anticipates.
 * Contract only (Sprint 5.0 BI Foundation freeze) — no exporter listed here
 * does anything yet. "DO NOT build Excel export. DO NOT build Power BI."
 * still applies; this enum exists so DatasetMetadata.supportedExports and
 * IExporter have something typed to reference.
 */
export enum ExportFormat {
  EXCEL = 'Excel',
  CSV = 'CSV',
  POWER_BI = 'PowerBI',
  API = 'API'
}
