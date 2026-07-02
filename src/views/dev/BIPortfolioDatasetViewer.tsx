import React, { useEffect, useState } from 'react';
import { RefreshCw, Database, CheckCircle2, XCircle } from 'lucide-react';
import { ExecutivePortfolioService } from '../../bi/services/ExecutivePortfolioService';
import { EXECUTIVE_PORTFOLIO_DATASET_METADATA } from '../../bi/datasets/ExecutivePortfolioDataset.metadata';
import { ExecutivePortfolioRow } from '../../bi/dto/ExecutivePortfolioRow';
import { PortfolioDatasetValidator, PortfolioValidationReport } from '../../bi/validation/PortfolioDatasetValidator';
import { ProjectLookupService } from '../../services/ProjectLookupService';
import { ProjectSetupService } from '../../services/ProjectSetupService';
import { ActivationPolicyResult } from '../../domain/projects/policies/ProjectActivationPolicy';

/**
 * BIPortfolioDatasetViewer — Sprint 5.1 Phase 5.
 *
 * Temporary developer page. Purpose: prove ExecutivePortfolioDataset builds
 * from the real Operational Layer with no placeholders — nothing here is
 * mocked. Reached via a "DEV" sidebar entry (App.tsx currentView ===
 * 'dev-bi-portfolio'), not a permanent product surface. Remove this route
 * and its Sidebar entry once the BI layer moves to a real consumer
 * (Power BI, Executive Dashboard, REST) in a future sprint.
 *
 * No redesign, no new UI system — plain table + cards matching the existing
 * Tailwind conventions used across views/.
 */

// Columns rendered in the full dataset table — one entry per
// ExecutivePortfolioRow field so nothing is silently hidden from the proof.
const COLUMNS: { key: keyof ExecutivePortfolioRow; label: string }[] = [
  { key: 'projectId', label: 'Project ID' },
  { key: 'projectCode', label: 'Code' },
  { key: 'nameEn', label: 'Name (EN)' },
  { key: 'country', label: 'Country' },
  { key: 'client', label: 'Client' },
  { key: 'businessUnit', label: 'Business Unit' },
  { key: 'coordinator', label: 'Coordinator' },
  { key: 'recordStatus', label: 'Record Status' },
  { key: 'status', label: 'Status' },
  { key: 'lifecycleStage', label: 'Lifecycle Stage' },
  { key: 'workflowState', label: 'Workflow State' },
  { key: 'contractType', label: 'Contract Type' },
  { key: 'currency', label: 'Currency' },
  { key: 'signedContractValue', label: 'Signed Value' },
  { key: 'revisedContractValue', label: 'Revised Value' },
  { key: 'normalizedContractValue', label: 'Normalized Value (base ccy)' },
  { key: 'setupReadinessScore', label: 'Setup Readiness %' },
  { key: 'executionProgressPercentage', label: 'Execution Progress %' },
  { key: 'healthScore', label: 'Health' },
  { key: 'riskScore', label: 'Risk' },
  { key: 'meetingsCount', label: 'Meetings' },
  { key: 'ipcsCount', label: 'IPCs' },
  { key: 'claimsCount', label: 'Claims' },
  { key: 'variationOrdersCount', label: 'VOs' },
  { key: 'nocsCount', label: 'NOCs' },
  { key: 'subcontractsCount', label: 'Subcontracts' },
  { key: 'documentsCount', label: 'Documents' },
  { key: 'attachmentsCount', label: 'Attachments' },
  { key: 'wbsPackageCount', label: 'WBS Packages' },
  { key: 'totalCertifiedIpcValue', label: 'Total Certified IPC' },
  { key: 'totalOutstandingIpcValue', label: 'Total Outstanding IPC' },
  { key: 'totalApprovedClaimValue', label: 'Total Approved Claims' },
  { key: 'totalApprovedVoValue', label: 'Total Approved VOs' },
  { key: 'totalSubcontractInvoicedValue', label: 'Total Subcontract Invoiced' }
];

