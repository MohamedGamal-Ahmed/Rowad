import React from 'react';
import { 
  Plus, MoreHorizontal, ChevronRight, MessageSquare, Paperclip, Clock
} from 'lucide-react';
import { CalendarEvent, EventStatus, EventPriority } from '../../types';

interface KanbanBoardProps {
  lang: 'ar' | 'en';
  events: CalendarEvent[];
  onSelectEvent: (id: string) => void;
}

export function KanbanBoard({ lang, events, onSelectEvent }: KanbanBoardProps) {
  const isAr = lang === 'ar';

  const columns: Array<{ id: EventStatus; label: { en: string; ar: string }; color: string }> = [
    { id: EventStatus.PENDING, label: { en: 'Pending', ar: 'قيد الانتظار' }, color: 'border-slate-300 bg-slate-100 dark:bg-slate-900/60' },
    { id: EventStatus.IN_PROGRESS, label: { en: 'In Progress', ar: 'جاري العمل' }, color: 'border-blue-400 bg-blue-50/20 dark:bg-blue-950/10' },
    { id: EventStatus.WAITING_FOR_ME, label: { en: 'Waiting On Me', ar: 'بانتظاري' }, color: 'border-amber-400 bg-amber-50/20' },
    { id: EventStatus.COMPLETED, label: { en: 'Completed', ar: 'مكتمل ومؤرشف' }, color: 'border-emerald-400 bg-emerald-50/20' }
  ];

  const getPriorityTagColor = (priority: EventPriority) => {
    switch (priority) {
      case EventPriority.CRITICAL:
        return 'text-brand-red bg-red-50 border-red-100';
      case EventPriority.HIGH:
        return 'text-orange-700 bg-orange-50 border-orange-100';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 pb-12 overflow-x-auto no-scrollbar">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-sans">
          {isAr ? 'لوحة كانبان لتدفق وإنجاز المهام' : 'Operational Status Kanban Lanes'}
        </h3>
        <p className="text-xs text-slate-400">
          {isAr ? 'إدارة مرنة للمراحل والعطاءات مقسمة حسب حالة الإنجاز والمتابعة المباشرة' : 'Agile board organizing pre-award tenders and controls by processing lanes'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[1000px] items-start">
        {columns.map((col) => {
          const colEvents = events.filter(e => e.status === col.id || (col.id === EventStatus.PENDING && e.status === EventStatus.WAITING_FOR_OTHERS) || (col.id === EventStatus.IN_PROGRESS && e.status === EventStatus.OVERDUE));

          return (
            <div 
              key={col.id} 
              className={`border border-slate-150 dark:border-slate-800/80 rounded-[28px] p-4 flex flex-col gap-3 min-h-[500px] ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-sans">
                    {isAr ? col.label.ar : col.label.en}
                  </span>
                  <span className="text-[10px] font-bold bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    {colEvents.length}
                  </span>
                </div>
              </div>

              {/* Column Items */}
              <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                {colEvents.map((e) => {
                  return (
                    <div
                      key={e.id}
                      onClick={() => onSelectEvent(e.id)}
                      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold font-mono text-slate-400">
                            {e.projectCode}
                          </span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getPriorityTagColor(e.priority)}`}>
                            {isAr ? {
                              [EventPriority.CRITICAL]: 'حرِج',
                              [EventPriority.HIGH]: 'عالي',
                              [EventPriority.MEDIUM]: 'متوسط',
                              [EventPriority.LOW]: 'منخفض'
                            }[e.priority] : e.priority}
                          </span>
                        </div>

                        <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-brand-red transition-colors line-clamp-2">
                          {isAr ? e.title.ar : e.title.en}
                        </h5>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/60 pt-2.5 text-[9px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span>{e.startDate}</span>
                        </span>
                        <span className="font-semibold text-slate-500 truncate max-w-[80px]">{e.ownerName.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })}

                {colEvents.length === 0 && (
                  <p className="text-center py-8 text-[11px] text-slate-400 font-sans italic">
                    {isAr ? 'لا توجد عناصر هنا' : 'Empty Column'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
