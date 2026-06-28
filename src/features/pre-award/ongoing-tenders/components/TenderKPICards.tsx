import React from 'react';
import { Briefcase, AlertTriangle, CheckSquare, Layers } from 'lucide-react';
import { Tender } from '../types';

interface TenderKPICardsProps {
  list: Tender[];
  isAr: boolean;
}

export function TenderKPICards({ list, isAr }: TenderKPICardsProps) {
  const activeTenders = list.filter(t => t.recordStatus === 'Active');
  const dueSoonTenders = list.filter(t => t.health === 'Due Soon');
  const overdueTenders = list.filter(t => t.health === 'Overdue');
  const archivedTenders = list.filter(t => t.recordStatus === 'Archived');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* Total Active Tenders */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <span className="text-[12px] uppercase font-bold text-gray-400 block truncate">
            {isAr ? 'إجمالي المزايدات الجارية' : 'TOTAL ACTIVE STUDY'}
          </span>
          <p className="text-2xl font-black text-brand-navy tracking-tight">{activeTenders.length}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-navy/5 flex items-center justify-center text-brand-navy shrink-0">
          <Briefcase className="w-6 h-6" />
        </div>
      </div>

      {/* Due Soon / Warning */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <span className="text-[12px] uppercase font-bold text-gray-400 block truncate">
            {isAr ? 'عطاءات تقترب من الإغلاق' : 'DUE SOON MATRICES'}
          </span>
          <p className="text-2xl font-black text-amber-600 tracking-tight">{dueSoonTenders.length}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* Overdue */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <span className="text-[12px] uppercase font-bold text-gray-400 block truncate">
            {isAr ? 'تأخير في تقديم العروض' : 'OVERDUE ACTIONS'}
          </span>
          <p className="text-2xl font-black text-brand-red tracking-tight">{overdueTenders.length}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-brand-red shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>

      {/* Archived */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <span className="text-[12px] uppercase font-bold text-gray-400 block truncate">
            {isAr ? 'الملفات المؤرشفة' : 'ARCHIVED SESSIONS'}
          </span>
          <p className="text-2xl font-black text-gray-600 tracking-tight">{archivedTenders.length}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
          <Layers className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
