import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Download, Printer, Save, Calendar, CheckCircle, 
  AlertCircle, DollarSign, List, Shield, Eye, Database, FileSpreadsheet, RotateCcw
} from 'lucide-react';
import { Project, ProjectMeeting, ProjectIPC, ProjectClaim, ProjectVariationOrder, ProjectNOC, ProjectDocument, ProjectSPR, ProjectSubcontract } from '../../../../domain/projects/Project';
import { RecordStatus } from '../../../../enums/RecordStatus';

interface SprReportingEngineProps {
  project: Project;
  meetings: ProjectMeeting[];
  ipcs: ProjectIPC[];
  claims: ProjectClaim[];
  vos: ProjectVariationOrder[];
  nocs: ProjectNOC[];
  documents: ProjectDocument[];
  subcontracts: ProjectSubcontract[];
  lang: 'ar' | 'en';
  onSaveSnapshot: (snapshot: ProjectSPR) => Promise<void>;
  savedSnapshots: ProjectSPR[];
}

export function SprReportingEngine({
  project,
  meetings,
  ipcs,
  claims,
  vos,
  nocs,
  documents,
  subcontracts,
  lang,
  onSaveSnapshot,
  savedSnapshots
}: SprReportingEngineProps) {
  const isAr = lang === 'ar';

  // 1. Report Parameters State
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // 2. Adjustables (Snapshotted metadata)
  const [overallProgress, setOverallProgress] = useState(65);
  const [scheduleVariance, setScheduleVariance] = useState(-2.5);
  const [costVariance, setCostVariance] = useState(1.8);
  const [customKeyAchievements, setCustomKeyAchievements] = useState('');
  const [bottlenecks, setBottlenecks] = useState('');
  const [pmoExecutiveSummary, setPmoExecutiveSummary] = useState('');

  // 3. Compare Snapshot view
  const [selectedSnapshotToView, setSelectedSnapshotToView] = useState<ProjectSPR | null>(null);

  // 4. Auto-Generated Content (Scanned directly from other modules)
  const monthlyData = useMemo(() => {
    const monthStr = selectedMonth; // e.g. "2026-06"
    
    const filteredMeetings = (meetings || []).filter(m => m && typeof m.date === 'string' && m.date.startsWith(monthStr));
    const filteredIpcs = (ipcs || []).filter(i => i && typeof i.ipcSubmissionDate === 'string' && i.ipcSubmissionDate.startsWith(monthStr));
    const filteredClaims = (claims || []).filter(c => c && typeof c.submissionDate === 'string' && c.submissionDate.startsWith(monthStr));
    const filteredVos = (vos || []).filter(v => {
      if (!v) return false;
      const empDate = v.employerInstruction?.date;
      const commDate = v.commercialOffer?.commercialDate;
      const appDate = v.approval?.approvalDate;
      return (typeof empDate === 'string' && empDate.startsWith(monthStr)) ||
             (typeof commDate === 'string' && commDate.startsWith(monthStr)) ||
             (typeof appDate === 'string' && appDate.startsWith(monthStr));
    });
    const filteredDocs = (documents || []).filter(d => d && typeof d.dateReceived === 'string' && d.dateReceived.startsWith(monthStr));

    // Calculate aggregated monthly financials
    const totalSubmittedIpcVal = filteredIpcs.reduce((acc, i) => acc + (i.invoiceGrossValue || 0), 0);
    const totalCertifiedIpcVal = filteredIpcs.reduce((acc, i) => acc + (i.certifiedAmount || 0), 0);
    const totalSubmittedClaimVal = filteredClaims.reduce((acc, c) => acc + (c.additionalClaimedAmount || 0), 0);
    const totalApprovedClaimVal = filteredClaims.reduce((acc, c) => acc + (c.approvedAmount || 0), 0);
    const totalApprovedVoVal = filteredVos.reduce((acc, v) => acc + (v.approval?.approvedAmount || 0), 0);

    // Cumulative Project Metrics (Entire lifecycle stats)
    const cumCertifiedIpcVal = (ipcs || []).reduce((acc, i) => acc + (i.netCertifiedAmount ?? i.certifiedAmount ?? 0), 0);
    
    const cumPaidIpcVal = (ipcs || []).reduce((acc, i) => {
      const totalPaid = (i.payments || [])
        .filter(p => p.status === 'Received' || p.status === 'Verified')
        .reduce((sum, p) => sum + p.paymentAmount, 0);
      return acc + totalPaid;
    }, 0);

    const cumOutstandingIpcVal = (ipcs || []).reduce((acc, i) => {
      const totalPaid = (i.payments || [])
        .filter(p => p.status === 'Received' || p.status === 'Verified')
        .reduce((sum, p) => sum + p.paymentAmount, 0);
      const isCertifiedStatus = i.status === 'Certified' || i.status === 'Paid' || i.status === 'Partially Paid';
      const outstanding = isCertifiedStatus ? Math.max(0, (i.netCertifiedAmount ?? i.certifiedAmount ?? 0) - totalPaid) : 0;
      return acc + outstanding;
    }, 0);

    const totalSubcontractsCommitted = (subcontracts || []).reduce((acc, s) => acc + (s.totalSubcontractAmount || 0), 0);
    const totalSubcontractsInvoiced = (subcontracts || []).reduce((acc, s) => acc + (s.tillDateInvoicedAmount || 0), 0);

    const totalClaimsApprovedCost = (claims || []).reduce((acc, c) => acc + (c.approvedAmount || 0), 0);
    const totalClaimsApprovedEot = (claims || []).reduce((acc, c) => acc + (c.approvedCompletionExtensionDays || 0), 0);

    const totalApprovedVosCount = (vos || []).filter(v => v.status === 'Approved' || v.status === 'Implemented').length;
    const totalPendingVosCount = (vos || []).filter(v => v.status === 'Draft' || v.status === 'Submitted' || v.status === 'Under Review').length;

    // NOC status counts
    const isExpired = (expDate: string | undefined): boolean => {
      if (!expDate) return false;
      const exp = new Date(expDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return exp.getTime() < today.getTime();
    };

    const isExpiringSoon = (expDate: string | undefined): boolean => {
      if (!expDate) return false;
      const exp = new Date(expDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    };

    const activeNocs = (nocs || []).filter(n => n.status === 'Approved' && !isExpired(n.expiryDate)).length;
    const expiredNocs = (nocs || []).filter(n => n.status === 'Approved' && isExpired(n.expiryDate)).length;
    const expiringSoonNocs = (nocs || []).filter(n => n.status === 'Approved' && isExpiringSoon(n.expiryDate)).length;

    return {
      meetings: filteredMeetings,
      ipcs: filteredIpcs,
      claims: filteredClaims,
      vos: filteredVos,
      docs: filteredDocs,
      metrics: {
        totalSubmittedIpcVal,
        totalCertifiedIpcVal,
        totalSubmittedClaimVal,
        totalApprovedClaimVal,
        totalApprovedVoVal,
        // Cumulative metrics
        cumCertifiedIpcVal,
        cumPaidIpcVal,
        cumOutstandingIpcVal,
        totalSubcontractsCommitted,
        totalSubcontractsInvoiced,
        totalClaimsApprovedCost,
        totalClaimsApprovedEot,
        totalApprovedVosCount,
        totalPendingVosCount,
        activeNocs,
        expiredNocs,
        expiringSoonNocs
      }
    };
  }, [selectedMonth, meetings, ipcs, claims, vos, documents, subcontracts, nocs]);

  // Seed default comments based on auto-scanned facts
  useEffect(() => {
    if (selectedSnapshotToView) {
      // If viewing a snapshot, lock fields to snapshot values
      setOverallProgress(selectedSnapshotToView.overallProgressPercentage);
      setScheduleVariance(selectedSnapshotToView.scheduleVariance);
      setCostVariance(selectedSnapshotToView.costVariance);
      setCustomKeyAchievements(selectedSnapshotToView.keyAchievements);
      setBottlenecks(selectedSnapshotToView.bottlenecksAndRisks);
      setPmoExecutiveSummary(selectedSnapshotToView.pmoSummary);
    } else {
      // Populate defaults from computed live values
      const defaultAchievements = [
        `Conducted ${monthlyData.meetings.length} coordination meetings.`,
        monthlyData.vos.length > 0 ? `Registered ${monthlyData.vos.length} variation orders.` : '',
        monthlyData.ipcs.length > 0 ? `Submitted ${monthlyData.ipcs.length} progress invoices.` : '',
        monthlyData.claims.length > 0 ? `Processed ${monthlyData.claims.length} technical extensions.` : '',
      ].filter(Boolean).join('\n');

      setCustomKeyAchievements(defaultAchievements);
      setBottlenecks('No immediate critical blockers flagged in site registers.');
      setPmoExecutiveSummary('PMO Review complete. Works progressing in alignment with WBS targets.');
    }
  }, [monthlyData, selectedSnapshotToView]);

  // 5. Freeze & Save Snapshot
  const handleSaveSnapshotTrigger = async () => {
    const snapshot: ProjectSPR = {
      id: `spr-${Date.now()}`,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: {
        createdBy: 'User',
        createdAt: new Date().toISOString()
      },
      projectId: project.id,
      reportingMonth: selectedMonth,
      overallProgressPercentage: overallProgress,
      scheduleVariance: scheduleVariance,
      costVariance: costVariance,
      keyAchievements: customKeyAchievements,
      bottlenecksAndRisks: bottlenecks,
      pmoSummary: pmoExecutiveSummary,
      status: 'Submitted'
    };
    await onSaveSnapshot(snapshot);
  };

  // 6. CSV Export
  const handleExportCSV = () => {
    const csvContent = [
      ['Monthly PMO Performance Report (SPR)', `Project: ${project.nameEn}`],
      ['Reporting Month', selectedMonth],
      [],
      ['Performance Metrics', 'Value'],
      ['Overall Progress Percentage', `${overallProgress}%`],
      ['Schedule Variance (SV %)', `${scheduleVariance}%`],
      ['Cost Variance (CV %)', `${costVariance}%`],
      [],
      ['Financial Accumulations', `Currency: ${project.currency}`],
      ['Total IPCs Submitted This Month', monthlyData.metrics.totalSubmittedIpcVal],
      ['Total IPCs Certified This Month', monthlyData.metrics.totalCertifiedIpcVal],
      ['Total Claims Registered This Month', monthlyData.metrics.totalSubmittedClaimVal],
      ['Total Claims Approved This Month', monthlyData.metrics.totalApprovedClaimVal],
      ['Approved Variation Orders Value', monthlyData.metrics.totalApprovedVoVal],
      [],
      ['Meetings Count', monthlyData.meetings.length],
      ['Documents Count', monthlyData.docs.length],
      [],
      ['Key Achievements & Milestones', customKeyAchievements.replace(/\n/g, ' | ')],
      ['Active Risks & Bottlenecks', bottlenecks.replace(/\n/g, ' | ')],
      ['PMO Executive Summary', pmoExecutiveSummary.replace(/\n/g, ' | ')]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SPR-Report-${project.code}-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format currency helpers
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Parameters Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-brand-red shrink-0" />
            <div>
              <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-wider">
                {isAr ? 'محرك التقارير الشهرية المركزي' : 'Corporate Monthly SPR Engine'}
              </h4>
              <p className="text-[10px] text-slate-400">
                {isAr ? 'يقوم المحرك آلياً بقراءة وتجميع كافة الأنشطة والمستخلصات والمطالبات المرتبطة بالشهر المحدد.' : 'Pulls transactional data live from Meetings, Claims, Variations, Subcontracts, & Documents.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedSnapshotToView(null);
                }} 
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 font-bold outline-none"
              />
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Download CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">{isAr ? 'تصدير إكسل' : 'Export CSV'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Print PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{isAr ? 'طباعة التقرير' : 'Print PDF'}</span>
            </button>

            {!selectedSnapshotToView && (
              <button
                onClick={handleSaveSnapshotTrigger}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                title="Freeze & Lock Archive"
              >
                <Save className="w-4 h-4" />
                <span>{isAr ? 'حفظ لقطة أرشيفية' : 'Save Snapshot'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Snapshot / Comparison Bar */}
        {savedSnapshots.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'المقارنات التاريخية والأرشيف:' : 'Historical Snapshots (Lock comparison):'}</span>
            {savedSnapshots.map(snap => (
              <button
                key={snap.id}
                onClick={() => setSelectedSnapshotToView(selectedSnapshotToView?.id === snap.id ? null : snap)}
                className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                  selectedSnapshotToView?.id === snap.id
                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-850 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                {snap.reportingMonth} {selectedSnapshotToView?.id === snap.id ? '• Active View' : '• Read Snapshot'}
              </button>
            ))}
            {selectedSnapshotToView && (
              <button 
                onClick={() => setSelectedSnapshotToView(null)}
                className="text-[9px] font-bold text-rose-500 hover:underline"
              >
                {isAr ? 'العودة للبث المباشر' : 'Reset to Live'}
              </button>
            )}
          </div>
        )}
      </div>

      {selectedSnapshotToView && (
        <div className="p-3 bg-blue-50/50 border border-blue-100 dark:bg-blue-950/10 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-xl flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          <span>
            {isAr 
              ? 'تنبيه: أنت تستعرض الآن نسخة أرشيفية مجمدة وتاريخية لتقرير الشهر المحدد. البيانات محمية من التعديل.' 
              : 'Audit Notice: You are viewing a frozen, immutable historical archive. Live modifications are blocked.'}
          </span>
        </div>
      )}

      {/* Main Grid with Computed Facts and Editorial Commentary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2-Span): Generated Sections from other Modules */}
        <div className="lg:col-span-2 space-y-6 print-container">
          
          {/* Section 1: Financial Accumulation Aggregates */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h5 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand-red" />
              <span>{isAr ? 'التحليلات والمجاميع المالية المكتشفة' : 'Auto-Computed Financial Dashboard'}</span>
            </h5>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">{isAr ? 'قيمة المستخلصات المقدمة' : 'Gross IPC Invoiced'}</span>
                <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">{formatMoney(monthlyData.metrics.totalSubmittedIpcVal)}</p>
                <span className="text-[8px] text-slate-400 font-sans block mt-0.5">Based on {monthlyData.ipcs.length} records</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">{isAr ? 'المطالبات المعتمدة المضافة' : 'Claims Approved Value'}</span>
                <p className="font-mono font-bold text-sm text-emerald-600 mt-1">{formatMoney(monthlyData.metrics.totalApprovedClaimVal)}</p>
                <span className="text-[8px] text-slate-400 font-sans block mt-0.5">{monthlyData.claims.length} technical claims</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 col-span-2 sm:col-span-1">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">{isAr ? 'الأوامر التغييرية المعتمدة' : 'Approved VOs'}</span>
                <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">{formatMoney(monthlyData.metrics.totalApprovedVoVal)}</p>
                <span className="text-[8px] text-slate-400 font-sans block mt-0.5">{monthlyData.vos.length} variation items</span>
              </div>
            </div>

            {/* Cumulative Project Baseline & Commitments */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <h6 className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                {isAr ? 'الملخص التراكمي وإسناد العقود للمشروع' : 'Cumulative Project Commitments & IPC Status'}
              </h6>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">{isAr ? 'إجمالي الدفعات المعتمدة' : 'Total IPC Certified (To Date)'}</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(monthlyData.metrics.cumCertifiedIpcVal)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">{isAr ? 'الدفعات المدفوعة للمقاول' : 'Total Paid IPC (To Date)'}</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(monthlyData.metrics.cumPaidIpcVal)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">{isAr ? 'إجمالي المبالغ المستحقة' : 'Total IPC Outstanding'}</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(monthlyData.metrics.cumOutstandingIpcVal)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">{isAr ? 'إسناد عقود مقاولي الباطن' : 'Subcontract Committed'}</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(monthlyData.metrics.totalSubcontractsCommitted)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-slate-55/40 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850 flex justify-between items-center">
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase font-bold">{isAr ? 'نسبة إسناد مقاولي الباطن' : 'Subcontracts Financial Progress'}</span>
                    <p className="font-mono font-extrabold text-[10px] text-slate-700 dark:text-slate-300 mt-0.5">
                      {formatMoney(monthlyData.metrics.totalSubcontractsInvoiced)} / {formatMoney(monthlyData.metrics.totalSubcontractsCommitted)}
                    </p>
                  </div>
                  <span className="font-mono font-black text-xs text-brand-red">
                    {monthlyData.metrics.totalSubcontractsCommitted > 0 
                      ? `${Math.round((monthlyData.metrics.totalSubcontractsInvoiced / monthlyData.metrics.totalSubcontractsCommitted) * 100)}%` 
                      : '0%'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-55/40 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850 flex justify-between items-center">
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase font-bold">{isAr ? 'تحديثات المطالبات والأوامر التغييرية' : 'Claims & Variation Status'}</span>
                    <p className="font-mono font-extrabold text-[10px] text-slate-700 dark:text-slate-300 mt-0.5">
                      {isAr ? 'مطالبات مالية معتمدة: ' : 'Claims Approved Sum: '} {formatMoney(monthlyData.metrics.totalClaimsApprovedCost)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[9px] text-slate-500">
                    {monthlyData.metrics.totalClaimsApprovedEot} {isAr ? 'يوم EOT' : 'EOT Days'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Meetings & Communications Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h5 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-red" />
              <span>{isAr ? 'اجتماعات التنسيق والضبط المكتشفة' : 'Active Coordination Registers'}</span>
            </h5>

            {monthlyData.meetings.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {monthlyData.meetings.map(m => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">{isAr && m.titleAr ? m.titleAr : m.title}</span>
                      <span className="text-[9px] text-slate-400 font-sans">{m.date} | {m.startTime} - {m.endTime}</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 border rounded-full capitalize font-sans">{m.meetingType}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-6 text-xs italic">
                {isAr ? 'لم يثبت عقد اجتماعات خلال الشهر المحدد.' : 'No meetings registered for this specific calendar month.'}
              </div>
            )}
          </div>

          {/* Section 3: Document Control and Government NOC */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h5 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-red" />
              <span>{isAr ? 'المراسلات والخطابات المسجلة' : 'Document Control Transmittals'}</span>
            </h5>

            {monthlyData.docs.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {monthlyData.docs.map(doc => (
                  <div key={doc.id} className="py-2 flex items-center justify-between text-xs font-mono">
                    <div className="truncate pr-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">{isAr && doc.titleAr ? doc.titleAr : doc.titleEn}</span>
                      <span className="text-[9px] text-slate-400 font-sans">Sender: {doc.sender} • Recipient: {doc.recipient}</span>
                    </div>
                    <span className="text-[9px] text-brand-red font-bold font-sans bg-slate-50 px-1.5 py-0.5 rounded border shrink-0">{doc.code || 'N/A'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-6 text-xs italic">
                {isAr ? 'لا توجد مستندات واردة أو صادرة مسجلة لهذا الشهر.' : 'No transmittals recorded in this month.'}
              </div>
            )}
          </div>

          {/* Section 3.5: Government Permitting & NOC Integrity */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h5 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-red" />
              <span>{isAr ? 'تصاريح الممانعة والتراخيص الحكومية (NOC)' : 'Government Permitting & NOC Integrity'}</span>
            </h5>
            <div className="grid grid-cols-3 gap-3 text-xs text-center font-mono">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="text-[8px] text-slate-400 block font-sans font-bold uppercase">{isAr ? 'ساري وصالح' : 'Active NOCs'}</span>
                <p className="font-black text-emerald-600 mt-1 text-sm">{monthlyData.metrics.activeNocs}</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="text-[8px] text-slate-400 block font-sans font-bold uppercase">{isAr ? 'منتهي الصلاحية' : 'Expired NOCs'}</span>
                <p className={`font-black mt-1 text-sm ${monthlyData.metrics.expiredNocs > 0 ? 'text-rose-600' : 'text-slate-500'}`}>{monthlyData.metrics.expiredNocs}</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="text-[8px] text-slate-400 block font-sans font-bold uppercase">{isAr ? 'ينتهي قريباً' : 'Expiring Soon'}</span>
                <p className={`font-black mt-1 text-sm ${monthlyData.metrics.expiringSoonNocs > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{monthlyData.metrics.expiringSoonNocs}</p>
              </div>
            </div>
            {(monthlyData.metrics.expiredNocs > 0 || monthlyData.metrics.expiringSoonNocs > 0) && (
              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold font-sans">
                {monthlyData.metrics.expiredNocs > 0
                  ? (isAr ? '⚠️ تنبيه: توجد تصاريح ممانعة حكومية منتهية الصلاحية تتطلب التجديد الفوري.' : '⚠️ Warning: Expired NOC permits detected! Renewal required.')
                  : (isAr ? '⚠️ تنبيه: توجد تصاريح ممانعة ستنتهي صلاحيتها قريباً.' : '⚠️ Notice: Active NOC permits expiring soon.')
                }
              </p>
            )}
          </div>

        </div>

        {/* Right Column (1-Span): Editorial adjustable inputs */}
        <div className="space-y-6">
          
          {/* Section 4: Performance Indicators Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h5 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-red" />
              <span>{isAr ? 'مؤشرات الأداء المستهدفة' : 'Performance Variables'}</span>
            </h5>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الإنجاز الفعلي التراكمي (%)' : 'Overall Progress %'}</label>
                <input 
                  type="number" 
                  min={0} 
                  max={100} 
                  value={overallProgress} 
                  onChange={(e) => setOverallProgress(Number(e.target.value))}
                  disabled={!!selectedSnapshotToView}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-brand-red text-slate-800 dark:text-slate-100 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'التباين الزمني (SV %)' : 'Schedule Var %'}</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={scheduleVariance} 
                    onChange={(e) => setScheduleVariance(Number(e.target.value))}
                    disabled={!!selectedSnapshotToView}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-brand-red text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'التباين المالي (CV %)' : 'Cost Var %'}</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={costVariance} 
                    onChange={(e) => setCostVariance(Number(e.target.value))}
                    disabled={!!selectedSnapshotToView}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-brand-red text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Editorial commentary inputs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h5 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-red" />
              <span>{isAr ? 'شروح وتعليقات الإدارة التنفيذية' : 'Bilingual Executive Commentary'}</span>
            </h5>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الملخص والتوصيات العامة' : 'PMO Executive Brief *'}</label>
                <textarea 
                  rows={3} 
                  value={pmoExecutiveSummary}
                  onChange={(e) => setPmoExecutiveSummary(e.target.value)}
                  disabled={!!selectedSnapshotToView}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-brand-red text-slate-700 dark:text-slate-300 font-sans"
                  placeholder="Completed executive project milestone overview for corporate board."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'أبرز الإنجازات المحققة' : 'Achievements Summary *'}</label>
                <textarea 
                  rows={3} 
                  value={customKeyAchievements}
                  onChange={(e) => setCustomKeyAchievements(e.target.value)}
                  disabled={!!selectedSnapshotToView}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-brand-red text-slate-700 dark:text-slate-300 font-mono"
                  placeholder="Bullet lists of specific tasks met this month."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المخاطر والتحديات' : 'Critical Risks & Blocks'}</label>
                <textarea 
                  rows={2} 
                  value={bottlenecks}
                  onChange={(e) => setBottlenecks(e.target.value)}
                  disabled={!!selectedSnapshotToView}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-brand-red text-slate-700 dark:text-slate-300 font-sans"
                  placeholder="E.g. pending local authority approval on utility line crossing."
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
