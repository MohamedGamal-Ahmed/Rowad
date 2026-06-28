import React, { useMemo } from 'react';
import { 
  GitCommit, AlertTriangle, ArrowRight, HelpCircle
} from 'lucide-react';
import { CalendarEvent, EventStatus } from '../../types';
import { useTimeline } from '../../hooks/useTimeline';

interface TimelineTracksProps {
  lang: 'ar' | 'en';
  events: CalendarEvent[];
  onSelectEvent: (id: string) => void;
}

export function TimelineTracks({ lang, events, onSelectEvent }: TimelineTracksProps) {
  const isAr = lang === 'ar';
  const projects = useTimeline(events);

  // Define relative horizontal scale: June 15 to July 15, 2026 (30 days total)
  const scaleStart = new Date('2026-06-15');
  const scaleEnd = new Date('2026-07-15');
  const totalDays = 30;

  const datesHeader = useMemo(() => {
    const list: Array<{ dateStr: string; label: string }> = [];
    // Generate dates at 5-day increments
    for (let i = 0; i <= totalDays; i += 5) {
      const d = new Date(scaleStart);
      d.setDate(d.getDate() + i);
      const labelStr = `${d.getMonth() + 1}/${d.getDate()}`;
      list.push({
        dateStr: d.toISOString().split('T')[0],
        label: labelStr
      });
    }
    return list;
  }, []);

  const calculateLeftPercent = (dateStr: string): number => {
    const evDate = new Date(dateStr);
    if (evDate < scaleStart) return 0;
    if (evDate > scaleEnd) return 100;

    const diffTime = evDate.getTime() - scaleStart.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.round((diffDays / totalDays) * 100);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-sans">
            {isAr ? 'مخطط تتبع جدارية المشاريع والمراحل (غانت)' : 'Horizontal Operations Gantt Timeline'}
          </h3>
          <p className="text-xs text-slate-400">
            {isAr ? 'عرض أفقي لمراحل العمل التتابعية وعلاقات الارتباط' : 'Horizontal tracks mapping dependencies and date sequences (June 15 - July 15)'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] overflow-x-auto shadow-sm p-6">
        <div className="min-w-[800px] space-y-8">
          {/* Header Dates Bar */}
          <div className="grid grid-cols-[220px_1fr] border-b border-slate-150 dark:border-slate-800 pb-3 font-mono text-[10px] text-slate-400 font-bold">
            <div>{isAr ? 'المشروع وقائمة المراحل' : 'PROJECT & TRACK'}</div>
            <div className="relative h-5">
              {datesHeader.map((d, idx) => {
                const percent = (idx * 5 / totalDays) * 100;
                return (
                  <span 
                    key={idx} 
                    style={{ left: `${percent}%` }}
                    className="absolute transform -translate-x-1/2"
                  >
                    {d.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Project Track Rows */}
          {projects.length === 0 ? (
            <p className="text-center py-6 text-slate-400 italic text-xs">
              {isAr ? 'لا توجد مشاريع مفعّلة حالياً.' : 'No active projects to display.'}
            </p>
          ) : (
            <div className="space-y-8">
              {projects.map((proj) => {
                return (
                  <div key={proj.projectCode} className="grid grid-cols-[220px_1fr] items-center gap-2">
                    {/* Project Left Deck */}
                    <div className="pr-4 border-r dark:border-slate-800 rtl:border-r-0 rtl:border-l rtl:pl-4">
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-brand-navy/10 text-brand-navy">
                        {proj.projectCode}
                      </span>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 truncate">
                        {isAr ? proj.projectName.ar : proj.projectName.en}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {proj.startDate} {isAr ? 'إلى' : 'to'} {proj.endDate}
                      </p>
                    </div>

                    {/* Timeline Gantt Track Right */}
                    <div className="relative h-20 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-2xl flex items-center">
                      {/* Midline link connector */}
                      <div className="absolute left-2 right-2 h-0.5 bg-slate-200 dark:bg-slate-800"></div>

                      {/* Render Events as Interactive nodes */}
                      {proj.events.map((e) => {
                        const leftPercent = calculateLeftPercent(e.startDate);
                        const isCompleted = e.status === EventStatus.COMPLETED;
                        const isOverdue = e.status === EventStatus.OVERDUE;

                        return (
                          <div
                            key={e.id}
                            style={{ left: `${leftPercent}%` }}
                            onClick={() => onSelectEvent(e.id)}
                            className="absolute transform -translate-x-1/2 cursor-pointer group z-10"
                          >
                            {/* Milestone Dot Indicator */}
                            <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 shadow transition-all group-hover:scale-125
                              ${isCompleted 
                                ? 'bg-emerald-500 border-emerald-200' 
                                : isOverdue 
                                  ? 'bg-rose-500 border-rose-200 animate-pulse'
                                  : e.hasConflict
                                    ? 'bg-amber-500 border-amber-200'
                                    : 'bg-blue-600 border-blue-200'
                              }
                            `}>
                              <GitCommit className="w-2.5 h-2.5 text-white" />
                            </div>

                            {/* Floating hover tag */}
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 font-sans">
                              <p className="font-bold">{isAr ? e.title.ar : e.title.en}</p>
                              <p className="font-mono">{e.startDate}</p>
                            </div>

                            {/* Mini persistent label underneath */}
                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-[9px] font-black text-slate-500 dark:text-slate-400 max-w-[100px] truncate text-center font-sans">
                              {isAr ? e.title.ar.substring(0, 10) : e.title.en.substring(0, 12)}...
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
