import React from 'react';
import { Archive, FileSpreadsheet } from 'lucide-react';

interface TenderActionsProps {
  selectedCount: number;
  onBulkArchive: () => void;
  onBulkExport: () => void;
  isAr: boolean;
}

export function TenderActions({ selectedCount, onBulkArchive, onBulkExport, isAr }: TenderActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-brand-navy text-white px-6 py-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 select-none">
      <div className="flex items-center gap-3">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <span className="text-[14px] font-extrabold font-sans">
          {isAr
            ? `تم تحديد ${selectedCount} سجل لمجموعة العمل`
            : `${selectedCount} tenders selected for batch operations`}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBulkExport}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'تصدير الكشف (Excel)' : 'Export Spreadsheets'}</span>
        </button>

        <button
          type="button"
          onClick={onBulkArchive}
          className="px-4 py-2 bg-brand-red hover:bg-brand-red/90 text-white rounded-xl transition-all font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-red/10"
        >
          <Archive className="w-4 h-4" />
          <span>{isAr ? 'أرشفة كافة المحدد' : 'Archive Selected'}</span>
        </button>
      </div>
    </div>
  );
}
