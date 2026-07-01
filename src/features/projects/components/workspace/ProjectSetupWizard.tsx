import React, { useState, useEffect } from 'react';
import {
  Building2, Calendar, DollarSign, FileText, CheckCircle2, AlertCircle,
  ArrowLeft, ArrowRight, Save, ShieldAlert, Users, FolderCheck, Play,
  LayoutGrid, Bell, Stamp, CalendarClock, Clock3, Bug
} from 'lucide-react';
import { ProjectSetupDraft, ProjectTeamMember, ProjectLifecycleStage, ProjectWorkflowState, ProjectStatus } from '../../../../domain/projects/Project';
import { ActivationPolicyResult } from '../../../../domain/projects/policies/ProjectActivationPolicy';
import { ProjectSetupService } from '../../../../services/ProjectSetupService';
import { ProjectRepository } from '../../../../repositories/ProjectRepository';
import { BiText } from '../../../../components/BiText';

const MOCK_EMPLOYEES = [
  { id: 'EMP-Sherif-Kamel', name: 'Eng. Sherif Kamel' },
  { id: 'EMP-Ahmed-Ali', name: 'Eng. Ahmed Ali' },
  { id: 'EMP-Tarek-Hassan', name: 'Eng. Tarek Hassan' },
  { id: 'EMP-Khaled-Mansour', name: 'Eng. Khaled Mansour' },
  { id: 'EMP-Mohamed-Gamal', name: 'Eng. Mohamed Gamal' },
  { id: 'EMP-Moustafa-Ibrahim', name: 'Eng. Moustafa Ibrahim' }
];

interface ProjectSetupWizardProps {
  lang: 'ar' | 'en';
  projectId: string;
  onComplete: () => void;
}

