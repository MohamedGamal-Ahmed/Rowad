import React from 'react';
import { 
  AlertTriangle, AlertCircle, RefreshCw, UserCheck, ShieldAlert, ArrowRight, CheckCircle2
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { useConflicts, ScheduleConflict } from '../../hooks/useConflicts';

interface ConflictPanelProps {
  lang: 'ar' | 'en';
  events: CalendarEvent[];
  onSelectEvent: (id: string) => void;
  onAutoResolve: (conflict: ScheduleConflict) => void;
}

export function ConflictPanel({ lang, events, onSelectEvent, onAutoResolve }: ConflictPanelProps) {
  const isAr = lang === 'ar';
  const conflictsList = useConflicts(events);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 text-brand-red border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <AlertCircle className="w-5 h-5 text-brand-red" />,
          bg: 'bg-rose-50'
        };
      case 'high':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
          bg: 'bg-orange-50'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50'
        };
      case 'info':
        return {
          icon: <UserCheck className="w-5 h-5 text-sky-600" />,
          bg: 'bg-sky-50'
        };
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50'
        };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-sans">
          {isAr ? 'مركز تدقيق وتعارض المخططات الزمنية' : 'Operations Schedule Diagnostics Center'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {isAr ? 'كشف ذكي وتلقائي لتداخل الموارد، والأخطاء الكرونولوجية، والمواعيد المتداخلة' : 'System-wide evaluation of double-bookings, chronological sequence gaps, and lag buffer violations'}
        </p>
      </div>

      {conflictsList.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-6 space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-sans">
            {isAr ? 'جميع المخططات الزمنية متوافقة بالكامل' : 'Schedules are Fully Aligned!'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isAr ? 'لا يوجد تداخل في حجز الموظفين، ويتم احترام كافة سلاسل الاعتمادية والمستندات.' : 'Zero resource double-bookings or chronological dependency violations detected across the portfolio.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-150 dark:border-rose-900 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-brand-red shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider font-sans">
                {isAr ? `تم رصد عدد ${conflictsList.length} تنبيه تعارض وجدولة` : `Detected ${conflictsList.length} Active Schedule Diagnostics`}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'يُرجى مراجعة وتعديل التواريخ أو ترحيلها تلقائياً باستخدام مقترح التعديل المتاح لكل تعارض لتفادي تأثر سير العمل.' : 'Please evaluate the warnings below. You can apply our intelligent DAG Auto-Reschedule recommendations to propagate dates smoothly forward.'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {conflictsList.map((c) => {
              const theme = getSeverityIcon(c.severity);
              const isInfo = c.severity === 'info';
              return (
                <div 
                  key={c.id}
                  className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[24px] p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 ${theme.bg} rounded-xl mt-0.5`}>
                        {theme.icon}
                      </div>
                      <div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getSeverityBadge(c.severity)}`}>
                          {c.severity}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans mt-1">
                          {isAr ? c.title.ar : c.title.en}
                        </h4>
                        <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                          {isAr ? c.description?.ar : c.description?.en}
                        </p>
                      </div>
                    </div>

                    {/* Auto Resolve action button - only show if not info (back-to-back sequential is normal and doesn't require resolution) */}
                    {!isInfo && (
                      <button
                        onClick={() => onAutoResolve(c)}
                        className="flex items-center gap-1.5 bg-brand-red text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-brand-red/90 transition-all cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'ترحيل وحل التعارض' : 'Auto-Resolve & Shift'}</span>
                      </button>
                    )}
                  </div>

                  {/* Affected Milestones details */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 border border-slate-150 dark:border-slate-800/60 space-y-3">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      {isAr ? 'الأحداث المتأثرة بالتعارض' : 'AFFECTED MILESTONES'}
                    </p>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                      {c.affectedEvents.map((e, idx) => (
                        <React.Fragment key={e.id}>
                          {idx > 0 && (
                            <div className="flex items-center justify-center shrink-0 text-slate-300">
                              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </div>
                          )}
                          <div 
                            onClick={() => onSelectEvent(e.id)}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3 rounded-xl hover:border-slate-300 transition-colors cursor-pointer"
                          >
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">{e.projectCode}</span>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{isAr ? e.title.ar : e.title.en}</h5>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{e.startDate} ({e.startTime || '08:00'} - {e.endTime || '09:00'})</p>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
