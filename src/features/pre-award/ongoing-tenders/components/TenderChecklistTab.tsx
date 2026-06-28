import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Tender } from '../types';

interface TenderChecklistTabProps {
  selectedTender: Tender;
  isAr: boolean;
}

export function TenderChecklistTab({ selectedTender, isAr }: TenderChecklistTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-gray-55/50 p-4 rounded-2xl border border-gray-100 space-y-3.5 text-sans">
        <span className="text-[10px] text-gray-400 font-bold uppercase block">{isAr ? 'تدقيقات ومستندات الفحص الأولي' : 'Initial Feasibility Checklists'}</span>

        <div className="space-y-2">
          {[
            { label: isAr ? 'استلاف مستندات المزايدة والمخططات الأصلية' : 'Full RFP Documents Received', checked: selectedTender.checklistReceived ?? true },
            { label: isAr ? 'دراسة وفحص المخططات الهندسية' : 'Technical Drawings Audited', checked: selectedTender.checklistDrawings ?? true },
            { label: isAr ? 'مطابقة وتحديث جداول الكميات (BOQ)' : 'BOQ Cost Sheet Harmonized', checked: selectedTender.checklistBOQ ?? true },
            {
              label: isAr ? 'مراجعة الميزات والمواصفات الفنية الخاصة بالإنشاء' : 'Technical Specifications Verified',
              checked: selectedTender.checklistSpecs ?? true,
            },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-100 text-[13px]">
              {item.checked ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
              )}
              <span className={`font-semibold ${item.checked ? 'text-gray-700' : 'text-gray-400 line-through font-normal'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-2 text-sans">
        <span className="text-[10px] text-gray-400 font-bold uppercase block">{isAr ? 'معاينة الموقع والزيارات الميدانية' : 'Site Visit Verification Details'}</span>
        <div className="bg-white p-3 rounded-xl border border-gray-50 text-[13px]">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-semibold">{isAr ? 'الزيارة الميدانية مطلوبة؟' : 'Site Visit Demanded?'}</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                selectedTender.siteVisitRequired ?? true ? 'bg-amber-100 text-amber-800' : 'bg-gray-55 text-gray-550'
              }`}
            >
              {selectedTender.siteVisitRequired ?? true
                ? isAr
                  ? 'نعم - إلزامي'
                  : 'Yes - Mandatory'
                : isAr
                ? 'غير مطلوب'
                : 'No'}
            </span>
          </div>
          {(selectedTender.siteVisitRequired ?? true) && (
            <div className="flex justify-between items-center mt-2.5 border-t border-gray-50 pt-2.5">
              <span className="text-gray-400 font-semibold">{isAr ? 'موعد الزيارة المحدد:' : 'Scheduled Visit Date:'}</span>
              <span className="font-mono text-xs font-bold text-brand-navy">{selectedTender.siteVisitDate || '2026-06-30'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
