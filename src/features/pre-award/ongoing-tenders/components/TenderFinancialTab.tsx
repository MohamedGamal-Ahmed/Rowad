import React from 'react';
import { Tender } from '../types';
import { FinancialsCalculator } from '../../../../business-rules/FinancialsCalculator';

interface TenderFinancialTabProps {
  selectedTender: Tender;
  isAr: boolean;
}

export function TenderFinancialTab({ selectedTender, isAr }: TenderFinancialTabProps) {
  const parseValue = (valStr: string): number => {
    return FinancialsCalculator.parseToNumber(valStr);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 text-sans">
      <span className="text-[10px] text-gray-400 font-bold uppercase block pl-1">{isAr ? 'ورقة البيانات والمؤشرات المالية' : 'Financial Metrics & Estimative Target'}</span>

      <div className="bg-gray-950 text-white rounded-2xl p-5 space-y-4 border border-brand-navy/10 shadow-sm font-mono text-[13px]">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-bold uppercase text-[10px]">{isAr ? 'القيمة التقديرية للمشروع (السعر المستهدف)' : 'Estimated Tender Value'}</span>
          <span className="text-[15px] font-black text-white">{selectedTender.estimatedValue}</span>
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-3.5">
          <span className="text-gray-400 font-bold uppercase text-[10px]">{isAr ? 'كلفة التقدير الداخلية المتوقعة' : 'Internal Estimated Cost'}</span>
          <span className="text-[14px] font-bold text-gray-300">{selectedTender.estimatedCost || 'N/A'}</span>
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-3.5">
          <span className="text-gray-400 font-bold uppercase text-[10px]">{isAr ? 'هامش الربح المتوقع' : 'Projected Margin Metrics'}</span>
          <div className="text-right">
            {(() => {
              const val = parseValue(selectedTender.estimatedValue);
              const cost = parseValue(selectedTender.estimatedCost || '');
              if (val && cost && val >= cost) {
                const margin = val - cost;
                const marginPct = (margin / val) * 100;
                return (
                  <div>
                    <span className="text-emerald-400 font-bold text-sm block">
                      +{selectedTender.currency} {margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] text-emerald-400/85">({marginPct.toFixed(2)}% Margin)</span>
                  </div>
                );
              }
              return <span className="text-gray-450">N/A</span>;
            })()}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-3.5">
          <span className="text-gray-400 font-bold uppercase text-[10px]">{isAr ? 'قيمة خطابات الضمان المطلوبة (2%)' : 'Tender Bond Required (2%)'}</span>
          <span className="text-emerald-400 text-sm font-black">{selectedTender.bondAmount}</span>
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-3.5">
          <span className="text-gray-400 font-bold uppercase text-[10px]">{isAr ? 'عملة حساب العطاء والمناقصة' : 'Reporting Currency Standard'}</span>
          <span className="text-brand-red bg-red-500/10 border border-brand-red/20 px-2 py-0.5 rounded font-bold text-xs uppercase">{selectedTender.currency}</span>
        </div>
      </div>
    </div>
  );
}