export function ProjectSetupWizard({
  lang,
  projectId,
  onComplete
}: ProjectSetupWizardProps) {
  const isAr = lang === 'ar';
  const setupService = React.useMemo(() => new ProjectSetupService(), []);
  const MANDATORY_DOCS = React.useMemo(() => setupService.getRequiredDocumentsList(), [setupService]);

  // Wizard active step state
  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<ProjectSetupDraft | null>(null);
  const [project, setProject] = useState<any | null>(null);

  // Form Fields States (hydrated from draft payload)
  const [currency, setCurrency] = useState('AED');
  const [baseCurrency, setBaseCurrency] = useState('EGP');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [exchangeRateDate, setExchangeRateDate] = useState('');
  const [exchangeRateSource, setExchangeRateSource] = useState<'Manual' | 'Central Bank' | 'ERP' | 'API'>('Manual');
  const [contractType, setContractType] = useState('Lump Sum');
  const [employer, setEmployer] = useState('');
  const [retentionPct, setRetentionPct] = useState(10);
  const [advancePct, setAdvancePct] = useState(10);
  const [vatPct, setVatPct] = useState(15);
  const [costCenter, setCostCenter] = useState('');

  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState(365);
  const [mobPeriod, setMobPeriod] = useState(30);

  const [pmId, setPmId] = useState('');
  const [smId, setSmId] = useState('');
  const [caId, setCaId] = useState('');
  const [extraMembers, setExtraMembers] = useState<{ roleId: string; employeeId: string }[]>([]);

  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  
  // Validation status
  const [stepValidations, setStepValidations] = useState<{ stepId: number; isValid: boolean; missingFields: string[] }[]>([]);
  const [readinessScore, setReadinessScore] = useState<number>(0);
  const [detailedValidations, setDetailedValidations] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsgs, setErrorMsgs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Authoritative policy result (consumes ProjectActivationPolicy.evaluate())
  const [policyResult, setPolicyResult] = useState<ActivationPolicyResult | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const DEV_MODE = (window as any).__ROWAD_DEV_MODE === true || localStorage.getItem('rowad_dev_mode') === 'true';

  const [projectAttachments, setProjectAttachments] = useState<any[]>([]);
  const [lastValidationTime, setLastValidationTime] = useState<string>('');

  // Sprint 4A Persistence Hotfix — RULE 3: hydration source is ALWAYS the
  // repository. This helper is called both on mount and after every successful
  // Save Draft roundtrip so the wizard's field state can never drift from disk.
  const hydrateFromRepository = React.useCallback(async (targetStep?: number) => {
    const activeDraft = await setupService.resumeDraft(projectId);
    setDraft(activeDraft);
    setCurrentStep(targetStep !== undefined ? targetStep : activeDraft.currentStep);

    const repo = new ProjectRepository();
    const proj = await repo.getById(projectId);
    setProject(proj);

    const atts = await repo.getAttachments(projectId);
    setProjectAttachments(atts);

    // Hydrate state
    const comm = activeDraft.commercial;
    if (comm) {
      setCurrency(comm.contractCurrency || 'AED');
      setBaseCurrency(comm.baseCurrency || 'EGP');
      setExchangeRate(comm.exchangeRate ?? 1);
      setExchangeRateDate(comm.exchangeRateDate || '');
      setExchangeRateSource(comm.exchangeRateSource || 'Manual');
      setContractType(comm.contractType || 'Lump Sum');
      setRetentionPct(comm.retentionPercentage ?? 10);
      setAdvancePct(comm.advancePaymentPercentage ?? 10);
      setVatPct(comm.vatPercentage ?? 15);
      setCostCenter(comm.costCenterCode || '');
      setEmployer(comm.employer || proj?.client || '');
    }

    const sch = activeDraft.schedule;
    if (sch) {
      setStartDate(sch.startDate || '');
      setDuration(sch.contractDurationDays || 365);
      setMobPeriod(sch.mobilizationPeriodDays || 30);
    }

    const team = activeDraft.office?.teamMembers || [];
    const pm = team.find(t => t.roleId === 'PM');
    const sm = team.find(t => t.roleId === 'SM');
    const ca = team.find(t => t.roleId === 'CA');
    setPmId(pm ? pm.employeeId : '');
    setSmId(sm ? sm.employeeId : '');
    setCaId(ca ? ca.employeeId : '');
    setExtraMembers(team.filter(t => t.roleId !== 'PM' && t.roleId !== 'SM' && t.roleId !== 'CA').map(t => ({
      roleId: t.roleId,
      employeeId: t.employeeId
    })));

    setUploadedDocs(activeDraft.documents?.verifiedDocumentCategories || []);
  }, [projectId, setupService]);

  // Load setup draft on mount
  useEffect(() => {
    hydrateFromRepository();
  }, [projectId, hydrateFromRepository]);

  // Fetch authoritative policy result when project is in PENDING_ACTIVATION
  useEffect(() => {
    if (project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION) {
      setupService.evaluatePolicy(projectId).then(setPolicyResult);
    } else {
      setPolicyResult(null);
    }
  }, [project?.workflowState, project?.isSetupComplete, projectId]);

  // Synchronize step validations when fields change
  useEffect(() => {
    if (!draft) return;
    validateCurrentState();
  }, [
    draft, currency, baseCurrency, exchangeRate, exchangeRateDate, exchangeRateSource, contractType, employer,
    retentionPct, advancePct, vatPct, costCenter, startDate, duration, 
    mobPeriod, pmId, smId, caId, extraMembers, uploadedDocs, projectAttachments
  ]);

  const calculateCompletionDate = () => {
    if (!startDate || !duration) return '';
    try {
      const start = new Date(startDate);
      const completion = new Date(start.getTime() + Number(duration) * 24 * 60 * 60 * 1000);
      return completion.toISOString().substring(0, 10);
    } catch (_) {
      return '';
    }
  };

  const calculateMobilizationDate = () => {
    if (!startDate || !mobPeriod) return '';
    try {
      const start = new Date(startDate);
      const mob = new Date(start.getTime() + Number(mobPeriod) * 24 * 60 * 60 * 1000);
      return mob.toISOString().substring(0, 10);
    } catch (_) {
      return '';
    }
  };

  const getPayload = (): ProjectSetupDraft => {
    const team: ProjectTeamMember[] = [];
    const todayStr = new Date().toISOString().substring(0, 10);
    if (pmId) team.push({ roleId: 'PM', employeeId: pmId, assignedAt: todayStr });
    if (smId) team.push({ roleId: 'SM', employeeId: smId, assignedAt: todayStr });
    if (caId) team.push({ roleId: 'CA', employeeId: caId, assignedAt: todayStr });
    extraMembers.forEach(m => {
      if (m.employeeId && m.employeeId.trim()) {
        team.push({ roleId: m.roleId, employeeId: m.employeeId, assignedAt: todayStr });
      }
    });

    // A step is marked "completed" once its own validation has passed at least once.
    // Union with whatever was already persisted so revisiting an earlier, now-invalid
    // step doesn't retroactively erase progress on other steps.
    const completed = new Set<number>(draft?.completedSteps || []);
    stepValidations.forEach(v => { if (v.isValid) completed.add(v.stepId); });

    return {
      projectId,
      currentStep,
      lastSaved: new Date().toISOString(),
      completedSteps: Array.from(completed),
      commercial: {
        baseCurrency,
        contractCurrency: currency,
        exchangeRate: Number(exchangeRate),
        exchangeRateDate: exchangeRateDate || undefined,
        exchangeRateSource: exchangeRateSource,
        contractType: contractType as any,
        deliveryMethod: undefined,
        retentionPercentage: Number(retentionPct),
        advancePaymentPercentage: Number(advancePct),
        vatPercentage: Number(vatPct),
        costCenterCode: costCenter,
        employer: employer || 'Employer Default'
      },
      schedule: {
        startDate,
        contractDurationDays: Number(duration),
        mobilizationPeriodDays: Number(mobPeriod),
        workingCalendar: '5-Day Week',
        holidayCalendar: 'Egypt Holidays',
        timeZone: 'Africa/Cairo',
        workingHours: '08:00-17:00',
        weekendPattern: 'Friday-Saturday'
      },
      office: {
        teamMembers: team
      },
      documents: {
        verifiedDocumentCategories: uploadedDocs
      }
    };
  };

  const validateCurrentState = () => {
    const payload = getPayload();
    const results = setupService.validateDraft(payload, projectAttachments);

    const validations = [
      { stepId: 1, isValid: results.commercial.isValid, missingFields: results.commercial.errors },
      { stepId: 2, isValid: results.schedule.isValid, missingFields: results.schedule.errors },
      { stepId: 3, isValid: results.office.isValid, missingFields: results.office.errors },
      { stepId: 4, isValid: results.documents.isValid, missingFields: [
        ...results.documents.errors,
        ...results.documents.warnings
      ] }
    ];

    setStepValidations(validations);
    setReadinessScore(results.readinessScore);
    setDetailedValidations(results);
    setLastValidationTime(new Date().toLocaleTimeString());
  };

  const handleSaveDraft = async (nextStep?: number) => {
    if (!draft) return;
    setIsSaving(true);
    setErrorMsgs([]);
    setSuccessMsg('');

    const targetStep = nextStep !== undefined ? nextStep : currentStep;
    const payload = getPayload();
    payload.currentStep = targetStep;

    // Sprint 4A Persistence Hotfix — RULE 1 (verified pipeline). saveDraft
    // now returns true ONLY when the repository roundtrip verified the
    // persisted draft matches this payload. On any failure we must NOT tell
    // the user the save succeeded (RULE 5).
    let success = false;
    try {
      success = await setupService.saveDraft(projectId, payload);
    } catch (e) {
      console.error('[Wizard] saveDraft threw', e);
      success = false;
    }

    if (success) {
      // RULES 3 + 4 — rehydrate from the repository (never from `payload`).
      // The service already refreshed the cache; here we resync wizard state
      // to whatever the repository now considers canonical.
      try {
        await hydrateFromRepository(targetStep);
      } catch (e) {
        console.error('[Wizard] rehydrate after save failed', e);
        setIsSaving(false);
        setErrorMsgs([isAr ? 'تم الحفظ لكن فشل التحديث. يرجى إعادة فتح المشروع.' : 'Saved, but reload failed. Please reopen the project.']);
        return;
      }
      setIsSaving(false);
      if (nextStep === undefined) {
        setSuccessMsg(isAr ? 'تم حفظ المسودة بنجاح!' : 'Draft saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } else {
      setIsSaving(false);
      // RULE 5 — never show success unless verification passed.
      setErrorMsgs([isAr ? 'فشل الحفظ — تحقق من قاعدة البيانات أو حاول مرة أخرى.' : 'Save failed — repository verification did not confirm the write. Please retry.']);
    }
  };

  const toggleDocument = (docName: string) => {
    if (uploadedDocs.includes(docName)) {
      setUploadedDocs(uploadedDocs.filter(d => d !== docName));
    } else {
      setUploadedDocs([...uploadedDocs, docName]);
    }
  };

  const handleAddExtraMember = () => {
    setExtraMembers([...extraMembers, { roleId: 'PE', employeeId: '' }]);
  };

  const handleRemoveExtraMember = (idx: number) => {
    setExtraMembers(extraMembers.filter((_, i) => i !== idx));
  };

  const handleUpdateExtraMember = (idx: number, field: 'roleId' | 'employeeId', value: string) => {
    const updated = [...extraMembers];
    updated[idx] = { ...updated[idx], [field]: value } as any;
    setExtraMembers(updated);
  };

  const handleActivateProject = async () => {
    setErrorMsgs([]);
    setIsSaving(true);

    if (project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION) {
      const response = await setupService.activateProject(projectId);
      if (response.policyResult) setPolicyResult(response.policyResult);
      setIsSaving(false);
      if (response.success) {
        setSuccessMsg(isAr ? 'تم تفعيل المشروع بنجاح!' : 'Project activated successfully!');
        setTimeout(() => onComplete(), 500);
      } else {
        setErrorMsgs(response.errors);
      }
    } else {
      const payload = getPayload();
      const response = await setupService.completeSetup(projectId, payload);
      setIsSaving(false);
      if (response.success) {
        const repo = new ProjectRepository();
        const proj = await repo.getById(projectId);
        setProject(proj);
        const atts = await repo.getAttachments(projectId);
        setProjectAttachments(atts);
        setSuccessMsg(isAr ? 'اكتملت التهيئة! المشروع الآن جاهز للتفعيل.' : 'Setup completed! The project is now ready for activation.');
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsgs(response.errors);
      }
    }
  };

  if (!draft) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Users className="w-6 h-6 animate-spin mr-2" />
        <span>Loading project setup workspace...</span>
      </div>
    );
  }

  // Sprint 4A.1 (Part 2): "Setup Center" cards. Each maps to an independent, separately
  // saved section — no forced linear order. Placeholder cards (Calendars/Approvals/
  // Notifications) are Advisory-tier only (Part 3): informational, never block anything,
  // and are listed here so the module surface won't need rework when those domains land.
  const steps = [
    { id: 1, icon: DollarSign, label: { en: 'Commercial', ar: 'البيانات المالية' }, validationKey: 'commercial' as const },
    { id: 2, icon: Calendar, label: { en: 'Schedule', ar: 'البرنامج الزمني' }, validationKey: 'schedule' as const },
    { id: 3, icon: Users, label: { en: 'Project Office', ar: 'مكتب المشروع' }, validationKey: 'office' as const },
    { id: 4, icon: FileText, label: { en: 'Documents', ar: 'المستندات' }, validationKey: 'documents' as const }
  ];

  const advisoryCards = [
    { icon: CalendarClock, label: { en: 'Calendars', ar: 'التقويمات' } },
    { icon: Stamp, label: { en: 'Approvals', ar: 'مصفوفة الاعتماد' } },
    { icon: Bell, label: { en: 'Notifications', ar: 'الإشعارات' } }
  ];

  const lastUpdatedLabel = draft.lastSaved ? new Date(draft.lastSaved).toLocaleString(isAr ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">

      {/* Wizard Timeline Step Header */}
      <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-brand-navy/10 text-brand-navy rounded-lg font-extrabold font-mono">
            SETUP
          </span>
          <div>
            <h4 className="font-extrabold text-brand-navy dark:text-slate-100">
              {isAr ? 'مركز تهيئة المشروع' : 'Project Setup Center'}
            </h4>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'أكمل كل قسم بشكل مستقل، واحفظ التقدم، وعُد لاحقاً في أي وقت.' : 'Complete each section independently, save progress, and resume anytime.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[9px] text-slate-400 font-semibold hidden sm:flex items-center gap-1">
            <Clock3 className="w-3 h-3" />
            {isAr ? 'آخر تحديث:' : 'Last updated:'} {lastUpdatedLabel}
          </span>
          <button
            onClick={() => handleSaveDraft()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isAr ? 'حفظ مسودة' : 'Save Draft'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex gap-2 items-center font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsgs.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl space-y-1 font-bold">
          <div className="flex gap-2 items-center">
            <ShieldAlert className="w-4 h-4" />
            <span>{isAr ? 'لا يمكن إكمال التفعيل بسبب المشاكل التالية:' : 'Activation blocked due to the following requirements:'}</span>
          </div>
          <ul className="list-disc list-inside pl-6 text-[11px] font-medium space-y-0.5">
            {errorMsgs.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {currentStep === 0 ? (
        /* SETUP CENTER — modular independent cards (Part 2). No forced order; each
           section shows its own Status / Progress % / Validation state / Last updated. */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(step => {
            const validation = (detailedValidations?.[step.validationKey]) as { isValid?: boolean; errors?: string[]; warnings?: string[] } | undefined;
            const isCompleted = (draft.completedSteps || []).includes(step.id);
            const hasErrors = (validation?.errors?.length || 0) > 0;
            const hasWarnings = (validation?.warnings?.length || 0) > 0;
            const errorCount = validation?.errors?.length || 0;

            return (
              <button
                key={step.id}
                onClick={() => handleSaveDraft(step.id)}
                className="text-left rtl:text-right p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl hover:border-brand-navy/40 hover:shadow-sm transition-all cursor-pointer flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`p-2 rounded-xl ${validation?.isValid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 dark:bg-slate-850 text-slate-400'}`}>
                    <step.icon className="w-4 h-4" />
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                    validation?.isValid
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : hasWarnings && !hasErrors
                      ? 'bg-amber-50 border-amber-100 text-amber-700'
                      : 'bg-slate-50 border-slate-150 text-slate-400'
                  }`}>
                    {validation?.isValid ? (isAr ? 'مكتمل' : 'COMPLETE') : (isAr ? 'غير مكتمل' : 'INCOMPLETE')}
                  </span>
                </div>
                <div>
                  <h5 className="font-extrabold text-brand-navy dark:text-slate-100 text-xs">
                    <BiText text={step.label} primaryLang={lang} stacked={false} />
                  </h5>
                  {errorCount > 0 && (
                    <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{errorCount} {isAr ? 'ملاحظة معلقة' : 'item(s) pending'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${validation?.isValid ? 'bg-emerald-500' : hasErrors ? 'bg-rose-400' : 'bg-amber-500'}`}
                      style={{ width: `${validation?.isValid ? '100' : hasErrors ? '25' : '60'}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400">{validation?.isValid ? '100' : hasErrors ? '0' : '60'}%</span>
                </div>
              </button>
            );
          })}

          {advisoryCards.map((card, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50/60 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-3 opacity-70"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-400">
                  <card.icon className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black rounded-full border bg-slate-50 border-slate-150 text-slate-400">
                  {isAr ? 'قريباً' : 'ADVISORY'}
                </span>
              </div>
              <div>
                <h5 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs">
                  <BiText text={card.label} primaryLang={lang} stacked={false} />
                </h5>
                <p className="text-[9px] text-slate-400 mt-0.5">{isAr ? 'لا يمنع التفعيل — قيد التطوير في مرحلة لاحقة.' : 'Never blocks activation — planned for a future phase.'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleSaveDraft(0)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-brand-navy cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isAr ? '← العودة إلى مركز التهيئة' : '← Back to Setup Center'}</span>
          </button>
        </div>
      )}

      {/* Content areas per step */}
      {currentStep !== 0 && (
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 min-h-[300px]">

        {/* Step 1: Commercial */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h4 className="font-extrabold text-brand-navy dark:text-slate-100 border-b pb-2 mb-4">
              {isAr ? 'التهيئة المالية والتجارية للمشروع' : 'Commercial & Financial Configuration'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'العملة التعاقدية' : 'Contract Currency'}
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="EGP">EGP - Egyptian Pound</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'العملة الرئيسية للشركة' : 'Base Currency'}
                </label>
                <select
                  value={baseCurrency}
                  onChange={e => setBaseCurrency(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="EGP">EGP - Egyptian Pound</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'صاحب العمل (Employer)' : 'Employer'}
                </label>
                <input
                  type="text"
                  value={employer}
                  onChange={e => setEmployer(e.target.value)}
                  placeholder="Enter Employer Name"
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              {currency !== baseCurrency && (
                <>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      {isAr ? 'سعر الصرف' : 'Exchange Rate'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={exchangeRate}
                      onChange={e => setExchangeRate(Number(e.target.value))}
                      className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      {isAr ? 'تاريخ سعر الصرف' : 'Exchange Rate Date'}
                    </label>
                    <input
                      type="date"
                      value={exchangeRateDate}
                      onChange={e => setExchangeRateDate(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      {isAr ? 'مصدر سعر الصرف' : 'Exchange Rate Source'}
                    </label>
                    <select
                      value={exchangeRateSource}
                      onChange={e => setExchangeRateSource(e.target.value as any)}
                      className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Central Bank">Central Bank</option>
                      <option value="ERP">ERP</option>
                      <option value="API">API</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'نوع العقد' : 'Contract Type'}
                </label>
                <select
                  value={contractType}
                  onChange={e => setContractType(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="Lump Sum">Lump Sum (مقطوعية)</option>
                  <option value="Unit Rate">Unit Rate (جدول كميات)</option>
                  <option value="Cost Plus">Cost Plus (تكلفة زائد هامش)</option>
                  <option value="Design & Build">Design & Build (تصميم وتنفيذ)</option>
                  <option value="Target Cost">Target Cost (التكلفة المستهدفة)</option>
                  <option value="Reimbursable">Reimbursable (مسترد التكلفة)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'مركز تكلفة النظام' : 'Enterprise Cost Center Code'}
                </label>
                <input
                  type="text"
                  value={costCenter}
                  onChange={e => setCostCenter(e.target.value)}
                  placeholder="e.g. CC-ZED-02"
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'نسبة الاستقطاع الاحتياطي (%)' : 'Retention Percentage (%)'}
                </label>
                <input
                  type="number"
                  value={retentionPct}
                  onChange={e => setRetentionPct(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'نسبة الدفعة المقدمة (%)' : 'Advance Payment Percentage (%)'}
                </label>
                <input
                  type="number"
                  value={advancePct}
                  onChange={e => setAdvancePct(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'نسبة ضريبة القيمة المضافة (%)' : 'VAT Percentage (%)'}
                </label>
                <input
                  type="number"
                  value={vatPct}
                  onChange={e => setVatPct(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h4 className="font-extrabold text-brand-navy dark:text-slate-100 border-b pb-2 mb-4">
              {isAr ? 'البرنامج التعاقدي وفترة التجهيز' : 'Contractual Timeline & Mobilization'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'تاريخ المباشرة المعتمد (Commencement)' : 'Official Commencement Date'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'مدة العقد الكلية (بالأيام)' : 'Contract Duration (Days)'}
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'تاريخ انتهاء المشروع التعاقدي المستهدف' : 'Calculated Contractual Completion Date'}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-slate-600 font-mono font-bold border border-slate-150">
                  {calculateCompletionDate() || 'Enter Commencement & Duration'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'فترة التجهيز والموبلايزيشن (بالأيام)' : 'Mobilization Period (Days)'}
                </label>
                <input
                  type="number"
                  value={mobPeriod}
                  onChange={e => setMobPeriod(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'تاريخ جاهزية الموقع / انتهاء التجهيز' : 'Calculated Site Mobilization Date'}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-slate-600 font-mono font-bold border border-slate-150">
                  {calculateMobilizationDate() || 'Enter Commencement Date'}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Step 3: Project Office */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h4 className="font-extrabold text-brand-navy dark:text-slate-100 border-b pb-2 mb-4">
              {isAr ? 'تسكين فريق عمل إدارة المشروع' : 'Project Office Roles Assignment'}
            </h4>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border rounded-2xl space-y-4">
                <h5 className="font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wide text-[10px]">
                  {isAr ? 'الأدوار التعاقدية الإلزامية لتفعيل المشروع' : 'Mandatory Execution Personnel (Required)'}
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      {isAr ? 'مدير المشروع (Project Manager)' : 'Project Manager (PM)'}
                    </label>
                    <select
                      value={pmId}
                      onChange={e => setPmId(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200 font-sans"
                    >
                      <option value="">{isAr ? '-- اختر مدير المشروع --' : '-- Select Project Manager --'}</option>
                      {MOCK_EMPLOYEES.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      {isAr ? 'مدير الموقع (Site Manager)' : 'Site Manager (SM)'}
                    </label>
                    <select
                      value={smId}
                      onChange={e => setSmId(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200 font-sans"
                    >
                      <option value="">{isAr ? '-- اختر مدير الموقع --' : '-- Select Site Manager --'}</option>
                      {MOCK_EMPLOYEES.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      {isAr ? 'مراقب العقد والتسويات' : 'Contract Administrator (CA)'}
                    </label>
                    <select
                      value={caId}
                      onChange={e => setCaId(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200 font-sans"
                    >
                      <option value="">{isAr ? '-- اختر مراقب العقد --' : '-- Select Contract Admin --'}</option>
                      {MOCK_EMPLOYEES.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Dynamic roles block */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {isAr ? 'الأعضاء والمهندسين المساعدين' : 'Additional Project Office Roles (Optional)'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddExtraMember}
                    className="text-[10px] font-bold text-brand-red hover:underline"
                  >
                    + {isAr ? 'إضافة دور جديد' : 'Assign New Role'}
                  </button>
                </div>

                <div className="space-y-3">
                  {extraMembers.map((member, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-white dark:bg-slate-900 border p-3 rounded-xl">
                      <div className="flex-1 grid grid-cols-2 gap-4 font-sans text-xs">
                        <select
                          value={member.roleId}
                          onChange={e => handleUpdateExtraMember(idx, 'roleId', e.target.value)}
                          className="p-2 border rounded-lg bg-white"
                        >
                          <option value="PE">Planning Engineer (مهندس تخطيط)</option>
                          <option value="CC">Cost Controller (مراقب تكاليف)</option>
                          <option value="QC">QA/QC Engineer (مهندس جودة)</option>
                          <option value="HSE">HSE Engineer (مهندس سلامة)</option>
                          <option value="DC">Document Controller (مراقب مستندات)</option>
                          <option value="PR">Procurement Engineer (مهندس مشتريات)</option>
                        </select>
                        <select
                          value={member.employeeId}
                          onChange={e => handleUpdateExtraMember(idx, 'employeeId', e.target.value)}
                          className="p-2 border rounded-lg bg-white"
                        >
                          <option value="">{isAr ? '-- اختر الموظف --' : '-- Select Employee --'}</option>
                          {MOCK_EMPLOYEES.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraMember(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold font-sans text-xs shrink-0 cursor-pointer"
                      >
                        {isAr ? 'حذف' : 'Remove'}
                      </button>
                    </div>
                  ))}

                  {extraMembers.length === 0 && (
                    <p className="text-center text-slate-400 py-3 text-[11px]">
                      {isAr ? 'لا توجد تعيينات إضافية حالياً.' : 'No additional role assignments configured.'}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Step 4: Documents Readiness */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h4 className="font-extrabold text-brand-navy dark:text-slate-100 border-b pb-2 mb-4">
              {isAr ? 'تدقيق جاهزية المستندات والمخططات الإنشائية' : 'Project Documents Readiness checklist'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/20 p-4 border rounded-2xl mb-4">
              {isAr 
                ? 'وفقاً لسياسة الجودة في رواد، لا يمكن تفعيل المشروع لبدء التقديم أو الفوترة قبل تدقيق وحصر المستندات الستة الإلزامية التالية:' 
                : 'In alignment with PMO corporate compliance, project setup activation is blocked until the following six mandatory contractual records are uploaded and verified:'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MANDATORY_DOCS.map((doc) => {
                const isUploaded = uploadedDocs.includes(doc);
                return (
                  <label
                    key={doc}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all
                      ${isUploaded 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-300 text-slate-800' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-400 hover:border-slate-350'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isUploaded}
                        onChange={() => toggleDocument(doc)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="font-bold text-xs">{doc}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${isUploaded ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-150 text-slate-400'}`}>
                      {isUploaded ? (isAr ? 'تم التحقق' : 'VERIFIED') : (isAr ? 'معلق' : 'PENDING')}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

      </div>
      )}

      {currentStep !== 0 && currentStep < 4 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => { if (currentStep > 1) handleSaveDraft(currentStep - 1); }}
            disabled={currentStep === 1 || isSaving}
            className={`flex items-center gap-1 px-4 py-2 border rounded-lg font-bold cursor-pointer transition-all text-[11px]
              ${currentStep === 1
                ? 'border-slate-150 text-slate-300 cursor-not-allowed'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }
            `}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isAr ? 'السابق' : 'Previous Step'}</span>
          </button>

          <button
            onClick={() => handleSaveDraft(currentStep + 1)}
            disabled={isSaving}
            className="flex items-center gap-1 px-4 py-2 bg-brand-navy text-white hover:bg-brand-navy/90 rounded-lg font-bold cursor-pointer transition-all text-[11px]"
          >
            <span>{isAr ? 'التالي' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {currentStep === 4 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => handleSaveDraft(3)}
            disabled={isSaving}
            className="flex items-center gap-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold cursor-pointer transition-all text-[11px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isAr ? 'السابق' : 'Previous Step'}</span>
          </button>

          <button
            onClick={() => handleSaveDraft(0)}
            disabled={isSaving}
            className="flex items-center gap-1 px-4 py-2 bg-brand-navy text-white hover:bg-brand-navy/90 rounded-lg font-bold cursor-pointer transition-all text-[11px]"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{isAr ? 'العودة إلى مركز التهيئة' : 'Back to Setup Center'}</span>
          </button>
        </div>
      )}

      {/* ACTIVATION READINESS DASHBOARD (Part 5) — always visible, not gated behind a
          step. Per-section progress bars replace the old single percentage so users can
          see exactly what's complete and what's blocking activation at a glance. */}
      <div id="activation-readiness-dashboard" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-slate-150 dark:border-slate-800 pt-6">
          <div>
            <h4 className="font-extrabold text-brand-navy dark:text-slate-100">
              {isAr ? 'مراجعة جاهزية تفعيل وتدقيق المشروع' : 'Activation Readiness Review'}
            </h4>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'التحقق من جاهزية التهيئة قبل تفعيل عمليات التنفيذ' : 'Verify configuration readiness before enabling execution operations.'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 px-4 py-2 rounded-xl">
            {/* Use authoritative policy score when available, fall back to step validator score */}
            {(() => {
              const displayScore = project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION && policyResult
                ? policyResult.readinessScore
                : readinessScore;
              return (<>
                <span className={`text-xl font-black font-mono ${displayScore >= 80 ? 'text-emerald-600' : displayScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {displayScore}%
                </span>
                <span className="text-[9px] font-black uppercase text-slate-500 block leading-tight">
                  {displayScore === 100
                    ? (isAr ? 'جاهز بالكامل' : 'FULLY READY')
                    : displayScore >= 75
                    ? (isAr ? 'جاهز للتفعيل' : 'READY FOR ACTIVATION')
                    : (isAr ? 'بحاجة لمستندات' : 'INCOMPLETE')}
                </span>
              </>);
            })()}
          </div>
        </div>

        {/* Per-section readiness bars — uses Policy result when project is in PENDING_ACTIVATION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map(step => {
            const stepName = step.validationKey;
            const stepRes = (policyResult?.stepResults as any)?.[stepName] || (detailedValidations as any)?.[step.validationKey];
            const pass = stepRes?.pass ?? stepRes?.isValid ?? false;
            return (
              <div key={step.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <step.icon className="w-3.5 h-3.5 text-slate-400" />
                    <BiText text={step.label} primaryLang={lang} stacked={false} />
                  </span>
                  <span className={`text-[9px] font-mono font-black ${pass ? 'text-emerald-600' : 'text-rose-500'}`}>{pass ? '100' : '0'}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pass ? 'bg-emerald-500' : 'bg-rose-400'}`}
                    style={{ width: `${pass ? 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Checklist review status panel — uses authoritative policy result when available */}
              <div className="md:col-span-2 p-5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 rounded-2xl space-y-4">
                <h5 className="font-extrabold text-brand-navy dark:text-slate-100 tracking-wide text-[10px] uppercase">
                  {isAr ? 'تدقيق مصفوفة الجاهزية الإدارية والتعاقدية' : 'Activation Readiness Checklist Verification'}
                </h5>

                <div className="space-y-3">
                  {[
                    { 
                      id: 'comm', 
                      label: { en: 'Commercial Policy', ar: 'السياسة المالية والتعاقدية' }, 
                      val: policyResult?.stepResults?.commercial?.pass ?? detailedValidations?.commercial?.isValid,
                      errors: policyResult?.stepResults?.commercial?.errors || detailedValidations?.commercial?.errors || [],
                      warnings: policyResult?.stepResults?.commercial?.warnings || detailedValidations?.commercial?.warnings || []
                    },
                    { 
                      id: 'timeline', 
                      label: { en: 'Schedule Policy', ar: 'سياسة البرنامج الزمني' }, 
                      val: policyResult?.stepResults?.schedule?.pass ?? detailedValidations?.schedule?.isValid,
                      errors: policyResult?.stepResults?.schedule?.errors || detailedValidations?.schedule?.errors || [],
                      warnings: policyResult?.stepResults?.schedule?.warnings || detailedValidations?.schedule?.warnings || []
                    },
                    { 
                      id: 'team', 
                      label: { en: 'Project Office Policy', ar: 'سياسة تعيينات فريق العمل' }, 
                      val: policyResult?.stepResults?.office?.pass ?? detailedValidations?.office?.isValid,
                      errors: policyResult?.stepResults?.office?.errors || detailedValidations?.office?.errors || [],
                      warnings: policyResult?.stepResults?.office?.warnings || detailedValidations?.office?.warnings || []
                    },
                    { 
                      id: 'docs', 
                      label: { en: 'Documents Policy', ar: 'سياسة تدقيق المستندات' }, 
                      val: policyResult?.stepResults?.documents?.pass ?? detailedValidations?.documents?.isValid,
                      errors: policyResult?.stepResults?.documents?.errors || detailedValidations?.documents?.errors || [],
                      warnings: policyResult?.stepResults?.documents?.warnings || detailedValidations?.documents?.warnings || []
                    }
                  ].map(policy => (
                    <div key={policy.id} className="p-3 bg-white dark:bg-slate-900 border rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          <BiText text={policy.label} primaryLang={lang} stacked={false} />
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${policy.val ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : policy.warnings.length > 0 && policy.errors.length === 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                          {policy.val 
                            ? (isAr ? 'مستوفى' : 'PASS') 
                            : policy.warnings.length > 0 && policy.errors.length === 0
                            ? (isAr ? 'تحذير' : 'WARNING')
                            : (isAr ? 'غير مكتمل' : 'FAIL')}
                        </span>
                      </div>
                      
                      {/* Detailed warnings/errors list */}
                      {(policy.errors.length > 0 || policy.warnings.length > 0) && (
                        <div className="space-y-1 pl-3 text-[10px] text-slate-500 font-semibold border-l border-slate-100 dark:border-slate-850">
                          {policy.errors.map((err: string, i: number) => (
                            <div key={`err-${i}`} className="text-rose-600 flex items-center gap-1.5">
                              <span className="w-1 h-1 bg-rose-500 rounded-full shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                          {policy.warnings.map((warn: string, i: number) => (
                            <div key={`warn-${i}`} className="text-amber-600 flex items-center gap-1.5">
                              <span className="w-1 h-1 bg-amber-500 rounded-full shrink-0" />
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activation action triggers */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 rounded-2xl flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    {isAr ? 'حالة التفعيل والتشغيل' : 'Activation Gate Status'}
                  </span>
                  <div className="flex gap-2 items-center">
                    <ShieldAlert className="w-5 h-5 text-slate-400" />
                    <span className="font-black text-brand-navy dark:text-slate-200">
                      {project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION
                        ? (isAr ? 'جاهز للتفعيل المالي' : 'READY FOR ACTIVATION')
                        : stepValidations.every(v => v.isValid) 
                        ? (isAr ? 'جاهز لإكمال التهيئة' : 'READY TO COMPLETE SETUP')
                        : (isAr ? 'تهيئة معلقة' : 'BLOCKED')
                      }
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-2 font-sans">
                    {project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION
                      ? (isAr
                        ? 'المشروع خضع للموافقة المبدئية ومستعد لبدء المطالبات المالية والمستخلصات والأوامر التغييرية.'
                        : 'The project setup has been approved and is ready for full commercial activation.')
                      : (isAr
                        ? 'تأكيد إكمال التهيئة سيقوم بالتحقق من الحقول وتجميد المسودة وتقديم طلب التنشيط.'
                        : 'Completing setup will validate the parameters, lock draft inputs, and queue for activation.')
                    }
                  </p>
                </div>

                <button
                  onClick={handleActivateProject}
                  disabled={
                    project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION
                      ? isSaving
                      : (!stepValidations.every(v => v.isValid) || isSaving)
                  }
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs font-sans text-xs
                    ${(project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION || stepValidations.every(v => v.isValid))
                      ? 'bg-brand-red text-white hover:bg-brand-red/90'
                      : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                    }
                  `}
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION
                      ? (isAr ? 'تفعيل المشروع وبدء التنفيذ' : 'Activate Project')
                      : (isAr ? 'تأكيد إكمال التهيئة' : 'Complete Setup')
                    }
                  </span>
                </button>
              </div>

            </div>
          </div>

      {/* QA DEBUG PANEL — DEV MODE ONLY */}
      {DEV_MODE && (
        <div className="border-2 border-dashed border-amber-400 bg-amber-50/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-amber-600" />
              <span className="font-black text-amber-800 text-xs">QA DEBUG PANEL</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="text-[9px] font-bold text-amber-600 hover:underline cursor-pointer"
            >
              {showDebugPanel ? 'HIDE' : 'EXPAND'}
            </button>
          </div>

          {showDebugPanel && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono">
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Workflow State</span>
                  <span className="font-bold text-slate-800">{project?.workflowState || 'undefined'}</span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Lifecycle Stage</span>
                  <span className="font-bold text-slate-800">{project?.lifecycleStage || 'undefined'}</span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Status</span>
                  <span className="font-bold text-slate-800">{project?.status || 'undefined'}</span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Readiness %</span>
                  <span className="font-bold text-slate-800">
                    {project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION && policyResult
                      ? `${policyResult.readinessScore}%`
                      : `${readinessScore}%`}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Draft Exists</span>
                  <span className="font-bold text-slate-800">{String(Boolean(project?.setupDraft))}</span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Attachments Count</span>
                  <span className="font-bold text-slate-800">{projectAttachments.length}</span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Repository Save Status</span>
                  <span className="font-bold text-slate-800">{isSaving ? 'Saving...' : 'Persisted / Idle'}</span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Last Validation Time</span>
                  <span className="font-bold text-slate-800">{lastValidationTime || 'N/A'}</span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Commercial</span>
                  <span className={`font-bold ${
                    (policyResult?.stepResults?.commercial?.pass ?? detailedValidations?.commercial?.isValid)
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}>
                    {(policyResult?.stepResults?.commercial?.pass ?? detailedValidations?.commercial?.isValid) ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Schedule</span>
                  <span className={`font-bold ${
                    (policyResult?.stepResults?.schedule?.pass ?? detailedValidations?.schedule?.isValid)
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}>
                    {(policyResult?.stepResults?.schedule?.pass ?? detailedValidations?.schedule?.isValid) ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Office</span>
                  <span className={`font-bold ${
                    (policyResult?.stepResults?.office?.pass ?? detailedValidations?.office?.isValid)
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}>
                    {(policyResult?.stepResults?.office?.pass ?? detailedValidations?.office?.isValid) ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200">
                  <span className="font-black text-slate-400 block">Documents</span>
                  <span className={`font-bold ${
                    (policyResult?.stepResults?.documents?.pass ?? detailedValidations?.documents?.isValid)
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}>
                    {(policyResult?.stepResults?.documents?.pass ?? detailedValidations?.documents?.isValid) ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200 col-span-2">
                  <span className="font-black text-slate-400 block">Policy Result Allowed</span>
                  <span className={`font-bold ${
                    project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION
                      ? (policyResult?.activationAllowed ? 'text-emerald-600' : 'text-rose-600')
                      : 'text-slate-400'
                  }`}>
                    {project?.workflowState === ProjectWorkflowState.PENDING_ACTIVATION
                      ? (policyResult?.activationAllowed ? 'ALLOWED' : 'BLOCKED')
                      : 'NOT PENDING_ACTIVATION'}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 space-y-1 border border-amber-200 col-span-2">
                  <span className="font-black text-slate-400 block">Policy Errors</span>
                  <span className="font-bold text-rose-600 text-[9px] block max-h-12 overflow-y-auto">
                    {policyResult?.errors?.join(', ') || 'None'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2">
                <span className="font-black text-slate-400 text-[10px] font-mono block">ACTIVATION LOGS</span>
                <div className="font-mono text-[9px] max-h-40 overflow-y-auto space-y-1.5 bg-slate-900 text-slate-200 p-3 rounded-lg">
                  {setupService.getActivationLogs().length === 0 ? (
                    <span className="text-slate-500">No activation logs registered. Try activating the project.</span>
                  ) : (
                    setupService.getActivationLogs().map((log, i) => (
                      <div key={i} className="border-b border-slate-800 pb-1 last:border-0 last:pb-0">
                        <span className="text-amber-400">[{log.timestamp}]</span>{' '}
                        <span className="text-emerald-400">[{log.stage}]</span>{' '}
                        <span>{log.message}</span>
                        {log.details && (
                          <pre className="text-[8px] text-slate-400 overflow-x-auto mt-0.5 max-w-full">
                            {JSON.stringify(log.details)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
