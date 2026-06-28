import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';
import { Tender, WizardFormState, TimelineRules } from '../types';
import { TimelineCalculator } from '../../../../business-rules/TimelineCalculator';
import { FinancialsCalculator } from '../../../../business-rules/FinancialsCalculator';
import { Settings } from '../../../../domain/administration/Settings';
import { NumberingService } from '../../../../services/NumberingService';
import { Clock } from '../../../../services/Clock';
import { HealthCalculator } from '../../../../business-rules/HealthCalculator';
import { HealthStatus } from '../../../../enums/HealthStatus';

interface TenderWizardModalProps {
  onClose: () => void;
  isAr: boolean;
  lang: 'ar' | 'en';
  onUpdateList: React.Dispatch<React.SetStateAction<Tender[]>>;
  setSelectedTenderId: (id: string | null) => void;
  setToastAlert: (alert: { type: 'warn' | 'success' | 'info'; message: string } | null) => void;
  settings: Settings;
  list: Tender[];
}

const getInitialWizardState = (settings: Settings, listLength: number): WizardFormState => {
  const seq = listLength + 1;
  const projectCode = NumberingService.generateProjectCode(settings.numberingSettings, seq);
  const tenderNumber = NumberingService.generateTenderNumber(settings.numberingSettings, seq);
  return {
    projectCode,
    tenderNumber,
    projectNameAr: '',
    projectNameEn: '',
    locationEn: 'Riyadh - Saudi Arabia',
    locationAr: 'الرياض - المملكة العربية السعودية',
    tenderTypeEn: 'EPC Contract',
    tenderTypeAr: 'عقد هندسة وتشييد',
    currency: 'SAR',
    estValue: '',
    estCost: '',
    clientEn: 'General Authority Co',
    clientAr: 'الهيئة العامة للتشييد',
    consultantEn: 'Dar Al-Handasah',
    consultantAr: 'دار الهندسة المعتمدة',
    branchEn: 'Riyadh Branch',
    branchAr: 'فرع الرياض الرئيسي',
    businessUnitEn: 'Infrastructure',
    businessUnitAr: 'قطاع البنية التحتية',

    coordinatorEn: 'Eng. Khalid Al-Saeed',
    coordinatorAr: 'المهندس خالد السعيد',
    contractsEngineerEn: 'Ahmed Mostafa',
    contractsEngineerAr: 'أحمد مصطفى',
    tenderStudyEngineerEn: 'Eng. Nour El-Din',
    tenderStudyEngineerAr: 'المهندس نور الدين',
    departmentEn: 'Estimating',
    departmentAr: 'قسم دراسة التكاليف',
    priority: 'Medium',

    techDate: '',
    commDate: '',
    officialDate: '',
    closingDate: '',
    kickOffDate: '',
    alignmentDate: '',
    followUpDate: '',

    riskDueDate: '',
    contractQualsDueDate: '',
    checklistReceived: false,
    checklistDrawings: false,
    checklistBOQ: false,
    checklistSpecs: false,
    siteVisitRequired: false,
    siteVisitDate: '',

    overriddenFields: {},
  };
};

