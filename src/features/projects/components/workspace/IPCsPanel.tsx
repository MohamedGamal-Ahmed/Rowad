import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Save, Edit3, Archive, RotateCcw, DollarSign, Calendar, 
  Tag, Layers, ArrowRight, Eye, CheckCircle2, AlertCircle, X, Banknote 
} from 'lucide-react';
import { ProjectIPC, Payment } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';
import { RecordStatus } from '../../../../enums/RecordStatus';
import { BiText } from '../../../../components/BiText';

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

  const [ipcs, setIpcs] = useState<ProjectIPC[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingIpc, setEditingIpc] = useState<ProjectIPC | null>(null);

  // Form Fields
  const [ipcNumber, setIpcNumber] = useState('');
  const [invoiceGrossValue, setInvoiceGrossValue] = useState(0);
  const [invoiceNetValue, setInvoiceNetValue] = useState(0);
  const [status, setStatus] = useState('Draft');
  const [workTill, setWorkTill] = useState('');
  const [ipcSubmissionDate, setIpcSubmissionDate] = useState('');

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

  useEffect(() => {
    reloadIpcs();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipcNumber.trim()) return;

    if (isProjectArchived) {
      window.alert(isAr ? 'لا يمكن تعديل السجلات لأن المشروع مؤرشف حالياً.' : 'Cannot save changes because the project is currently archived.');
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
      ipcSubmissionDate: ipcSubmissionDate || new Date().toISOString().substring(0, 10)
    };

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
    if (payAmount <= 0) return;

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

    setPayments([...payments, newPay]);
    setShowPaymentForm(false);
    resetPaymentForm();
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
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

  const startEdit = (ipc: ProjectIPC) => {
    if (isProjectArchived) {
      window.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
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
  };

  const resetPaymentForm = () => {
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
      window.alert(isAr ? 'لا يمكن أرشفة مستخلص تم صرفه بالكامل.' : 'Cannot archive an IPC that is already fully paid.');
      return;
    }

    const reason = window.prompt(isAr ? 'أدخل سبب أرشفة المستخلص (إلزامي):' : 'Enter IPC archive reason (mandatory):');
    if (!reason || !reason.trim()) {
      window.alert(isAr ? 'السبب مطلوب لإتمام العملية.' : 'Archive reason is required.');
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
      window.alert(isAr ? 'لا يمكن استعادة السجل لأن المشروع الأب مؤرشف.' : 'Cannot restore IPC because the parent project is archived.');
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
                onChange={e => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="Draft">Draft (مسودة)</option>
                <option value="Submitted">Submitted (تم التقديم للمالك)</option>
                <option value="Certified">Certified (تم الاعتماد والاستحقاق)</option>
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
                  // Quick flat tax approximation: net is 90% of gross (customary 10% withholding/retention)
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

                <div className="flex justify-end items-end gap-2 sm:col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
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
                const totalPaid = (ipc.payments || []).reduce((sum, pay) => sum + pay.paymentAmount, 0);
                
                return (
                  <div key={ipc.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4 hover:border-slate-250 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[9px]">
                          Invoice Gross: {(ipc.invoiceGrossValue).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          ipc.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                          ipc.status === 'Certified' ? 'bg-blue-50 text-blue-600 border border-blue-100/50' :
                          ipc.status === 'Submitted' ? 'bg-amber-50 text-amber-600 border border-amber-100/50' :
                          'bg-slate-50 text-slate-400 border border-slate-200/50'
                        }`}>
                          {ipc.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-[13px] hover:text-brand-red cursor-pointer transition-colors" onClick={() => startView(ipc)}>
                          {ipc.ipcNumber}
                        </h4>
                        <div className="text-[10px] text-slate-450 font-sans font-semibold mt-1">
                          Net Claimed: <span className="font-mono text-slate-800 font-extrabold">{(ipc.invoiceNetValue).toLocaleString()} EGP</span>
                        </div>
                        <div className="text-[10px] text-slate-450 font-sans font-semibold">
                          Total Received: <span className="font-mono text-emerald-600 font-extrabold">{totalPaid.toLocaleString()} EGP</span>
                        </div>
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
