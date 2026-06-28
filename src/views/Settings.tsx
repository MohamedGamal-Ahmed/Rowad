import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Clock, Shield, Save, Check, AlertCircle, 
  DollarSign, Calendar, Hash, HardHat, Activity, Plus, Trash2, Sliders
} from 'lucide-react';
import { BiText } from '../components/BiText';
import { Settings } from '../domain/administration/Settings';
import { SettingsValidator } from '../validators/SettingsValidator';

interface SettingsViewProps {
  lang: 'ar' | 'en';
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
}

export function SettingsView({ lang, settings, onUpdateSettings }: SettingsViewProps) {
  const isAr = lang === 'ar';
  
  // Local form state initialized with current active settings
  const [localSettings, setLocalSettings] = useState<Settings>(() => ({
    ...settings,
    timelineRules: { ...settings.timelineRules },
    financialSettings: { ...settings.financialSettings },
    businessCalendar: { 
      ...settings.businessCalendar,
      weekendDays: [...settings.businessCalendar.weekendDays],
      holidayDates: [...settings.businessCalendar.holidayDates],
      specialClosures: [...(settings.businessCalendar.specialClosures || [])]
    },
    numberingSettings: { ...settings.numberingSettings },
    workloadSettings: { ...settings.workloadSettings },
    healthSettings: { ...settings.healthSettings },
    conflictSettings: settings.conflictSettings ? { ...settings.conflictSettings } : {
      minGapBetweenMeetings: 30,
      travelBuffer: 15,
      conflictThreshold: 0,
      allowBackToBack: true
    }
  }));

  const [activeTab, setActiveTab] = useState<'timeline' | 'financial' | 'calendar' | 'numbering' | 'workload' | 'security' | 'conflict'>('timeline');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Input helpers for lists
  const [newHoliday, setNewHoliday] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = SettingsValidator.validate(localSettings);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setSavedSuccess(false);
      // Scroll to error banner
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    onUpdateSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const toggleWeekendDay = (dayIndex: number) => {
    const current = localSettings.businessCalendar.weekendDays;
    let next: number[];
    if (current.includes(dayIndex)) {
      next = current.filter(d => d !== dayIndex);
    } else {
      next = [...current, dayIndex].sort();
    }
    setLocalSettings(prev => ({
      ...prev,
      businessCalendar: {
        ...prev.businessCalendar,
        weekendDays: next
      }
    }));
  };

  const addHoliday = () => {
    if (!newHoliday) return;
    if (localSettings.businessCalendar.holidayDates.includes(newHoliday)) return;
    
    setLocalSettings(prev => ({
      ...prev,
      businessCalendar: {
        ...prev.businessCalendar,
        holidayDates: [...prev.businessCalendar.holidayDates, newHoliday].sort()
      }
    }));
    setNewHoliday('');
  };

  const removeHoliday = (dateStr: string) => {
    setLocalSettings(prev => ({
      ...prev,
      businessCalendar: {
        ...prev.businessCalendar,
        holidayDates: prev.businessCalendar.holidayDates.filter(d => d !== dateStr)
      }
    }));
  };

  const resetToDefaults = () => {
    if (window.confirm(isAr ? 'هل أنت متأكد من إعادة تعيين كافة قيم الإعدادات إلى القيم الافتراضية للشركة؟' : 'Are you sure you want to restore default corporate rules?')) {
      setLocalSettings({
        id: 'admin-settings',
        userId: 'admin',
        preferredLanguage: lang,
        timelineRules: {
          kickOffOffset: -30,
          riskAssessmentOffset: -21,
          contractQualificationOffset: -14,
          alignmentOffset: -10,
          intermediateFollowUpOffset: -5,
          reminderDays: 3,
          followUpDays: 5,
          escalationDays: 7
        },
        financialSettings: {
          bidBondPercentage: 2.0,
          performanceBondPercentage: 10.0,
          retentionPercentage: 10.0,
          vatPercentage: 15.0,
          advancePaymentPercentage: 10.0,
          defaultCurrency: 'AED',
          currencyDisplayMode: 'individual'
        },
        businessCalendar: {
          country: 'Saudi Arabia',
          region: 'Riyadh',
          weekendDays: [5, 6],
          holidayDates: ['2026-09-23', '2026-02-22'],
          workingHoursStart: '08:00',
          workingHoursEnd: '17:00',
          halfWorkingDays: [],
          specialClosures: []
        },
        numberingSettings: {
          projectFormat: 'PRJ-{YEAR}-{SEQ}',
          tenderFormat: 'PA-{YEAR}-{SEQ}',
          ipcFormat: 'IPC-{PROJECT}-{SEQ}',
          claimFormat: 'CLM-{PROJECT}-{SEQ}',
          voFormat: 'VO-{PROJECT}-{SEQ}',
          nocFormat: 'NOC-{PROJECT}-{SEQ}',
          documentFormat: 'DOC-{TYPE}-{SEQ}'
        },
        workloadSettings: {
          maxTasksPerEngineer: 5,
          warningThreshold: 80
        },
        healthSettings: {
          dueSoonThresholdDays: 7,
          overdueThresholdDays: 0
        },
        conflictSettings: {
          minGapBetweenMeetings: 30,
          travelBuffer: 15,
          conflictThreshold: 0,
          allowBackToBack: true
        }
      });
    }
  };

  const daysOfWeek = [
    { nameEn: 'Sunday', nameAr: 'الأحد', val: 0 },
    { nameEn: 'Monday', nameAr: 'الاثنين', val: 1 },
    { nameEn: 'Tuesday', nameAr: 'الثلاثاء', val: 2 },
    { nameEn: 'Wednesday', nameAr: 'الأربعاء', val: 3 },
    { nameEn: 'Thursday', nameAr: 'الخميس', val: 4 },
    { nameEn: 'Friday', nameAr: 'الجمعة', val: 5 },
    { nameEn: 'Saturday', nameAr: 'السبت', val: 6 },
  ];

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-navy/5 text-brand-navy rounded-2xl">
            <SettingsIcon className="w-6 h-6 text-brand-red animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-navy tracking-tight">
              {isAr ? "إدارة نظام ROWAD والسياسات" : "Enterprise System Settings & Policies"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isAr ? "محرك التهيئة الشامل - تحكم بكافة سياسات الأعمال، القواعد المالية، المخططات، والترقيم." : "Configure core business rules, monetary formulas, project codes, and localization rules."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">
            {isAr ? "محرك التهيئة نشط" : "CONFIG ENGINE LIVE"}
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{isAr ? "تم حفظ إعدادات المحرك وتحديث السياسات المعتمدة بنجاح!" : "Configuration settings successfully validated and active across all modules!"}</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 text-red-800 rounded-2xl border border-red-100 space-y-1.5 animate-in fade-in duration-200 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-brand-red shrink-0" />
            <span>{isAr ? "فشل التحقق من صحة المدخلات الإدارية:" : "Administrative Validation Failed:"}</span>
          </div>
          <ul className="list-disc list-inside pl-4 space-y-0.5 font-medium">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Settings Sub-Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1.5">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer
              ${activeTab === 'timeline' 
                ? 'bg-brand-navy text-white shadow-md' 
                : 'bg-white border border-gray-50 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{isAr ? "مواعيد العطاءات" : "Timeline Offsets"}</span>
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer
              ${activeTab === 'financial' 
                ? 'bg-brand-navy text-white shadow-md' 
                : 'bg-white border border-gray-50 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>{isAr ? "القواعد المالية" : "Financial Formulas"}</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer
              ${activeTab === 'calendar' 
                ? 'bg-brand-navy text-white shadow-md' 
                : 'bg-white border border-gray-50 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{isAr ? "التقويم المؤسسي" : "Business Calendar"}</span>
          </button>

          <button
            onClick={() => setActiveTab('numbering')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer
              ${activeTab === 'numbering' 
                ? 'bg-brand-navy text-white shadow-md' 
                : 'bg-white border border-gray-50 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Hash className="w-4 h-4 shrink-0" />
            <span>{isAr ? "أنماط الترقيم" : "Numbering Formats"}</span>
          </button>

          <button
            onClick={() => setActiveTab('workload')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer
              ${activeTab === 'workload' 
                ? 'bg-brand-navy text-white shadow-md' 
                : 'bg-white border border-gray-50 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>{isAr ? "مؤشرات الصحة والأعباء" : "Health & Workload"}</span>
          </button>

          <button
            onClick={() => setActiveTab('conflict')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer
              ${activeTab === 'conflict' 
                ? 'bg-brand-navy text-white shadow-md' 
                : 'bg-white border border-gray-50 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{isAr ? "قواعد محرك التعارض" : "Conflict Engine Rules"}</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer
              ${activeTab === 'security' 
                ? 'bg-brand-navy text-white shadow-md' 
                : 'bg-white border border-gray-50 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>{isAr ? "صلاحيات الوصول" : "Access & Security"}</span>
          </button>
        </div>

        {/* Configuration Panel Container */}
        <div className="md:col-span-3">
          <form onSubmit={handleSave} className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 space-y-6">
            
            {/* 1. TIMELINE OFFSETS TAB */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="border-b border-gray-150 pb-3">
                  <h3 className="text-base font-black text-brand-navy">
                    {isAr ? "فوارق المخططات الزمنية (عطاءات العروض)" : "Tender Milestone Offsets"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {isAr ? "قيم فوارق المدد الزمنية بالأيام (سالبة أو صفر) بالنسبة لتاريخ تقديم الملف الفني لتوجيه المهندسين." : "Configure milestone offset policies relative to technical submission date (e.g. -30 for 30 days prior)."}
                  </p>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  {/* Kick-Off */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-brand-navy">{isAr ? "الاجتماع التحضيري الداخلي (Kick-off)" : "Internal Kick-off Meeting"}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{isAr ? "بدء دراسة مستندات التناقص الفنية" : "Drafting start of legal analysis and requirements"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={localSettings.timelineRules.kickOffOffset}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          timelineRules: { ...prev.timelineRules, kickOffOffset: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-20 bg-white border border-gray-200 rounded-lg p-2 font-mono font-bold text-center text-brand-navy focus:outline-none"
                      />
                      <span className="text-gray-400 font-bold">{isAr ? "أيام" : "days"}</span>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-brand-navy">{isAr ? "تقييم المخاطر الفنية والمالية" : "Technical & Risk Assessment"}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{isAr ? "أقصى موعد لتسليم مصفوفة حصر المخاطر" : "Cut-off milestone to verify project risks and margins"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={localSettings.timelineRules.riskAssessmentOffset}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          timelineRules: { ...prev.timelineRules, riskAssessmentOffset: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-20 bg-white border border-gray-200 rounded-lg p-2 font-mono font-bold text-center text-brand-navy focus:outline-none"
                      />
                      <span className="text-gray-400 font-bold">{isAr ? "أيام" : "days"}</span>
                    </div>
                  </div>

                  {/* Contract Qualifications */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-brand-navy">{isAr ? "التحفظات والشروط التعاقدية القانونية" : "Contractual Qualifications"}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{isAr ? "تقديم الصياغة القانونية والتحفظات على بنود المشروع" : "Determining legal deviations and tender variations"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={localSettings.timelineRules.contractQualificationOffset}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          timelineRules: { ...prev.timelineRules, contractQualificationOffset: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-20 bg-white border border-gray-200 rounded-lg p-2 font-mono font-bold text-center text-brand-navy focus:outline-none"
                      />
                      <span className="text-gray-400 font-bold">{isAr ? "أيام" : "days"}</span>
                    </div>
                  </div>

                  {/* Alignment Meeting */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-brand-navy">{isAr ? "اجتماع توحيد الرؤى والمطابقة" : "Consensus Alignment Meeting"}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{isAr ? "توزيع الأدوار لتسعير أقسام المناقصة الفنية" : "Unified internal pricing presentation checklist"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={localSettings.timelineRules.alignmentOffset}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          timelineRules: { ...prev.timelineRules, alignmentOffset: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-20 bg-white border border-gray-200 rounded-lg p-2 font-mono font-bold text-center text-brand-navy focus:outline-none"
                      />
                      <span className="text-gray-400 font-bold">{isAr ? "أيام" : "days"}</span>
                    </div>
                  </div>

                  {/* Follow-up Days */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-brand-navy">{isAr ? "مهلة الإشعارات والتذكيرات التلقائية" : "Auto Reminder Lead Days"}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{isAr ? "تنبيه المهندسين قبل اقتراب المواعيد النهائية للملفات" : "Proactive email/notification system reminder trigger"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={localSettings.timelineRules.reminderDays}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          timelineRules: { ...prev.timelineRules, reminderDays: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-20 bg-white border border-gray-200 rounded-lg p-2 font-mono font-bold text-center text-brand-navy focus:outline-none"
                      />
                      <span className="text-gray-400 font-bold">{isAr ? "أيام" : "days"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FINANCIAL SETTINGS TAB */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                <div className="border-b border-gray-150 pb-3">
                  <h3 className="text-base font-black text-brand-navy">
                    {isAr ? "السياسات المالية ونسب الدفع" : "Financial Rules & Bonds"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {isAr ? "تعديل محددات الحساب المالي الافتراضية للكفالات المصرفية وعوائد الخصم وقيمة الضريبة السارية." : "Define global percentage constraints for bonds, tax rates, and retention factors."}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Bid Bond % */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                    <label className="font-black text-brand-navy block">{isAr ? "كفالة دخول المناقصة (Bid Bond %)" : "Bid Bond Percentage"}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="0.05"
                        value={localSettings.financialSettings.bidBondPercentage}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          financialSettings: { ...prev.financialSettings, bidBondPercentage: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold font-mono text-brand-navy focus:outline-none"
                      />
                      <span className="font-bold text-gray-400">%</span>
                    </div>
                  </div>

                  {/* Performance Bond % */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                    <label className="font-black text-brand-navy block">{isAr ? "كفالة حسن التنفيذ (Performance Bond %)" : "Performance Bond Percentage"}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="0.1"
                        value={localSettings.financialSettings.performanceBondPercentage}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          financialSettings: { ...prev.financialSettings, performanceBondPercentage: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold font-mono text-brand-navy focus:outline-none"
                      />
                      <span className="font-bold text-gray-400">%</span>
                    </div>
                  </div>

                  {/* Retention % */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                    <label className="font-black text-brand-navy block">{isAr ? "نسبة حجز الضمان المستقطع (Retention %)" : "Retention / Withholding Factor"}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="0.1"
                        value={localSettings.financialSettings.retentionPercentage}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          financialSettings: { ...prev.financialSettings, retentionPercentage: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold font-mono text-brand-navy focus:outline-none"
                      />
                      <span className="font-bold text-gray-400">%</span>
                    </div>
                  </div>

                  {/* VAT % */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                    <label className="font-black text-brand-navy block">{isAr ? "ضريبة القيمة المضافة السارية (VAT %)" : "Value Added Tax (VAT)"}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="0.5"
                        value={localSettings.financialSettings.vatPercentage}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          financialSettings: { ...prev.financialSettings, vatPercentage: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold font-mono text-brand-navy focus:outline-none"
                      />
                      <span className="font-bold text-gray-400">%</span>
                    </div>
                  </div>

                  {/* Advance Payment % */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 col-span-1 sm:col-span-2">
                    <label className="font-black text-brand-navy block">{isAr ? "نسبة الدفعة المقدمة المعتمدة (Advance Payment %)" : "Standard Advance Payment Factor"}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="0.5"
                        value={localSettings.financialSettings.advancePaymentPercentage}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          financialSettings: { ...prev.financialSettings, advancePaymentPercentage: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold font-mono text-brand-navy focus:outline-none"
                      />
                      <span className="font-bold text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. BUSINESS CALENDAR TAB */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="border-b border-gray-150 pb-3">
                  <h3 className="text-base font-black text-brand-navy">
                    {isAr ? "تقويم الأعمال والمكافآت والتعطيلات" : "Business Calendar & Working Days"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {isAr ? "تحديد العطل الرسمية وأيام الإجازات الأسبوعية والبلد لحساب المخططات الزمنية مع استبعاد الإجازات." : "Enforce localization properties, weekend filters, and holiday exclusions for smart date arithmetic."}
                  </p>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  {/* Location Meta */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-black text-brand-navy">{isAr ? "الدولة والبلد الساري" : "Calendar Country"}</label>
                      <input 
                        type="text" 
                        value={localSettings.businessCalendar.country}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          businessCalendar: { ...prev.businessCalendar, country: e.target.value }
                        }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-black text-brand-navy">{isAr ? "المنطقة / المحافظة" : "Region / Jurisdiction"}</label>
                      <input 
                        type="text" 
                        value={localSettings.businessCalendar.region}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          businessCalendar: { ...prev.businessCalendar, region: e.target.value }
                        }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Weekend days selectors */}
                  <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="font-extrabold text-brand-navy block">{isAr ? "أيام الإجازة الأسبوعية (عطلة نهاية الأسبوع)" : "Weekend Non-Working Days"}</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {daysOfWeek.map((day) => {
                        const isWeekend = localSettings.businessCalendar.weekendDays.includes(day.val);
                        return (
                          <button
                            type="button"
                            key={day.val}
                            onClick={() => toggleWeekendDay(day.val)}
                            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer text-xs transition-colors border ${
                              isWeekend 
                                ? 'bg-brand-red text-white border-brand-red' 
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {isAr ? day.nameAr : day.nameEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="space-y-1">
                      <label className="font-extrabold text-brand-navy block">{isAr ? "توقيت بدء العمل" : "Shift Start (24h)"}</label>
                      <input 
                        type="text" 
                        placeholder="08:00"
                        value={localSettings.businessCalendar.workingHoursStart}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          businessCalendar: { ...prev.businessCalendar, workingHoursStart: e.target.value }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-extrabold text-brand-navy block">{isAr ? "توقيت انتهاء العمل" : "Shift End (24h)"}</label>
                      <input 
                        type="text" 
                        placeholder="17:00"
                        value={localSettings.businessCalendar.workingHoursEnd}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          businessCalendar: { ...prev.businessCalendar, workingHoursEnd: e.target.value }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Holiday Dates List Manager */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <label className="font-extrabold text-brand-navy block">{isAr ? "قائمة الأعياد والتعطيلات الرسمية السنوية" : "Official Public Holidays List"}</label>
                    
                    <div className="flex gap-2">
                      <input 
                        type="date"
                        value={newHoliday}
                        onChange={(e) => setNewHoliday(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg p-2 font-mono text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={addHoliday}
                        className="px-4 py-2 bg-brand-navy hover:bg-brand-navy/90 text-white font-extrabold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? "إضافة عطلة" : "Add Holiday"}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {localSettings.businessCalendar.holidayDates.map((hDate) => (
                        <div 
                          key={hDate}
                          className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-250 font-mono text-[11px] font-bold text-brand-navy"
                        >
                          <span>{hDate}</span>
                          <button
                            type="button"
                            onClick={() => removeHoliday(hDate)}
                            className="text-brand-red hover:bg-red-50 p-0.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. NUMBERING CONFIG TAB */}
            {activeTab === 'numbering' && (
              <div className="space-y-6">
                <div className="border-b border-gray-150 pb-3">
                  <h3 className="text-base font-black text-brand-navy">
                    {isAr ? "قواعد وصيغ الترقيم الآلي للوثائق" : "Dynamic Reference Numbering Formats"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {isAr ? "صياغة معايير الأرقام المرجعية للسجلات والوثائق التعاقدية. تدعم الصيغ المعطيات المتغيرة مثل السنة والتسلسل." : "Establish document numbering sequences and tags. Placeholders allowed: {YEAR}, {SEQ} (sequence), {PROJECT}, {TYPE}."}
                  </p>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  {/* Project Code */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <label className="font-extrabold text-brand-navy block">{isAr ? "نمط ترقيم المشاريع التنفيذية" : "Project Identifier Template"}</label>
                    <input 
                      type="text" 
                      value={localSettings.numberingSettings.projectFormat}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        numberingSettings: { ...prev.numberingSettings, projectFormat: e.target.value }
                      }))}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono font-bold text-brand-navy focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">{isAr ? "مثال افتراضي: PRJ-2026-004" : "Example output: PRJ-2026-001"}</p>
                  </div>

                  {/* Tender Code */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <label className="font-extrabold text-brand-navy block">{isAr ? "نمط ترقيم العطاءات وتجهيز العروض" : "Pre-Award Tender Bid Template"}</label>
                    <input 
                      type="text" 
                      value={localSettings.numberingSettings.tenderFormat}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        numberingSettings: { ...prev.numberingSettings, tenderFormat: e.target.value }
                      }))}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono font-bold text-brand-navy focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">{isAr ? "مثال افتراضي: PA-2026-015" : "Example output: PA-2026-001"}</p>
                  </div>

                  {/* Record IPC Format */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <label className="font-extrabold text-brand-navy block">{isAr ? "صيغة ترقيم الدفعات المؤقتة والشهادات (IPC)" : "Interim Payment Certificate (IPC) Format"}</label>
                    <input 
                      type="text" 
                      value={localSettings.numberingSettings.ipcFormat}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        numberingSettings: { ...prev.numberingSettings, ipcFormat: e.target.value }
                      }))}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono font-bold text-brand-navy focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">{isAr ? "مثال: IPC-NEOM-002" : "Example output: IPC-MAKTOUM-001"}</p>
                  </div>

                  {/* Claim Format */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <label className="font-extrabold text-brand-navy block">{isAr ? "صيغة ترقيم المطالبات المالية والزمنية" : "Contractual Claim Format"}</label>
                    <input 
                      type="text" 
                      value={localSettings.numberingSettings.claimFormat}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        numberingSettings: { ...prev.numberingSettings, claimFormat: e.target.value }
                      }))}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono font-bold text-brand-navy focus:outline-none"
                    />
                  </div>

                  {/* Document Format */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <label className="font-extrabold text-brand-navy block">{isAr ? "نمط ترقيم المستندات الهندسية والأرشفة" : "Engineering Document Control Reference"}</label>
                    <input 
                      type="text" 
                      value={localSettings.numberingSettings.documentFormat}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        numberingSettings: { ...prev.numberingSettings, documentFormat: e.target.value }
                      }))}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono font-bold text-brand-navy focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">{isAr ? "مثال: DOC-DRAWING-012" : "Example output: DOC-INCOMING-001"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. WORKLOAD & HEALTH TAB */}
            {activeTab === 'workload' && (
              <div className="space-y-6">
                <div className="border-b border-gray-150 pb-3">
                  <h3 className="text-base font-black text-brand-navy">
                    {isAr ? "قواعد العبء الهندسي والإنذار الصحي" : "Workload Limits & Health Thresholds"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {isAr ? "تعيين المحددات الإدارية القصوى لقدرات المهندسين ومؤشرات الإنذار المبكر لقرب تواريخ تسليم العطاءات." : "Set maximum concurrent task quotas for engineers and warning triggers for tender tracking lists."}
                  </p>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  {/* Engineer capacity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                      <label className="font-extrabold text-brand-navy block">{isAr ? "الحد الأقصى للعطاءات لكل مهندس فني" : "Max Tenders per Estimator"}</label>
                      <input 
                        type="number" 
                        value={localSettings.workloadSettings.maxTasksPerEngineer}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          workloadSettings: { ...prev.workloadSettings, maxTasksPerEngineer: parseInt(e.target.value) || 1 }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold focus:outline-none text-center"
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                      <label className="font-extrabold text-brand-navy block">{isAr ? "عتبة الإنذار بالأعباء المفرطة (%)" : "Workload Warning Threshold (%)"}</label>
                      <input 
                        type="number" 
                        value={localSettings.workloadSettings.warningThreshold}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          workloadSettings: { ...prev.workloadSettings, warningThreshold: parseInt(e.target.value) || 80 }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold focus:outline-none text-center"
                      />
                    </div>
                  </div>

                  {/* Health Thresholds */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="space-y-1.5">
                      <label className="font-extrabold text-brand-navy block">{isAr ? "عتبة حالة 'يقترب موعده' (أيام)" : "Due Soon Alert Threshold (Days)"}</label>
                      <input 
                        type="number" 
                        value={localSettings.healthSettings.dueSoonThresholdDays}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          healthSettings: { ...prev.healthSettings, dueSoonThresholdDays: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold focus:outline-none text-center"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-extrabold text-brand-navy block">{isAr ? "عتبة حالة 'متأخر' (أيام)" : "Overdue Alert Threshold (Days)"}</label>
                      <input 
                        type="number" 
                        value={localSettings.healthSettings.overdueThresholdDays}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          healthSettings: { ...prev.healthSettings, overdueThresholdDays: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold focus:outline-none text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5.5 CONFLICT RESOLUTION RULES TAB */}
            {activeTab === 'conflict' && (
              <div className="space-y-6">
                <div className="border-b border-gray-150 pb-3">
                  <h3 className="text-base font-black text-brand-navy font-sans">
                    {isAr ? "قواعد محرك كشف وتدقيق التعارض" : "Conflict Detection Engine & Rules"}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">
                    {isAr 
                      ? "تحديد معايير الجدولة والتحقق من التداخل الزمني، بما في ذلك أوقات الانتقال والاجتماعات المتتالية وفترات الترحيل." 
                      : "Define corporate rules for calendar overlaps, transition buffers, and sequential meeting permissions."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-extrabold text-brand-navy block text-xs">
                        {isAr ? "الحد الأدنى للفجوة بين الاجتماعات (بالدقائق)" : "Minimum Gap Between Meetings (Minutes)"}
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        value={localSettings.conflictSettings?.minGapBetweenMeetings ?? 30}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          conflictSettings: { 
                            ...(prev.conflictSettings || { minGapBetweenMeetings: 30, travelBuffer: 15, conflictThreshold: 0, allowBackToBack: true }), 
                            minGapBetweenMeetings: parseInt(e.target.value) || 0 
                          }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold focus:outline-none text-center text-xs"
                      />
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        {isAr 
                          ? "الوقت الإجباري بين الاجتماعات لمنع التداخل (يولد تحذير انتقال إذا قل الفاصل عنه)." 
                          : "Required gap between consecutive meetings before generating a transition warning."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-extrabold text-brand-navy block text-xs">
                        {isAr ? "عتبة التداخل والتعارض (بالدقائق)" : "Conflict Threshold (Minutes)"}
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        value={localSettings.conflictSettings?.conflictThreshold ?? 0}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          conflictSettings: { 
                            ...(prev.conflictSettings || { minGapBetweenMeetings: 30, travelBuffer: 15, conflictThreshold: 0, allowBackToBack: true }), 
                            conflictThreshold: parseInt(e.target.value) || 0 
                          }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold focus:outline-none text-center text-xs"
                      />
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        {isAr 
                          ? "مدة التداخل المسموح بها قبل اعتبار التداخل بمثابة 'حجز مزدوج حرج'." 
                          : "Permitted overlap duration in minutes before generating a Critical Conflict."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-extrabold text-brand-navy block text-xs">
                        {isAr ? "مخزن وقت السفر والانتقال (بالدقائق)" : "Travel / Buffer Gap (Minutes)"}
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        value={localSettings.conflictSettings?.travelBuffer ?? 15}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          conflictSettings: { 
                            ...(prev.conflictSettings || { minGapBetweenMeetings: 30, travelBuffer: 15, conflictThreshold: 0, allowBackToBack: true }), 
                            travelBuffer: parseInt(e.target.value) || 0 
                          }
                        }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold focus:outline-none text-center text-xs"
                      />
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        {isAr 
                          ? "مخزن احتياطي لأوقات السفر والانتقال الجغرافي للموظفين بين المواقع." 
                          : "Required travel or geographical buffer allocated to transition schedules safely."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-extrabold text-brand-navy block text-xs">
                        {isAr ? "التقويم الفعلي وساعات العمل" : "Business Calendar Working Hours"}
                      </label>
                      <div className="bg-gray-50 border border-gray-150 rounded-lg p-2 text-center text-xs font-mono font-bold text-gray-600">
                        {localSettings.businessCalendar.workingHoursStart} &rarr; {localSettings.businessCalendar.workingHoursEnd}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        {isAr 
                          ? "يتم قراءتها تلقائياً من تبويب التقويم لتحديد فترات العمل الرسمية." 
                          : "Automatically synchronized from the Business Calendar tab."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 flex items-center justify-between gap-4 mt-4">
                    <div>
                      <h4 className="text-xs font-black text-brand-navy font-sans">
                        {isAr ? "السماح بالاجتماعات المتتالية مباشرة" : "Allow Back-to-Back Meetings"}
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">
                        {isAr 
                          ? "عند التفعيل، لن يعتبر النظام الاجتماع الذي يبدأ فور انتهاء سابقه (مثال: 10:00-11:00 ثم 11:00-12:00) بمثابة تعارض." 
                          : "If enabled, events where end time matches start time (e.g. 10:00-11:00 and 11:00-12:00) will be classified as a Sequential Schedule rather than a conflict."}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={localSettings.conflictSettings?.allowBackToBack ?? true}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          conflictSettings: { 
                            ...(prev.conflictSettings || { minGapBetweenMeetings: 30, travelBuffer: 15, conflictThreshold: 0, allowBackToBack: true }), 
                            allowBackToBack: e.target.checked 
                          }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-navy"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 6. ACCESS & SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 text-center space-y-4">
                  <Shield className="w-12 h-12 text-brand-red mx-auto animate-pulse" />
                  <h3 className="text-lg font-black text-brand-navy">
                    {isAr ? "أمان الصلاحيات وحماية السجلات" : "Role-Based Access Isolation (RBAC)"}
                  </h3>
                  <p className="text-gray-400 text-xs max-w-md mx-auto">
                    {isAr ? "صلاحيات المشرف الفني والمدير الفني مدمجة حالياً بشكل مباشر في المنصة لمنع التلاعب بالمقاييس. يمكنك تهيئة نسب الفوترة والمحاسبة بالكامل من الأقسام الفنية الأخرى في شريط الإعدادات الجانبي." : "Administrative permissions are automatically bound to the Rowad technical director role in this environment. System rules can be fully modified and simulated in other configuration tabs."}
                  </p>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold cursor-pointer transition-colors"
              >
                {isAr ? "استرجاع الإعدادات الافتراضية" : "Restore Corporate Defaults"}
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-brand-navy/95 text-white font-extrabold rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isAr ? "حفظ وتطبيق التغييرات" : "Save and Deploy Settings"}</span>
                </button>
              </div>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
