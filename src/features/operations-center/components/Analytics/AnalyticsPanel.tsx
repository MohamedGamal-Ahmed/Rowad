import React, { useMemo } from 'react';
import { 
  BarChart, PieChart, TrendingUp, AlertOctagon, CheckSquare, Layers, Clock
} from 'lucide-react';
import { CalendarEvent, EventStatus, EventModuleType } from '../../types';

interface AnalyticsPanelProps {
  lang: 'ar' | 'en';
  events: CalendarEvent[];
}

export function AnalyticsPanel({ lang, events }: AnalyticsPanelProps) {
  const isAr = lang === 'ar';

  const stats = useMemo(() => {
    const total = events.length;
    const completed = events.filter(e => e.status === EventStatus.COMPLETED).length;
    const overdue = events.filter(e => e.status === EventStatus.OVERDUE).length;
    const active = events.filter(e => e.status === EventStatus.IN_PROGRESS || e.status === EventStatus.WAITING_FOR_ME).length;
    const conflicts = events.filter(e => e.hasConflict).length;

    // Modules breakdown
    const preaward = events.filter(e => e.module === EventModuleType.PRE_AWARD).length;
    const controls = events.filter(e => e.module === EventModuleType.PROJECT_CONTROLS).length;
    const docs = events.filter(e => e.module === EventModuleType.DOCUMENT_CONTROL).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      overdue,
      active,
      conflicts,
      completionRate,
      preaward,
      controls,
      docs
    };
  }, [events]);

  return (
    <div className="space-y-6 pb-12">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-sans">
          {isAr ? 'تقارير الأداء ومؤشرات جودة التخطيط' : 'Operations Analytics & Planning Quality'}
        </h3>
        <p className="text-xs text-slate-400">
          {isAr ? 'تحليل إحصائي فوري لجودة ومعدل الإنجاز للخطط والمراحل ومستندات التعاقد' : 'Strategic PMO indicators reflecting milestones completion rates and bottleneck risks'}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Completion Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              {isAr ? 'معدل إنجاز المراحل' : 'Completion Rate'}
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {stats.completionRate}%
            </h4>
            <p className="text-[10px] text-slate-400">
              {stats.completed} {isAr ? 'من أصل' : 'of'} {stats.total} {isAr ? 'مهمة' : 'milestones'}
            </p>
          </div>
        </div>

        {/* KPI 2: Overdue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              {isAr ? 'المتأخرات الحرجة' : 'Overdue Items'}
            </span>
            <div className="p-1.5 bg-rose-50 text-brand-red rounded-lg">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {stats.overdue}
            </h4>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'تتطلب تدخلاً مسبقاً وفورياً' : 'Urgent action required'}
            </p>
          </div>
        </div>

        {/* KPI 3: Conflicts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              {isAr ? 'مخاطر التعارض والجدولة' : 'Schedule Conflicts'}
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {stats.conflicts}
            </h4>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'تداخل في حجز الموارد والجدولة' : 'Double bookings & lag breaches'}
            </p>
          </div>
        </div>

        {/* KPI 4: Total active */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              {isAr ? 'المهام النشطة الجارية' : 'Active Portfolio'}
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {stats.active}
            </h4>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'تحت الدراسة والمتابعة الميدانية' : 'Currently in progress'}
            </p>
          </div>
        </div>
      </div>

      {/* Visual representation card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-4">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest font-sans flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <span>{isAr ? 'توزيع عبء العمل والمهام على إدارات المؤسسة' : 'Departmental Breakdown of Operational Milestones'}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Deck 1: Pre-award */}
          <div className="bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'قسم دراسة العطاءات (Pre-Award)' : 'Estimation & Tendering'}</p>
              <span className="text-xs font-mono font-bold text-blue-600">{stats.preaward}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats.total > 0 ? (stats.preaward / stats.total) * 100 : 0}%` }}
                className="h-full bg-blue-500 rounded-full"
              ></div>
            </div>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'مواعيد التقديم الفني والمالي وورش العمل للعملاء' : 'Kickoffs, risk assessments, bid submissions'}
            </p>
          </div>

          {/* Deck 2: Project Controls */}
          <div className="bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'التحكم والمتابعة الميدانية (Execution)' : 'Project Controls & Execution'}</p>
              <span className="text-xs font-mono font-bold text-emerald-600">{stats.controls}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats.total > 0 ? (stats.controls / stats.total) * 100 : 0}%` }}
                className="h-full bg-emerald-500 rounded-full"
              ></div>
            </div>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'مطالبات مالية، مستخلصات جارية، أوامر تغيير وتصاريح' : 'IPCs, contract claims, VOs, NOC checks'}
            </p>
          </div>

          {/* Deck 3: Document Control */}
          <div className="bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'مراقبة الوثائق الهندسية (Documents)' : 'Document & Submittals Control'}</p>
              <span className="text-xs font-mono font-bold text-purple-600">{stats.docs}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats.total > 0 ? (stats.docs / stats.total) * 100 : 0}%` }}
                className="h-full bg-purple-500 rounded-full"
              ></div>
            </div>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'مراجعات مستندات، صادر ووارد الخطابات الهندسية' : 'Transmittals reviews, shop drawings logging'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
