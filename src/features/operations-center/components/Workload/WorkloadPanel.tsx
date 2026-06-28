import React from 'react';
import { 
  BarChart2, Users, AlertTriangle, ShieldCheck, CheckCircle
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { useWorkload, ResourceCapacity } from '../../hooks/useWorkload';

interface WorkloadPanelProps {
  lang: 'ar' | 'en';
  events: CalendarEvent[];
}

export function WorkloadPanel({ lang, events }: WorkloadPanelProps) {
  const isAr = lang === 'ar';
  const resources = useWorkload(events);

  // Return categorization of load
  const getLoadStatus = (index: number): { label: { en: string; ar: string }; color: string; barColor: string } => {
    if (index <= 15) {
      return {
        label: { en: 'Available / Light Load', ar: 'متاح / ضغط خفيف' },
        color: 'text-slate-500 bg-slate-50 border-slate-200',
        barColor: 'bg-slate-400'
      };
    } else if (index <= 25) {
      return {
        label: { en: 'Optimal Allocation', ar: 'توزيع مثالي ومستقر' },
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        barColor: 'bg-emerald-500'
      };
    } else if (index <= 35) {
      return {
        label: { en: 'Heavily Loaded', ar: 'مكثف / يقترب من الحد الأقصى' },
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        barColor: 'bg-amber-500'
      };
    } else {
      return {
        label: { en: 'Critical Saturation / Risk', ar: 'ضغط حرج / مخاطر تأخر' },
        color: 'text-brand-red bg-red-50 border-red-200 animate-pulse',
        barColor: 'bg-brand-red'
      };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-sans">
          {isAr ? 'مؤشرات توزيع العمل وطاقة الموارد البشرية' : 'Resource Workload & Portfolio Capacity'}
        </h3>
        <p className="text-xs text-slate-400">
          {isAr ? 'متابعة حية لعبء العمل على منسقي ومهندسي العقود والدراسات بالمؤسسة' : 'Operational bandwidth tracked via our index: (Meetings x1) + (Active Tenders x4) + (Submissions x3)'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((res) => {
          const loadInfo = getLoadStatus(res.capacityIndex);
          const percentMax = Math.min(Math.round((res.capacityIndex / 40) * 100), 100);

          return (
            <div 
              key={res.id}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[28px] p-6 shadow-sm space-y-6"
            >
              {/* Header profile */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-navy text-white text-base font-black flex items-center justify-center shrink-0 shadow-sm">
                    {res.avatar}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight font-sans">
                      {isAr ? res.name.ar : res.name.en}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {isAr ? res.role.ar : res.role.en}
                    </p>
                  </div>
                </div>

                <div className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${loadInfo.color}`}>
                  {isAr ? loadInfo.label.ar : loadInfo.label.en}
                </div>
              </div>

              {/* Progress gauge index */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    {isAr ? 'مؤشر الكثافة التشغيلية' : 'Operational Load Index'}
                  </span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
                    {res.capacityIndex} / 40 Max
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${percentMax}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${loadInfo.barColor}`}
                  ></div>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-3 gap-3 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">{isAr ? 'اجتماعات' : 'Meetings'}</p>
                  <p className="text-base font-black text-slate-800 dark:text-slate-100 font-mono">{res.meetingsCount}</p>
                  <p className="text-[8px] text-slate-400">({res.meetingsCount}x1 pts)</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">{isAr ? 'عطاءات جارية' : 'Tenders'}</p>
                  <p className="text-base font-black text-slate-800 dark:text-slate-100 font-mono">{res.tendersCount}</p>
                  <p className="text-[8px] text-slate-400">({res.tendersCount}x4 pts)</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">{isAr ? 'موعد نهائي' : 'Submissions'}</p>
                  <p className="text-base font-black text-slate-800 dark:text-slate-100 font-mono">{res.submissionsCount}</p>
                  <p className="text-[8px] text-slate-400">({res.submissionsCount}x3 pts)</p>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