export function TenderWizardModal({
  onClose,
  isAr,
  lang,
  onUpdateList,
  setSelectedTenderId,
  setToastAlert,
  settings,
  list,
}: TenderWizardModalProps) {
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardForm, setWizardForm] = useState<WizardFormState>(() => {
    const saved = localStorage.getItem('preaward_wizard_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return getInitialWizardState(settings, list.length);
  });

  useEffect(() => {
    localStorage.setItem('preaward_wizard_draft', JSON.stringify(wizardForm));
  }, [wizardForm]);

  const rules = settings.timelineRules;

  const clearWizardDraft = () => {
    localStorage.removeItem('preaward_wizard_draft');
    setWizardForm(getInitialWizardState(settings, list.length));
    setWizardStep(1);
  };

  const handleTechDateChange = (newTechDate: string) => {
    if (!newTechDate) {
      setWizardForm(prev => ({ ...prev, techDate: '' }));
      return;
    }

    const calculated: Partial<WizardFormState> = {
      techDate: newTechDate,
    };

    const milestones = TimelineCalculator.calculateMilestones(newTechDate, rules, settings.businessCalendar);

    if (!wizardForm.overriddenFields.kickOffDate) {
      calculated.kickOffDate = milestones.kickOffDate;
    }
    if (!wizardForm.overriddenFields.riskDueDate) {
      calculated.riskDueDate = milestones.riskDueDate;
    }
    if (!wizardForm.overriddenFields.contractQualsDueDate) {
      calculated.contractQualsDueDate = milestones.contractQualsDueDate;
    }
    if (!wizardForm.overriddenFields.alignmentDate) {
      calculated.alignmentDate = milestones.alignmentDate;
    }
    if (!wizardForm.overriddenFields.followUpDate) {
      calculated.followUpDate = milestones.followUpDate;
    }
    if (!wizardForm.overriddenFields.commDate) {
      calculated.commDate = TimelineCalculator.addDays(newTechDate, 12, settings.businessCalendar);
    }

    setWizardForm(prev => ({
      ...prev,
      ...calculated,
    }));
  };

  const updateCommDate = (val: string) => {
    setWizardForm(prev => ({
      ...prev,
      commDate: val,
      overriddenFields: { ...prev.overriddenFields, commDate: true },
    }));
  };

  const updateKickOffDate = (val: string) => {
    setWizardForm(prev => ({
      ...prev,
      kickOffDate: val,
      overriddenFields: { ...prev.overriddenFields, kickOffDate: true },
    }));
  };

  const updateRiskDueDate = (val: string) => {
    setWizardForm(prev => ({
      ...prev,
      riskDueDate: val,
      overriddenFields: { ...prev.overriddenFields, riskDueDate: true },
    }));
  };

  const updateContractQualsDueDate = (val: string) => {
    setWizardForm(prev => ({
      ...prev,
      contractQualsDueDate: val,
      overriddenFields: { ...prev.overriddenFields, contractQualsDueDate: true },
    }));
  };

  const updateAlignmentDate = (val: string) => {
    setWizardForm(prev => ({
      ...prev,
      alignmentDate: val,
      overriddenFields: { ...prev.overriddenFields, alignmentDate: true },
    }));
  };

  const updateFollowUpDate = (val: string) => {
    setWizardForm(prev => ({
      ...prev,
      followUpDate: val,
      overriddenFields: { ...prev.overriddenFields, followUpDate: true },
    }));
  };

  const submitWizardTender = () => {
    if (!wizardForm.projectNameEn || !wizardForm.projectCode) {
      setToastAlert({
        type: 'warn',
        message: isAr ? 'يرجى ملء الاسم الإنجليزي للمشروع والرمز التلقائي.' : 'Please enter Project English Name and automatic Project Code.',
      });
      return;
    }

    if (!wizardForm.techDate || !wizardForm.commDate) {
      setToastAlert({
        type: 'warn',
        message: isAr ? 'تواريخ تقديم العطاء الفني والمالي إلزامية!' : 'Technical and Commercial submission dates are mandatory!',
      });
      return;
    }

    const isDuplicate = list.some(item => item.tenderNumber.trim().toLowerCase() === wizardForm.tenderNumber.trim().toLowerCase());
    if (isDuplicate) {
      setToastAlert({
        type: 'warn',
        message: isAr ? 'رقم المزايدة هذا مسجل بالفعل وموجود بالنظام.' : 'This Tender Number is already registered in the system.',
      });
      return;
    }

    const checklistNotes = [];
    if (wizardForm.checklistReceived) checklistNotes.push('Tender Documents Received');
    if (wizardForm.checklistDrawings) checklistNotes.push('Drawings Received');
    if (wizardForm.checklistBOQ) checklistNotes.push('BOQ Received');
    if (wizardForm.checklistSpecs) checklistNotes.push('Specifications Received');

    const extraNoteText = `Complete Pre-Award Setup Details:
• Tender Study Engineer: ${wizardForm.tenderStudyEngineerEn} (${wizardForm.tenderStudyEngineerAr})
• Department: ${wizardForm.departmentEn} • Priority: ${wizardForm.priority}
• Consultant: ${wizardForm.consultantEn}
• Branch Name: ${wizardForm.branchEn}
• Business Unit: ${wizardForm.businessUnitEn}
• Milestones:
  - Internal Kick-off: ${wizardForm.kickOffDate || 'N/A'} (Suggested: ${!wizardForm.overriddenFields.kickOffDate ? 'Yes' : 'Overridden'})
  - Risk Assessment Due: ${wizardForm.riskDueDate || 'N/A'} (Suggested: ${!wizardForm.overriddenFields.riskDueDate ? 'Yes' : 'Overridden'})
  - Qualifications Due: ${wizardForm.contractQualsDueDate || 'N/A'} (Suggested: ${!wizardForm.overriddenFields.contractQualsDueDate ? 'Yes' : 'Overridden'})
  - 1st Alignment Meeting: ${wizardForm.alignmentDate || 'N/A'} (Suggested: ${!wizardForm.overriddenFields.alignmentDate ? 'Yes' : 'Overridden'})
  - Intermediate Follow-up: ${wizardForm.followUpDate || 'N/A'} (Suggested: ${!wizardForm.overriddenFields.followUpDate ? 'Yes' : 'Overridden'})
  - Official Submission Date: ${wizardForm.officialDate || 'N/A'}
  - Closing Date: ${wizardForm.closingDate || 'N/A'}
• Checklist Completed: ${checklistNotes.join(', ') || 'None'}
• Site Visit: ${wizardForm.siteVisitRequired ? `Required on ${wizardForm.siteVisitDate}` : 'Not Required'}`;

    const parsedValue = FinancialsCalculator.parseToNumber(wizardForm.estValue);
    const parsedCost = FinancialsCalculator.parseToNumber(wizardForm.estCost);
    const calculatedBond = FinancialsCalculator.calculateBidBond(parsedValue, settings.financialSettings);

    const calculatedDaysRemaining = wizardForm.techDate ? Clock.diffInDays(wizardForm.techDate) : 30;
    const calculatedHealth = HealthCalculator.calculate(calculatedDaysRemaining, false, settings.healthSettings);
    let healthStr: 'Healthy' | 'Due Soon' | 'Overdue' | 'Archived' = 'Healthy';
    if (calculatedHealth === HealthStatus.ARCHIVED) {
      healthStr = 'Archived';
    } else if (calculatedHealth === HealthStatus.OVERDUE) {
      healthStr = 'Overdue';
    } else if (calculatedHealth === HealthStatus.DUE_SOON) {
      healthStr = 'Due Soon';
    }

    const createdTender: Tender = {
      id: `t-wizard-${Date.now()}`,
      projectCode: wizardForm.projectCode,
      tenderNumber: wizardForm.tenderNumber || `TN-${Math.floor(1000 + Math.random() * 9000)}`,
      projectName: { en: wizardForm.projectNameEn, ar: wizardForm.projectNameAr || wizardForm.projectNameEn },
      location: { en: wizardForm.locationEn, ar: wizardForm.locationAr },
      coordinator: { en: wizardForm.coordinatorEn, ar: wizardForm.coordinatorAr },
      contractsEngineer: { en: wizardForm.contractsEngineerEn, ar: wizardForm.contractsEngineerAr },
      tenderStudyEngineer: { en: wizardForm.tenderStudyEngineerEn, ar: wizardForm.tenderStudyEngineerAr },
      department: wizardForm.departmentEn,
      priority: wizardForm.priority,
      techSubmissionDate: wizardForm.techDate,
      commSubmissionDate: wizardForm.commDate,
      overallSubmissionDate: wizardForm.officialDate || wizardForm.commDate,
      closingDate: wizardForm.closingDate,
      kickOffDate: wizardForm.kickOffDate,
      alignmentDate: wizardForm.alignmentDate,
      followUpDate: wizardForm.followUpDate,
      riskDueDate: wizardForm.riskDueDate,
      contractQualsDueDate: wizardForm.contractQualsDueDate,
      projectStatus: { en: 'Active Study', ar: 'تحت الدراسة والتقدير' },
      awardStatus: { en: 'Pending Submission', ar: 'قيد تجهيز المغلفات' },
      recordStatus: 'Active',
      daysRemaining: calculatedDaysRemaining,
      health: healthStr,
      estimatedValue: `${wizardForm.currency} ${FinancialsCalculator.formatAmount(parsedValue)}`,
      estimatedCost: `${wizardForm.currency} ${FinancialsCalculator.formatAmount(parsedCost)}`,
      bondAmount: `${wizardForm.currency} ${FinancialsCalculator.formatAmount(calculatedBond)}`,
      currency: wizardForm.currency,
      tenderType: { en: wizardForm.tenderTypeEn, ar: wizardForm.tenderTypeAr },
      clientName: { en: wizardForm.clientEn, ar: wizardForm.clientAr },
      consultant: { en: wizardForm.consultantEn, ar: wizardForm.consultantAr },
      branch: { en: wizardForm.branchEn, ar: wizardForm.branchAr },
      businessUnit: { en: wizardForm.businessUnitEn, ar: wizardForm.businessUnitAr },
      notes: [
        {
          id: `wn-${Date.now()}-1`,
          author: 'ROWAD WIZARD',
          date: Clock.todayISO(),
          text: 'SaaS Guided pre-award wizard completed. System loaded timeline milestones dynamically according to Pre-Award settings.',
        },
        { id: `wn-${Date.now()}-2`, author: 'WIZARD LOG', date: Clock.todayISO(), text: extraNoteText },
      ],
      documents: [],
    };

    onUpdateList(prev => [createdTender, ...prev]);
    onClose();
    setSelectedTenderId(createdTender.id);
    localStorage.removeItem('preaward_wizard_draft');

    setToastAlert({
      type: 'success',
      message: isAr
        ? 'تم إنشاء السجل وتوليد المواعيد والتحذيرات الزمنية وتخزينها للمناقصة الجديدة بنجاح!'
        : 'Tender record generated, scheduling rules applied, and timeline initialized successfully!',
    });
  };

  return (
    <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-[32px] shadow-2xl max-w-6xl w-full p-6 md:p-8 space-y-6 border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto no-scrollbar font-sans"
        onKeyDown={e => {
          if (e.key === 'Escape') onClose();
        }}
      >
        {/* Left side: Wizard Steps core */}
        <div className="flex-1 flex flex-col justify-between space-y-6">
          {/* Header and Draft status */}
          <div className="flex justify-between items-start border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-navy/10 rounded-2xl text-brand-navy shrink-0">
                <FileSignature className="w-6 h-6 text-brand-red" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-brand-navy flex items-center gap-2">
                  {isAr ? 'دليل إنشاء مناقصة جديدة' : 'Pre-Award Guided Tender Wizard'}
                </h3>
                <p className="text-xs text-gray-505 mt-0.5">
                  {isAr
                    ? 'خطوات ذكية متطابقة مع مصفوفة دراسة العطاءات ونظام التقدير للمؤسسة'
                    : 'SaaS-guided pre-award setup with real-time scheduling offsets.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {isAr ? 'مسودة تلقائية' : 'Auto Saving Draft'}
              </span>
              <button
                type="button"
                onClick={clearWizardDraft}
                className="text-[9px] text-gray-400 hover:text-brand-red font-bold underline transition-colors cursor-pointer"
              >
                {isAr ? 'مسح المسودة والبدء من جديد' : 'Clear Draft & Restart'}
              </button>
            </div>
          </div>

          {/* Progress Stepper bar */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { step: 1, id: 'general', labelEn: 'General', labelAr: 'البيانات العامة' },
              { step: 2, id: 'assignments', labelEn: 'Assignments', labelAr: 'التكليفات' },
              { step: 3, id: 'timeline', labelEn: 'Timeline', labelAr: 'الجدول الزمني' },
              { step: 4, id: 'financial', labelEn: 'Financial', labelAr: 'المالية والمستندات' },
              { step: 5, id: 'review', labelEn: 'Review & Submission', labelAr: 'المراجعة والاعتماد' },
            ].map(s => {
              const isActive = wizardStep === s.step;
              const isCompleted = wizardStep > s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < wizardStep || (wizardForm.projectNameEn && wizardForm.projectCode)) {
                      setWizardStep(s.step);
                    }
                  }}
                  className={`flex flex-col items-center py-2.5 rounded-xl border transition-all text-center group cursor-pointer
                    ${
                      isActive
                        ? 'bg-brand-navy border-brand-navy text-white shadow-md'
                        : isCompleted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-gray-50/50 border-gray-100 text-gray-400 hover:bg-gray-55'
                    }`}
                >
                  <span className="text-[10px] font-black tracking-widest font-mono">{isCompleted ? '✓' : `0${s.step}`}</span>
                  <span className="text-[10px] font-bold block truncate max-w-full px-1">{isAr ? s.labelAr : s.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Steps Body */}
          <div className="flex-1 min-h-[365px] max-h-[50vh] overflow-y-auto no-scrollbar py-2 text-xs">
            {/* STEP 1: Project Information */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-[10px] text-brand-red font-black uppercase tracking-wider block">
                  {isAr ? 'القسم الأول: معلومات المشروع' : 'SECTION 1 - PROJECT INFORMATION'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'كود المشروع (توليد تلقائي)' : 'Project Code (Auto Generated)'}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled
                        value={wizardForm.projectCode}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold font-mono text-gray-500 flex-1 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const random = Math.floor(1000 + Math.random() * 9000);
                          setWizardForm(prev => ({ ...prev, projectCode: `PC-2026-R${random}` }));
                        }}
                        className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold cursor-pointer transition-colors"
                        title={isAr ? 'توليد كود آخر' : 'Regenerate unique project code'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'رقم المزايدة *' : 'Tender Number *'}</label>
                    <input
                      type="text"
                      required
                      value={wizardForm.tenderNumber}
                      onChange={e => setWizardForm(prev => ({ ...prev, tenderNumber: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-brand-navy"
                      placeholder="TN-88291"
                    />
                  </div>

                  {isAr ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-450 block">اسم المشروع (بالعربية) *</label>
                      <input
                        type="text"
                        required
                        value={wizardForm.projectNameAr}
                        onChange={e => {
                          const val = e.target.value;
                          setWizardForm(prev => ({ ...prev, projectNameAr: val, projectNameEn: val }));
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                        placeholder="مشروع بناء خط نفط مكرر..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-450 block">Project Name (English) *</label>
                      <input
                        type="text"
                        required
                        value={wizardForm.projectNameEn}
                        onChange={e => {
                          const val = e.target.value;
                          setWizardForm(prev => ({ ...prev, projectNameEn: val, projectNameAr: val }));
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                        placeholder="Refined Oil Pipeline Project..."
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'الموقع الجغرافي' : 'Location'}</label>
                    <input
                      type="text"
                      value={wizardForm.locationEn}
                      onChange={e => setWizardForm(prev => ({ ...prev, locationEn: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                      placeholder="Tabuk - Saudi Arabia"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'نوع المناقصة' : 'Tender Type'}</label>
                    <select
                      value={wizardForm.tenderTypeEn}
                      onChange={e =>
                        setWizardForm(prev => ({
                          ...prev,
                          tenderTypeEn: e.target.value,
                          tenderTypeAr:
                            e.target.value === 'EPC Contract'
                              ? 'عقد هندسة وتشييد'
                              : e.target.value === 'Design & Build'
                              ? 'تصميم وتشييد'
                              : 'عقد تسليم مفتاح',
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option value="EPC Contract">EPC Contract</option>
                      <option value="Design & Build">Design & Build</option>
                      <option value="Lump Sum Turnkey">Lump Sum Turnkey</option>
                      <option value="Unit Rate Measure">Unit Rate Measure</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'العملة' : 'Currency'}</label>
                    <select
                      value={wizardForm.currency}
                      onChange={e => setWizardForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option value="SAR">SAR (Saudi Riyal)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EGP">EGP (Egyptian Pound)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'القيمة التقديرية للمشروع' : 'Estimated Project Value'}</label>
                    <input
                      type="text"
                      value={wizardForm.estValue}
                      onChange={e => setWizardForm(prev => ({ ...prev, estValue: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-brand-navy"
                      placeholder="e.g. 150,000,000"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'تكلفة العطاء التقديرية' : 'Estimated Tender Cost'}</label>
                    <input
                      type="text"
                      value={wizardForm.estCost}
                      onChange={e => setWizardForm(prev => ({ ...prev, estCost: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-brand-navy"
                      placeholder="e.g. 5,000,000"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'العميل / مالك العمل' : 'Client'}</label>
                    <input
                      type="text"
                      value={wizardForm.clientEn}
                      onChange={e => setWizardForm(prev => ({ ...prev, clientEn: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                      placeholder="Aramco"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'الاستشاري' : 'Consultant'}</label>
                    <input
                      type="text"
                      value={wizardForm.consultantEn}
                      onChange={e => setWizardForm(prev => ({ ...prev, consultantEn: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                      placeholder="Dar Al-Handasah"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'الفرع المسؤول' : 'Branch'}</label>
                    <select
                      value={wizardForm.branchEn}
                      onChange={e =>
                        setWizardForm(prev => ({
                          ...prev,
                          branchEn: e.target.value,
                          branchAr: e.target.value === 'Riyadh Branch' ? 'فرع الرياض الرئيسي' : 'فرع دبي الإقليمي',
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Riyadh Branch">Riyadh Branch</option>
                      <option value="Jeddah Branch">Jeddah Branch</option>
                      <option value="Eastern Province">Eastern Province</option>
                      <option value="Dubai District">Dubai District</option>
                      <option value="Cairo Hub">Cairo Hub</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'وحدة الأعمال المقررة' : 'Business Unit'}</label>
                    <select
                      value={wizardForm.businessUnitEn}
                      onChange={e =>
                        setWizardForm(prev => ({
                          ...prev,
                          businessUnitEn: e.target.value,
                          businessUnitAr: e.target.value === 'Infrastructure' ? 'قطاع البنية التحتية' : 'قطاع المباني والأبراج',
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Infrastructure">Infrastructure Unit</option>
                      <option value="Buildings & Towers">Buildings & Towers</option>
                      <option value="Industrial Plants">Industrial Plants</option>
                      <option value="Water & MEP">Water & MEP</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Assignments */}
            {wizardStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-[10px] text-brand-red font-black uppercase tracking-wider block">
                  {isAr ? 'القسم الثاني: التكليفات وفريق العمل' : 'SECTION 2 - ASSIGNMENTS'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'منسق دراسة العطاء' : 'Tender Coordinator'}</label>
                    <select
                      value={wizardForm.coordinatorEn}
                      onChange={e =>
                        setWizardForm(prev => ({
                          ...prev,
                          coordinatorEn: e.target.value,
                          coordinatorAr: e.target.value === 'Eng. Khalid Al-Saeed' ? 'المهندس خالد السعيد' : 'مهندسة ياسمين عمر',
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Eng. Khalid Al-Saeed">Eng. Khalid Al-Saeed</option>
                      <option value="Eng. Yasmin Omar">Eng. Yasmin Omar</option>
                      <option value="Eng. Sherif Amin">Eng. Sherif Amin</option>
                      <option value="Eng. Ramy Fawzy">Eng. Ramy Fawzy</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'مهندس العقود الشريك' : 'Contracts Engineer'}</label>
                    <select
                      value={wizardForm.contractsEngineerEn}
                      onChange={e =>
                        setWizardForm(prev => ({
                          ...prev,
                          contractsEngineerEn: e.target.value,
                          contractsEngineerAr: e.target.value === 'Ahmed Mostafa' ? 'أحمد مصطفى' : 'خالد حسن',
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Ahmed Mostafa">Ahmed Mostafa</option>
                      <option value="Khaled Hassan">Khaled Hassan</option>
                      <option value="Fatma Amer">Fatma Amer</option>
                      <option value="Salim Mansoor">Salim Mansoor</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'مهندس التقديرات الفني' : 'Tender Study Engineer'}</label>
                    <select
                      value={wizardForm.tenderStudyEngineerEn}
                      onChange={e =>
                        setWizardForm(prev => ({
                          ...prev,
                          tenderStudyEngineerEn: e.target.value,
                          tenderStudyEngineerAr: e.target.value === 'Eng. Nour El-Din' ? 'المهندس نور الدين' : 'المهندس طارق قواس',
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Eng. Nour El-Din">Eng. Nour El-Din</option>
                      <option value="Eng. Tareq Kawas">Eng. Tareq Kawas</option>
                      <option value="Eng. Amr Soliman">Eng. Amr Soliman</option>
                      <option value="Eng. Hoda Mansour">Eng. Hoda Mansour</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'الإدارة المختصة' : 'Department'}</label>
                    <select
                      value={wizardForm.departmentEn}
                      onChange={e => setWizardForm(prev => ({ ...prev, departmentEn: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Estimating">Estimating</option>
                      <option value="Contracts">Contracts</option>
                      <option value="Engineering & Design">Engineering & Design</option>
                      <option value="Strategic Procurement">Strategic Procurement</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'أولوية دراسة الملف' : 'Priority'}</label>
                    <select
                      value={wizardForm.priority}
                      onChange={e => setWizardForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical Priority</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Submission Timeline */}
            {wizardStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200 text-sans">
                <span className="text-[10px] text-brand-red font-black uppercase tracking-wider block">
                  {isAr ? 'القسم الثالث: المخطط الزمني وتأريخ تسليم الملفات' : 'SECTION 3 - TIMELINE SUGGESTIONS'}
                </span>

                <div className="p-3 bg-brand-navy/5 text-brand-navy font-bold rounded-2xl flex items-start gap-2 text-[11px] border border-brand-navy/10 leading-relaxed max-w-xl">
                  <Sparkles className="w-5 h-5 text-brand-red shrink-0" />
                  <div>
                    {isAr
                      ? 'ميزة الذكاء الهيكلي نشطة: عند اختيار موعد التسليم الفني، سيقوم النظام تلقائياً بجدولة المواعيد الوسطية بناء على إعدادات الإدارة.'
                      : 'Adaptive schedule suggestion active: Selecting the Technical Submission Date automatically schedules internal milestones.'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-amber-50/40 p-3 rounded-2xl border border-amber-100">
                    <label className="text-[10px] font-black uppercase text-[#183B63] block">{isAr ? 'تاريخ تقديم العرض الفني *' : 'Technical Submission Date *'}</label>
                    <input
                      type="date"
                      required
                      value={wizardForm.techDate}
                      onChange={e => handleTechDateChange(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 bg-amber-50/40 p-3 rounded-2xl border border-amber-100">
                    <label className="text-[10px] font-black uppercase text-[#183B63] block">{isAr ? 'تاريخ تقديم العرض التجاري *' : 'Commercial Submission Date *'}</label>
                    <div className="space-y-1.5">
                      <input
                        type="date"
                        required
                        value={wizardForm.commDate}
                        onChange={e => updateCommDate(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none"
                      />
                      {wizardForm.techDate && !wizardForm.overriddenFields.commDate && (
                        <span className="text-[10px] font-black text-brand-red block">✨ {isAr ? 'مقترح تلقائياً (فني + 12 أيام)' : 'Suggested Automatically (+12 days)'}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'تاريخ التسليم الرسمي' : 'Official Submission Date'}</label>
                    <input
                      type="date"
                      value={wizardForm.officialDate}
                      onChange={e => setWizardForm(prev => ({ ...prev, officialDate: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-250 rounded-xl p-2.5 font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">{isAr ? 'تاريخ إغلاق العطاء' : 'Closing Date'}</label>
                    <input
                      type="date"
                      value={wizardForm.closingDate}
                      onChange={e => setWizardForm(prev => ({ ...prev, closingDate: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-250 rounded-xl p-2.5 font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 p-3 bg-gray-50/50 rounded-2xl border border-gray-150">
                    <label className="text-[10px] font-black uppercase text-gray-450 block">{isAr ? 'الاجتماع التحضيري الداخلي' : 'Internal Kick-off Meeting'}</label>
                    <input
                      type="date"
                      value={wizardForm.kickOffDate}
                      onChange={e => updateKickOffDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 focus:outline-none"
                    />
                    {wizardForm.techDate && !wizardForm.overriddenFields.kickOffDate && (
                      <span className="text-[9px] font-bold text-emerald-600 block">
                        ✨ {isAr ? `تلميح تلقائي (${rules.kickOffOffset} أيام)` : `Suggested Automatically (${rules.kickOffOffset} days)`}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 p-3 bg-gray-50/50 rounded-2xl border border-gray-150">
                    <label className="text-[10px] font-black uppercase text-gray-450 block">{isAr ? 'اجتماع المراجعة والتنسيق الأول' : '1st Alignment Meeting'}</label>
                    <input
                      type="date"
                      value={wizardForm.alignmentDate}
                      onChange={e => updateAlignmentDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 focus:outline-none"
                    />
                    {wizardForm.techDate && !wizardForm.overriddenFields.alignmentDate && (
                      <span className="text-[9px] font-bold text-emerald-600 block">
                        ✨ {isAr ? `تلميح تلقائي (${rules.alignmentOffset} أيام)` : `Suggested Automatically (${rules.alignmentOffset} days)`}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 p-3 bg-gray-50/50 rounded-2xl border border-gray-150">
                    <label className="text-[10px] font-black uppercase text-gray-450 block">{isAr ? 'اجتماع المتابعة البيني' : 'Intermediate Follow-up'}</label>
                    <input
                      type="date"
                      value={wizardForm.followUpDate}
                      onChange={e => updateFollowUpDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 focus:outline-none"
                    />
                    {wizardForm.techDate && !wizardForm.overriddenFields.followUpDate && (
                      <span className="text-[9px] font-bold text-emerald-600 block">
                        ✨ {isAr ? `تلميح تلقائي (${rules.intermediateFollowUpOffset} أيام)` : `Suggested Automatically (${rules.intermediateFollowUpOffset} days)`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Contract Activities & Checklist */}
            {wizardStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-[10px] text-brand-red font-black uppercase tracking-wider block">
                  {isAr ? 'الجمع الرابع: متطلبات التعاقد والمستندات المستلمة' : 'SECTION 4 - CONTRACT ACTIVITIES & CHECKLIST'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3 bg-gray-50/50 rounded-2xl border border-gray-150">
                    <label className="text-[10px] font-black uppercase text-gray-450 block">{isAr ? 'الحد الأقصى لتقرير المخاطر' : 'Risk Assessment Due'}</label>
                    <input
                      type="date"
                      value={wizardForm.riskDueDate}
                      onChange={e => updateRiskDueDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 focus:outline-none"
                    />
                    {wizardForm.techDate && !wizardForm.overriddenFields.riskDueDate && (
                      <span className="text-[9px] font-bold text-emerald-600 block">
                        ✨ {isAr ? `تلميح تلقائي (${rules.riskAssessmentOffset} أيام)` : `Suggested Automatically (${rules.riskAssessmentOffset} days)`}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 p-3 bg-gray-50/50 rounded-2xl border border-gray-150">
                    <label className="text-[10px] font-black uppercase text-gray-450 block">{isAr ? 'الحد الأقصى للمؤهلات القانونية' : 'Contract Qualifications Due'}</label>
                    <input
                      type="date"
                      value={wizardForm.contractQualsDueDate}
                      onChange={e => updateContractQualsDueDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 focus:outline-none"
                    />
                    {wizardForm.techDate && !wizardForm.overriddenFields.contractQualsDueDate && (
                      <span className="text-[9px] font-bold text-emerald-600 block">
                        ✨ {isAr ? `تلميح تلقائي (${rules.contractQualificationOffset} أيام)` : `Suggested Automatically (${rules.contractQualificationOffset} days)`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Checklists */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-3">
                  <span className="text-[10px] text-brand-navy font-black block tracking-wider uppercase">🔧 {isAr ? 'كشف مستندات ومرفقات العطاء' : 'DOCUMENT RECEIPT CHECKLIST'}</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'checklistReceived', labelAr: 'تحقق مستندات العطاء الرئيسية', labelEn: 'Tender Documents Received' },
                      { key: 'checklistDrawings', labelAr: 'استلام المخططات والرسوم الهندسية', labelEn: 'Drawings Received' },
                      { key: 'checklistBOQ', labelAr: 'استلام كشف جداول الكميات (BOQ)', labelEn: 'BOQ Received' },
                      { key: 'checklistSpecs', labelAr: 'استلام المواصفات وكراسة الشروط', labelEn: 'Specifications Received' },
                    ].map(chk => (
                      <label key={chk.key} className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-gray-150 hover:bg-gray-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(wizardForm as any)[chk.key]}
                          onChange={e => setWizardForm(prev => ({ ...prev, [chk.key]: e.target.checked }))}
                          className="rounded text-brand-red focus:ring-brand-red w-4 h-4 cursor-pointer"
                        />
                        <span className="font-bold text-gray-650">{isAr ? chk.labelAr : chk.labelEn}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Site Visit Selection */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-3">
                  <span className="text-[10px] text-brand-navy font-black block tracking-wider uppercase">🏗️ {isAr ? 'معاينة الموقع الفعلي للمشروع' : 'SITE VISIT CONTROL'}</span>

                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-150 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizardForm.siteVisitRequired}
                        onChange={e => setWizardForm(prev => ({ ...prev, siteVisitRequired: e.target.checked }))}
                        className="rounded text-brand-red focus:ring-brand-red w-4 h-4"
                      />
                      <span className="font-bold text-gray-750">{isAr ? 'زيارة الموقع مطلوبة قانوناً' : 'Site Visit Required'}</span>
                    </label>

                    {wizardForm.siteVisitRequired && (
                      <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-150">
                        <span className="text-gray-450 font-medium">{isAr ? 'تحديد موعد الزيارة مسبقاً:' : 'Site Visit Date:'}</span>
                        <input
                          type="date"
                          required
                          value={wizardForm.siteVisitDate}
                          onChange={e => setWizardForm(prev => ({ ...prev, siteVisitDate: e.target.value }))}
                          className="bg-white border border-gray-250 rounded-xl p-2 font-bold focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Review & Confirmation */}
            {wizardStep === 5 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-wider block">
                  {isAr ? 'القسم الخامس: مراجعة وتأكيد بيانات العطاء' : 'SECTION 5 - REVIEW & VERIFY'}
                </span>

                {(() => {
                  const warnings: string[] = [];
                  const conflicts: string[] = [];

                  if (!wizardForm.projectNameEn) warnings.push(isAr ? 'اسم المشروع بالإنجليزية مطلوب.' : 'English Project Name is required.');
                  if (!wizardForm.projectNameAr) warnings.push(isAr ? 'اسم المشروع بالعربية مطلوب لتقديم السير الذاتية.' : 'Arabic Project Name is recommended.');
                  if (!wizardForm.tenderNumber) warnings.push(isAr ? 'رقم المزايدة ضروري للمطابقة الفرعية.' : 'Tender Number can\'t be empty.');
                  if (!wizardForm.techDate) warnings.push(isAr ? 'تاريخ تقديم العرض الفني إلزامي!' : 'Technical Submission Date is required!');
                  if (!wizardForm.commDate) warnings.push(isAr ? 'تاريخ تقديم العرض المالي إلزامي!' : 'Commercial Submission Date is required!');

                  if (wizardForm.techDate && wizardForm.commDate && Clock.parse(wizardForm.commDate) < Clock.parse(wizardForm.techDate)) {
                    conflicts.push(isAr ? 'تحذير زمني: تاريخ تقديم المالي يسبق تاريخ الفني.' : 'Date Conflict: Commercial Submission is scheduled before Technical Submission.');
                  }
                  if (wizardForm.techDate && wizardForm.kickOffDate && Clock.parse(wizardForm.kickOffDate) > Clock.parse(wizardForm.techDate)) {
                    conflicts.push(isAr ? 'تضارب: موعد الاجتماع التحضيري الداخلي بعد تاريخ تسليم الفني!' : 'Conflict: Internal Kick-off meeting is scheduled after Technical Submission.');
                  }
                  if (wizardForm.techDate && wizardForm.alignmentDate && Clock.parse(wizardForm.alignmentDate) > Clock.parse(wizardForm.techDate)) {
                    conflicts.push(isAr ? 'تضارب: اجتماع التنسيق والمطابقة الأول مبرمج بعد تاريخ المزايدة!' : 'Conflict: 1st Alignment meeting is configured after Technical Submission.');
                  }
                  if (wizardForm.siteVisitRequired && wizardForm.siteVisitDate && wizardForm.techDate && Clock.parse(wizardForm.siteVisitDate) > Clock.parse(wizardForm.techDate)) {
                    conflicts.push(isAr ? 'تحذير: تاريخ معاينة الموقع تم بعد انتهاء موعد تسليم العطاء الفني!' : 'Warning: Site Visit Date is planned after Technical Submission.');
                  }

                  return (
                    <div className="space-y-2">
                      {warnings.length > 0 && (
                        <div className="p-3 bg-red-50 text-red-800 rounded-2xl border border-red-100 space-y-1">
                          <span className="font-extrabold block">🚨 {isAr ? 'الحقول الإلزامية المفقودة:' : 'Missing Required Fields:'}</span>
                          <ul className="list-disc pl-4 rtl:pr-4 rtl:pl-0 text-[11px] font-medium">
                            {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                          </ul>
                        </div>
                      )}

                      {conflicts.length > 0 && (
                        <div className="p-3 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 space-y-1">
                          <span className="font-extrabold block">⚠️ {isAr ? 'تضارب التواريخ والمحاذير:' : 'Potential Date Conflicts:'}</span>
                          <ul className="list-disc pl-4 rtl:pr-4 rtl:pl-0 text-[11px] font-medium text-amber-900">
                            {conflicts.map((c, idx) => <li key={idx}>{c}</li>)}
                          </ul>
                        </div>
                      )}

                      {warnings.length === 0 && conflicts.length === 0 && (
                        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 font-bold block text-center">
                          🛡️ {isAr ? 'موافقة النظام: كل التواريخ والمستندات متطابقة مئة بالمئة!' : 'Compliant Structure: All date orders are logically sound!'}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-150 space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase block">{isAr ? 'الأكواد العامة' : 'PROJECT IDENTIFIERS'}</span>
                    <p className="font-bold text-brand-navy block truncate"><span className="text-[#183B63] select-none">{isAr ? 'الكود: ' : 'Code: '}</span> {wizardForm.projectCode}</p>
                    <p className="font-bold text-brand-navy block"><span className="text-[#183B63] select-none">{isAr ? 'المزايدة: ' : 'Number: '}</span> {wizardForm.tenderNumber}</p>
                    <p className="font-extrabold text-brand-red block truncate"><span className="text-[#183B63] font-normal select-none">{isAr ? 'الاسم: ' : 'Name: '}</span> {isAr ? (wizardForm.projectNameAr || wizardForm.projectNameEn) : wizardForm.projectNameEn}</p>
                    <p className="text-gray-550 block font-medium"><span className="text-[#183B63] font-normal select-none">{isAr ? 'الموقع: ' : 'Location: '}</span>{wizardForm.locationEn}</p>
                  </div>

                  <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-150 space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase block">{isAr ? 'منسقين العطاء المقررة' : 'ASSIGNED STAFF'}</span>
                    <p className="font-bold text-brand-navy block select-none">👔 <span className="font-medium text-gray-550">{isAr ? 'المنسق: ' : 'Coordinator: '}</span> {wizardForm.coordinatorEn}</p>
                    <p className="font-bold text-brand-navy block select-none">📄 <span className="font-medium text-gray-555">{isAr ? 'العقود: ' : 'Contracts: '}</span> {wizardForm.contractsEngineerEn}</p>
                    <p className="font-bold text-brand-navy block select-none">🛠️ <span className="font-medium text-gray-555">{isAr ? 'التقدير: ' : 'Estimator: '}</span> {wizardForm.tenderStudyEngineerEn}</p>
                    <p className="font-bold text-brand-navy block select-none">🏢 <span className="font-medium text-gray-555">{isAr ? 'الأولوية: ' : 'Priority: '}</span> <span className="text-brand-red">{wizardForm.priority}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Steps footer controls */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100 flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                if (wizardStep === 1) {
                  onClose();
                } else {
                  setWizardStep(prev => prev - 1);
                }
              }}
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{wizardStep === 1 ? (isAr ? 'إلغاء وإغلاق' : 'Cancel') : (isAr ? 'الخطوة السابقة' : 'Previous')}</span>
            </button>

            <div className="flex items-center gap-2">
              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1 && (!wizardForm.projectNameEn || !wizardForm.projectNameAr)) {
                      setToastAlert({
                        type: 'warn',
                        message: isAr ? 'يرجى ملء اسم المشروع باللغتين العربية والإنجليزية للمتابعة.' : 'Please enter Project Name in both languages to proceed.',
                      });
                      return;
                    }
                    if (wizardStep === 3 && (!wizardForm.techDate || !wizardForm.commDate)) {
                      setToastAlert({
                        type: 'warn',
                        message: isAr ? 'تواريخ تقديم العطاء الفني والمالي ضرورية جداً لمتابعة برمجة باقي الملفات.' : 'Technical and financial submittal dates are mandatory before proceeding.',
                      });
                      return;
                    }
                    setWizardStep(prev => prev + 1);
                  }}
                  className="px-6 py-2.5 bg-brand-navy hover:bg-brand-navy/95 text-white font-extrabold rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <span>{isAr ? 'التالي' : 'Next Step'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitWizardTender}
                  disabled={!wizardForm.projectNameEn || !wizardForm.techDate || !wizardForm.commDate}
                  className="px-8 py-3 bg-brand-red hover:bg-brand-red/90 text-white font-black rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'إنشاء وتفعيل السجل' : 'Create Tender'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right side: VISUAL TIMELINE PREVIEW */}
        <div className="md:w-80 md:shrink-0 bg-gray-50/70 p-5 rounded-3xl border border-gray-150 flex flex-col justify-between max-h-fit">
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-3 text-center">
              <span className="text-[10px] text-brand-red font-black tracking-widest block uppercase font-mono">
                {isAr ? 'معاينة البناء الزمني الفوري' : 'LIVE SCHEDULE MONITOR'}
              </span>
              <h4 className="font-extrabold text-sm text-brand-navy mt-1">{isAr ? 'مصفوفة إجراءات ما قبل الترسية' : 'Pre-Award Project Timeline'}</h4>
            </div>

            {/* Milestones dynamic timeline elements */}
            <div className="relative pl-3 rtl:pl-0 rtl:pr-3 space-y-4">
              <div className="absolute top-1 bottom-1 left-4 rtl:left-auto rtl:right-4 w-0.5 border-l border-dashed border-gray-300" />

              {[
                { key: 'received', labelEn: 'Tender Received', labelAr: 'تلقي العطاء وأبواب PMO', date: Clock.todayISO(), status: 'done' },
                { key: 'kickOff', labelEn: 'Internal Kick-off', labelAr: 'الاجتماع التحضيري الداخلي', date: wizardForm.kickOffDate, status: wizardForm.kickOffDate ? 'okay' : 'empty', offset: rules.kickOffOffset },
                { key: 'risk', labelEn: 'Risk Assessment Due', labelAr: 'تقييم مخاطر المشروع المالي', date: wizardForm.riskDueDate, status: wizardForm.riskDueDate ? 'okay' : 'empty', offset: rules.riskAssessmentOffset },
                { key: 'quals', labelEn: 'Contract Qualifications', labelAr: 'الشروط والتحفظات القانونية', date: wizardForm.contractQualsDueDate, status: wizardForm.contractQualsDueDate ? 'okay' : 'empty', offset: rules.contractQualificationOffset },
                { key: 'alignment', labelEn: '1st Alignment Meeting', labelAr: 'اجتماع المطابقة والتسعير الأول', date: wizardForm.alignmentDate, status: wizardForm.alignmentDate ? 'okay' : 'empty', offset: rules.alignmentOffset },
                { key: 'tech', labelEn: 'Technical Submission', labelAr: 'تقديم العرض الفني المتكامل', date: wizardForm.techDate, status: wizardForm.techDate ? 'required-okay' : 'required-empty' },
                { key: 'followUp', labelEn: 'Intermediate Follow-up', labelAr: 'متابعة الصياغة والتسعير البيني', date: wizardForm.followUpDate, status: wizardForm.followUpDate ? 'okay' : 'empty', offset: rules.intermediateFollowUpOffset },
                { key: 'comm', labelEn: 'Commercial Submission', labelAr: 'تقديم السعر والعرض المالي', date: wizardForm.commDate, status: wizardForm.commDate ? 'required-okay' : 'required-empty' },
                { key: 'official', labelEn: 'Official Submission', labelAr: 'التسجيل والتسليم الرسمي والترئيس', date: wizardForm.officialDate, status: wizardForm.officialDate ? 'okay' : 'empty' },
              ].map((m, idx) => {
                const isDone = m.status === 'done';
                const isOkay = m.status === 'okay' || m.status === 'required-okay';
                const isEmpty = m.status === 'empty' || m.status === 'required-empty';
                const isRequired = m.status.startsWith('required-');

                const isSuggested = !isDone && !isEmpty && m.key !== 'official' && m.key !== 'tech' && !wizardForm.overriddenFields[m.key as any];

                return (
                  <div key={idx} className="flex gap-4 items-start relative select-none group text-sans">
                    <div className="z-10 bg-white rounded-full p-0.5 shrink-0">
                      {isDone ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">✓</div>
                      ) : isOkay ? (
                        <div
                          className={`w-4.5 h-4.5 rounded-full font-black text-[9px] flex items-center justify-center border
                            ${isRequired ? 'bg-brand-red text-white border-brand-red' : 'bg-brand-navy text-white border-brand-navy'}`}
                        >
                          •
                        </div>
                      ) : (
                        <div
                          className={`w-4.5 h-4.5 rounded-full font-bold text-[9px] flex items-center justify-center border
                            ${isRequired ? 'bg-red-50 border-red-300 text-brand-red animate-pulse' : 'bg-gray-100 border-gray-250 text-gray-400'}`}
                        >
                          !
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-extrabold leading-tight text-brand-navy flex items-center gap-1.5 wrap ${isEmpty ? 'opacity-50' : ''}`}>
                        <span>{isAr ? m.labelAr : m.labelEn}</span>
                        {isRequired && <span className="text-brand-red text-xs">*</span>}
                      </p>

                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[10px] font-bold font-mono text-gray-400">
                          {m.date ? (
                            Clock.parse(m.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
                          ) : (
                            isAr ? 'غير محدد' : 'Not set'
                          )}
                        </span>

                        {isSuggested && (
                          <span className="text-[9px] font-black text-brand-red shrink-0 flex items-center gap-0.5 leading-none select-none bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                            ✨ {isAr ? 'مقترح' : 'Offset'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/85 p-3 rounded-2xl border border-gray-150 mt-4 text-[10px] text-gray-405 leading-normal flex items-center gap-2">
            <span className="text-base">🔔</span>
            <p>{isAr ? 'تقوم الحلقات الزمنية برسم الفروقات يومياً لتنبيه منسق العقود في حالة أي تعارض طارئ.' : 'Days calculation warnings trigger alerts dynamically on the estimators board.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
