import React from 'react';
import { Briefcase, Building2, DollarSign } from 'lucide-react';

interface ProjectKpiBoardProps {
  kpis: {
    total: number;
    active: number;
    preAward: number;
    value: number;
  };
  isAr: boolean;
  formatCurrency: (val: number, curr: string) => string;
}

export function ProjectKpiBoard({ kpis, isAr, formatCurrency }: ProjectKpiBoardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
            {isAr ? 'إجمالي المشاريع' : 'TOTAL PORTFOLIO'}
          </span>
          <p className="text-2xl font-black text-brand-navy dark:text-slate-100">{kpis.total}</p>
        </div>
        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
          <Briefcase className="w-5 h-5" />
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
            {isAr ? 'المشاريع النشطة' : 'ACTIVE WORKLOAD'}
          </span>
          <p className="text-2xl font-black text-emerald-600">{kpis.active}</p>
        </div>
        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
            {isAr ? 'عقود قبل الترسية' : 'PRE-AWARD BIDS'}
          </span>
          <p className="text-2xl font-black text-amber-600">{kpis.preAward}</p>
        </div>
        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
            {isAr ? 'إجمالي قيمة العقود' : 'TOTAL VALUE'}
          </span>
          <p className="text-xl font-black text-brand-red">{formatCurrency(kpis.value, 'EGP')}</p>
        </div>
        <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 rounded-xl flex items-center justify-center text-brand-red shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
