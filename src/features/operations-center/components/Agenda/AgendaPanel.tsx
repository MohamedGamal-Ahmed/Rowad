import React from 'react';
import { 
  Clock, MapPin, CheckCircle, ChevronRight, AlertTriangle, Paperclip
} from 'lucide-react';
import { CalendarEvent, EventStatus } from '../../types';
import { useAgenda } from '../../hooks/useAgenda';

interface AgendaPanelProps {
  lang: 'ar' | 'en';
  events: CalendarEvent[];
  onSelectEvent: (id: string) => void;
}

export function AgendaPanel({ lang, events, onSelectEvent }: AgendaPanelProps) {
  const isAr = lang === 'ar';
  const groups = useAgenda(events);

  return (
    <div className="space-y-6 pb-12">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-sans">
          {isAr ? 'دفتر المواعيد وأجندة الأعمال التفصيلية' : 'High-Density Chronicle List View'}
        </h3>
        <p className="text-xs text-slate-400">
          {isAr ? 'استعراض زمني تتابعي لكافة المراحل والمستندات والاجتماعات للمؤسسة' : 'Scrollable sequence of project controls, tender deadlines, and submittals'}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 text-slate-400 italic bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl">
          {isAr ? 'لا توجد مواعيد مجدولة للمحفظة حالياً.' : 'No active scheduled agenda items.'}
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:top-4 before:bottom-4 before:left-[17px] rtl:before:left-auto rtl:before:right-[17px] before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {groups.map((group) => (
            <div key={group.dateString} className="space-y-3 relative">
              {/* Timeline date node pin */}
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-brand-red/10 border border-brand-red text-brand-red flex items-center justify-center shrink-0 font-sans font-bold text-xs relative z-10">
                  {new Date(group.dateString).getDate()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight font-sans">
                    {isAr ? group.formattedDate.ar : group.formattedDate.en}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {group.dateString}
                  </p>
                </div>
              </div>

              {/* Day items list */}
              <div className="pl-12 rtl:pl-0 rtl:pr-12 space-y-3">
                {group.events.map((e) => {
                  const isCompleted = e.status === EventStatus.COMPLETED;
                  return (
                    <div
                      key={e.id}
                      onClick={() => onSelectEvent(e.id)}
                      className={`group border border-slate-150 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4`}
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-brand-navy/5 text-brand-navy dark:bg-slate-800 dark:text-slate-300">
                            {e.projectCode}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-400 uppercase font-bold">{e.module}</span>
                          
                          {e.hasConflict && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{isAr ? 'تعارض' : 'Conflict'}</span>
                            </span>
                          )}
                        </div>

                        <h5 className={`text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-red transition-colors ${isCompleted ? 'line-through opacity-50' : ''}`}>
                          {isAr ? e.title.ar : e.title.en}
                        </h5>

                        <p className="text-xs text-slate-400 truncate leading-relaxed">
                          {isAr ? e.description?.ar : e.description?.en}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{e.startTime || '08:00'} - {e.endTime || '17:00'}</span>
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-500">{e.ownerName}</span>
                          {e.attachments.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                <span>{e.attachments.length}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 rtl:rotate-180 transition-colors shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
