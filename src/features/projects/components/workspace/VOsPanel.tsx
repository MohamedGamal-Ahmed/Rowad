import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Save, Edit3, Archive, RotateCcw, PenTool, Calendar, 
  DollarSign, FileText, CheckCircle, X, Users, AlertTriangle 
} from 'lucide-react';
import { ProjectVariationOrder, VOApprovalHistory } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';
import { RecordStatus } from '../../../../enums/RecordStatus';

interface VOsPanelProps {
  lang: 'ar' | 'en';
  projectId: string;
  projectCode: string;
  isProjectArchived: boolean;
}

export function VOsPanel({
  lang,
  projectId,
  projectCode,
  isProjectArchived
}: VOsPanelProps) {
  const isAr = lang === 'ar';
  const lookupService = ProjectLookupService.getInstance();

  const [vos, setVos] = useState<ProjectVariationOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingVo, setEditingVo] = useState<ProjectVariationOrder | null>(null);

  // Form Fields
  const [voNumber, setVoNumber] = useState('');
  const [voTitle, setVoTitle] = useState('');
  const [voTitleAr, setVoTitleAr] = useState('');
  const [status, setStatus] = useState('Draft');
  
  // Independent metrics & attributes
  const [additionalValue, setAdditionalValue] = useState(0);
  const [scheduleImpactDays, setScheduleImpactDays] = useState(0);
  const [costImpactType, setCostImpactType] = useState('Addition');
  const [riskLevel, setRiskLevel] = useState('Low');
  const [remarks, setRemarks] = useState('');

  // Child Entity list: VO Approval History
  const [approvals, setApprovals] = useState<VOApprovalHistory[]>([]);
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  // New Approval Step fields
  const [stepName, setStepName] = useState('');
  const [stepAction, setStepAction] = useState('Approved');
  const [actorName, setActorName] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [comments, setComments] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived'>('Active');
  const [searchQuery, setSearchQuery] = useState('');

  const reloadVos = async () => {
    const list = await lookupService.getVariationOrders(projectId);
    setVos(list);
  };

  useEffect(() => {
    reloadVos();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voNumber.trim() || !voTitle.trim()) return;

    if (isProjectArchived) {
      window.alert(isAr ? 'لا يمكن تعديل السجلات لأن المشروع مؤرشف حالياً.' : 'Cannot save changes because the project is currently archived.');
      return;
    }

    const targetId = editingVo ? editingVo.id : `vo-${Date.now()}`;
    const auditInfo = editingVo ? editingVo.auditInfo : {
      createdBy: 'User',
      createdAt: new Date().toISOString()
    };

    const voRecord: ProjectVariationOrder = {
      id: targetId,
      recordStatus: editingVo ? editingVo.recordStatus : RecordStatus.ACTIVE,
      auditInfo,
      projectId,
      voNumber: voNumber.trim(),
      title: voTitle.trim(),
      titleAr: voTitleAr.trim() || undefined,
      status,
      additionalValue,
      scheduleImpactDays,
      costImpactType,
      riskLevel,
      remarks,
      approvals // Bind child approvals history
    };

    const success = await lookupService.saveVariationOrder(voRecord);
    if (success) {
      await lookupService.addHistory(
        projectId,
        editingVo ? 'Variation Order Updated' : 'Variation Order Registered',
        'User',
        `VO: ${voNumber}, Value: ${additionalValue}, EOT: ${scheduleImpactDays} Days`,
        'VariationOrder',
        targetId
      );
      setShowForm(false);
      resetForm();
      reloadVos();
    }
  };

  const handleAddApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepName.trim() || !actorName.trim()) return;

    const newStep: VOApprovalHistory = {
      id: `app-${Date.now()}`,
      voId: editingVo?.id || '',
      stepName: stepName.trim(),
      action: stepAction,
      actorName: actorName.trim(),
      actionDate: actionDate || new Date().toISOString().substring(0, 10),
      comments: comments.trim()
    };

    setApprovals([...approvals, newStep]);
    setShowApprovalForm(false);
    resetApprovalForm();
  };

  const removeApproval = (id: string) => {
    setApprovals(approvals.filter(a => a.id !== id));
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

  const startEdit = (vo: ProjectVariationOrder) => {
    if (isProjectArchived) {
      window.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    loadVoIntoForm(vo);
    setFormMode('edit');
    setShowForm(true);
  };

  const startView = (vo: ProjectVariationOrder) => {
    loadVoIntoForm(vo);
    setFormMode('view');
    setShowForm(true);
  };

  const loadVoIntoForm = (vo: ProjectVariationOrder) => {
    setEditingVo(vo);
    setVoNumber(vo.voNumber);
    setVoTitle(vo.title);
    setVoTitleAr(vo.titleAr || '');
    setStatus(vo.status);
    setAdditionalValue(vo.additionalValue);
    setScheduleImpactDays(vo.scheduleImpactDays || 0);
    setCostImpactType(vo.costImpactType || 'Addition');
    setRiskLevel(vo.riskLevel || 'Low');
    setRemarks(vo.remarks || '');
    setApprovals(vo.approvals || []);
  };

  const resetForm = () => {
    setEditingVo(null);
    setVoNumber('');
    setVoTitle('');
    setVoTitleAr('');
    setStatus('Draft');
    setAdditionalValue(0);
    setScheduleImpactDays(0);
    setCostImpactType('Addition');
    setRiskLevel('Low');
    setRemarks('');
    setApprovals([]);
    setShowApprovalForm(false);
  };

  const resetApprovalForm = () => {
    setStepName('');
    setStepAction('Approved');
    setActorName('');
    setActionDate(new Date().toISOString().substring(0, 10));
    setComments('');
  };

  const handleArchive = async (vo: ProjectVariationOrder) => {
    if (isProjectArchived) return;

    // Restrict delete: Block archive if status is already approved
    if (vo.status === 'Approved') {
      window.alert(isAr ? 'لا يمكن أرشفة أمر تغييري معتمد ومقفل.' : 'Cannot archive an approved variation order.');
      return;
    }

    const reason = window.prompt(isAr ? 'أدخل سبب أرشفة الأمر التغييري (إلزامي):' : 'Enter VO archive reason (mandatory):');
    if (!reason || !reason.trim()) {
      window.alert(isAr ? 'السبب مطلوب لإتمام العملية.' : 'Archive reason is required.');
      return;
    }

    const updated: ProjectVariationOrder = {
      ...vo,
      recordStatus: RecordStatus.ARCHIVED,
      archiveInfo: {
        archivedBy: 'User',
        archivedAt: new Date().toISOString(),
        archiveReason: reason.trim()
      }
    };

    const success = await lookupService.saveVariationOrder(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'Variation Order Archived',
        'User',
        `Archived VO: ${vo.voNumber}. Reason: ${reason}`
      );
      reloadVos();
    }
  };

  const handleRestore = async (vo: ProjectVariationOrder) => {
    if (isProjectArchived) {
      window.alert(isAr ? 'لا يمكن استعادة السجل لأن المشروع الأب مؤرشف.' : 'Cannot restore VO because the parent project is archived.');
      return;
    }

    const updated: ProjectVariationOrder = {
      ...vo,
      recordStatus: RecordStatus.ACTIVE,
      archiveInfo: undefined
    };

    const success = await lookupService.saveVariationOrder(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'Variation Order Restored',
        'User',
        `Restored VO: ${vo.voNumber}`
      );
      reloadVos();
    }
  };

  const filteredVos = useMemo(() => {
    return vos.filter(v => {
      const matchStatus = statusFilter === 'Archived' 
        ? v.recordStatus === RecordStatus.ARCHIVED 
        : v.recordStatus !== RecordStatus.ARCHIVED;
      
      const q = searchQuery.toLowerCase();
      const matchQuery = !searchQuery.trim() || 
        v.voNumber.toLowerCase().includes(q) || 
        v.title.toLowerCase().includes(q) ||
        (v.titleAr && v.titleAr.toLowerCase().includes(q));
      
      return matchStatus && matchQuery;
    });
  }, [vos, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 text-xs">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-brand-navy dark:text-slate-100 uppercase">
            {isAr ? 'سجل الأوامر التغييرية والمقايسات الإضافية' : 'Variation Orders (VO)'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isAr ? 'حساب الزيادة أو النقص المالي في البنود، تمديد تواريخ التسليم، وتسجيل اعتمادات الاستشاري والمالك.' : 'Audit contract alterations, cost impact types, EOT milestones, and approval trails.'}
          </p>
        </div>

        {!showForm && !isProjectArchived && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'طلب أمر تغييري جديد' : 'Request VO'}</span>
          </button>
        )}
      </div>

      {/* Form View */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-6">
          <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase border-b pb-2">
            {formMode === 'view' ? (isAr ? 'عرض تفاصيل الأمر التغييري' : 'View VO details') :
             formMode === 'edit' ? (isAr ? 'تعديل الأمر التغييري الحالي' : 'Edit Variation Order') : 
             (isAr ? 'تسجيل أمر تغييري جديد' : 'New Variation Order')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رقم الأمر التغييري *' : 'VO Number *'}</label>
              <input
                type="text"
                required
                disabled={formMode === 'view'}
                value={voNumber}
                onChange={e => setVoNumber(e.target.value)}
                placeholder="e.g. VO-01, VO-CIV-02"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'اسم البند / العنوان (EN) *' : 'Title (EN) *'}</label>
              <input
                type="text"
                required
                disabled={formMode === 'view'}
                value={voTitle}
                onChange={e => setVoTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'اسم البند / العنوان (AR)' : 'Title (AR)'}</label>
              <input
                type="text"
                disabled={formMode === 'view'}
                value={voTitleAr}
                onChange={e => setVoTitleAr(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الحالة الحالية للاعتماد' : 'VO Status'}</label>
              <select
                disabled={formMode === 'view'}
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تصنيف تأثير التكلفة' : 'Cost Impact Type'}</label>
              <select
                disabled={formMode === 'view'}
                value={costImpactType}
                onChange={e => setCostImpactType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="Addition">Addition (زيادة تكلفة العقد)</option>
                <option value="Omission">Omission (وفر مالي وتقليص بنود)</option>
                <option value="Substitution">Substitution (موازنة واستبدال بنود)</option>
                <option value="No Cost">No Cost (تغيير فني بدون تكلفة)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'درجة الخطورة والتأثير' : 'Risk Level'}</label>
              <select
                disabled={formMode === 'view'}
                value={riskLevel}
                onChange={e => setRiskLevel(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High / Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'مبلغ التعديل الإضافي (EGP) *' : 'Additional Value (EGP) *'}</label>
              <input
                type="number"
                required
                disabled={formMode === 'view'}
                value={additionalValue || ''}
                onChange={e => setAdditionalValue(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'عدد الأيام المضافة للجدول الزمني' : 'Schedule Impact (Days)'}</label>
              <input
                type="number"
                disabled={formMode === 'view'}
                value={scheduleImpactDays || ''}
                onChange={e => setScheduleImpactDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

          </div>

          {/* Child Entity: VOApprovalHistory */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-150">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-[10px] font-black text-brand-navy dark:text-slate-100 uppercase flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'سجل اعتمادات وتواقيع المستند' : 'VO Approval & Review History'}</span>
              </span>
              
              {formMode !== 'view' && !showApprovalForm && (
                <button
                  type="button"
                  onClick={() => { resetApprovalForm(); setShowApprovalForm(true); }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg font-bold text-[10px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تسجيل خطوة اعتماد' : 'Record Step'}</span>
                </button>
              )}
            </div>

            {/* Approval Subform */}
            {showApprovalForm && (
              <div className="bg-white dark:bg-slate-900 border border-emerald-100 p-4 rounded-xl space-y-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'اسم خطوة المراجعة *' : 'Step Name *'}</label>
                  <input
                    type="text"
                    required
                    value={stepName}
                    onChange={e => setStepName(e.target.value)}
                    placeholder="e.g. Consultant Recommendation"
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'الإجراء المتخذ' : 'Action'}</label>
                  <select
                    value={stepAction}
                    onChange={e => setStepAction(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Revise">Revise / Resubmit</option>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'اسم المراجع المسؤول *' : 'Actor Name *'}</label>
                  <input
                    type="text"
                    required
                    value={actorName}
                    onChange={e => setActorName(e.target.value)}
                    placeholder="e.g. Eng. Hani Al-Said"
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ الإجراء' : 'Action Date'}</label>
                  <input
                    type="date"
                    required
                    value={actionDate}
                    onChange={e => setActionDate(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="space-y-0.5 sm:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">{isAr ? 'ملاحظات وتوصيات' : 'Comments'}</label>
                  <input
                    type="text"
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                </div>

                <div className="flex justify-end items-end gap-2 sm:col-span-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApprovalForm(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddApproval}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                  >
                    {isAr ? 'إضافة' : 'Record'}
                  </button>
                </div>
              </div>
            )}

            {/* List of Approval steps */}
            <div className="space-y-2">
              {approvals.map((app, idx) => (
                <div key={app.id || idx} className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-150 flex flex-col justify-between gap-1 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{app.stepName}</span>
                    <span className="font-mono text-slate-400 font-bold text-[10px]">{app.actionDate}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans font-semibold">
                    Reviewed By: <span className="text-slate-700 font-bold">{app.actorName}</span>
                  </div>
                  {app.comments && <p className="italic text-slate-450 mt-1 font-semibold">"{app.comments}"</p>}
                  <div className="flex justify-end pt-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      app.action === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                      app.action === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {app.action}
                    </span>
                    {formMode !== 'view' && (
                      <button
                        type="button"
                        onClick={() => removeApproval(app.id)}
                        className="text-brand-red p-0.5 hover:bg-red-50 rounded ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {approvals.length === 0 && (
                <span className="text-[10px] text-slate-450 italic block">{isAr ? 'لا يوجد سجل تواقيع معتمد.' : 'No approval history steps recorded.'}</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'ملاحظات عامة وشرح مبررات البند التغييري' : 'VO Justification & Remarks'}</label>
            <textarea
              rows={3}
              disabled={formMode === 'view'}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder={isAr ? 'اكتب تبريرات طلب التعديل والبنود المتأثرة هنا...' : 'Provide details of design changes or client directives...'}
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
                <span>{formMode === 'edit' ? (isAr ? 'حفظ التغييرات' : 'Save Changes') : (isAr ? 'حفظ السجل' : 'Save VO')}</span>
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
              placeholder={isAr ? 'البحث بالرمز أو الاسم...' : 'Search by VO number or title...'}
              className="w-full sm:w-80 p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg"
            />
            
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{isAr ? 'تصفية الحالة:' : 'Filter:'}</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="border rounded p-1 bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none"
              >
                <option value="Active">{isAr ? 'النشطة' : 'Active Orders'}</option>
                <option value="Archived">{isAr ? 'المؤرشفة' : 'Archived'}</option>
              </select>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVos.length > 0 ? (
              filteredVos.map((vo) => (
                <div key={vo.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4 hover:border-slate-250 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[9px] text-slate-500">
                        {vo.costImpactType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        vo.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                        vo.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100/50' :
                        'bg-slate-50 text-slate-500 border border-slate-200/50'
                      }`}>
                        {vo.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-[13px] hover:text-brand-red cursor-pointer transition-colors" onClick={() => startView(vo)}>
                        {vo.voNumber}
                      </h4>
                      <p className="text-[10px] text-slate-450 font-semibold mt-0.5">{isAr && vo.titleAr ? vo.titleAr : vo.title}</p>
                      
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500 font-semibold font-sans pt-2 border-t">
                        <span>Cost Impact: <span className="font-mono text-slate-850 font-bold">{vo.additionalValue.toLocaleString()} EGP</span></span>
                        <span>EOT Days: <span className="font-mono text-slate-850 font-bold">{vo.scheduleImpactDays || 0} Days</span></span>
                        <span>Risk Level: <span className="font-sans font-extrabold text-brand-navy">{vo.riskLevel || 'Low'}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-850">
                    <button
                      onClick={() => startView(vo)}
                      className="text-brand-navy hover:text-brand-red font-extrabold text-[10px]"
                    >
                      {isAr ? 'عرض سجل التوقيعات ➔' : 'View Approval Steps ➔'}
                    </button>

                    {!isProjectArchived && (
                      <div className="flex items-center gap-1">
                        {vo.recordStatus === 'Archived' ? (
                          <button
                            onClick={() => handleRestore(vo)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-100 cursor-pointer"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(vo)}
                              className="p-1 text-slate-650 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleArchive(vo)}
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
                <PenTool className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                <p className="font-bold">{isAr ? 'لا توجد بنود أوامر تغييرية مسجلة.' : 'No variation orders registered.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
