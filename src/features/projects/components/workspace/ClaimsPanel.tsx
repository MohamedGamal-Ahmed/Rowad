import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Save, Edit3, Archive, RotateCcw, AlertTriangle, Calendar, 
  DollarSign, FileText, CheckCircle, X, Users, MessageSquare 
} from 'lucide-react';
import { ProjectClaim, ClaimNegotiation, ClaimStatus } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';
import { RecordStatus } from '../../../../enums/RecordStatus';
import { ClaimLifecycleValidator } from '../../../../business-rules/ClaimLifecycleValidator';

interface ClaimsPanelProps {
  lang: 'ar' | 'en';
  projectId: string;
  projectCode: string;
  isProjectArchived: boolean;
  onRefresh?: () => void;
}

export function ClaimsPanel({
  lang,
  projectId,
  projectCode,
  isProjectArchived,
  onRefresh
}: ClaimsPanelProps) {
  const isAr = lang === 'ar';
  const lookupService = ProjectLookupService.getInstance();

  const [claims, setClaims] = useState<ProjectClaim[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingClaim, setEditingClaim] = useState<ProjectClaim | null>(null);

  // Form Fields
  const [claimNumber, setClaimNumber] = useState('');
  const [claimType, setClaimType] = useState('EOT');
  const [submissionDate, setSubmissionDate] = useState('');
  const [requestedDays, setRequestedDays] = useState(0);
  const [approvedDays, setApprovedDays] = useState(0);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [invoicedAmount, setInvoicedAmount] = useState(0);
  const [status, setStatus] = useState<ClaimStatus>('Prepared');
  const [notes, setNotes] = useState('');

  // Child Entity list: Claim Negotiations
  const [negotiations, setNegotiations] = useState<ClaimNegotiation[]>([]);
  const [showNegForm, setShowNegForm] = useState(false);

  // New Negotiation Form Fields
  const [negDate, setNegDate] = useState('');
  const [negAmount, setNegAmount] = useState(0);
  const [negDays, setNegDays] = useState(0);
  const [negBy, setNegBy] = useState('');
  const [negSummary, setNegSummary] = useState('');
  const [negStatus, setNegStatus] = useState('Negotiation');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived'>('Active');
  const [searchQuery, setSearchQuery] = useState('');

  const reloadClaims = async () => {
    const list = await lookupService.getClaims(projectId);
    setClaims(list);
  };

  useEffect(() => {
    reloadClaims();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimNumber.trim()) return;

    if (isProjectArchived) {
      window.alert(isAr ? 'لا يمكن تعديل السجلات لأن المشروع مؤرشف حالياً.' : 'Cannot save changes because the project is currently archived.');
      return;
    }

    // State machine validator check for edit transitions
    if (editingClaim && editingClaim.status !== status) {
      const allowed = ClaimLifecycleValidator.isTransitionAllowed(editingClaim.status, status);
      if (!allowed) {
        window.alert(isAr 
          ? `انتقال غير مسموح به للحالة من: ${editingClaim.status} إلى ${status}` 
          : `Illegal transition blocked from state: ${editingClaim.status} to ${status}`
        );
        return;
      }
    }

    const targetId = editingClaim ? editingClaim.id : `clm-${Date.now()}`;
    const auditInfo = editingClaim ? editingClaim.auditInfo : {
      createdBy: 'User',
      createdAt: new Date().toISOString()
    };

    const claimRecord: ProjectClaim = {
      id: targetId,
      recordStatus: editingClaim ? editingClaim.recordStatus : RecordStatus.ACTIVE,
      auditInfo,
      projectId,
      claimNumber: claimNumber.trim(),
      claimType,
      submissionDate: submissionDate || new Date().toISOString().substring(0, 10),
      requestedCompletionExtensionDays: requestedDays,
      approvedCompletionExtensionDays: approvedDays,
      additionalClaimedAmount: claimedAmount,
      approvedAmount,
      invoicedAmount,
      status,
      notes,
      negotiations // Bind child negotiations
    };

    const success = await lookupService.saveClaim(claimRecord);
    if (success) {
      await lookupService.addHistory(
        projectId,
        editingClaim ? 'Claim Details Updated' : 'Claim Filed',
        'User',
        `Claim: ${claimNumber}, Status: ${status}`,
        'Claim',
        targetId
      );
      setShowForm(false);
      resetForm();
      reloadClaims();
      if (onRefresh) onRefresh();
    }
  };

  const handleAddNeg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!negSummary.trim()) return;

    const newNeg: ClaimNegotiation = {
      id: `neg-${Date.now()}`,
      claimId: editingClaim?.id || '',
      negotiationDate: negDate || new Date().toISOString().substring(0, 10),
      proposalAmount: negAmount,
      eotDaysProposed: negDays,
      negotiatedBy: negBy.trim() || 'Contracts Director',
      summary: negSummary.trim(),
      statusAtStep: negStatus
    };

    setNegotiations([...negotiations, newNeg]);
    setShowNegForm(false);
    resetNegForm();
  };

  const removeNeg = (id: string) => {
    setNegotiations(negotiations.filter(n => n.id !== id));
  };

  const startCreate = () => {
    if (isProjectArchived) {
      window.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    resetForm();
    setFormMode('create');
    setShowForm(true);
  };

  const startEdit = (claim: ProjectClaim) => {
    if (isProjectArchived) {
      window.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    loadClaimIntoForm(claim);
    setFormMode('edit');
    setShowForm(true);
  };

  const startView = (claim: ProjectClaim) => {
    loadClaimIntoForm(claim);
    setFormMode('view');
    setShowForm(true);
  };

  const loadClaimIntoForm = (claim: ProjectClaim) => {
    setEditingClaim(claim);
    setClaimNumber(claim.claimNumber);
    setClaimType(claim.claimType);
    setSubmissionDate(claim.submissionDate);
    setRequestedDays(claim.requestedCompletionExtensionDays);
    setApprovedDays(claim.approvedCompletionExtensionDays || 0);
    setClaimedAmount(claim.additionalClaimedAmount);
    setApprovedAmount(claim.approvedAmount || 0);
    setInvoicedAmount(claim.invoicedAmount || 0);
    setStatus(claim.status);
    setNotes(claim.notes || '');
    setNegotiations(claim.negotiations || []);
  };

  const resetForm = () => {
    setEditingClaim(null);
    setClaimNumber('');
    setClaimType('EOT');
    setSubmissionDate(new Date().toISOString().substring(0, 10));
    setRequestedDays(0);
    setApprovedDays(0);
    setClaimedAmount(0);
    setApprovedAmount(0);
    setInvoicedAmount(0);
    setStatus('Prepared');
    setNotes('');
    setNegotiations([]);
    setShowNegForm(false);
  };

  const resetNegForm = () => {
    setNegDate(new Date().toISOString().substring(0, 10));
    setNegAmount(0);
    setNegDays(0);
    setNegBy('');
    setNegSummary('');
    setNegStatus('Negotiation');
  };

  const handleArchive = async (claim: ProjectClaim) => {
    if (isProjectArchived) return;

    // Restrict archive rule: Block if status is in active Negotiation
    if (claim.status === 'Negotiation') {
      window.alert(isAr ? 'لا يمكن أرشفة مطالبة قيد التفاوض والمراجعة النشطة.' : 'Cannot archive a claim while it is actively in negotiation.');
      return;
    }

    const reason = window.prompt(isAr ? 'أدخل سبب أرشفة المطالبة (إلزامي):' : 'Enter Claim archive reason (mandatory):');
    if (!reason || !reason.trim()) {
      window.alert(isAr ? 'السبب مطلوب لإتمام العملية.' : 'Archive reason is required.');
      return;
    }

    const updated: ProjectClaim = {
      ...claim,
      recordStatus: RecordStatus.ARCHIVED,
      archiveInfo: {
        archivedBy: 'User',
        archivedAt: new Date().toISOString(),
        archiveReason: reason.trim()
      }
    };

    const success = await lookupService.saveClaim(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'Claim Archived',
        'User',
        `Archived claim: ${claim.claimNumber}. Reason: ${reason}`
      );
      reloadClaims();
      if (onRefresh) onRefresh();
    }
  };

  const handleRestore = async (claim: ProjectClaim) => {
    if (isProjectArchived) {
      window.alert(isAr ? 'لا يمكن استعادة السجل لأن المشروع الأب مؤرشف.' : 'Cannot restore Claim because the parent project is archived.');
      return;
    }

    const updated: ProjectClaim = {
      ...claim,
      recordStatus: RecordStatus.ACTIVE,
      archiveInfo: undefined
    };

    const success = await lookupService.saveClaim(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'Claim Restored',
        'User',
        `Restored claim: ${claim.claimNumber}`
      );
      reloadClaims();
      if (onRefresh) onRefresh();
    }
  };

  // State machine transition helper for dropdown options
  const dropdownStates = useMemo(() => {
    if (formMode === 'create') {
      return ['Prepared'];
    }
    if (editingClaim) {
      return ClaimLifecycleValidator.getAllowedNextStates(editingClaim.status);
    }
    return ['Prepared'];
  }, [formMode, editingClaim]);

  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchStatus = statusFilter === 'Archived' 
        ? c.recordStatus === RecordStatus.ARCHIVED 
        : c.recordStatus !== RecordStatus.ARCHIVED;
      
      const q = searchQuery.toLowerCase();
      const matchQuery = !searchQuery.trim() || c.claimNumber.toLowerCase().includes(q);
      
      return matchStatus && matchQuery;
    });
  }, [claims, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 text-xs">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-brand-navy dark:text-slate-100 uppercase">
            {isAr ? 'المطالبات الفنية والزمنية والمالية' : 'Contractual Claims'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isAr ? 'إصدار طلبات التمديد الزمني (EOT) والتعويضات المالية ومتابعة مراحل التفاوض القانوني.' : 'Manage Extension of Time (EOT) claims, cost impact adjustments, and legal consensus steps.'}
          </p>
        </div>

        {!showForm && !isProjectArchived && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تقديم مطالبة جديدة' : 'File Claim'}</span>
          </button>
        )}
      </div>

      {/* Form View */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-6">
          <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase border-b pb-2">
            {formMode === 'view' ? (isAr ? 'عرض تفاصيل المطالبة' : 'View Claim details') :
             formMode === 'edit' ? (isAr ? 'تعديل بيانات المطالبة' : 'Edit Claim Record') : 
             (isAr ? 'تقديم مطالبة جديدة في المشروع' : 'New Contractual Claim')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رقم المطالبة العقدية *' : 'Claim Number *'}</label>
              <input
                type="text"
                required
                disabled={formMode === 'view'}
                value={claimNumber}
                onChange={e => setClaimNumber(e.target.value)}
                placeholder="e.g. CLM-NEOM-01"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'نوع المطالبة' : 'Claim Type'}</label>
              <select
                disabled={formMode === 'view'}
                value={claimType}
                onChange={e => setClaimType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="EOT">Extension of Time (EOT)</option>
                <option value="Cost">Financial Compensation</option>
                <option value="Combined">Combined (EOT & Cost)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المرحلة / حالة المطالبة' : 'Claim Status'}</label>
              <select
                disabled={formMode === 'view' || dropdownStates.length <= 1}
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                {/* State Machine drop options */}
                {dropdownStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
                {/* Fallback if current state is terminal to allow loading it */}
                {!dropdownStates.includes(status) && <option value={status}>{status}</option>}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ التقديم المعتمد' : 'Submission Date'}</label>
              <input
                type="date"
                required
                disabled={formMode === 'view'}
                value={submissionDate}
                onChange={e => setSubmissionDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'عدد الأيام المطلوبة للتمديد' : 'Requested Extension (Days)'}</label>
              <input
                type="number"
                disabled={formMode === 'view'}
                value={requestedDays || ''}
                onChange={e => setRequestedDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'عدد الأيام المعتمدة فعلياً' : 'Approved Extension (Days)'}</label>
              <input
                type="number"
                disabled={formMode === 'view'}
                value={approvedDays || ''}
                onChange={e => setApprovedDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'قيمة التعويض المالي المطالب بها' : 'Claimed Amount'}</label>
              <input
                type="number"
                disabled={formMode === 'view'}
                value={claimedAmount || ''}
                onChange={e => setClaimedAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'القيمة المعتمدة للتسوية' : 'Approved Amount'}</label>
              <input
                type="number"
                disabled={formMode === 'view'}
                value={approvedAmount || ''}
                onChange={e => setApprovedAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المبالغ المفوترة فعلياً' : 'Invoiced Amount'}</label>
              <input
                type="number"
                disabled={formMode === 'view'}
                value={invoicedAmount || ''}
                onChange={e => setInvoicedAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

          </div>

          {/* Negotiations Child Business Entity list */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-150">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-[10px] font-black text-brand-navy dark:text-slate-100 uppercase flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-red" />
                <span>{isAr ? 'سجل جلسات التفاوض والمراسلات القانونية' : 'Claim Negotiation History'}</span>
              </span>
              
              {formMode !== 'view' && !showNegForm && (
                <button
                  type="button"
                  onClick={() => { resetNegForm(); setShowNegForm(true); }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-bold text-[10px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تسجيل جلسة تفاوض' : 'Record Negotiation'}</span>
                </button>
              )}
            </div>

            {/* Negotiation Subform */}
            {showNegForm && (
              <div className="bg-white dark:bg-slate-900 border border-rose-100 p-4 rounded-xl space-y-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ الجلسة *' : 'Negotiation Date *'}</label>
                  <input
                    type="date"
                    required
                    value={negDate}
                    onChange={e => setNegDate(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'المبلغ المقترح للتسوية' : 'Proposed Amount'}</label>
                  <input
                    type="number"
                    value={negAmount || ''}
                    onChange={e => setNegAmount(Number(e.target.value))}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'التمديد الزمني المقترح (أيام)' : 'Proposed EOT Days'}</label>
                  <input
                    type="number"
                    value={negDays || ''}
                    onChange={e => setNegDays(Number(e.target.value))}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'المفاوض الممثل' : 'Negotiated By'}</label>
                  <input
                    type="text"
                    value={negBy}
                    onChange={e => setNegBy(e.target.value)}
                    placeholder="e.g. Commercial Director"
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'حالة المطالبة في هذه الخطوة' : 'Status at Step'}</label>
                  <select
                    value={negStatus}
                    onChange={e => setNegStatus(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  >
                    <option value="Negotiation">Negotiation</option>
                    <option value="Counter Proposal">Counter Proposal</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-0.5 sm:col-span-3">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'خلاصة ما تم التوصل إليه *' : 'Negotiation Summary *'}</label>
                  <textarea
                    required
                    rows={2}
                    value={negSummary}
                    onChange={e => setNegSummary(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="flex justify-end items-end gap-2 sm:col-span-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNegForm(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNeg}
                    className="px-4 py-1.5 bg-brand-navy hover:bg-brand-navy/95 text-white rounded text-xs font-bold"
                  >
                    {isAr ? 'إضافة الجلسة' : 'Record'}
                  </button>
                </div>
              </div>
            )}

            {/* List of Negotiations */}
            <div className="space-y-2">
              {negotiations.map((neg, idx) => (
                <div key={neg.id || idx} className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-150 flex flex-col justify-between gap-2 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[9px] text-slate-600">
                      By: {neg.negotiatedBy}
                    </span>
                    <span className="font-mono text-slate-400 font-bold text-[10px]">
                      {neg.negotiationDate}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-700 dark:text-slate-300">{neg.summary}</p>

                  <div className="flex justify-between items-center pt-2 border-t text-[10px] text-slate-450 font-sans">
                    <div className="flex gap-3">
                      {neg.proposalAmount > 0 && <span>Proposed: <span className="font-mono text-slate-700 font-bold">{neg.proposalAmount.toLocaleString()} EGP</span></span>}
                      {neg.eotDaysProposed > 0 && <span>EOT proposed: <span className="font-mono text-slate-700 font-bold">{neg.eotDaysProposed} Days</span></span>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold">
                        {neg.statusAtStep}
                      </span>
                      {formMode !== 'view' && (
                        <button
                          type="button"
                          onClick={() => removeNeg(neg.id)}
                          className="text-brand-red p-0.5 hover:bg-red-50 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {negotiations.length === 0 && (
                <span className="text-[10px] text-slate-450 italic block">{isAr ? 'لا توجد جلسات تفاوض مسجلة.' : 'No recorded negotiation history.'}</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'ملاحظات وتفاصيل الدعم للمطالبة' : 'Support Claims & Remarks'}</label>
            <textarea
              rows={3}
              disabled={formMode === 'view'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isAr ? 'اكتب تبريرات المطالبة والمخاطر هنا...' : 'Provide details of delay events and contract clauses...'}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
            >
              {formMode === 'view' ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'إلغاء' : 'Cancel')}
            </button>
            {formMode !== 'view' && (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold rounded-xl cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{formMode === 'edit' ? (isAr ? 'حفظ التغييرات' : 'Save Changes') : (isAr ? 'حفظ المطالبة' : 'Save Claim')}</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* Grid List View */}
      {!showForm && (
        <div className="space-y-3">
          {/* List Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'البحث برقم المطالبة...' : 'Search by Claim number...'}
              className="w-full sm:w-80 p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg"
            />
            
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{isAr ? 'تصفية الحالة:' : 'Filter:'}</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="border rounded p-1 bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none"
              >
                <option value="Active">{isAr ? 'النشطة' : 'Active Claims'}</option>
                <option value="Archived">{isAr ? 'المؤرشفة' : 'Archived'}</option>
              </select>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => (
                <div key={claim.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4 hover:border-slate-250 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[9px] text-slate-500">
                        Type: {claim.claimType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                        claim.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100/50' :
                        claim.status === 'Disputed' ? 'bg-purple-50 text-purple-650 border border-purple-100/50' :
                        'bg-slate-50 text-slate-500 border border-slate-200/50'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-[13px] hover:text-brand-red cursor-pointer transition-colors" onClick={() => startView(claim)}>
                        {claim.claimNumber}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500 font-semibold font-sans pt-2 border-t">
                        <span>Claimed Amt: <span className="font-mono text-slate-850 font-bold">{claim.additionalClaimedAmount.toLocaleString()} EGP</span></span>
                        <span>Approved Amt: <span className="font-mono text-emerald-600 font-bold">{(claim.approvedAmount || 0).toLocaleString()} EGP</span></span>
                        <span>EOT Days Claimed: <span className="font-mono text-slate-850 font-bold">{claim.requestedCompletionExtensionDays} Days</span></span>
                        <span>Approved EOT: <span className="font-mono text-emerald-600 font-bold">{claim.approvedCompletionExtensionDays || 0} Days</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-850">
                    <button
                      onClick={() => startView(claim)}
                      className="text-brand-navy hover:text-brand-red font-extrabold text-[10px]"
                    >
                      {isAr ? 'مستندات المفاوضات ➔' : 'View Negotiation Docs ➔'}
                    </button>

                    {!isProjectArchived && (
                      <div className="flex items-center gap-1">
                        {claim.recordStatus === 'Archived' ? (
                          <button
                            onClick={() => handleRestore(claim)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-100 cursor-pointer"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(claim)}
                              className="p-1 text-slate-650 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleArchive(claim)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-100 cursor-pointer"
                              title="Archive"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200">
                <AlertTriangle className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                <p className="font-bold">{isAr ? 'لا توجد مطالبات تعاقدية مسجلة.' : 'No registered contractual claims found.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
