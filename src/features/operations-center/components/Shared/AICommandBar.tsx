import React, { useState } from 'react';
import { Sparkles, ArrowLeftRight, Check } from 'lucide-react';

interface AICommandBarProps {
  lang: 'ar' | 'en';
  onExecuteCommand: (command: string, actionType: string, filterVal?: string) => void;
}

export function AICommandBar({ lang, onExecuteCommand }: AICommandBarProps) {
  const isAr = lang === 'ar';
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const sampleQueries = isAr 
    ? [
        { text: 'أظهر المهام المتأخرة', action: 'filter', val: 'overdue' },
        { text: 'من لديه ضغط عمل؟', action: 'tab', val: 'workload' },
        { text: 'مشاكل الجدولة والتعارض', action: 'tab', val: 'conflicts' },
      ]
    : [
        { text: 'Show overdue tasks', action: 'filter', val: 'overdue' },
        { text: 'Who is overloaded?', action: 'tab', val: 'workload' },
        { text: 'Show schedule conflicts', action: 'tab', val: 'conflicts' },
      ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input.toLowerCase();
    let action = 'search';
    let value = input;
    let feedbackEn = '';
    let feedbackAr = '';

    if (query.includes('overdue') || query.includes('متأخر')) {
      action = 'filter';
      value = 'overdue';
      feedbackEn = 'Filtered view for overdue items.';
      feedbackAr = 'تم تصفية العرض لإظهار العناصر المتأخرة فقط.';
    } else if (query.includes('workload') || query.includes('overload') || query.includes('ضغط') || query.includes('موزع')) {
      action = 'tab';
      value = 'workload';
      feedbackEn = 'Switched to Workload tab to check resource capacity.';
      feedbackAr = 'تم الانتقال لعلامة تبويب طاقة العمل لمراجعة الموارد.';
    } else if (query.includes('conflict') || query.includes('تعارض') || query.includes('مشكل')) {
      action = 'tab';
      value = 'conflicts';
      feedbackEn = 'Switched to Conflicts tab to inspect scheduling alerts.';
      feedbackAr = 'تم الانتقال لعلامة تبويب التعارضات لمراجعة التنبيهات.';
    } else if (query.includes('timeline') || query.includes('gantt') || query.includes('مخطط')) {
      action = 'tab';
      value = 'timeline';
      feedbackEn = 'Opened Project Timeline (Gantt Tracker).';
      feedbackAr = 'تم الانتقال للمخطط الزمني للمشروع (غانت).';
    } else {
      feedbackEn = `Searching across schedules for "${input}"...`;
      feedbackAr = `جاري البحث في الجداول والمهام عن "${input}"...`;
    }

    onExecuteCommand(input, action, value);
    setFeedback(isAr ? feedbackAr : feedbackEn);
    setInput('');
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[24px] p-4 shadow-sm mb-6">
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 relative">
        <div className="flex items-center gap-2 text-brand-red animate-pulse">
          <Sparkles className="w-5 h-5 shrink-0" />
        </div>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isAr 
            ? "💡 اسأل المساعد الذكي: 'أظهر المهام المتأخرة' أو 'من لديه ضغط عمل؟'..." 
            : "💡 Ask AI Copilot: 'Show overdue tasks' or 'Who is overloaded?'..."
          }
          className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-sans"
        />
        
        <button
          type="submit"
          className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs px-5 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer"
        >
          {isAr ? 'تحليل' : 'Analyze'}
        </button>
      </form>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mr-2">
          {isAr ? 'اقتراحات:' : 'Suggestions:'}
        </span>
        {sampleQueries.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInput(q.text);
            }}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-150 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {q.text}
          </button>
        ))}
      </div>

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl px-4 py-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
          <Check className="w-4 h-4 shrink-0" />
          <span className="font-sans font-medium">{feedback}</span>
        </div>
      )}
    </div>
  );
}
