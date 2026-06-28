import React from 'react';
import { DownloadCloud, FileText } from 'lucide-react';
import { Tender } from '../types';

interface TenderDocumentsTabProps {
  selectedTender: Tender;
  isAr: boolean;
}

export function TenderDocumentsTab({ selectedTender, isAr }: TenderDocumentsTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <span className="text-[10px] text-gray-400 font-bold uppercase block pl-1">{isAr ? 'حزم مستندات العروض والمزايدة' : 'Standard Templates & Guidelines'}</span>

      <div className="grid grid-cols-2 gap-2.5 text-sans">
        <a
          href="#"
          className="p-4 bg-brand-red/5 hover:bg-brand-red/10 border border-brand-red/10 rounded-2xl flex flex-col justify-between h-28 hover:shadow-sm transition-all"
        >
          <div className="p-1.5 bg-brand-red/10 rounded-xl text-brand-red self-start">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-[12px] text-brand-navy block">{isAr ? 'عقد مصفوفة الصلاحيات فني' : 'Technical Quals Pack'}</span>
            <span className="text-[10px] text-gray-400 font-mono block">PDF • 4.2 MB</span>
          </div>
        </a>

        <a
          href="#"
          className="p-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl flex flex-col justify-between h-28 hover:shadow-sm transition-all"
        >
          <div className="p-1.5 bg-emerald-500/10 rounded-xl text-emerald-600 self-start">
            <DownloadCloud className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-[12px] text-brand-navy block">{isAr ? 'نموذج جدول تسعير الكلف' : 'Estimative Model BOQ'}</span>
            <span className="text-[10px] text-gray-400 font-mono block">XLSX • 1.8 MB</span>
          </div>
        </a>
      </div>

      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
        <div className="text-xs space-y-1 text-sans">
          <p className="font-extrabold text-amber-800">{isAr ? 'تعليمات الرفع والحفظ التلقائي' : 'Uploading Custom Documents'}</p>
          <p className="text-amber-700 leading-relaxed">
            Attach official RFP specs, BOQ worksheets, or pre-bid templates directly to keep estimative workflows audit-ready and aligned with procurement standards.
          </p>
        </div>
      </div>
    </div>
  );
}
