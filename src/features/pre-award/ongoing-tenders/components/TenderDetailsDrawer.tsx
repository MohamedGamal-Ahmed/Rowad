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
import { AwardConfirmationValidator } from '../../../../validators/AwardConfirmationValidator';
import { ProjectAttachment } from '../../../../domain/projects/Project';
import { Modal } from '../../../../components/ui/Modal';

const AWARD_DOCUMENT_CATEGORIES = ['Letter of Award', 'Signed Contract', 'Award Minutes', 'Clarifications'] as const;

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
  onAwardTender?: (tender: Tender, signedContractValue: number, contractCurrency: string, awardDate: string, loaReferenceNumber: string, awardAttachments?: ProjectAttachment[]) => void;
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

  const [showAwardWizard, setShowAwardWizard] = React.useState(false);
  const [signedContractValue, setSignedContractValue] = React.useState<number>(0);
  const [contractCurrency, setContractCurrency] = React.useState<string>('EGP');
  const [awardDate, setAwardDate] = React.useState<string>('');
  const [loaReferenceNumber, setLoaReferenceNumber] = React.useState<string>('');
  const [awardFiles, setAwardFiles] = React.useState<{ name: string; size: string; category: string }[]>([]);

  React.useEffect(() => {
    if (showAwardWizard && selectedTender) {
      const parsedVal = parseFloat(selectedTender.estimatedValue.replace(/,/g, '')) || 0;
      setSignedContractValue(parsedVal);
      setContractCurrency(selectedTender.currency || 'EGP');
      setAwardDate(new Date().toISOString().substring(0, 10));
      setLoaReferenceNumber('');
      setAwardFiles([{ name: 'Letter_of_Award_LOA.pdf', size: '1.8 MB', category: 'Letter of Award' }]);
    }
  }, [showAwardWizard, selectedTender]);

  const validationErrors = showAwardWizard
    ? AwardConfirmationValidator.validate(signedContractValue, contractCurrency, awardDate, loaReferenceNumber)
    : [];
  const isAwardValid = validationErrors.length === 0;

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

      {/* Award conversion confirmation wizard — rendered via portal (Modal) so it is never
          clipped/mispositioned by the animated/transformed drawer it lives inside. */}
      <Modal
        open={showAwardWizard}
        onClose={() => setShowAwardWizard(false)}
        eyebrow={isAr ? 'معالج الترسية' : 'Award Wizard'}
        title={isAr ? 'تحويل المناقصة إلى مشروع' : 'Convert Tender to Project'}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAwardWizard(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={!isAwardValid}
              onClick={() => {
                setShowAwardWizard(false);
                const mappedAttachments: ProjectAttachment[] = awardFiles.map((file, i) => ({
                  id: `att-award-${selectedTender.id}-${Date.now()}-${i}`,
                  projectId: `p-award-${selectedTender.id}`,
                  entityType: 'Project',
                  category: file.category,
                  sourceModule: 'Award Confirmation',
                  fileName: file.name,
                  fileSize: file.size,
                  uploadedBy: 'User (Award Confirmation)',
                  uploadedDate: new Date().toISOString().split('T')[0]
                }));
                onAwardTender?.(selectedTender, signedContractValue, contractCurrency, awardDate, loaReferenceNumber, mappedAttachments);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                isAwardValid
                  ? 'bg-brand-red text-white hover:bg-brand-red/90 shadow-sm'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isAr ? 'تأكيد الترسية' : 'Confirm Award'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'كود المشروع' : 'Project Code'}</span>
            <strong className="text-brand-navy font-mono">{selectedTender.projectCode}</strong>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'العميل' : 'Client'}</span>
            <strong className="text-brand-navy">{isAr ? selectedTender.clientName.ar : selectedTender.clientName.en}</strong>
          </div>
        </div>

        {/* Editable Contract Info */}
        <div className="space-y-3 border-t pt-3">
          <h5 className="font-extrabold text-brand-navy dark:text-slate-100 text-[11px] uppercase">
            {isAr ? 'المعلومات التعاقدية للترسية' : 'Contract Award Information'}
          </h5>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              {isAr ? 'القيمة المتعاقد عليها (Signed Contract Value) *' : 'Signed Contract Value *'}
            </label>
            <input
              type="number"
              value={signedContractValue || ''}
              onChange={(e) => setSignedContractValue(parseFloat(e.target.value) || 0)}
              className="w-full p-2.5 border rounded-xl bg-white text-slate-800 focus:outline-none focus:border-brand-red border-slate-200"
              placeholder="e.g. 1500000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              {isAr ? 'عملة العقد *' : 'Contract Currency *'}
            </label>
            <select
              value={contractCurrency}
              onChange={(e) => setContractCurrency(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-white text-slate-800 focus:outline-none focus:border-brand-red border-slate-200"
            >
              <option value="AED">AED - UAE Dirham</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="EGP">EGP - Egyptian Pound</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              {isAr ? 'تاريخ الترسية *' : 'Award Date *'}
            </label>
            <input
              type="date"
              value={awardDate}
              onChange={(e) => setAwardDate(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-white text-slate-800 focus:outline-none border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              {isAr ? 'رقم خطاب الترسية LOA Reference *' : 'Award / LOA Reference Number *'}
            </label>
            <input
              type="text"
              value={loaReferenceNumber}
              onChange={(e) => setLoaReferenceNumber(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-white text-slate-800 focus:outline-none focus:border-brand-red border-slate-200"
              placeholder="e.g. LOA-2026-004"
            />
          </div>

          {/* Multiple Award Attachments, each with a Document Control category so they
              migrate cleanly into the project's Award Documents record on confirmation. */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase font-sans">
                {isAr ? 'مرفقات قرار الترسية *' : 'Award Attachments *'}
              </label>
              <button
                type="button"
                onClick={() => {
                  const count = awardFiles.length + 1;
                  setAwardFiles([...awardFiles, { name: `Award_Supporting_Doc_${count}.pdf`, size: '2.1 MB', category: 'Clarifications' }]);
                }}
                className="text-[10px] font-bold text-brand-red hover:underline cursor-pointer"
              >
                + {isAr ? 'إضافة مستند' : 'Add Document'}
              </button>
            </div>
            {awardFiles.length === 0 ? (
              <div className="text-[10px] text-slate-400 text-center py-2 bg-slate-50 border border-dashed rounded-xl font-sans">
                {isAr ? 'لا توجد مستندات مرفقة' : 'No documents attached'}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {awardFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700 text-[10px] font-semibold font-sans">{file.name}</span>
                      <span className="text-slate-450 text-[9px] font-mono shrink-0">({file.size})</span>
                    </div>
                    <select
                      value={file.category}
                      onChange={(e) => {
                        const updated = [...awardFiles];
                        updated[idx] = { ...updated[idx], category: e.target.value };
                        setAwardFiles(updated);
                      }}
                      className="text-[9px] font-bold border rounded-lg bg-white px-1.5 py-1 shrink-0"
                    >
                      {AWARD_DOCUMENT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setAwardFiles(awardFiles.filter((_, i) => i !== idx))}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-brand-red rounded cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[10px] space-y-0.5">
            {validationErrors.map((err, i) => (
              <div key={i} className="flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-[11px] font-semibold text-amber-800 leading-relaxed">
          {isAr
            ? 'تأكيد الترسية سينشئ مشروعاً مسوداً ويمنع التعديل على المناقصة.'
            : 'Confirming award will create the setup project record and lock this tender.'}
        </div>
      </Modal>

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
