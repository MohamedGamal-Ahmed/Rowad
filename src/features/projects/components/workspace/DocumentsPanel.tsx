import React, { useState, useEffect } from 'react';
import { 
  Plus, Folder, Eye, FileText, Lock, Unlock, History, Save, X, Paperclip 
} from 'lucide-react';
import { Project, ProjectDocument, WBSPackage } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';
import { DocumentType } from '../../../../domain/master/MasterData';
import { RecordStatus } from '../../../../enums/RecordStatus';
import { ContextualAttachmentsList } from './ContextualAttachmentsList';
import { useDialog } from '../../../../components/ui/DialogProvider';

interface DocumentsPanelProps {
  project: Project;
  lang: 'ar' | 'en';
  documents: ProjectDocument[];
  wbsPackages: WBSPackage[];
  reloadAllProjectData: () => void;
  expandedRecordId: string | null;
  setExpandedRecordId: (id: string | null) => void;
  focusedRecordId: string | null;
  setFocusedRecordId: (id: string | null) => void;
}

export function DocumentsPanel({
  project,
  lang,
  documents,
  wbsPackages,
  reloadAllProjectData,
  expandedRecordId,
  setExpandedRecordId,
  focusedRecordId,
  setFocusedRecordId
}: DocumentsPanelProps) {
  const isAr = lang === 'ar';
  const dialog = useDialog();
  const projectRepo = ProjectLookupService.getInstance();

  const [masterDocTypes, setMasterDocTypes] = useState<DocumentType[]>([]);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [docCode, setDocCode] = useState('');
  const [docTitleEn, setDocTitleEn] = useState('');
  const [docTitleAr, setDocTitleAr] = useState('');
  const [docCat, setDocCat] = useState<'Drawing' | 'Transmittal' | 'Incoming' | 'Outgoing'>('Drawing');
  const [docTypeId, setDocTypeId] = useState('');
  const [docSender, setDocSender] = useState('');
  const [docRecip, setDocRecip] = useState('');
  const [docDate, setDocDate] = useState('');
  const [docStatus, setDocStatus] = useState('');
  const [docPriority, setDocPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [docVer, setDocVer] = useState('Rev 1.0');
  const [selectedWbsId, setSelectedWbsId] = useState('');

  // Revision Form States
  const [showRevFormId, setShowRevFormId] = useState<string | null>(null);
  const [newRevVersion, setNewRevVersion] = useState('');
  const [newRevDate, setNewRevDate] = useState('');
  const [newRevRemarks, setNewRevRemarks] = useState('');
  const [newRevFile, setNewRevFile] = useState('');

  useEffect(() => {
    async function loadMasterData() {
      const docTypes = await projectRepo.getDocTypes();
      setMasterDocTypes(docTypes);
    }
    loadMasterData();
  }, []);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !docCode || !docTitleEn) return;

    const initialRev = {
      id: `rev-${Date.now()}`,
      version: docVer || 'Rev 1.0',
      date: docDate || new Date().toISOString().substring(0, 10),
      remarks: 'Initial document registration',
      fileAttachmentId: undefined,
      fileAttachmentName: undefined
    };

    const newDoc: ProjectDocument = {
      id: `pdoc-${Date.now()}`,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: {
        createdBy: 'User',
        createdAt: new Date().toISOString()
      },
      projectId: project.id,
      wbsId: selectedWbsId || undefined,
      code: docCode,
      titleEn: docTitleEn,
      titleAr: docTitleAr || undefined,
      category: docCat,
      docTypeId,
      sender: docSender,
      recipient: docRecip,
      dateReceived: docDate || new Date().toISOString().substring(0, 10),
      status: docStatus || 'Approved',
      priority: docPriority,
      version: docVer,
      isLocked: false,
      revisions: [initialRev],
      relatedMeetingIds: [],
      relatedVOIds: [],
      relatedClaimIds: []
    };

    await projectRepo.saveDocument(newDoc);
    await projectRepo.addHistory(
      project.id, 
      'Document Registered', 
      'System', 
      `Registered document: ${docCode}`,
      'Document',
      newDoc.id,
      docCode
    );
    setShowForm(false);
    resetForm();
    reloadAllProjectData();
  };

  const resetForm = () => {
    setDocCode('');
    setDocTitleEn('');
    setDocTitleAr('');
    setDocCat('Drawing');
    setDocTypeId('');
    setDocSender('');
    setDocRecip('');
    setDocDate('');
    setDocStatus('');
    setDocPriority('Medium');
    setDocVer('Rev 1.0');
    setSelectedWbsId('');
  };

  // Checkout (Lock) Document
  const handleCheckout = async (doc: ProjectDocument) => {
    if (project.recordStatus === 'Archived') return;
    const updated: ProjectDocument = {
      ...doc,
      isLocked: true,
      checkedOutBy: 'Current User',
      checkedOutAt: new Date().toISOString()
    };
    const success = await projectRepo.saveDocument(updated);
    if (success) {
      await projectRepo.addHistory(
        project.id,
        'Document Checked Out',
        'User',
        `Checked out & locked document: ${doc.code}`,
        'Document',
        doc.id,
        doc.code
      );
      reloadAllProjectData();
    }
  };

  // Checkin (Unlock) Document
  const handleCheckin = async (doc: ProjectDocument) => {
    if (project.recordStatus === 'Archived') return;
    const updated: ProjectDocument = {
      ...doc,
      isLocked: false,
      checkedOutBy: undefined,
      checkedOutAt: undefined
    };
    const success = await projectRepo.saveDocument(updated);
    if (success) {
      await projectRepo.addHistory(
        project.id,
        'Document Checked In',
        'User',
        `Checked in & unlocked document: ${doc.code}`,
        'Document',
        doc.id,
        doc.code
      );
      reloadAllProjectData();
    }
  };

  // Register New Revision
  const handleAddRevision = async (e: React.FormEvent, doc: ProjectDocument) => {
    e.preventDefault();
    if (!newRevVersion.trim()) return;

    if (doc.isLocked && doc.checkedOutBy !== 'Current User') {
      await dialog.alert(isAr ? 'المستند مقفل بواسطة مستخدم آخر.' : 'This document is locked by another user.');
      return;
    }

    const nextRev = {
      id: `rev-${Date.now()}`,
      version: newRevVersion.trim(),
      date: newRevDate || new Date().toISOString().substring(0, 10),
      remarks: newRevRemarks.trim() || 'Manual revision upload',
      fileAttachmentId: newRevFile.trim() ? `file-${Date.now()}` : undefined,
      fileAttachmentName: newRevFile.trim() ? newRevFile.trim() : undefined
    };

    const updatedRevisions = doc.revisions ? [...doc.revisions, nextRev] : [nextRev];

    const updated: ProjectDocument = {
      ...doc,
      version: newRevVersion.trim(), // Update current version to match
      revisions: updatedRevisions
    };

    const success = await projectRepo.saveDocument(updated);
    if (success) {
      await projectRepo.addHistory(
        project.id,
        'Document Revision Registered',
        'User',
        `Document ${doc.code} revised to version ${newRevVersion}`,
        'Document',
        doc.id,
        doc.code
      );
      setShowRevFormId(null);
      resetRevForm();
      reloadAllProjectData();
    }
  };

  const resetRevForm = () => {
    setNewRevVersion('');
    setNewRevDate('');
    setNewRevRemarks('');
    setNewRevFile('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="documents-panel-container">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
          {isAr ? 'سجل مراقبة وثائق ومستندات المشروع (Doc Control)' : 'Project Technical & Commercial Document Register'}
        </h3>
        {!showForm && project.recordStatus !== 'Archived' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red text-white hover:bg-brand-red-dark rounded-lg text-[10px] font-bold transition-all cursor-pointer"
            id="register-doc-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل مستند جديد' : 'New Document'}</span>
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleCreateDocument} className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs" id="document-form">
          <div className="md:col-span-3 font-bold border-b pb-1 text-slate-650 dark:text-slate-300 flex justify-between items-center">
            <span>{isAr ? 'استمارة تدوين مخطط هندسي أو مراسلة رسمية صادر/وارد' : 'Specialized Document Control Entry Form'}</span>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'كود الترميز الفني (مطلوب)' : 'Document Code'}</label>
            <input required type="text" value={docCode} onChange={e => setDocCode(e.target.value)} placeholder="e.g. ROWAD-NEOM-CIV-DRW-045" className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تصنيف المراسلة' : 'Category'}</label>
            <select value={docCat} onChange={e => setDocCat(e.target.value as any)} className="w-full p-2.5 border rounded-lg bg-white text-slate-800">
              <option value="Drawing">Drawing (مخطط هندسي)</option>
              <option value="Transmittal">Transmittal (محضر إرسال)</option>
              <option value="Incoming">Incoming (بريد خطاب وارد)</option>
              <option value="Outgoing">Outgoing (بريد خطاب صادر)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'نوع الوثيقة الرئيسي' : 'Document Type'}</label>
            <select value={docTypeId} onChange={e => setDocTypeId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-slate-800">
              <option value="">-- Choose Type --</option>
              {masterDocTypes.map(dt => (
                <option key={dt.id} value={dt.id}>{isAr && dt.nameAr ? dt.nameAr : dt.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'العنوان بالإنجليزية (مطلوب)' : 'Document Title (EN)'}</label>
            <input required type="text" value={docTitleEn} onChange={e => setDocTitleEn(e.target.value)} placeholder="e.g. Soil reports under main tank area" className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'العنوان بالعربية (اختياري)' : 'Document Title (AR)'}</label>
            <input type="text" value={docTitleAr} onChange={e => setDocTitleAr(e.target.value)} placeholder="مثال: تقارير اختبارات التربة" className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الجهة المرسلة' : 'Sender'}</label>
            <input required type="text" value={docSender} onChange={e => setDocSender(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الجهة المستلمة' : 'Recipient'}</label>
            <input required type="text" value={docRecip} onChange={e => setDocRecip(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ التلقي/الإرسال' : 'Date Received'}</label>
            <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'حالة الاعتماد' : 'Status'}</label>
            <input type="text" value={docStatus} onChange={e => setDocStatus(e.target.value)} placeholder="Approved, Under Audit" className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'مستوى الأهمية' : 'Priority'}</label>
            <select value={docPriority} onChange={e => setDocPriority(e.target.value as any)} className="w-full p-2.5 border rounded-lg bg-white text-slate-800">
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'حزمة العمل (WBS)' : 'WBS Work Package'}</label>
            <select value={selectedWbsId} onChange={e => setSelectedWbsId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-slate-800">
              <option value="">{isAr ? '-- اختر حزمة العمل --' : '-- Select WBS Package --'}</option>
              {wbsPackages.map(w => (
                <option key={w.id} value={w.id}>{w.code} - {isAr && w.nameAr ? w.nameAr : w.nameEn}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رقم الإصدار' : 'Revision Version'}</label>
            <input type="text" value={docVer} onChange={e => setDocVer(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t mt-2">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-brand-red text-white hover:bg-brand-red-dark rounded-lg font-bold">Register Document</button>
          </div>
        </form>
      ) : null}

      {documents.length > 0 ? (
        <div className="space-y-3.5" id="documents-list">
          {documents.map(doc => {
            const isExpanded = expandedRecordId === doc.id;
            const isFocused = focusedRecordId === doc.id;
            const linkedWbs = wbsPackages.find(w => w.id === doc.wbsId);
            const isDocLockedByOthers = doc.isLocked && doc.checkedOutBy !== 'Current User';

            return (
              <div 
                key={doc.id} 
                className={`bg-slate-50 dark:bg-slate-950/20 border p-4.5 rounded-2xl flex flex-col gap-4 hover:shadow-xs transition-all text-xs
                  ${isFocused ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/5' : 'border-slate-100 dark:border-slate-850'}
                `}
              >
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[9px] text-slate-500 bg-white dark:bg-slate-900 border px-2 py-0.5 rounded font-bold">{doc.code}</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 font-mono">{doc.category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        doc.priority === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {doc.priority}
                      </span>
                      {doc.isLocked && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-250 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                          <Lock className="w-3 h-3" />
                          <span>Locked ({doc.checkedOutBy})</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-850 dark:text-slate-100">
                      {isAr && doc.titleAr ? doc.titleAr : doc.titleEn}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      From: <span className="font-bold text-slate-500">{doc.sender}</span> | To: <span className="font-bold text-slate-500">{doc.recipient}</span>
                    </p>

                    {linkedWbs && (
                      <div className="flex items-center gap-1.5 text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono max-w-max mt-1">
                        <Folder className="w-3.5 h-3.5 text-brand-red" />
                        <span className="font-bold">{linkedWbs.code}</span>
                        <span>-</span>
                        <span className="truncate max-w-[150px]">{isAr && linkedWbs.nameAr ? linkedWbs.nameAr : linkedWbs.nameEn}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-[10px] text-slate-400 font-bold self-end md:self-center">
                    <div>
                      <span className="text-[9px] font-sans text-slate-400 block">{isAr ? 'الإصدار الحالي' : 'Current Rev'}</span>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5">{doc.version}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-sans text-slate-400 block">{isAr ? 'تاريخ التلقي' : 'Date'}</span>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5">{doc.dateReceived}</p>
                    </div>

                    {/* Checkout & Lock buttons */}
                    {project.recordStatus !== 'Archived' && (
                      <div className="flex gap-1.5">
                        {doc.isLocked ? (
                          doc.checkedOutBy === 'Current User' && (
                            <button
                              onClick={() => handleCheckin(doc)}
                              className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded cursor-pointer text-[9px]"
                              title="Check In & Unlock"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Check In</span>
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleCheckout(doc)}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded cursor-pointer text-[9px]"
                            title="Check Out & Lock"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Check Out</span>
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setExpandedRecordId(isExpanded ? null : doc.id);
                        if (isFocused) setFocusedRecordId(null);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-250 rounded text-slate-500 cursor-pointer"
                      title="Toggle details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-4 border-t border-slate-150 dark:border-slate-850 space-y-4">
                    
                    {/* Document Revisions History */}
                    <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="font-extrabold text-[10px] text-brand-navy dark:text-slate-200 uppercase flex items-center gap-1">
                          <History className="w-4 h-4 text-brand-red" />
                          <span>{isAr ? 'تاريخ المراجعات والتعديلات الفنية' : 'Technical Revisions Log'}</span>
                        </span>

                        {!isDocLockedByOthers && !showRevFormId && project.recordStatus !== 'Archived' && (
                          <button
                            type="button"
                            onClick={() => {
                              resetRevForm();
                              setShowRevFormId(doc.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-brand-red text-white hover:bg-brand-red-dark rounded text-[9px] font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isAr ? 'إصدار مراجعة جديدة' : 'Add Revision'}</span>
                          </button>
                        )}
                      </div>

                      {/* New Revision Form */}
                      {showRevFormId === doc.id && (
                        <form onSubmit={(e) => handleAddRevision(e, doc)} className="bg-slate-50 p-3 rounded-lg border border-slate-200/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'رقم الإصدار (مطلوب) *' : 'Revision Version (e.g. Rev 1.1) *'}</label>
                            <input
                              type="text"
                              required
                              value={newRevVersion}
                              onChange={e => setNewRevVersion(e.target.value)}
                              placeholder="e.g. Rev 1.1"
                              className="w-full p-1.5 border rounded bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'تاريخ المراجعة' : 'Revision Date'}</label>
                            <input
                              type="date"
                              required
                              value={newRevDate}
                              onChange={e => setNewRevDate(e.target.value)}
                              className="w-full p-1.5 border rounded bg-white"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'ملف مرفق (محاكاة رفع ملف)' : 'Attach Document File'}</label>
                            <input
                              type="text"
                              value={newRevFile}
                              onChange={e => setNewRevFile(e.target.value)}
                              placeholder="e.g. structural-rev1.1.pdf"
                              className="w-full p-1.5 border rounded bg-white font-mono"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-[9px] font-black text-slate-400 uppercase">{isAr ? 'ملاحظات التغيير الفني *' : 'Remarks / Changes Summary *'}</label>
                            <textarea
                              required
                              rows={2}
                              value={newRevRemarks}
                              onChange={e => setNewRevRemarks(e.target.value)}
                              placeholder="Describe changes in this revision..."
                              className="w-full p-1.5 border rounded bg-white"
                            />
                          </div>

                          <div className="flex justify-end gap-2 sm:col-span-2 pt-2">
                            <button
                              type="button"
                              onClick={() => { setShowRevFormId(null); resetRevForm(); }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border rounded font-bold text-[10px]"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3.5 py-1 bg-brand-red text-white hover:bg-brand-red-dark rounded font-bold text-[10px]"
                            >
                              Save Revision
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Revisions List */}
                      <div className="space-y-2">
                        {doc.revisions && doc.revisions.map((rev, idx) => (
                          <div key={rev.id || idx} className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 flex flex-col justify-between gap-1.5">
                            <div className="flex justify-between items-center font-bold text-[10px] text-slate-650">
                              <span className="text-brand-navy">Version: {rev.version}</span>
                              <span className="font-mono">{rev.date}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-350 italic font-semibold">"{rev.remarks}"</p>
                            {rev.fileAttachmentName && (
                              <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-mono mt-1 font-bold">
                                <Paperclip className="w-3 h-3" />
                                <span>{rev.fileAttachmentName}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {(!doc.revisions || doc.revisions.length === 0) && (
                          <span className="text-[10px] text-slate-450 italic block">{isAr ? 'لا يوجد إصدارات سابقة.' : 'No revisions registered.'}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        {isAr ? 'مرفقات الوثيقة المرتبطة' : 'Contextual Attachments'}
                      </h5>
                      <ContextualAttachmentsList
                        projectId={project.id}
                        entityType="Document"
                        entityId={doc.id}
                        lang={lang}
                        onRefresh={reloadAllProjectData}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-10 text-xs">
          {isAr ? 'لا توجد مستندات مسجلة لهذا المشروع.' : 'No documents registered yet.'}
        </div>
      )}
    </div>
  );
}
