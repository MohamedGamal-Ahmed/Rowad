import React from 'react';
import { PencilLine } from 'lucide-react';
import { Tender } from '../types';

interface TenderNotesTabProps {
  selectedTender: Tender;
  isAr: boolean;
}

export function TenderNotesTab({ selectedTender, isAr }: TenderNotesTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200 text-sans">
      <span className="text-[10px] text-gray-400 font-bold uppercase block pl-1">{isAr ? 'الملاحظات والتعليقات الفنية' : 'Collaborative Study Feedback'}</span>

      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex gap-3 text-xs">
        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-xl h-fit self-start shrink-0">
          <PencilLine className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-extrabold text-brand-navy">{isAr ? 'ملاحظة التدقيق الفني المسبق:' : 'Technical Feasibility Insight'}</p>
          <p className="text-gray-500 leading-relaxed font-normal">
            {selectedTender.technicalNotes ||
              (isAr
                ? 'لا توجد تعليقات فنية إضافية مدونة لهذه المزايدة حالياً. تواصل مع مدير الهندسة للتسجيل.'
                : 'No technical clarifications logged for this item. Ensure BOQ matches exact specifications before validation.')}
          </p>
        </div>
      </div>
    </div>
  );
}
