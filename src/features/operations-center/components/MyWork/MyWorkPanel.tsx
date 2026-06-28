import React from 'react';
import { 
  CheckSquare, Square, AlertCircle, Clock, CheckCircle2, ChevronRight, MessageSquare, Tag, User2
} from 'lucide-react';
import { CalendarEvent, EventStatus, EventPriority } from '../../types';

interface MyWorkPanelProps {
  lang: 'ar' | 'en';
  events: CalendarEvent[];
  onSelectEvent: (id: string) => void;
  onCompleteEvent: (id: string) => void;
}

export function MyWorkPanel({ lang, events, onSelectEvent, onCompleteEvent }: MyWorkPanelProps) {
  const isAr = lang === 'ar';
  
  // Get active user's events (mock active user has 'usr-sara' / Sara Al-Mansoori)
  const myEvents = events.filter(e => 
    e.ownerId === 'usr-sara' || 
    e.ownerName.toLowerCase().includes('sara')
  );

  const todayStr = '2026-06-23'; // Standard mock baseline date

  // 1. Overdue
  const overdueEvents = myEvents.filter(e => 
    e.status === EventStatus.OVERDUE || 
    (e.startDate < todayStr && e.status !== EventStatus.COMPLETED)
  );

  // 2. Today
  const todayEvents = myEvents.filter(e => 
    e.startDate === todayStr && 
    e.status !== EventStatus.COMPLETED && 
    e.status !== EventStatus.OVERDUE
  );

  // 3. Tomorrow
  const tomorrowEvents = myEvents.filter(e => {
    const tom = new Date(todayStr);
    tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split('T')[0];
    return e.startDate === tomStr && e.status !== EventStatus.COMPLETED;
  });

  // 4. This Week (upcoming but not today or tomorrow, within 7 days)
  const thisWeekEvents = myEvents.filter(e => {
    const dateLimit = new Date(todayStr);
    dateLimit.setDate(dateLimit.getDate() + 7);
    const limitStr = dateLimit.toISOString().split('T')[0];
    const tom = new Date(todayStr);
    tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split('T')[0];

    return e.startDate > tomStr && e.startDate <= limitStr && e.status !== EventStatus.COMPLETED;
  });

  // 5. Waiting For Me
  const waitingForMeEvents = myEvents.filter(e => 
    e.status === EventStatus.WAITING_FOR_ME
  );

  // 6. Waiting For Others
  const waitingForOthersEvents = myEvents.filter(e => 
    e.status === EventStatus.WAITING_FOR_OTHERS
  );

  // 7. Completed Today
  const completedTodayEvents = myEvents.filter(e => 
    e.status === EventStatus.COMPLETED && 
    e.startDate === todayStr
  );

  const renderSection = (
    title: { en: string; ar: string }, 
    list: CalendarEvent[], 
    accentColor: string, 
    emptyText: { en: string; ar: string }
  ) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className={`w-2 h-2 rounded-full ${accentColor}`}></div>
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest font-sans">
            {isAr ? title.ar : title.en} ({list.length})
          </h4>
        </div>

        {list.length === 0 ? (
          <p className="text-xs text-slate-400 font-sans italic pl-4">
            {isAr ? emptyText.ar : emptyText.en}
          </p>
        ) : (
          <div className="space-y-2">
            {list.map((e) => (
              <div 
                key={e.id}
                className={`flex items-start justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group`}
                onClick={() => onSelectEvent(e.id)}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Quick Finish Checkbox */}
                  <button 
                    onClick={(evt) => {
                      evt.stopPropagation();
                      onCompleteEvent(e.id);
                    }}
                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                  >
                    {e.status === EventStatus.COMPLETED ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 hover:border-emerald-500" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {e.projectCode}
                      </span>
                      {e.priority === EventPriority.CRITICAL && (
                        <span className="text-[9px] font-black uppercase text-brand-red font-sans">
                          {isAr ? 'حرِج' : 'CRITICAL'}
                        </span>
                      )}
                    </div>

                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-red transition-colors">
                      {isAr ? e.title.ar : e.title.en}
                    </h5>

                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {isAr ? e.description?.ar : e.description?.en}
                    </p>

                    {/* Metadata strip */}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{e.startDate} {e.startTime && `| ${e.startTime}`}</span>
                      </span>
                      {e.notes.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{e.notes.length}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 rtl:rotate-180 transition-colors shrink-0 self-center" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-sans">
            {isAr ? 'مهامي اليومية وجدول أعمالي' : 'Personal Daily Priority Board'}
          </h3>
          <p className="text-xs text-slate-400">
            {isAr ? 'تتم التصفية تلقائياً لإظهار مهامك ومسؤولياتك المباشرة' : 'Automatically synchronized for your personal coordinator profile'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-brand-navy/5 text-brand-navy text-[10px] font-black uppercase tracking-wider font-mono px-3 py-1.5 rounded-full">
          <User2 className="w-3.5 h-3.5" />
          <span>SARA AL-MANSOORI (PMO)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Hand: Critical Overdue, Today, Tomorrow */}
        <div className="space-y-6">
          {renderSection(
            { en: '⌛ OVERDUE TASKS', ar: '⌛ مهام متأخرة التنفيذ' }, 
            overdueEvents, 
            'bg-rose-500 animate-pulse', 
            { en: 'No overdue tasks. Perfect schedule alignment!', ar: 'لا توجد مهام متأخرة. توافق كامل للمخطط الزمني!' }
          )}

          {renderSection(
            { en: '📅 TODAY priorities', ar: '📅 أولويات اليوم ومواعيده' }, 
            todayEvents, 
            'bg-brand-red', 
            { en: 'No tasks scheduled for today.', ar: 'لا توجد مهام مجدولة لليوم.' }
          )}

          {renderSection(
            { en: '📆 TOMORROW prep', ar: '📆 تحضيرات الغد المسبقة' }, 
            tomorrowEvents, 
            'bg-amber-500', 
            { en: 'No tasks scheduled for tomorrow.', ar: 'لا توجد مهام مسبقة للغد.' }
          )}
        </div>

        {/* Right Hand: This Week, Approvals, Completed */}
        <div className="space-y-6">
          {renderSection(
            { en: '📥 WAITING FOR ME (Approvals)', ar: '📥 بانتظار موافقتي واعتمادي' }, 
            waitingForMeEvents, 
            'bg-blue-500', 
            { en: 'You are not blocking any workflow approvals.', ar: 'لا توجد ملفات بانتظار توقيعك أو موافقتك حالياً.' }
          )}

          {renderSection(
            { en: '⏳ WAITING FOR OTHERS', ar: '⏳ بانتظار مدخلات الآخرين' }, 
            waitingForOthersEvents, 
            'bg-purple-500', 
            { en: 'No pending items blocked on external departments.', ar: 'لا توجد مهام معلقة بانتظار مدخلات الأقسام الأخرى.' }
          )}

          {renderSection(
            { en: '📋 THIS WEEK lookahead', ar: '📋 الاستشراف الأسبوعي للمهام' }, 
            thisWeekEvents, 
            'bg-slate-400', 
            { en: 'No other tasks scheduled for this week.', ar: 'لا توجد مهام أخرى مجدولة لهذا الأسبوع.' }
          )}

          {renderSection(
            { en: '✅ COMPLETED TODAY', ar: '✅ ما تم إنجازه واكتماله اليوم' }, 
            completedTodayEvents, 
            'bg-emerald-500', 
            { en: 'No tasks completed yet today. Mark tasks to log achievements!', ar: 'لم يتم إنهاء مهام اليوم بعد. ضع علامة صح لتسجيل الإنجاز!' }
          )}
        </div>
      </div>
    </div>
  );
}
