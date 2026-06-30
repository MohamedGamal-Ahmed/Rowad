import React from 'react';
import {
  DollarSign, FileText,
  Clock, ShieldCheck, Activity, ExternalLink,
  Flame, ArrowUpRight
} from 'lucide-react';
import { Project, ProjectMeeting, ProjectIPC, ProjectClaim, ProjectVariationOrder, ProjectNOC, ProjectDocument, ContextualAttachment, ProjectHistory } from '../../../../domain/projects/Project';

interface ProjectDashboardProps {
  lang: 'ar' | 'en';
  project: Project;
  meetings: ProjectMeeting[];
  ipcs: ProjectIPC[];
  claims: ProjectClaim[];
  vos: ProjectVariationOrder[];
  nocs: ProjectNOC[];
  documents: ProjectDocument[];
  attachments: ContextualAttachment[];
  history: ProjectHistory[];
  onNavigateTab: (tabId: string) => void;
  onNavigateToRecord?: (tabId: string, recordId: string) => void;
}

export function ProjectDashboard({
  lang,
  project,
  meetings,
  ipcs,
  claims,
  vos,
  nocs,
  documents,
  attachments,
  history,
  onNavigateTab,
  onNavigateToRecord
}: ProjectDashboardProps) {
  const isAr = lang === 'ar';

  // Format Helper
  const formatMoney = (val: number | undefined) => {
    if (val === undefined) return '0.00';
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // 1. Calculate Health scores (simulate real data indicators based on records)
  const scheduleHealth = meetings.length > 5 ? 'Warning' : 'Healthy';
  const costHealth = claims.some(c => c.status === 'Disputed') ? 'Critical' : 'Healthy';
  const documentHealth = documents.filter(d => d.priority === 'High' && d.status !== 'Approved').length > 2 ? 'Warning' : 'Healthy';
  const contractHealth = 'Healthy';
  const operationalHealth = 'Healthy';

  const healthColors = (state: string) => {
    switch (state) {
      case 'Healthy': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900';
      case 'Warning': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900';
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  // 2. Compute live KPIs
  const openIpcCount = ipcs.filter(i => i.status !== 'Paid').length;
  const openIpcValue = ipcs.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.invoiceGrossValue, 0);

  const pendingClaimsCount = claims.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const pendingClaimsValue = claims.filter(c => c.status === 'Submitted' || c.status === 'Under Review').reduce((sum, c) => sum + c.additionalClaimedAmount, 0);

  const pendingVOSCount = vos.filter(v => v.status === 'Submitted' || v.status === 'Draft').length;
  const pendingVOSValue = vos.filter(v => v.status === 'Submitted' || v.status === 'Draft').reduce((sum, v) => sum + (v.commercialOffer?.amount ?? 0), 0);

  const pendingNocCount = nocs.filter(n => n.status === 'Pending' || n.status === 'Under Review').length;
  const activeMeetingsCount = meetings.length;
  const pendingApprovalDocs = documents.filter(d => d.status.toLowerCase().includes('pending') || d.status.toLowerCase().includes('review')).length;

  // 3. Scheduling Conflict Summary
  const conflictsList: string[] = [];
  // Detect overlapping meetings or narrow slots
  for (let i = 0; i < meetings.length; i++) {
    for (let j = i + 1; j < meetings.length; j++) {
      if (meetings[i].date === meetings[j].date) {
        conflictsList.push(
          isAr 
            ? `تداخل محتمل في تاريخ ${meetings[i].date} بين: "${meetings[i].titleAr || meetings[i].title}" و "${meetings[j].titleAr || meetings[j].title}"`
            : `Overlapping date conflict on ${meetings[i].date} between: "${meetings[i].title}" and "${meetings[j].title}"`
        );
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Project Identity & Lifecycle Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-navy/5 dark:bg-brand-red/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 z-10 relative">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black tracking-wider rounded border border-slate-150 dark:border-slate-750 font-mono uppercase">
                {project.code}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                project.lifecycleStage === 'Execution' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30' 
                  : project.lifecycleStage === 'Pre-Award'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {isAr ? `المرحلة: ${project.lifecycleStage === 'Pre-Award' ? 'قبل الترسية' : project.lifecycleStage === 'Execution' ? 'التنفيذ والتشغيل' : project.lifecycleStage}` : `STAGE: ${project.lifecycleStage.toUpperCase()}`}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] rounded-full font-bold">
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-brand-navy dark:text-slate-100 tracking-tight leading-tight">
              {isAr && project.nameAr ? project.nameAr : project.nameEn}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'العميل: ' : 'Client: '} <span className="font-extrabold text-slate-600 dark:text-slate-300">{project.client}</span> | {isAr ? 'الاستشاري: ' : 'Consultant: '} <span className="font-extrabold text-slate-600 dark:text-slate-300">{project.consultant}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center shrink-0 w-full lg:w-auto">
            {/* Visual Lifecycle Stage Tracker */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-100 dark:border-slate-850 text-[10px] font-bold w-full sm:w-auto justify-between">
              {['Pre-Award', 'Awarded', 'Execution', 'Closing', 'Archived'].map((stage, idx) => {
                const isActive = project.lifecycleStage === stage;
                return (
                  <div key={stage} className="flex items-center gap-1">
                    {idx > 0 && <span className="text-slate-300 dark:text-slate-700 mx-0.5">→</span>}
                    <span className={`px-1.5 py-0.5 rounded ${isActive ? 'bg-brand-red text-white font-extrabold scale-105' : 'text-slate-400'}`}>
                      {isAr 
                        ? (stage === 'Pre-Award' ? 'دراسة' : stage === 'Awarded' ? 'ترسية' : stage === 'Execution' ? 'تنفيذ' : stage === 'Closing' ? 'إغلاق' : 'أرشفة')
                        : stage
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Project Health Radar */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 font-mono">
          {isAr ? 'مؤشرات الصحة المتكاملة للمشروع' : 'Integrated Project Health Indices'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { id: 'schedule', icon: Clock, label: { en: 'Schedule Health', ar: 'سلامة البرنامج الزمني' }, val: scheduleHealth },
            { id: 'cost', icon: DollarSign, label: { en: 'Cost Health', ar: 'الموقف المالي والموازنة' }, val: costHealth },
            { id: 'document', icon: FileText, label: { en: 'Document Control', ar: 'مراقبة المستندات' }, val: documentHealth },
            { id: 'contract', icon: ShieldCheck, label: { en: 'Contract Health', ar: 'سلامة الالتزامات التعاقدية' }, val: contractHealth },
            { id: 'operational', icon: Activity, label: { en: 'Operational Health', ar: 'جاهزية الموقع والعمليات' }, val: operationalHealth }
          ].map(health => (
            <div key={health.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center shadow-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl mb-3">
                <health.icon className="w-5 h-5 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">
                {isAr ? health.label.ar : health.label.en}
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${healthColors(health.val)}`}>
                {isAr 
                  ? (health.val === 'Healthy' ? 'سليم' : health.val === 'Warning' ? 'تحذير' : 'حرج')
                  : health.val.toUpperCase()
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live KPI Cards */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 font-mono">
          {isAr ? 'أداء العمليات الحية (مؤشرات الأداء)' : 'Live Operational KPIs'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* IPC Accounts Card */}
          <button 
            onClick={() => onNavigateTab('ipc')}
            className="bg-white dark:bg-slate-900 hover:border-brand-red border border-slate-150 dark:border-slate-800 p-5 rounded-3xl text-start shadow-xs transition-all relative group cursor-pointer"
          >
            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-brand-red transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">{isAr ? 'المستخلصات الجارية (غير مدفوعة)' : 'Open IPC Accounts'}</span>
            <div className="text-xl font-black text-brand-navy dark:text-slate-100 mb-1 font-mono">
              {openIpcCount} <span className="text-xs font-normal text-slate-400">{isAr ? 'مستندات' : 'Records'}</span>
            </div>
            <div className="text-xs font-bold text-slate-500 font-mono">
              {formatMoney(openIpcValue)} {project.currency}
            </div>
          </button>

          {/* Pending Claims Card */}
          <button 
            onClick={() => onNavigateTab('claims')}
            className="bg-white dark:bg-slate-900 hover:border-brand-red border border-slate-150 dark:border-slate-800 p-5 rounded-3xl text-start shadow-xs transition-all relative group cursor-pointer"
          >
            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-brand-red transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">{isAr ? 'المطالبات المالية المعلقة' : 'Pending Commercial Claims'}</span>
            <div className="text-xl font-black text-brand-navy dark:text-slate-100 mb-1 font-mono">
              {pendingClaimsCount} <span className="text-xs font-normal text-slate-400">{isAr ? 'طلبات' : 'Claims'}</span>
            </div>
            <div className="text-xs font-bold text-slate-500 font-mono">
              {formatMoney(pendingClaimsValue)} {project.currency}
            </div>
          </button>

          {/* Pending VOs Card */}
          <button 
            onClick={() => onNavigateTab('vo')}
            className="bg-white dark:bg-slate-900 hover:border-brand-red border border-slate-150 dark:border-slate-800 p-5 rounded-3xl text-start shadow-xs transition-all relative group cursor-pointer"
          >
            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-brand-red transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">{isAr ? 'الأوامر التغييرية معلقة الاعتماد' : 'Pending Variation Orders'}</span>
            <div className="text-xl font-black text-brand-navy dark:text-slate-100 mb-1 font-mono">
              {pendingVOSCount} <span className="text-xs font-normal text-slate-400">{isAr ? 'أوامر' : 'VOs'}</span>
            </div>
            <div className="text-xs font-bold text-slate-500 font-mono">
              {formatMoney(pendingVOSValue)} {project.currency}
            </div>
          </button>

          {/* Other KPIs Quick List */}
          <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-4 rounded-3xl flex flex-col justify-between text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold">{isAr ? 'تصاريح عدم الممانعة المفتوحة' : 'Open NOC Permits'}</span>
              <span className="font-extrabold text-brand-navy dark:text-slate-200 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">{pendingNocCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold">{isAr ? 'الاجتماعات النشطة' : 'Active Meetings'}</span>
              <span className="font-extrabold text-brand-navy dark:text-slate-200 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">{activeMeetingsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold">{isAr ? 'مستندات معلقة المراجعة' : 'Docs Pending Approval'}</span>
              <span className="font-extrabold text-brand-navy dark:text-slate-200 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">{pendingApprovalDocs}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Grid: Activity Feed & Upcoming/Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl lg:col-span-2 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
            <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-widest font-mono">
              {isAr ? 'شريط العمليات والأحداث الأخير (مفصل)' : 'Recent Operations Activity feed'}
            </h4>
            <button 
              onClick={() => onNavigateTab('history')}
              className="text-[10px] font-bold text-brand-red hover:underline"
            >
              {isAr ? 'عرض السجل بالكامل' : 'View Full Feed'}
            </button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="flex gap-4 items-start text-xs leading-relaxed">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0 mt-1.5"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {item.action}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5 truncate text-[11px]">
                    {item.details}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.performedBy && (
                      <span className="text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                        {item.performedBy}
                      </span>
                    )}
                    {item.module && (
                      <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-extrabold uppercase font-mono">
                        {item.module}
                      </span>
                    )}
                    {item.entityCode && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        #{item.entityCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column for Deadlines, Uploads, Conflicts */}
        <div className="space-y-6">
          
          {/* Scheduling Conflicts Block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-3">
            <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-widest font-mono border-b pb-2">
              {isAr ? 'تحليل النزاعات والتداخلات' : 'Scheduling Conflict Engine'}
            </h4>
            {conflictsList.length > 0 ? (
              <div className="space-y-2">
                {conflictsList.slice(0, 2).map((conflict, index) => (
                  <div key={index} className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl flex gap-2 items-start text-[11px]">
                    <Flame className="w-4 h-4 shrink-0 text-brand-red" />
                    <span>{conflict}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-xl flex gap-2 items-center text-[11px] font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{isAr ? 'جاهز! لا توجد تداخلات أو تضارب مواعيد حالية.' : 'All clear! No overlapping conflicts detected.'}</span>
              </div>
            )}
          </div>

          {/* Recent Document Uploads */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-3">
            <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-widest font-mono border-b pb-2">
              {isAr ? 'آخر الملفات والمرفقات التعاقدية' : 'Recent Contract Uploads'}
            </h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
              {attachments.slice(0, 3).map((att) => (
                <div key={att.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl text-xs">
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-700 dark:text-slate-300 truncate" title={att.fileName}>
                      {att.fileName}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {att.fileSize} • {att.category}
                    </span>
                  </div>
                  <button className="p-1 text-slate-400 hover:text-brand-navy">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {attachments.length === 0 && (
                <p className="text-center text-slate-400 py-3 text-[11px]">
                  {isAr ? 'لا توجد مرفقات حديثة.' : 'No uploads available.'}
                </p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
