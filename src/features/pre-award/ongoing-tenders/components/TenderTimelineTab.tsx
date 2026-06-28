import React from 'react';
import { Tender } from '../types';
import { MilestoneBusinessRules } from '../../../../business-rules/MilestoneBusinessRules';
import { DEFAULT_MILESTONE_TEMPLATES } from '../../../../constants/MilestoneTemplates';
import { MilestoneWorkflowState } from '../../../../enums/MilestoneWorkflowState';

interface TenderTimelineTabProps {
  selectedTender: Tender;
  isAr: boolean;
}

export function TenderTimelineTab({ selectedTender, isAr }: TenderTimelineTabProps) {
  // Compute milestones dynamically from the stored milestones list
  const computedMilestones = MilestoneBusinessRules.computeAllMilestones(
    selectedTender.milestones || [],
    DEFAULT_MILESTONE_TEMPLATES,
    selectedTender.techSubmissionDate
  );

  const getStepCode = (templateId: string, idx: number) => {
    switch (templateId) {
      case 'KICK_OFF': return 'K1';
      case 'RISK_ASSESSMENT': return 'R2';
      case 'CONTRACT_QUALIFICATIONS': return 'C3';
      case 'ALIGNMENT_MEETING': return 'A4';
      case 'INTERMEDIATE_FOLLOW_UP': return 'F5';
      case 'TECHNICAL_SUBMISSION': return 'T6';
      case 'COMMERCIAL_SUBMISSION': return 'M7';
      case 'TENDER_SUBMISSION': return 'S8';
      default: return `${templateId.charAt(0)}${idx + 1}`;
    }
  };

  const getStatusType = (state: MilestoneWorkflowState) => {
    if (state === MilestoneWorkflowState.VERIFIED || state === MilestoneWorkflowState.COMPLETED) {
      return 'done';
    }
    if (state === MilestoneWorkflowState.STARTED) {
      return 'now';
    }
    return 'wait';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <span className="text-[10px] text-gray-400 font-bold uppercase block">
          {isAr ? 'سجل الأيام المتبقية والموعد الفتح' : 'Submission Lifespan'}
        </span>
        <div className="flex justify-between items-center text-sans mt-1">
          <span className="text-xs font-semibold text-gray-500">{isAr ? 'تاريخ إغلاق العطاء:' : 'Closing Date Frame:'}</span>
          <span className="font-mono text-sm font-bold text-brand-navy">{selectedTender.closingDate || 'N/A'}</span>
        </div>
      </div>

      <span className="text-[11px] text-gray-400 uppercase font-black block tracking-widest font-sans pl-1">
        {isAr ? 'مراحل الجدول الزمني للمزايدة' : 'Tender Milestone Roadmap'}
      </span>

      <div className="space-y-5 pt-1">
        {computedMilestones.map((cm, i) => {
          const m = cm.milestone;
          const t = cm.template;
          const stepCode = getStepCode(t.id, i);
          const statusType = getStatusType(m.workflowState);
          const dateDisplay = cm.dueDate || (isAr ? 'تاريخ يدوي' : 'Manual Date');

          return (
            <div key={m.id} className="flex gap-3 text-[13px] items-start font-sans relative">
              <div className="flex flex-col items-center shrink-0 relative mt-0.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] border transition-colors z-10
                  ${
                    statusType === 'done'
                      ? 'bg-brand-navy text-white border-brand-navy font-semibold'
                      : statusType === 'now'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                      : 'bg-gray-55 text-gray-400 border-gray-200'
                  }
                `}
                >
                  {stepCode}
                </div>
                {i < computedMilestones.length - 1 && (
                  <div className={`w-0.5 h-11 bg-gray-100 absolute top-7 left-1/2 -translate-x-1/2 ${statusType === 'done' ? 'bg-brand-navy/50' : ''}`} />
                )}
              </div>
              <div className="flex-1 pt-0.5 ml-1.5 ltr:ml-1.5 rtl:mr-1.5 rtl:ml-0 text-right rtl:text-right ltr:text-left">
                <div className="flex justify-between items-center font-extrabold text-brand-navy text-[13px]">
                  <span>{isAr ? t.displayName.ar : t.displayName.en}</span>
                  <span className="font-mono text-[10px] text-gray-400">{dateDisplay}</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-[10px] text-gray-400 font-normal">
                    {statusType === 'done'
                      ? (isAr ? 'تم تجاوز المرحلة بنجاح' : 'Phase cleared')
                      : statusType === 'now'
                      ? (isAr ? 'المرحلة الحالية قيد الإنجاز' : 'Ongoing milestone priority')
                      : (isAr ? 'بانتظار التقدم الزمني' : 'Future scheduled stage')}
                  </span>
                  {m.isCompleted && cm.daysDifference !== null && (
                    <span className={`text-[9px] font-bold ${cm.daysDifference <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {cm.delayDisplay}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
