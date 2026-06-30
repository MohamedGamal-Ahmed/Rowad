import React from 'react';
import {
  X,
  Briefcase,
  Users,
  Calendar,
  CheckSquare,
  DollarSign,
  FileText,
  Send,
  Activity,
  MapPin,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';
import { Tender } from '../types';
import { TenderOverviewTab } from './TenderOverviewTab';
import { TenderTimelineTab } from './TenderTimelineTab';
import { TenderChecklistTab } from './TenderChecklistTab';
import { TenderFinancialTab } from './TenderFinancialTab';
import { TenderMilestonesTab } from './TenderMilestonesTab';
import { TenderAssignmentsTab } from './TenderAssignmentsTab';
import { FinancialsCalculator } from '../../../../business-rules/FinancialsCalculator';
import { TenderAwardService } from '../../../../services/TenderAwardService';
import { WorkflowStatus } from '../../../../enums/WorkflowStatus';

interface TenderDetailsDrawerProps {
  selectedTender: Tender | null;
  onClose: () => void;
  isAr: boolean;
  lang: 'ar' | 'en';
  activeTab: 'overview' | 'assignments' | 'timeline' | 'milestones' | 'activities' | 'financial' | 'docs' | 'notes' | 'history';
  setActiveTab: (tab: any) => void;
  newNoteText: string;
  setNewNoteText: (val: string) => void;
  onAddNote: (id: string) => void;
  newDocName: string;
  setNewDocName: (val: string) => void;
  newDocSize: string;
  setNewDocSize: (size: string) => void;
  onAddDoc: (id: string) => void;
  onShowAlert: (msg: string) => void;
  onUpdateTender?: (updated: Tender) => void;
  onAwardTender?: (tender: Tender) => void;
  onStatusTransition?: (tenderId: string, newStatus: WorkflowStatus) => void;
}

export function TenderDetailsDrawer({
  selectedTender,
  onClose,
  isAr,
  lang,
  activeTab,
  setActiveTab,
  newNoteText,
  setNewNoteText,
  onAddNote,
  newDocName,
  setNewDocName,
  newDocSize,
  setNewDocSize,
  onAddDoc,
  onShowAlert,
  onUpdateTender,
  onAwardTender,
  onStatusTransition,
}: TenderDetailsDrawerProps) {
  if (!selectedTender) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-150 p-12 text-center text-sans flex flex-col items-center justify-center min-h-[500px] xl:sticky xl:top-4 shadow-sm">
        <ClipboardList className="w-12 h-12 text-gray-300 mb-3 animate-bounce" />
        <p className="text-gray-500 font-extrabold text-[15px] font-sans">
          {isAr ? 'الرجاء اختيار مشروع لاستعراض بياناته الكاملة' : 'Select a project to view its complete information.'}
        </p>
        <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto font-sans">
          {isAr
            ? 'انقر فوق أي صف في الجدول لعرض التفاصيل الرقمية وتكليفات الكلفة والمواعيد الخاصة بالملف الشامل.'
            : 'Click any row in the table to display the complete digital project archive.'}
        </p>
      </div>
    );
  }

  const parseValue = (valStr: string): number => {
    return FinancialsCalculator.parseToNumber(valStr);
  };

  const [showAwardWizard, setShowAwardWizard] = React.useState(false);
  const isReadOnly = React.useMemo(
    () => new TenderAwardService().isTenderReadOnly(selectedTender),
    [selectedTender.awardedProjectId, selectedTender.awardStatus, selectedTender.projectStatus]
  );

  return (
    <div className="bg-white rounded-[32px] border border-gray-150 shadow-xl p-7 space-y-6 xl:sticky xl:top-4 overflow-y-auto max-h-[85vh] premium-scrollbar">
      {/* Drawer Close / Header controls */}
      <div className="flex justify-between items-start pb-5 border-b border-gray-150">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block font-sans truncate">
              {selectedTender.projectCode}
            </span>
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                selectedTender.priority === 'Critical'
                  ? 'bg-red-100 text-red-700 font-extrabold animate-pulse'
                  : selectedTender.priority === 'High'
                  ? 'bg-amber-100 text-amber-700'
                  : selectedTender.priority === 'Medium'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {selectedTender.priority || 'Medium'}
            </span>
          </div>
          <h3 className={`text-[20px] font-black text-brand-navy leading-tight truncate ${isAr ? 'font-arabic' : 'font-sans'}`}>
            {isAr ? selectedTender.projectName.ar : selectedTender.projectName.en}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-brand-red transition-all cursor-pointer shrink-0"
          title="Close Inspection Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Award conversion confirmation wizard */}
      {showAwardWizard && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-red tracking-wider">
                  {isAr ? 'معالج الترسية' : 'Award Wizard'}
                </span>
                <h4 className="text-lg font-black text-brand-navy mt-1">
                  {isAr ? 'تحويل المناقصة إلى مشروع' : 'Convert Tender to Project'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAwardWizard(false)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'كود المشروع' : 'Project Code'}</span>
                <strong className="text-brand-navy font-mono">{selectedTender.projectCode}</strong>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'قيمة العقد' : 'Contract Value'}</span>
                <strong className="text-brand-navy">{selectedTender.estimatedValue}</strong>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'العميل' : 'Client'}</span>
                <strong className="text-brand-navy">{isAr ? selectedTender.clientName.ar : selectedTender.clientName.en}</strong>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'الاستشاري' : 'Consultant'}</span>
                <strong className="text-brand-navy">{selectedTender.consultant ? (isAr ? selectedTender.consultant.ar : selectedTender.consultant.en) : 'N/A'}</strong>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-[11px] font-semibold text-amber-800 leading-relaxed">
              {isAr
                ? 'بعد التأكيد سيتم إنشاء سجل مشروع مرتبط، نقل مستندات المناقصة كسجل مرفقات، وتصبح المناقصة للقراءة فقط.'
                : 'Confirming creates the linked Project record, transfers tender documents as attachments, and locks the Tender as read-only.'}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAwardWizard(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAwardWizard(false);
                  onAwardTender?.(selectedTender);
                }}
                className="px-5 py-2.5 bg-brand-red hover:bg-brand-red/90 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                {isAr ? 'تأكيد الترسية' : 'Confirm Award'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Header Tabs Row - horizontal scrolling */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-100 premium-scrollbar -mx-2 px-2">
        {(
          [
            { id: 'overview' as const, label: isAr ? 'الرئيسية' : 'Overview', icon: Briefcase },
            { id: 'assignments' as const, label: isAr ? 'التكليفات' : 'Assignments', icon: Users },
            { id: 'timeline' as const, label: isAr ? 'الجدول' : 'Timeline', icon: Calendar },
            { id: 'milestones' as const, label: isAr ? 'المراحل' : 'Milestones', icon: CheckCircle2 },
            { id: 'activities' as const, label: isAr ? 'التحقق' : 'Activities', icon: CheckSquare },
            { id: 'financial' as const, label: isAr ? 'المالية' : 'Financial', icon: DollarSign },
            { id: 'docs' as const, label: isAr ? 'الملفات' : 'Docs', icon: FileText },
            { id: 'notes' as const, label: isAr ? 'الملاحظات' : 'Notes', icon: Send },
            { id: 'history' as const, label: isAr ? 'السجل' : 'History', icon: Activity },
          ] as const
        ).map(t => {
          const CurrentIcon = t.icon;
          const isTabActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isTabActive ? 'bg-brand-navy text-white shadow-sm font-semibold' : 'bg-gray-55 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <CurrentIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <TenderOverviewTab
          selectedTender={selectedTender}
          isAr={isAr}
          isReadOnly={isReadOnly}
          onTransitionClick={() => setShowAwardWizard(true)}
          onStatusTransition={onStatusTransition}
        />
      )}

      {/* TAB 2: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <TenderAssignmentsTab
          selectedTender={selectedTender}
          isAr={isAr}
          lang={lang}
          onUpdateTender={onUpdateTender}
          onShowAlert={onShowAlert}
          readOnly={isReadOnly}
        />
      )}

      {/* TAB 3: TIMELINE */}
      {activeTab === 'timeline' && (
        <TenderTimelineTab selectedTender={selectedTender} isAr={isAr} />
      )}

      {/* TAB: MILESTONES */}
      {activeTab === 'milestones' && (
        <TenderMilestonesTab
          selectedTender={selectedTender}
          isAr={isAr}
          onUpdateTender={onUpdateTender || (() => {})}
          onShowAlert={onShowAlert}
          readOnly={isReadOnly}
        />
      )}

      {/* TAB 4: ACTIVITIES */}
      {activeTab === 'activities' && (
        <TenderChecklistTab selectedTender={selectedTender} isAr={isAr} />
      )}

      {/* TAB 5: FINANCIAL */}
      {activeTab === 'financial' && (
        <TenderFinancialTab selectedTender={selectedTender} isAr={isAr} />
      )}

      {/* TAB 6: DOCUMENTS */}
      {activeTab === 'docs' && (
        <div className="space-y-4 animate-in fade-in duration-200 text-sans">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">
              {isAr ? 'المستندات وكشوف الملف الرقمي' : 'RFP Specifications & Documents'} ({selectedTender.documents.length})
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto premium-scrollbar pr-1">
            {selectedTender.documents.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-150">
                {isAr ? 'لا توجد مستندات جمركية أو مواصفات فنية ملحقة بالملف.' : 'No documents linked to this digital project record yet.'}
              </p>
            ) : (
              selectedTender.documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 text-[13px] hover:bg-gray-50 transition-all duration-150"
                >
                  <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-brand-red shrink-0" />
                    <span className="font-extrabold text-[#183B63] truncate text-xs">{doc.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 font-mono font-normal">({doc.size})</span>
                  </div>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      onShowAlert(isAr ? 'جاري محاكاة تنزيل المستند المشفر لضمان الأمان...' : 'Simulating secure document package retrieve...');
                    }}
                    className="px-2 py-0.5 bg-white text-gray-400 hover:text-brand-navy hover:bg-gray-100 border border-gray-200 rounded text-[9px] font-bold transition-all shrink-0 ml-2"
                  >
                    {isAr ? 'تحميل' : 'DISPATCH'}
                  </a>
                </div>
              ))
            )}
          </div>

          {/* Add Document Simulation Trigger Form */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 mt-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">{isAr ? 'تسجيل مستند فني أو مراسلة جديدة' : 'Attach New Tender Document'}</span>
            <input
              disabled={isReadOnly}
              type="text"
              value={newDocName}
              onChange={e => setNewDocName(e.target.value)}
              placeholder={isAr ? 'اسم الملف (مثال: جدول الكميات المحدث)' : 'Enter document name (e.g. Approved BOQ)'}
              className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-navy transition-all disabled:bg-gray-100 disabled:text-gray-400"
            />
            <div className="flex gap-2">
              <select
                disabled={isReadOnly}
                value={newDocSize}
                onChange={e => setNewDocSize(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl p-2 text-xs focus:outline-none text-gray-500 w-24 shrink-0 font-bold disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="1.2 MB">1.2 MB</option>
                <option value="2.4 MB">2.4 MB</option>
                <option value="4.8 MB">4.8 MB</option>
                <option value="12.5 MB">12.5 MB</option>
              </select>
              <button
                type="button"
                onClick={() => onAddDoc(selectedTender.id)}
                disabled={isReadOnly}
                className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl text-xs font-bold transition-all py-2 cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAr ? 'إرفاق وتوثيق الملف' : 'Register Tender File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4 animate-in fade-in duration-200 text-sans">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">
              {isAr ? 'سجل المراجعات والملاحظات الداخلية font-ar' : 'Internal Engineering Notes'} ({selectedTender.notes.length})
            </span>
          </div>

          <div className="space-y-3.5 max-h-52 overflow-y-auto premium-scrollbar pr-1">
            {selectedTender.notes.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-150">
                {isAr ? 'لا توجد ملاحظات تقديرية في السجل حالياً.' : 'No engineering notes recorded.'}
              </p>
            ) : (
              selectedTender.notes.map(note => (
                <div key={note.id} className="bg-gray-50/70 p-3 rounded-xl border border-gray-150 text-[13px] space-y-1">
                  <div className="flex justify-between items-center text-gray-400 text-[10px] font-bold font-sans">
                    <span>👨‍💻 {note.author}</span>
                    <span>{note.date}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-semibold">{note.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Add note inside panel */}
          <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2 font-sans">
            <input
              disabled={isReadOnly}
              type="text"
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              placeholder={isAr ? 'اكتب ملاحظة كلفة أو عقود جديدة...' : 'Type custom estimative comment...'}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-navy focus:bg-white transition-all shadow-inner disabled:bg-gray-100 disabled:text-gray-400"
              onKeyDown={e => {
                if (e.key === 'Enter') onAddNote(selectedTender.id);
              }}
            />
            <button
              type="button"
              onClick={() => onAddNote(selectedTender.id)}
              disabled={isReadOnly}
              className="p-3 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-200 text-sans">
          <span className="text-[10px] text-gray-400 font-bold uppercase block pl-1">
            {isAr ? 'سجل أحداث عمليات المزايدة' : 'Business Events (Audit Log)'}
          </span>

          <div className="space-y-3 max-h-[420px] overflow-y-auto premium-scrollbar pr-1">
            {(!selectedTender.businessEvents || selectedTender.businessEvents.length === 0) ? (
              <p className="text-xs text-gray-400 italic text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                {isAr ? 'لا يوجد سجل للنشاط بعد' : 'No Activity Yet'}
              </p>
            ) : (
              [...selectedTender.businessEvents].reverse().map((event: any) => {
                const formattedTime = new Date(event.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div key={event.eventId} className="bg-slate-55 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs font-sans">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-[#183B63]">{event.userId}</span>
                      <span className="text-gray-400 text-[10px] font-mono font-normal">{formattedTime}</span>
                    </div>
                    <div className="text-slate-600 leading-relaxed font-semibold">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-brand-navy/10 text-brand-navy px-1.5 py-0.5 rounded text-[9px] uppercase font-black">{event.action}</span>
                        <span className="text-[9px] text-slate-450">({event.moduleId})</span>
                      </div>
                      {event.remarks && <p className="mt-1 text-slate-500 font-medium font-sans">{event.remarks}</p>}
                      {(event.oldValue !== undefined || event.newValue !== undefined) && (
                        <p className="text-[9px] text-slate-400 font-mono mt-1">
                          {event.oldValue || 'None'} → {event.newValue || 'None'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
