import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Tender } from '../types';
import { TenderLifecycleValidator } from '../../../../business-rules/TenderLifecycleValidator';
import { TenderService } from '../../../../services/TenderService';
import { WorkflowStatus } from '../../../../enums/WorkflowStatus';

interface TenderOverviewTabProps {
  selectedTender: Tender;
  isAr: boolean;
  isReadOnly: boolean;
  onTransitionClick: () => void;
  onStatusTransition?: (tenderId: string, newStatus: WorkflowStatus) => void;
}

export function TenderOverviewTab({ selectedTender, isAr, isReadOnly, onTransitionClick, onStatusTransition }: TenderOverviewTabProps) {
  const allowedNextStates = TenderLifecycleValidator.getAllowedNextStates(selectedTender.workflowStatus);
  const canTransition = !isReadOnly && allowedNextStates.length > 0;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as WorkflowStatus;
    if (newStatus && newStatus !== selectedTender.workflowStatus) {
      onStatusTransition?.(selectedTender.id, newStatus);
    }
  };
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="space-y-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <span className="text-[10px] text-gray-400 font-bold uppercase">{isAr ? 'العميل الرئيسي' : 'Main Client'}</span>
        <p className="text-[14px] font-bold text-gray-700">
          {selectedTender.clientName ? (isAr ? selectedTender.clientName.ar : selectedTender.clientName.en) : 'N/A'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">{isAr ? 'رقم المناقصة' : 'Tender Number'}</span>
          <span className="text-[13px] font-mono font-bold text-brand-navy">{selectedTender.tenderNumber}</span>
        </div>
        <div className="space-y-1 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">{isAr ? 'كود المشروع' : 'Project Code'}</span>
          <span className="text-[13px] font-mono font-bold text-brand-navy">{selectedTender.projectCode}</span>
        </div>
      </div>

      <div className="space-y-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <span className="text-[10px] text-gray-400 font-bold uppercase">{isAr ? 'الموقع الجغرافي' : 'Geographic Location'}</span>
        <div className="flex items-center gap-1 text-[13px] font-bold text-gray-700 mt-1">
          <MapPin className="w-4 h-4 text-brand-red" />
          <span>{isAr ? selectedTender.location.ar : selectedTender.location.en}</span>
        </div>
      </div>

      <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <span className="text-[10px] text-gray-400 font-bold uppercase block">{isAr ? 'حالة السجل وملخص التقييم' : 'Process Levels & Record Status'}</span>
        <div className="space-y-2 text-[13px] font-bold font-sans">
          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-50">
            <span className="text-gray-400 text-xs font-semibold">{isAr ? 'حالة المزايدة (Pre-Award)' : 'Pre-Award State'}</span>
            {canTransition ? (
              <select
                value={selectedTender.workflowStatus}
                onChange={handleStatusChange}
                className="text-brand-navy text-[12px] font-extrabold bg-transparent border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-brand-navy cursor-pointer"
              >
                <option value={selectedTender.workflowStatus} disabled>
                  {isAr ? selectedTender.projectStatus.ar : selectedTender.projectStatus.en}
                </option>
                {allowedNextStates.map(state => (
                  <option key={state} value={state}>
                    {TenderService.getStatusLabels(state).projectStatus[isAr ? 'ar' : 'en']}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-brand-navy text-[12px] font-extrabold">{isAr ? selectedTender.projectStatus.ar : selectedTender.projectStatus.en}</span>
            )}
          </div>
          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-50">
            <span className="text-gray-400 text-xs font-semibold">{isAr ? 'حالة الترسية' : 'Award Standing'}</span>
            <span className="text-emerald-700 text-[12px] font-extrabold">{isAr ? selectedTender.awardStatus.ar : selectedTender.awardStatus.en}</span>
          </div>
          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-50">
            <span className="text-gray-400 text-xs font-semibold">{isAr ? 'حالة الأرشفة' : 'Record Filing'}</span>
            <span className="text-blue-700 text-[12px] font-extrabold">{selectedTender.recordStatus}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-sans">
        <span className="text-[10px] text-gray-400 font-bold uppercase">{isAr ? 'نوع عقد المزايدة' : 'Tender Procurement Type'}</span>
        <p className="text-[14px] font-extrabold text-brand-navy mt-1">
          {isAr ? selectedTender.tenderType?.ar : selectedTender.tenderType?.en}
        </p>
      </div>

      {/* Future Extension Capability: Convert to Active Project */}
      <div className="bg-gradient-to-r from-brand-navy/5 to-indigo-50/30 p-4 rounded-2xl border border-brand-navy/10 mt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-indigo-600 tracking-wider uppercase">{isAr ? 'بوابة ترحيل العقود' : 'Transition Gate'}</span>
            <h4 className="text-xs font-black text-brand-navy">{isAr ? 'التحميل والترحيل إلى التنفيذ' : 'Convert to Project Operations'}</h4>
            <p className="text-[10px] text-gray-400 leading-tight">
              {isAr ? 'دراسة هندسية متقدمة لرفع نطاق العمل تلقائياً كعقد جاري.' : 'Automated conversion workflow to post award execution contracts.'}
            </p>
          </div>
          <button
            onClick={onTransitionClick}
            disabled={isReadOnly}
            className="px-3 py-2 bg-brand-red text-white text-[11px] font-black rounded-xl hover:bg-brand-red/90 transition-all cursor-pointer shadow-sm shadow-brand-red/20 shrink-0 disabled:bg-emerald-600 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isReadOnly ? (isAr ? 'تمت الترسية' : 'Awarded') : (isAr ? 'بدء الترحيل' : 'Convert')}
          </button>
        </div>
      </div>
    </div>
  );
}
