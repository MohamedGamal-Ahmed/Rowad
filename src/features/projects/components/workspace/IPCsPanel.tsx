import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Save, Edit3, Archive, RotateCcw, DollarSign, Calendar, 
  Tag, Layers, ArrowRight, Eye, CheckCircle2, AlertCircle, X, Banknote 
} from 'lucide-react';
import { ProjectIPC, Payment } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';
import { RecordStatus } from '../../../../enums/RecordStatus';
import { BiText } from '../../../../components/BiText';
import { CalculationService } from '../../../../services/CalculationService';
import { IpcValidator } from '../../../../validators/IpcValidator';
import { useDialog } from '../../../../components/ui/DialogProvider';

interface IPCsPanelProps {
  lang: 'ar' | 'en';
  projectId: string;
  projectCode: string;
  isProjectArchived: boolean;
  onRefresh?: () => void;
}

export function IPCsPanel({
  lang,
  projectId,
  projectCode,
  isProjectArchived,
  onRefresh
}: IPCsPanelProps) {
  const isAr = lang === 'ar';
  const lookupService = ProjectLookupService.getInstance();
  const dialog = useDialog();

  const [ipcs, setIpcs] = useState<ProjectIPC[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingIpc, setEditingIpc] = useState<ProjectIPC | null>(null);

  // Parent project and enterprise settings
  const [project, setProject] = useState<any>(null);
  const [financialSettings, setFinancialSettings] = useState<any>(null);

  // Form Fields
  const [ipcNumber, setIpcNumber] = useState('');
  const [invoiceGrossValue, setInvoiceGrossValue] = useState(0);
  const [invoiceNetValue, setInvoiceNetValue] = useState(0);
  const [status, setStatus] = useState('Draft');
  const [workTill, setWorkTill] = useState('');
  const [ipcSubmissionDate, setIpcSubmissionDate] = useState('');

  // Advanced Commercial IPC Engine Fields
  const [certifiedGrossValue, setCertifiedGrossValue] = useState(0);
  const [retentionDeduction, setRetentionDeduction] = useState(0);
  const [advanceRecovery, setAdvanceRecovery] = useState(0);
  const [withholdingTax, setWithholdingTax] = useState(0);
  const [netCertifiedAmount, setNetCertifiedAmount] = useState(0);
  const [previousIpcGrossCumulative, setPreviousIpcGrossCumulative] = useState(0);
  const [previousIpcNetCumulative, setPreviousIpcNetCumulative] = useState(0);
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  // Validation feedback state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [paymentFormError, setPaymentFormError] = useState<string>('');

  // Nested Payments state in memory before submit or managed locally
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // New Payment Form Fields
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Wire Transfer');
  const [payRef, setPayRef] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [bank, setBank] = useState('');
  const [payCurrency, setPayCurrency] = useState('EGP');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [payStatus, setPayStatus] = useState<'Pending' | 'Received' | 'Verified' | 'Rejected'>('Received');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived'>('Active');
  const [searchQuery, setSearchQuery] = useState('');

  const reloadIpcs = async () => {
    const list = await lookupService.getIPCs(projectId);
    setIpcs(list);
  };

  const loadProjectAndSettings = async () => {
    const projects = await lookupService.getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
    }
    
    const saved = localStorage.getItem('pmo_enterprise_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.financialSettings) {
          setFinancialSettings(parsed.financialSettings);
        }
      } catch (e) {}
    }
  };

  const runCalculations = (
    currentGrossCert: number,
    currentStatus: string,
    currentPayments: Payment[],
    latestIpcsList = ipcs
  ) => {
    const mockIpc: ProjectIPC = {
      id: editingIpc?.id || '',
      projectId,
      ipcNumber,
      workTill,
      ipcSubmissionDate,
      invoiceGrossValue,
      invoiceNetValue,
      certifiedGrossValue: currentGrossCert,
      status: currentStatus,
      payments: currentPayments,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: { createdBy: 'User', createdAt: '' }
    };

    const calcService = new CalculationService();
    const results = calcService.calculateIpcCommercials(
      mockIpc,
      latestIpcsList,
      financialSettings,
      project?.revisedContractValue ?? project?.signedContractValue ?? 0
    );

    setPreviousIpcGrossCumulative(results.previousGrossCumulative);
    setPreviousIpcNetCumulative(results.previousNetCumulative);
    setRetentionDeduction(results.retentionDeduction);
    setAdvanceRecovery(results.advanceRecovery);
    setWithholdingTax(results.withholdingTax);
    setNetCertifiedAmount(results.netCertifiedAmount);
    setTotalPaid(results.totalPaid);
    setOutstandingAmount(results.outstandingAmount);
    
    // Suggest status change only if in Certified/Paid/Partially Paid lifecycles
    if (currentStatus === 'Certified' || currentStatus === 'Paid' || currentStatus === 'Partially Paid') {
      setStatus(results.status);
    }
  };

  useEffect(() => {
    loadProjectAndSettings();
    reloadIpcs();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipcNumber.trim()) return;

    if (isProjectArchived) {
      await dialog.alert(isAr ? 'لا يمكن تعديل السجلات لأن المشروع مؤرشف حالياً.' : 'Cannot save changes because the project is currently archived.');
      return;
    }

    const targetId = editingIpc ? editingIpc.id : `ipc-${Date.now()}`;
    const auditInfo = editingIpc ? editingIpc.auditInfo : {
      createdBy: 'User',
      createdAt: new Date().toISOString()
    };

    const ipcRecord: ProjectIPC = {
      id: targetId,
      recordStatus: editingIpc ? editingIpc.recordStatus : RecordStatus.ACTIVE,
      auditInfo,
      projectId,
      ipcNumber: ipcNumber.trim(),
      invoiceGrossValue,
      invoiceNetValue,
      status,
      payments,
      workTill: workTill || new Date().toISOString().substring(0, 10),
      ipcSubmissionDate: ipcSubmissionDate || new Date().toISOString().substring(0, 10),

      // New Commercial Fields
      certifiedGrossValue,
      retentionDeduction,
      advanceRecovery,
      withholdingTax,
      netCertifiedAmount,
      previousIpcGrossCumulative,
      previousIpcNetCumulative
    };

    const validation = IpcValidator.validate(ipcRecord, ipcs);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    const success = await lookupService.saveIPC(ipcRecord);
    if (success) {
      await lookupService.addHistory(
        projectId,
        editingIpc ? 'IPC Details Updated' : 'IPC Registered',
        'User',
        `IPC: ${ipcNumber}, Net Value: ${invoiceNetValue}`,
        'IPC',
        targetId
      );
      setShowForm(false);
      resetForm();
      reloadIpcs();
      if (onRefresh) onRefresh();
    }
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentFormError('');
    if (payAmount <= 0) return;

    // Payment amount cannot push total collections beyond the IPC's Net Certified Amount.
    // An IPC that has not been certified yet (netCertifiedAmount = 0) cannot receive any payment.
    const remaining = Math.max(0, netCertifiedAmount - totalPaid);
    if (payAmount > remaining) {
      setPaymentFormError(
        isAr
          ? `قيمة الدفعة (${payAmount.toLocaleString()}) تتجاوز الرصيد المستحق المتبقي (${remaining.toLocaleString()}). لا يمكن أن يتجاوز إجمالي المحصل صافي المعتمد.`
          : `Payment amount (${payAmount.toLocaleString()}) exceeds the remaining certified balance (${remaining.toLocaleString()}). Total collected cannot exceed Net Certified Amount.`
      );
      return;
    }

    const newPay: Payment = {
      id: `pay-${Date.now()}`,
      ipcId: editingIpc?.id || '',
      paymentAmount: payAmount,
      paymentDate: payDate || new Date().toISOString().substring(0, 10),
      paymentMethod: payMethod,
      paymentReference: payRef.trim() || `TX-${Date.now().toString().slice(-6)}`,
      receiptNumber: receiptNumber.trim() || undefined,
      bank: bank.trim() || 'CIB Egypt',
      currency: payCurrency,
      exchangeRate: exchangeRate || 1,
      status: payStatus,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: {
        createdBy: 'User',
        createdAt: new Date().toISOString()
      }
    };

    const updated = [...payments, newPay];
    setPayments(updated);
    runCalculations(certifiedGrossValue, status, updated);
    setShowPaymentForm(false);
    resetPaymentForm();
  };

  const removePayment = (id: string) => {
    const updated = payments.filter(p => p.id !== id);
    setPayments(updated);
    runCalculations(certifiedGrossValue, status, updated);
  };

  const startCreate = async () => {
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    resetForm();
    setFormMode('create');
    setShowForm(true);
  };

  const startEdit = async (ipc: ProjectIPC) => {
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    loadIpcIntoForm(ipc);
    setFormMode('edit');
    setShowForm(true);
  };

  const startView = (ipc: ProjectIPC) => {
    loadIpcIntoForm(ipc);
    setFormMode('view');
    setShowForm(true);
  };

  const loadIpcIntoForm = (ipc: ProjectIPC) => {
    setEditingIpc(ipc);
    setIpcNumber(ipc.ipcNumber);
    setInvoiceGrossValue(ipc.invoiceGrossValue);
    setInvoiceNetValue(ipc.invoiceNetValue);
    setStatus(ipc.status);
    setPayments(ipc.payments || []);
    setWorkTill(ipc.workTill || '');
    setIpcSubmissionDate(ipc.ipcSubmissionDate || '');
    
    const cg = ipc.certifiedGrossValue ?? 0;
    setCertifiedGrossValue(cg);
    setRetentionDeduction(ipc.retentionDeduction ?? 0);
    setAdvanceRecovery(ipc.advanceRecovery ?? 0);
    setWithholdingTax(ipc.withholdingTax ?? 0);
    setNetCertifiedAmount(ipc.netCertifiedAmount ?? 0);
    setPreviousIpcGrossCumulative(ipc.previousIpcGrossCumulative ?? 0);
    setPreviousIpcNetCumulative(ipc.previousIpcNetCumulative ?? 0);
    setValidationErrors([]);

    runCalculations(cg, ipc.status, ipc.payments || []);
  };

  const resetForm = () => {
    setEditingIpc(null);
    setIpcNumber('');
    setInvoiceGrossValue(0);
    setInvoiceNetValue(0);
    setStatus('Draft');
    setPayments([]);
    setShowPaymentForm(false);
    setWorkTill('');
    setIpcSubmissionDate('');
    
    setCertifiedGrossValue(0);
    setRetentionDeduction(0);
    setAdvanceRecovery(0);
    setWithholdingTax(0);
    setNetCertifiedAmount(0);
    setPreviousIpcGrossCumulative(0);
    setPreviousIpcNetCumulative(0);
    setOutstandingAmount(0);
    setTotalPaid(0);
    setValidationErrors([]);
  };

  const resetPaymentForm = () => {
    setPaymentFormError('');
    setPayAmount(0);
    setPayDate(new Date().toISOString().substring(0, 10));
    setPayMethod('Bank Wire Transfer');
    setPayRef('');
    setReceiptNumber('');
    setBank('');
    setPayCurrency('EGP');
    setExchangeRate(1);
    setPayStatus('Received');
  };

  const handleArchive = async (ipc: ProjectIPC) => {
    if (isProjectArchived) return;
    
    // Restrict delete rule: Block archive if Status is Paid
    if (ipc.status === 'Paid') {
      await dialog.alert(isAr ? 'لا يمكن أرشفة مستخلص تم صرفه بالكامل.' : 'Cannot archive an IPC that is already fully paid.');
      return;
    }

    const reason = await dialog.promptText(
      isAr ? 'أدخل سبب أرشفة المستخلص (إلزامي):' : 'Enter IPC archive reason (mandatory):',
      { required: true, title: isAr ? 'أرشفة المستخلص' : 'Archive IPC' }
    );
    if (!reason || !reason.trim()) {
      return;
    }

    const updated: ProjectIPC = {
      ...ipc,
      recordStatus: RecordStatus.ARCHIVED,
      archiveInfo: {
        archivedBy: 'User',
        archivedAt: new Date().toISOString(),
        archiveReason: reason.trim()
      }
    };

    const success = await lookupService.saveIPC(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'IPC Archived',
        'User',
        `Archived IPC: ${ipc.ipcNumber}. Reason: ${reason}`
      );
      reloadIpcs();
      if (onRefresh) onRefresh();
    }
  };

  const handleRestore = async (ipc: ProjectIPC) => {
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'لا يمكن استعادة السجل لأن المشروع الأب مؤرشف.' : 'Cannot restore IPC because the parent project is archived.');
      return;
    }

    const updated: ProjectIPC = {
      ...ipc,
      recordStatus: RecordStatus.ACTIVE,
      archiveInfo: undefined
    };

    const success = await lookupService.saveIPC(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'IPC Restored',
        'User',
        `Restored IPC: ${ipc.ipcNumber}`
      );
      reloadIpcs();
      if (onRefresh) onRefresh();
    }
  };

  const filteredIpcs = useMemo(() => {
    return ipcs.filter(ipc => {
      const matchStatus = statusFilter === 'Archived' 
        ? ipc.recordStatus === RecordStatus.ARCHIVED 
        : ipc.recordStatus !== RecordStatus.ARCHIVED;
      
      const q = searchQuery.toLowerCase();
      const matchQuery = !searchQuery.trim() || ipc.ipcNumber.toLowerCase().includes(q);
      
      return matchStatus && matchQuery;
    });
  }, [ipcs, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 text-xs">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-brand-navy dark:text-slate-100 uppercase">
            {isAr ? 'المستخلصات المالية الجارية وقيد الدفع' : 'Interim Payment Certificates (IPC)'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isAr ? 'حساب الدفعات التراكمية، الخصميات، والضمان المحتجز ومتابعة التحصيل الفعلي من المالك.' : 'Track net values, performance withholding, and cash disbursements per certificate.'}
          </p>
        </div>

        {!showForm && !isProjectArchived && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إصدار مستخلص جديد' : 'Issue IPC'}</span>
          </button>
        )}
      </div>

      {/* Form View */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-6">
          <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase border-b pb-2">
            {formMode === 'view' ? (isAr ? 'عرض تفاصيل المستخلص' : 'View IPC details') :
             formMode === 'edit' ? (isAr ? 'تعديل بيانات المستخلص' : 'Edit IPC Certificate') : 
             (isAr ? 'إصدار مستخلص مالي جديد' : 'New IPC Certificate')}
          </h4>

          {validationErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl space-y-1">
              <span className="font-bold block">{isAr ? 'يرجى تصحيح الأخطاء التالية:' : 'Please correct the following errors:'}</span>
              <ul className="list-disc pl-5 space-y-0.5">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ الفترة لغاية *' : 'Work Period Till *'}</label>
              <input
                type="date"
                required
                disabled={formMode === 'view'}
                value={workTill}
                onChange={e => setWorkTill(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ تقديم المستخلص *' : 'IPC Submission Date *'}</label>
              <input
                type="date"
                required
                disabled={formMode === 'view'}
                value={ipcSubmissionDate}
                onChange={e => setIpcSubmissionDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رقم المستخلص المالي *' : 'IPC Number *'}</label>
              <input
                type="text"
                required
                disabled={formMode === 'view'}
                value={ipcNumber}
                onChange={e => setIpcNumber(e.target.value)}
                placeholder="e.g. IPC-01, IPC-02-REV"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الحالة الحالية للمستخلص' : 'IPC Status'}</label>
              <select
                disabled={formMode === 'view'}
                value={status}
                onChange={e => {
                  const s = e.target.value;
                  setStatus(s);
                  runCalculations(certifiedGrossValue, s, payments);
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="Draft">Draft (مسودة)</option>
                <option value="Submitted">Submitted (تم التقديم للمالك)</option>
                <option value="Certified">Certified (تم الاعتماد والاستحقاق)</option>
                <option value="Partially Paid">Partially Paid (دفع جزئي)</option>
                <option value="Paid">Paid / Settled (تم التحصيل والصرف)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'القيمة الإجمالية المطالب بها (Gross Value) *' : 'Invoice Gross Value *'}</label>
              <input
                type="number"
                required
                disabled={formMode === 'view'}
                value={invoiceGrossValue || ''}
                onChange={e => {
                  const gross = Number(e.target.value);
                  setInvoiceGrossValue(gross);
                  setInvoiceNetValue(Number((gross * 0.9).toFixed(2)));
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'صافي القيمة المستحقة (Net Value)' : 'Invoice Net Value'}</label>
              <input
                type="number"
                disabled={formMode === 'view'}
                value={invoiceNetValue || ''}
                onChange={e => setInvoiceNetValue(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none font-bold"
              />
            </div>

          </div>

          <div className="bg-slate-50 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-150 space-y-4">
              <h5 className="text-[10px] font-black text-brand-navy dark:text-slate-100 uppercase border-b pb-2">
                {isAr ? 'اعتماد الاستشاري والخصميات التجارية' : 'Consultant Certification & Deductions'}
              </h5>
              <p className="text-[10px] text-slate-400 -mt-2">
                {isAr
                  ? 'مطلوبة إلزاميًا فقط عند تغيير الحالة إلى معتمد / مدفوع جزئيًا / مدفوع.'
                  : 'Required only once status is set to Certified, Partially Paid or Paid.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    {isAr ? 'القيمة المعتمدة الإجمالية (Certified Gross)' : 'Certified Gross Value'}
                    {(status === 'Certified' || status === 'Paid' || status === 'Partially Paid') ? ' *' : ''}
                  </label>
                  <input
                    type="number"
                    disabled={formMode === 'view'}
                    value={certifiedGrossValue || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setCertifiedGrossValue(val);
                      runCalculations(val, status, payments);
                    }}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none font-bold animate-pulse-subtle"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'إجمالي المستخلص السابق (Gross Cumulative)' : 'Previous Gross Cumulative'}</label>
                  <input
                    type="number"
                    disabled
                    value={previousIpcGrossCumulative || 0}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'صافي المستخلص السابق (Net Cumulative)' : 'Previous Net Cumulative'}</label>
                  <input
                    type="number"
                    disabled
                    value={previousIpcNetCumulative || 0}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'خصم ضمان المحتجز (Retention)' : 'Retention Deduction'}</label>
                  <input
                    type="number"
                    disabled
                    value={retentionDeduction || 0}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'استرداد الدفعة المقدمة (Recovery)' : 'Advance Recovery'}</label>
                  <input
                    type="number"
                    disabled
                    value={advanceRecovery || 0}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'ضريبة الخصم والإضافة (Withholding Tax)' : 'Withholding Tax'}</label>
                  <input
                    type="number"
                    disabled
                    value={withholdingTax || 0}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'صافي المعتمد المستحق (Net Certified)' : 'Net Certified Amount'}</label>
                  <input
                    type="number"
                    disabled
                    value={netCertifiedAmount || 0}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-600 font-black font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'إجمالي المحصل الفعلي (Total Paid)' : 'Total Paid Amount'}</label>
                  <input
                    type="number"
                    disabled
                    value={totalPaid || 0}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg text-emerald-600 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الرصيد المتبقي المستحق (Outstanding)' : 'Outstanding Balance'}</label>
                  <input
                    type="number"
                    disabled
                    value={outstandingAmount || 0}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg text-red-600 font-extrabold font-mono"
                  />
                </div>
              </div>
            </div>

          {/* Child Panel: Cash Payments Collected */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-150">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-[10px] font-black text-brand-navy dark:text-slate-100 uppercase flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'دفعات الصرف والتحصيل الفعلي' : 'Cash Disbursements & Payments Log'}</span>
              </span>
              
              {formMode !== 'view' && !showPaymentForm && (
                <button
                  type="button"
                  onClick={() => { resetPaymentForm(); setShowPaymentForm(true); }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg font-bold text-[10px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تسجيل دفعة مستلمة' : 'Record Payment'}</span>
                </button>
              )}
            </div>

            {/* Inline Payment Creation Form */}
            {showPaymentForm && (
              <div className="bg-white dark:bg-slate-900 border border-emerald-100 p-4 rounded-xl space-y-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'قيمة الدفعة *' : 'Payment Amount *'}</label>
                  <input
                    type="number"
                    required
                    value={payAmount || ''}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ الاستلام' : 'Date Received'}</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'طريقة الدفع' : 'Payment Method'}</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  >
                    <option value="Bank Wire Transfer">Bank Wire Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Letter of Credit">Letter of Credit</option>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'كود التحويل / المرجع' : 'Transaction Ref *'}</label>
                  <input
                    type="text"
                    required
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    placeholder="e.g. TR-9521"
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'رقم الإيصال' : 'Receipt Number'}</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={e => setReceiptNumber(e.target.value)}
                    placeholder="e.g. REC-584"
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'البنك المستقبل' : 'Receiving Bank'}</label>
                  <input
                    type="text"
                    value={bank}
                    onChange={e => setBank(e.target.value)}
                    placeholder="e.g. HSBC Riyadh"
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'حالة الدفعة' : 'Payment Status'}</label>
                  <select
                    value={payStatus}
                    onChange={e => setPayStatus(e.target.value as any)}
                    className="w-full p-1.5 border rounded text-xs"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {paymentFormError && (
                  <div className="sm:col-span-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[10px] font-bold">
                    {paymentFormError}
                  </div>
                )}

                <div className="flex justify-end items-end gap-2 sm:col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowPaymentForm(false); setPaymentFormError(''); }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                  >
                    {isAr ? 'إضافة الدفعة' : 'Record'}
                  </button>
                </div>
              </div>
            )}

            {/* List of Payments */}
            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={p.id || idx} className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-slate-700 dark:text-slate-200">
                      Amount: <span className="text-emerald-600 font-mono">{(p.paymentAmount).toLocaleString()} {p.currency}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold font-sans">
                      Date: <span className="font-mono text-slate-650">{p.paymentDate}</span> | Ref: <span className="font-mono">{p.paymentReference}</span> | Bank: <span className="font-sans font-extrabold text-slate-600">{p.bank}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      p.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      p.status === 'Received' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      p.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {p.status}
                    </span>
                    {formMode !== 'view' && (
                      <button
                        type="button"
                        onClick={() => removePayment(p.id)}
                        className="text-brand-red p-1 hover:bg-red-50 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {payments.length === 0 && (
                <span className="text-[10px] text-slate-450 italic block">{isAr ? 'لا توجد دفعات محصلة بعد.' : 'No payment records received against this IPC.'}</span>
              )}
            </div>
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
                <span>{formMode === 'edit' ? (isAr ? 'حفظ التغييرات' : 'Save Changes') : (isAr ? 'حفظ المستخلص' : 'Save IPC')}</span>
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
              placeholder={isAr ? 'البحث بالرمز أو رقم المستخلص...' : 'Search by IPC number...'}
              className="w-full sm:w-80 p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg"
            />
            
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{isAr ? 'تصفية الحالة:' : 'Filter:'}</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="border rounded p-1 bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none"
              >
                <option value="Active">{isAr ? 'النشطة' : 'Active Certificates'}</option>
                <option value="Archived">{isAr ? 'المؤرشفة' : 'Archived'}</option>
              </select>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIpcs.length > 0 ? (
              filteredIpcs.map((ipc) => {
                const totalPaid = (ipc.payments || [])
                  .filter(p => p.recordStatus !== 'Archived' && p.status !== 'Rejected')
                  .reduce((sum, pay) => sum + pay.paymentAmount, 0);
                const currency = project?.currency || 'EGP';
                const isCertifiedStatus = ipc.status === 'Certified' || ipc.status === 'Paid' || ipc.status === 'Partially Paid';
                const outstanding = isCertifiedStatus ? Math.max(0, (ipc.netCertifiedAmount ?? 0) - totalPaid) : 0;
                
                return (
                  <div key={ipc.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4 hover:border-slate-250 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[9px]">
                          Invoice Gross: {(ipc.invoiceGrossValue).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          ipc.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                          ipc.status === 'Partially Paid' ? 'bg-amber-50 text-amber-600 border border-amber-100/50' :
                          ipc.status === 'Certified' ? 'bg-blue-50 text-blue-600 border border-blue-100/50' :
                          ipc.status === 'Submitted' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' :
                          'bg-slate-50 text-slate-400 border border-slate-200/50'
                        }`}>
                          {ipc.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-[13px] hover:text-brand-red cursor-pointer transition-colors" onClick={() => startView(ipc)}>
                          {ipc.ipcNumber}
                        </h4>
                        <div className="text-[10px] text-slate-400 font-sans font-semibold mt-1">
                          {isCertifiedStatus ? (
                            <>
                              Net Certified: <span className="font-mono text-slate-800 dark:text-slate-200 font-black">{(ipc.netCertifiedAmount ?? 0).toLocaleString()} {currency}</span>
                            </>
                          ) : (
                            <>
                              Net Claimed: <span className="font-mono text-slate-700 dark:text-slate-350 font-extrabold">{(ipc.invoiceNetValue).toLocaleString()} {currency}</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans font-semibold">
                          Received Cash: <span className="font-mono text-emerald-600 font-bold">{totalPaid.toLocaleString()} {currency}</span>
                        </div>
                        {isCertifiedStatus && (
                          <div className="text-[10px] text-slate-400 font-sans font-semibold">
                            Outstanding Balance: <span className={`font-mono font-bold ${outstanding > 0 ? 'text-red-500' : 'text-slate-500'}`}>{outstanding.toLocaleString()} {currency}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-850">
                      <button
                        onClick={() => startView(ipc)}
                        className="text-brand-navy hover:text-brand-red font-extrabold text-[10px]"
                      >
                        {isAr ? 'التفاصيل والدفعات ➔' : 'View Details & Payments ➔'}
                      </button>

                      {!isProjectArchived && (
                        <div className="flex items-center gap-1">
                          {ipc.recordStatus === 'Archived' ? (
                            <button
                              onClick={() => handleRestore(ipc)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-100 cursor-pointer"
                              title="Restore"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(ipc)}
                                className="p-1 text-slate-650 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleArchive(ipc)}
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
                );
              })
            ) : (
              <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200">
                <DollarSign className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                <p className="font-bold">{isAr ? 'لا توجد مستخلصات مسجلة.' : 'No issued IPC records found.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
