import React from 'react';
import { Download, Plus } from 'lucide-react';

interface TenderToolbarProps {
  isAr: boolean;
  onImportClick: () => void;
  onManualClick: () => void;
}

export function TenderToolbar({ isAr, onImportClick, onManualClick }: TenderToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 className={`text-[32px] font-black text-brand-navy tracking-tight leading-tight ${isAr ? 'font-arabic' : 'font-sans'}`}>
          {isAr ? 'المناقصات الجارية' : 'Ongoing Tenders'}
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          {isAr
            ? 'الملف التشغيلي اليومي لتتبع العروض، مواعيد التسليم الفني والمالي وتحديثات الضمانات.'
            : 'SaaS operational workspace for bid coordinators and contracts engineers.'}
        </p>
      </div>

      {/* Actions Row aligning to strict user workflows */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onImportClick}
          className="px-6 py-3 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl shadow-md flex items-center gap-2 text-[15px] font-extrabold transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400 transform rotate-180" />
          <span>{isAr ? '📥 استيراد كشف المناقصات' : '📥 Import Tender List'}</span>
        </button>

        <button
          type="button"
          onClick={onManualClick}
          className="px-5 py-3 bg-white hover:bg-gray-55 text-gray-700 border border-gray-200 rounded-xl shadow-sm flex items-center gap-2 text-[15px] font-bold transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-brand-red" />
          <span>{isAr ? 'إنشاء يدوي استثنائي font-ar' : 'Create Manual Tender'}</span>
        </button>
      </div>
    </div>
  );
}