function renderCell(row: ExecutivePortfolioRow, key: keyof ExecutivePortfolioRow): string {
  const value = row[key];
  if (value === undefined || value === null) return '—';
  if (typeof value === 'object') {
    const mcv = value as { amount?: number; currency?: string; amountInBaseCurrency?: number; baseCurrency?: string };
    if ('amount' in mcv) {
      return `${mcv.amount?.toLocaleString()} ${mcv.currency}` +
        (mcv.amountInBaseCurrency !== undefined ? ` (≈ ${mcv.amountInBaseCurrency.toLocaleString()} ${mcv.baseCurrency})` : '');
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function BIPortfolioDatasetViewer() {
  const [rows, setRows] = useState<ExecutivePortfolioRow[]>([]);
  const [generationMs, setGenerationMs] = useState<number | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [validationReport, setValidationReport] = useState<PortfolioValidationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = new ExecutivePortfolioService();
      const projectLookup = ProjectLookupService.getInstance();
      const setupService = new ProjectSetupService();

      const start = performance.now();
      const dataset = await service.getPortfolio();
      const elapsed = performance.now() - start;

      setRows(dataset);
      setGenerationMs(elapsed);
      setGeneratedAt(new Date().toISOString());

      const projects = await projectLookup.getProjects(true);
      const setupPolicyResults = new Map<string, ActivationPolicyResult>();
      for (const project of projects) {
        setupPolicyResults.set(project.id, await setupService.evaluatePolicy(project.id));
      }
      setValidationReport(PortfolioDatasetValidator.validate({ rows: dataset, projects, setupPolicyResults }));
    } catch (e: any) {
      setError(e?.message || 'Failed to build ExecutivePortfolioDataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-navy text-white flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">BI Dataset Viewer — ExecutivePortfolio</h1>
            <p className="text-xs text-gray-500">
              Sprint 5.1 developer proof page. Temporary — not a product surface. Reads the live BI layer, no mock data.
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Regenerate Dataset
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-bold mb-1">Row Count</p>
          <p className="text-2xl font-bold text-brand-navy">{rows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-bold mb-1">Generation Time</p>
          <p className="text-2xl font-bold text-brand-navy">{generationMs !== null ? `${generationMs.toFixed(1)} ms` : '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-bold mb-1">Generated At</p>
          <p className="text-sm font-semibold text-brand-navy">{generatedAt ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-bold mb-1">Validation</p>
          {validationReport ? (
            <p className={`text-sm font-bold flex items-center gap-1.5 ${validationReport.passed ? 'text-emerald-600' : 'text-red-600'}`}>
              {validationReport.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {validationReport.checks.filter(c => c.passed).length}/{validationReport.checks.length} checks passed
            </p>
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </div>
      </div>

      {/* Dataset metadata */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-brand-navy mb-3">Dataset Metadata</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div><span className="text-gray-400 block">ID</span><span className="font-semibold">{EXECUTIVE_PORTFOLIO_DATASET_METADATA.id}</span></div>
          <div><span className="text-gray-400 block">Version</span><span className="font-semibold">{EXECUTIVE_PORTFOLIO_DATASET_METADATA.version}</span></div>
          <div><span className="text-gray-400 block">Owner</span><span className="font-semibold">{EXECUTIVE_PORTFOLIO_DATASET_METADATA.owner}</span></div>
          <div><span className="text-gray-400 block">Refresh Strategy</span><span className="font-semibold">{EXECUTIVE_PORTFOLIO_DATASET_METADATA.refreshStrategy}</span></div>
          <div className="col-span-2 md:col-span-4"><span className="text-gray-400 block">Description</span><span>{EXECUTIVE_PORTFOLIO_DATASET_METADATA.description}</span></div>
          <div className="col-span-2 md:col-span-4">
            <span className="text-gray-400 block mb-1">Supported Filters</span>
            <div className="flex flex-wrap gap-1.5">
              {EXECUTIVE_PORTFOLIO_DATASET_METADATA.supportedFilters.map(f => (
                <span key={f.field} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px]">{f.label} ({f.type})</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validation report */}
      {validationReport && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-brand-navy mb-3">Validation Report</h2>
          <div className="space-y-2">
            {validationReport.checks.map(check => (
              <div key={check.id} className="flex items-start gap-2 text-xs border-b border-gray-50 last:border-0 py-1.5">
                {check.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />}
                <div>
                  <p className="font-semibold text-brand-navy">{check.id}</p>
                  <p className="text-gray-500">{check.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full dataset table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <h2 className="text-sm font-bold text-brand-navy p-5 pb-0 mb-3">Full Dataset ({rows.length} row(s))</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wide">
                {COLUMNS.map(col => (
                  <th key={String(col.key)} className="px-3 py-2 text-left whitespace-nowrap font-bold">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.projectId} className="border-t border-gray-50 hover:bg-gray-50/60">
                  {COLUMNS.map(col => (
                    <td key={String(col.key)} className="px-3 py-2 whitespace-nowrap text-gray-700">{renderCell(row, col.key)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && !loading && (
          <p className="text-center text-gray-400 text-sm py-8">No rows generated.</p>
        )}
      </div>
    </div>
  );
}
