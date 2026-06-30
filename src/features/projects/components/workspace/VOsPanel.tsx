import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Save, Edit3, Archive, RotateCcw, PenTool, Calendar, 
  DollarSign, FileText, CheckCircle, X, Users, AlertTriangle 
} from 'lucide-react';
import { ProjectVariationOrder, VOApprovalHistory } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';
import { RecordStatus } from '../../../../enums/RecordStatus';
import { VOLifecycleValidator } from '../../../../validators/VOLifecycleValidator';
import { useDialog } from '../../../../components/ui/DialogProvider';

interface VOsPanelProps {
  lang: 'ar' | 'en';
  projectId: string;
  projectCode: string;
  isProjectArchived: boolean;
  onRefresh?: () => void;
}

export function VOsPanel({
  lang,
  projectId,
  projectCode,
  isProjectArchived,
  onRefresh
}: VOsPanelProps) {
  const isAr = lang === 'ar';
  const lookupService = ProjectLookupService.getInstance();
  const dialog = useDialog();

  const [vos, setVos] = useState<ProjectVariationOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingVo, setEditingVo] = useState<ProjectVariationOrder | null>(null);

  // Parent Project Currency
  const [projectCurrency, setProjectCurrency] = useState('EGP');

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

  // Extended Change Management Fields
  // 1. Technical Description
  const [voType, setVoType] = useState<'Addition' | 'Omission' | 'Transfer'>('Addition');
  const [description, setDescription] = useState('');
  const [merits, setMerits] = useState('');

  // 2. Employer Instruction
  const [instructionType, setInstructionType] = useState<'EI' | 'AI' | 'VO' | 'Other'>('EI');
  const [instructionRef, setInstructionRef] = useState('');
  const [instructionDate, setInstructionDate] = useState('');

  // 3. Commercial Offer
  const [commSubmissionStatus, setCommSubmissionStatus] = useState<'Pending' | 'Submitted' | 'Approved'>('Pending');
  const [commRfvRef, setCommRfvRef] = useState('');
  const [commDate, setCommDate] = useState('');
  const [commAmount, setCommAmount] = useState(0);
  const [commEotDays, setCommEotDays] = useState(0);

  // 4. Approval details
  const [approvalDate, setApprovalDate] = useState('');
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [approvalRef, setApprovalRef] = useState('');
  const [approvedEotDays, setApprovedEotDays] = useState(0);

  // Override option for approved amount > proposed amount
  const [allowApprovedValueOverride, setAllowApprovedValueOverride] = useState(false);

  // Validation feedback state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

    const projects = await lookupService.getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProjectCurrency(found.currency || 'EGP');
    }
  };

  useEffect(() => {
    reloadVos();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voNumber.trim() || !voTitle.trim()) return;

    if (isProjectArchived) {
      await dialog.alert(isAr ? 'لا يمكن تعديل السجلات لأن المشروع مؤرشف حالياً.' : 'Cannot save changes because the project is currently archived.');
      return;
    }

    // Approved status check: Lock Approved VOs from edits except through workflow
    if (editingVo && (editingVo.status === 'Approved' || editingVo.status === 'Implemented') && status === editingVo.status) {
      await dialog.alert(isAr ? 'لا يمكن تعديل أمر تغييري معتمد ومقفل.' : 'Cannot modify an approved/implemented Variation Order.');
      return;
    }

    const targetId = editingVo ? editingVo.id : `vo-${Date.now()}`;
    const auditInfo = editingVo ? editingVo.auditInfo : {
      createdBy: 'User',
      createdAt: new Date().toISOString()
    };

    const finalValue = status === 'Approved' || status === 'Implemented' ? approvedAmount : commAmount;
    const finalEot = status === 'Approved' || status === 'Implemented' ? approvedEotDays : commEotDays;

    const voRecord: ProjectVariationOrder = {
      id: targetId,
      recordStatus: editingVo ? editingVo.recordStatus : RecordStatus.ACTIVE,
      auditInfo,
      projectId,
      voNumber: voNumber.trim(),
      title: voTitle.trim(),
      titleAr: voTitleAr.trim() || undefined,
      status,
      additionalValue: finalValue,
      scheduleImpactDays: finalEot,
      costImpactType,
      riskLevel,
      remarks,
      approvals,
      technicalDescription: {
        additionOrOmission: voType,
        description,
        merits
      },
      employerInstruction: {
        instructionType,
        reference: instructionRef.trim(),
        date: instructionDate
      },
      commercialOffer: {
        submissionStatus: commSubmissionStatus,
        rfvReference: commRfvRef.trim(),
        commercialDate: commDate,
        amount: commAmount,
        extensionOfTimeDays: commEotDays
      },
      approval: status === 'Approved' || status === 'Implemented' ? {
        approvalDate,
        approvedAmount,
        approvalReference: approvalRef.trim(),
        approvedEotDays
      } : undefined
    };

    const validation = VOLifecycleValidator.validate(voRecord, editingVo, allowApprovedValueOverride);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    const success = await lookupService.saveVariationOrder(voRecord);
    if (success) {
      await lookupService.addHistory(
        projectId,
        editingVo ? 'Variation Order Updated' : 'Variation Order Registered',
        'User',
        `VO: ${voNumber}, Value: ${finalValue}, EOT: ${finalEot} Days`,
        'VariationOrder',
        targetId
      );
      setShowForm(false);
      resetForm();
      reloadVos();
      if (onRefresh) onRefresh();
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

  const startCreate = async () => {
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    resetForm();
    setFormMode('create');
    setShowForm(true);
  };

  const startEdit = async (vo: ProjectVariationOrder) => {
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
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

    // Tech Description
    setVoType(vo.technicalDescription?.additionOrOmission || 'Addition');
    setDescription(vo.technicalDescription?.description || '');
    setMerits(vo.technicalDescription?.merits || '');

    // Employer Instruction
    setInstructionType(vo.employerInstruction?.instructionType || 'EI');
    setInstructionRef(vo.employerInstruction?.reference || '');
    setInstructionDate(vo.employerInstruction?.date || '');

    // Commercial Offer
    setCommSubmissionStatus(vo.commercialOffer?.submissionStatus || 'Pending');
    setCommRfvRef(vo.commercialOffer?.rfvReference || '');
    setCommDate(vo.commercialOffer?.commercialDate || '');
    setCommAmount(vo.commercialOffer?.amount || 0);
    setCommEotDays(vo.commercialOffer?.extensionOfTimeDays || 0);

    // Approval details
    setApprovalDate(vo.approval?.approvalDate || '');
    setApprovedAmount(vo.approval?.approvedAmount || 0);
    setApprovalRef(vo.approval?.approvalReference || '');
    setApprovedEotDays(vo.approval?.approvedEotDays || 0);

    setAllowApprovedValueOverride(false);
    setValidationErrors([]);
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

    setVoType('Addition');
    setDescription('');
    setMerits('');
    setInstructionType('EI');
    setInstructionRef('');
    setInstructionDate('');
    setCommSubmissionStatus('Pending');
    setCommRfvRef('');
    setCommDate('');
    setCommAmount(0);
    setCommEotDays(0);
    setApprovalDate('');
    setApprovedAmount(0);
    setApprovalRef('');
    setApprovedEotDays(0);
    setAllowApprovedValueOverride(false);
    setValidationErrors([]);
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
      await dialog.alert(isAr ? 'لا يمكن أرشفة أمر تغييري معتمد ومقفل.' : 'Cannot archive an approved variation order.');
      return;
    }

    const reason = await dialog.promptText(
      isAr ? 'أدخل سبب أرشفة الأمر التغييري (إلزامي):' : 'Enter VO archive reason (mandatory):',
      { required: true, title: isAr ? 'أرشفة الأمر التغييري' : 'Archive Variation Order' }
    );
    if (!reason || !reason.trim()) {
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
      if (onRefresh) onRefresh();
    }
  };

  const handleRestore = async (vo: ProjectVariationOrder) => {
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'لا يمكن استعادة السجل لأن المشروع الأب مؤرشف.' : 'Cannot restore VO because the parent project is archived.');
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
      if (onRefresh) onRefresh();
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
          <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase border-b pb-2 flex justify-between items-center">
            <span>
              {formMode === 'view' ? (isAr ? 'عرض تفاصيل الأمر التغييري' : 'View VO details') :
               formMode === 'edit' ? (isAr ? 'تعديل الأمر التغييري الحالي' : 'Edit Variation Order') : 
               (isAr ? 'تسجيل أمر تغييري جديد' : 'New Variation Order')}
            </span>
            {formMode !== 'view' && (
              <span className="text-[10px] text-brand-red font-extrabold uppercase">
                {isAr ? 'مسودة' : 'Active Workspace Draft'}
              </span>
            )}
          </h4>

          {/* Validation Feedback */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-350 space-y-1">
              <p className="font-extrabold flex items-center gap-1.5 text-[10px]">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{isAr ? 'يرجى تصحيح الأخطاء التالية قبل الحفظ:' : 'Please correct the following errors before saving:'}</span>
              </p>
              <ul className="list-disc list-inside text-[10px] space-y-0.5">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* SECTION 1: General Details */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider border-l-2 border-brand-red pl-2">
              {isAr ? '1. البيانات الأساسية' : '1. General details'}
            </h5>
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
            </div>
          </div>

          {/* SECTION 2: Client Instruction */}
          <div className="space-y-3 pt-3 border-t">
            <h5 className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-wider border-l-2 border-brand-red pl-2">
              {isAr ? '2. توجيه العميل (Instruction details)' : '2. Employer / Client instruction'}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'نوع التوجيه *' : 'Instruction Type *'}</label>
                <select
                  disabled={formMode === 'view'}
                  value={instructionType}
                  onChange={e => setInstructionType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
                >
                  <option value="EI">EI - Employer Instruction</option>
                  <option value="AI">AI - Architects Instruction</option>
                  <option value="VO">VO - Variation Order Directive</option>
                  <option value="Other">Other Letter/Instruction</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'مرجع الخطاب / التوجيه *' : 'Instruction Reference *'}</label>
                <input
                  type="text"
                  disabled={formMode === 'view'}
                  value={instructionRef}
                  onChange={e => setInstructionRef(e.target.value)}
                  placeholder="e.g. ROWAD-AI-045, ENGR-DIR-012"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ الخطاب / التوجيه' : 'Instruction Date'}</label>
                <input
                  type="date"
                  disabled={formMode === 'view'}
                  value={instructionDate}
                  onChange={e => setInstructionDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Technical Merits */}
          <div className="space-y-3 pt-3 border-t">
            <h5 className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-wider border-l-2 border-brand-red pl-2">
              {isAr ? '3. المبررات الفنية والأثر' : '3. Technical description & merits'}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'نوع التغيير الفني *' : 'Change Direction *'}</label>
                <select
                  disabled={formMode === 'view'}
                  value={voType}
                  onChange={e => setVoType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
                >
                  <option value="Addition">Addition (إضافة أعمال)</option>
                  <option value="Omission">Omission (حذف / وفر أعمال)</option>
                  <option value="Transfer">Transfer (نقل بنود)</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المزايا والمبررات التعاقدية *' : 'Contractual Merits / Justification *'}</label>
                <input
                  type="text"
                  disabled={formMode === 'view'}
                  value={merits}
                  onChange={e => setMerits(e.target.value)}
                  placeholder="e.g. Required due to unforeseen site obstacles in Sector B"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الوصف الفني التفصيلي *' : 'Technical Description *'}</label>
                <textarea
                  rows={2}
                  disabled={formMode === 'view'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed breakdown of addition, omission, or substitution specifications..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Contractor Commercial Proposal */}
          <div className="space-y-3 pt-3 border-t">
            <h5 className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-wider border-l-2 border-brand-red pl-2">
              {isAr ? '4. المقترح المالي والزمني (Proposed Offer)' : '4. Contractor commercial proposal'}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? `المبلغ المقترح للتغيير (${projectCurrency}) *` : `Proposed Amount (${projectCurrency}) *`}</label>
                <input
                  type="number"
                  required
                  disabled={formMode === 'view'}
                  value={commAmount || ''}
                  onChange={e => setCommAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'التمديد الزمني المقترح (أيام)' : 'Proposed EOT (Days)'}</label>
                <input
                  type="number"
                  disabled={formMode === 'view'}
                  value={commEotDays || ''}
                  onChange={e => setCommEotDays(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'مرجع مقترح التكلفة RFV' : 'RFV Reference'}</label>
                <input
                  type="text"
                  disabled={formMode === 'view'}
                  value={commRfvRef}
                  onChange={e => setCommRfvRef(e.target.value)}
                  placeholder="e.g. RFV-CIV-04"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ تقديم العرض' : 'Offer Date'}</label>
                <input
                  type="date"
                  disabled={formMode === 'view'}
                  value={commDate}
                  onChange={e => setCommDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'حالة تقديم العرض للعميل' : 'Submission Status'}</label>
                <select
                  disabled={formMode === 'view'}
                  value={commSubmissionStatus}
                  onChange={e => setCommSubmissionStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
                >
                  <option value="Pending">Pending / Under pricing</option>
                  <option value="Submitted">Submitted to Consultant/Client</option>
                  <option value="Approved">Approved in Principle</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5: Approval Baseline details (Only shown if status is Approved or Implemented) */}
          {(status === 'Approved' || status === 'Implemented') && (
            <div className="space-y-3 pt-3 border-t bg-emerald-50/20 dark:bg-emerald-950/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <h5 className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider border-l-2 border-emerald-600 pl-2">
                {isAr ? '5. بيانات الاعتماد والمقايسة المعتمدة (Approval Baseline)' : '5. Certified approval baseline'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-350 uppercase">{isAr ? `المبلغ المعتمد النهائي (${projectCurrency}) *` : `Approved Amount (${projectCurrency}) *`}</label>
                  <input
                    type="number"
                    required
                    disabled={formMode === 'view'}
                    value={approvedAmount || ''}
                    onChange={e => setApprovedAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500 font-extrabold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-350 uppercase">{isAr ? 'التمديد الزمني المعتمد (أيام)' : 'Approved EOT (Days)'}</label>
                  <input
                    type="number"
                    disabled={formMode === 'view'}
                    value={approvedEotDays || ''}
                    onChange={e => setApprovedEotDays(Number(e.target.value))}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-350 uppercase">{isAr ? 'مرجع الاعتماد / خطاب المالك *' : 'Approval Reference *'}</label>
                  <input
                    type="text"
                    required
                    disabled={formMode === 'view'}
                    value={approvalRef}
                    onChange={e => setApprovalRef(e.target.value)}
                    placeholder="e.g. MO-APPR-2026-03"
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-350 uppercase">{isAr ? 'تاريخ خطاب الاعتماد *' : 'Approval Date *'}</label>
                  <input
                    type="date"
                    required
                    disabled={formMode === 'view'}
                    value={approvalDate}
                    onChange={e => setApprovalDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {formMode !== 'view' && (
                  <div className="flex items-center gap-2 md:col-span-2 pt-4">
                    <input
                      type="checkbox"
                      id="overrideCheck"
                      checked={allowApprovedValueOverride}
                      onChange={e => setAllowApprovedValueOverride(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="overrideCheck" className="text-[10px] font-bold text-slate-650 cursor-pointer">
                      {isAr ? 'السماح بتجاوز المبلغ المعتمد للمقترح المقدم من المقاول.' : 'Allow approved value to exceed proposed amount (explicit override).'}
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

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
                        <span>Cost Impact: <span className="font-mono text-slate-850 font-bold">{vo.additionalValue.toLocaleString()} {projectCurrency}</span></span>
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
