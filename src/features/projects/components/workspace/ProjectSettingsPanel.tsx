import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Globe, Calendar, Users, ShieldAlert, CheckCircle2, AlertCircle, 
  Clock, DollarSign 
} from 'lucide-react';
import { Project, ProjectSettings } from '../../../../domain/projects/Project';
import { Currency, Department } from '../../../../domain/master/MasterData';
import { ProjectRepository } from '../../../../repositories/ProjectRepository';
import { MasterDataRepository } from '../../../../repositories/MasterDataRepository';
import { BiText } from '../../../../components/BiText';

interface ProjectSettingsPanelProps {
  lang: 'ar' | 'en';
  project: Project;
  onRefreshProjectData: () => void;
}

export function ProjectSettingsPanel({
  lang,
  project,
  onRefreshProjectData
}: ProjectSettingsPanelProps) {
  const isAr = lang === 'ar';
  const projectRepo = new ProjectRepository();
  const masterRepo = new MasterDataRepository();

  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  
  // Master lists
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);

  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'financial' | 'workflows'>('calendar');

  useEffect(() => {
    if (project.settings) {
      setSettings(project.settings);
    } else {
      setSettings(projectRepo.getDefaultProjectSettings(project));
    }

    async function loadMasters() {
      const currs = await masterRepo.getCurrencies();
      setCurrencies(currs);
      const depts = await masterRepo.getDepartments();
      setDepartmentsList(depts);
    }
    loadMasters();
  }, [project]);

  const handleDayToggle = (dayIndex: number) => {
    if (!settings) return;
    const currentDays = [...settings.workingDays];
    if (currentDays.includes(dayIndex)) {
      setSettings({
        ...settings,
        workingDays: currentDays.filter(d => d !== dayIndex)
      });
    } else {
      setSettings({
        ...settings,
        workingDays: [...currentDays, dayIndex].sort()
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    const updatedProject: Project = {
      ...project,
      settings
    };

    const res = await projectRepo.save(updatedProject);
    if (res) {
      setSuccessMsg(isAr ? 'تم حفظ إعدادات المشروع بنجاح!' : 'Project settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      onRefreshProjectData();
    }
  };

  if (!settings) {
    return <div className="p-4 text-center text-slate-400">Loading settings...</div>;
  }

  const daysOfWeek = [
    { label: { en: 'Sunday', ar: 'الأحد' }, val: 0 },
    { label: { en: 'Monday', ar: 'الإثنين' }, val: 1 },
    { label: { en: 'Tuesday', ar: 'الثلاثاء' }, val: 2 },
    { label: { en: 'Wednesday', ar: 'الأربعاء' }, val: 3 },
    { label: { en: 'Thursday', ar: 'الخميس' }, val: 4 },
    { label: { en: 'Friday', ar: 'الجمعة' }, val: 5 },
    { label: { en: 'Saturday', ar: 'السبت' }, val: 6 }
  ];

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6 animate-in fade-in duration-300 text-xs">
      
      {/* Title block */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
        <div>
          <h3 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-widest font-mono">
            {isAr ? 'إعدادات وقواعد عمل المشروع' : 'Project Settings & Constraints'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {isAr 
              ? 'تخصيص التقاويم، العملات، الأدوار، ومصفوفات الصلاحيات لمشروعك الحالي.' 
              : 'Customize calendar constraints, contract currency, approvers, and numbering formats for this project.'}
          </p>
        </div>

        <button 
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-navy text-white hover:bg-brand-navy/90 text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isAr ? 'حفظ التغييرات' : 'Save Constraints'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex gap-2 items-center font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Navigation */}
      <div className="flex gap-4 border-b border-slate-100 dark:border-slate-850 pb-px">
        {[
          { id: 'calendar', icon: Calendar, label: { en: 'Calendar & Work Days', ar: 'التقويم وأيام العمل' } },
          { id: 'financial', icon: DollarSign, label: { en: 'Financials & Currencies', ar: 'العملات والبيانات المالية' } },
          { id: 'workflows', icon: Users, label: { en: 'Approvals & Workflows', ar: 'صناّع القرار ومصفوفة الصلاحيات' } }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-1.5 pb-2.5 px-1 border-b-2 font-bold transition-all cursor-pointer
              ${activeSubTab === tab.id 
                ? 'border-brand-red text-brand-red' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }
            `}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <BiText text={tab.label} primaryLang={lang} stacked={false} />
          </button>
        ))}
      </div>

      {/* Tab: Calendar and Days */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'التقويم التشغيلي للمشروع' : 'Operational Calendar Pattern'}
              </label>
              <select 
                value={settings.workingCalendar} 
                onChange={e => setSettings({ ...settings, workingCalendar: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
              >
                <option value="Standard 5-Day">Standard 5-Day Work Week</option>
                <option value="Standard 6-Day">Standard 6-Day (Saturday Overtime)</option>
                <option value="Continuous Shift">Continuous 24/7 Operations</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'المنطقة الزمنية (TimeZone)' : 'Project Time Zone'}
              </label>
              <input 
                type="text" 
                value={settings.timeZone} 
                onChange={e => setSettings({ ...settings, timeZone: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              {isAr ? 'تحديد أيام العمل الرسمية بالموقع' : 'Official Working Days'}
            </label>
            <div className="flex flex-wrap gap-2.5">
              {daysOfWeek.map(day => {
                const isActive = settings.workingDays.includes(day.val);
                return (
                  <button
                    key={day.val}
                    type="button"
                    onClick={() => handleDayToggle(day.val)}
                    className={`px-4 py-2.5 rounded-xl border font-bold transition-all cursor-pointer
                      ${isActive 
                        ? 'bg-brand-red/10 border-brand-red text-brand-red font-black' 
                        : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                      }
                    `}
                  >
                    <BiText text={day.label} primaryLang={lang} stacked={false} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Financial & Currency */}
      {activeSubTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'عملة العقد والمطالبات (Currency)' : 'Contract Currency'}
              </label>
              <select 
                value={settings.currency} 
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
              >
                {currencies.map(curr => (
                  <option key={curr.id} value={curr.code}>
                    {curr.code} - {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'نمط ترقيم الوثائق والمخططات' : 'Document Numbering Formula'}
              </label>
              <input 
                type="text" 
                value={settings.documentNumberingRules} 
                onChange={e => setSettings({ ...settings, documentNumberingRules: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Workflows & Approvers */}
      {activeSubTab === 'workflows' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'مصفوفة وتدفق الموافقات' : 'Default Approval Workflow'}
              </label>
              <input 
                type="text" 
                value={settings.approvalWorkflow} 
                onChange={e => setSettings({ ...settings, approvalWorkflow: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'قواعد التصعيد التلقائي' : 'Auto-Escalation Rules'}
              </label>
              <input 
                type="text" 
                value={settings.escalationRules} 
                onChange={e => setSettings({ ...settings, escalationRules: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Roles checklist */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {isAr ? 'أدوار فريق العمل بالمشروع' : 'Configured Team Roles'}
              </span>
              <div className="space-y-1">
                {settings.projectRoles.map((role, idx) => (
                  <div key={idx} className="p-1.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-slate-600 dark:text-slate-300 font-semibold font-sans text-[11px]">
                    {role}
                  </div>
                ))}
              </div>
            </div>

            {/* Approvers list */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {isAr ? 'الجهات المفوضة بالاعتماد' : 'Configured Approvers'}
              </span>
              <div className="space-y-1">
                {settings.approvers.map((appr, idx) => (
                  <div key={idx} className="p-1.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-slate-600 dark:text-slate-300 font-semibold font-sans text-[11px]">
                    {appr}
                  </div>
                ))}
              </div>
            </div>

            {/* Risk matrix */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {isAr ? 'مصفوفة تقييم المخاطر المعتمدة' : 'Risk Assessment Matrix'}
              </span>
              <input 
                type="text" 
                value={settings.riskMatrix} 
                onChange={e => setSettings({ ...settings, riskMatrix: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 text-slate-600 font-bold"
              />
            </div>

          </div>
        </div>
      )}

    </form>
  );
}
