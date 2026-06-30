import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Save, Edit3, Archive, RotateCcw, FileCheck, Calendar, 
  Tag, Info, X, ShieldAlert 
} from 'lucide-react';
import { ProjectNOC } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';
import { RecordStatus } from '../../../../enums/RecordStatus';
import { ContextualAttachmentsList } from './ContextualAttachmentsList';

interface NOCsPanelProps {
  lang: 'ar' | 'en';
  projectId: string;
  projectCode: string;
  isProjectArchived: boolean;
  onRefresh?: () => void;
}

export function NOCsPanel({
  lang,
  projectId,
  projectCode,
  isProjectArchived,
  onRefresh
}: NOCsPanelProps) {
  const isAr = lang === 'ar';
  const lookupService = ProjectLookupService.getInstance();

  const [nocs, setNocs] = useState<ProjectNOC[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingNoc, setEditingNoc] = useState<ProjectNOC | null>(null);

  // Form Fields
  const [nocNumber, setNocNumber] = useState('');
  const [nocType, setNocType] = useState('Utility NOC');
  const [nocAuthority, setNocAuthority] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [remarks, setRemarks] = useState('');

  // NOC Expiry Helper Logic
  const isExpired = (expDate: string | undefined): boolean => {
    if (!expDate) return false;
    const exp = new Date(expDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exp.getTime() < today.getTime();
  };

  const isExpiringSoon = (expDate: string | undefined): boolean => {
    if (!expDate) return false;
    const exp = new Date(expDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  const getDaysRemaining = (expDate: string | undefined): number => {
    if (!expDate) return 0;
    const exp = new Date(expDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filters
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived'>('Active');
  const [searchQuery, setSearchQuery] = useState('');

  const reloadNocs = async () => {
    const list = await lookupService.getNOCs(projectId);
    setNocs(list);
  };

  useEffect(() => {
    reloadNocs();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nocNumber.trim() || !nocAuthority.trim()) return;

    if (isProjectArchived) {
      window.alert(isAr ? 'لا يمكن تعديل السجلات لأن المشروع مؤرشف حالياً.' : 'Cannot save changes because the project is currently archived.');
      return;
    }

    const targetId = editingNoc ? editingNoc.id : `noc-${Date.now()}`;
    const auditInfo = editingNoc ? editingNoc.auditInfo : {
      createdBy: 'User',
      createdAt: new Date().toISOString()
    };

    const nocRecord: ProjectNOC = {
      id: targetId,
      recordStatus: editingNoc ? editingNoc.recordStatus : RecordStatus.ACTIVE,
      auditInfo,
      projectId,
      nocNumber: nocNumber.trim(),
      nocType,
      authorityName: nocAuthority.trim(),
      applicationDate: applicationDate || new Date().toISOString().substring(0, 10),
      expiryDate: expiryDate || undefined,
      status,
      remarks: remarks.trim() || undefined
    };

    const success = await lookupService.saveNOC(nocRecord);
    if (success) {
      await lookupService.addHistory(
        projectId,
        editingNoc ? 'NOC Permit Details Updated' : 'NOC Permit Registered',
        'User',
        `NOC: ${nocNumber}, Authority: ${nocAuthority}, Status: ${status}`,
        'NOC',
        targetId
      );
      setShowForm(false);
      resetForm();
      reloadNocs();
      if (onRefresh) onRefresh();
    }
  };

  const startCreate = () => {
    if (isProjectArchived) {
      window.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    resetForm();
    setFormMode('create');
    setShowForm(true);
  };

  const startEdit = (noc: ProjectNOC) => {
    if (isProjectArchived) {
      window.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    loadNocIntoForm(noc);
    setFormMode('edit');
    setShowForm(true);
  };

  const startView = (noc: ProjectNOC) => {
    loadNocIntoForm(noc);
    setFormMode('view');
    setShowForm(true);
  };

  const loadNocIntoForm = (noc: ProjectNOC) => {
    setEditingNoc(noc);
    setNocNumber(noc.nocNumber);
    setNocType(noc.nocType);
    setNocAuthority(noc.authorityName);
    setApplicationDate(noc.applicationDate);
    setExpiryDate(noc.expiryDate || '');
    setStatus(noc.status);
    setRemarks(noc.remarks || '');
  };

  const resetForm = () => {
    setEditingNoc(null);
    setNocNumber('');
    setNocType('Utility NOC');
    setNocAuthority('');
    setApplicationDate(new Date().toISOString().substring(0, 10));
    setExpiryDate('');
    setStatus('Pending');
    setRemarks('');
  };

  const handleArchive = async (noc: ProjectNOC) => {
    if (isProjectArchived) return;

    const reason = window.prompt(isAr ? 'أدخل سبب أرشفة التصريح (إلزامي):' : 'Enter NOC archive reason (mandatory):');
    if (!reason || !reason.trim()) {
      window.alert(isAr ? 'السبب مطلوب لإتمام العملية.' : 'Archive reason is required.');
      return;
    }

    const updated: ProjectNOC = {
      ...noc,
      recordStatus: RecordStatus.ARCHIVED,
      archiveInfo: {
        archivedBy: 'User',
        archivedAt: new Date().toISOString(),
        archiveReason: reason.trim()
      }
    };

    const success = await lookupService.saveNOC(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'NOC Archived',
        'User',
        `Archived NOC: ${noc.nocNumber}. Reason: ${reason}`
      );
      reloadNocs();
      if (onRefresh) onRefresh();
    }
  };

  const handleRestore = async (noc: ProjectNOC) => {
    if (isProjectArchived) {
      window.alert(isAr ? 'لا يمكن استعادة السجل لأن المشروع الأب مؤرشف.' : 'Cannot restore NOC because the parent project is archived.');
      return;
    }

    const updated: ProjectNOC = {
      ...noc,
      recordStatus: RecordStatus.ACTIVE,
      archiveInfo: undefined
    };

    const success = await lookupService.saveNOC(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'NOC Restored',
        'User',
        `Restored NOC: ${noc.nocNumber}`
      );
      reloadNocs();
      if (onRefresh) onRefresh();
    }
  };

  const filteredNocs = useMemo(() => {
    return nocs.filter(n => {
      const matchStatus = statusFilter === 'Archived' 
        ? n.recordStatus === RecordStatus.ARCHIVED 
        : n.recordStatus !== RecordStatus.ARCHIVED;
      
      const q = searchQuery.toLowerCase();
      const matchQuery = !searchQuery.trim() || 
        n.nocNumber.toLowerCase().includes(q) || 
        n.authorityName.toLowerCase().includes(q);
      
      return matchStatus && matchQuery;
    });
  }, [nocs, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 text-xs">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-brand-navy dark:text-slate-100 uppercase">
            {isAr ? 'تصاريح الممانعة والموافقات الحكومية' : 'No Objection Certificates (NOC)'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isAr ? 'تسجيل طلبات ومتابعة تواريخ انتهاء شهادات الدفاع المدني والكهرباء والبيئة والتصاريح الخاصة.' : 'Track regulatory permits, expiration alerts, and municipal coordination milestones.'}
          </p>
        </div>

        {!showForm && !isProjectArchived && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل تصريح جديد' : 'Register NOC'}</span>
          </button>
        )}
      </div>

      {/* Form View */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-6">
          <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase border-b pb-2">
            {formMode === 'view' ? (isAr ? 'عرض تفاصيل التصريح' : 'View NOC details') :
             formMode === 'edit' ? (isAr ? 'تعديل بيانات التصريح الحالي' : 'Edit NOC Permit') : 
             (isAr ? 'تسجيل تصريح ممانعة جديد' : 'New NOC Permit')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رقم طلب التصريح / الترخيص *' : 'NOC Number *'}</label>
              <input
                type="text"
                required
                disabled={formMode === 'view'}
                value={nocNumber}
                onChange={e => setNocNumber(e.target.value)}
                placeholder="e.g. NOC-CIVIL-5812"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الجهة الحكومية / المانحة *' : 'Authority Name *'}</label>
              <input
                type="text"
                required
                disabled={formMode === 'view'}
                value={nocAuthority}
                onChange={e => setNocAuthority(e.target.value)}
                placeholder="e.g. Civil Defense Riyadh, EEAA Egypt"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تصنيف الممانعة' : 'NOC Type'}</label>
              <select
                disabled={formMode === 'view'}
                value={nocType}
                onChange={e => setNocType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="Utility NOC">Utility NOC (مرافق وخدمات)</option>
                <option value="Environmental">Environmental Permit (بيئي)</option>
                <option value="Civil Defense">Civil Defense & Safety (الدفاع المدني)</option>
                <option value="Roads & Transport">Roads & Transport (طرق ومواصلات)</option>
                <option value="Other">Other Permit (أخرى)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'حالة الطلب' : 'Permit Status'}</label>
              <select
                disabled={formMode === 'view'}
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="Pending">Pending (قيد الانتظار)</option>
                <option value="Approved">Approved (معتمد وساري)</option>
                <option value="Rejected">Rejected (مرفوض)</option>
                <option value="Expired">Expired (منتهي الصلاحية)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ تقديم الطلب' : 'Application Date'}</label>
              <input
                type="date"
                required
                disabled={formMode === 'view'}
                value={applicationDate}
                onChange={e => setApplicationDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}</label>
              <input
                type="date"
                disabled={formMode === 'view'}
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'شروط وتفاصيل الترخيص' : 'Permit Terms & Remarks'}</label>
            <textarea
              rows={3}
              disabled={formMode === 'view'}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder={isAr ? 'اكتب شروط الاستخدام أو أسباب التعديل هنا...' : 'Provide terms, conditions or reasons...'}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
            />
          </div>

          {/* Attachments Section (Edit/View mode only) */}
          {formMode !== 'create' && editingNoc && (
            <div className="space-y-3 pt-3 border-t">
              <h5 className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider border-l-2 border-brand-red pl-2">
                {isAr ? 'مرفقات ووثائق التصريح' : 'NOC contextual attachments'}
              </h5>
              <ContextualAttachmentsList
                lang={lang}
                projectId={projectId}
                entityType="NOC"
                entityId={editingNoc.id}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
            >
              {formMode === 'view' ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'إلغاء' : 'Cancel')}
            </button>
            {formMode !== 'view' && (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold rounded-xl cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{formMode === 'edit' ? (isAr ? 'حفظ التغييرات' : 'Save Changes') : (isAr ? 'حفظ التصريح' : 'Save Permit')}</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* Grid List View */}
      {!showForm && (
        <div className="space-y-3">
          {/* List Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'البحث بالرمز أو الجهة...' : 'Search by NOC number or authority...'}
              className="w-full sm:w-80 p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg"
            />
            
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{isAr ? 'تصفية الحالة:' : 'Filter:'}</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="border rounded p-1 bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none"
              >
                <option value="Active">{isAr ? 'النشطة' : 'Active Permits'}</option>
                <option value="Archived">{isAr ? 'المؤرشفة' : 'Archived'}</option>
              </select>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNocs.length > 0 ? (
              filteredNocs.map((noc) => (
                <div key={noc.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4 hover:border-slate-250 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[9px] text-slate-500">
                        {noc.nocType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        noc.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                        noc.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100/50' :
                        noc.status === 'Expired' ? 'bg-amber-50 text-amber-600 border border-amber-100/50' :
                        'bg-slate-50 text-slate-500 border border-slate-200/50'
                      }`}>
                        {noc.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-[13px] hover:text-brand-red cursor-pointer transition-colors" onClick={() => startView(noc)}>
                        {noc.nocNumber}
                      </h4>
                      <p className="text-[10px] text-slate-450 font-sans mt-0.5 font-bold">Authority: {noc.authorityName}</p>
                      
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500 font-semibold font-sans pt-2 border-t">
                        <span>Applied: <span className="font-mono text-slate-850 font-bold">{noc.applicationDate}</span></span>
                        <span>Expires: <span className="font-mono text-slate-850 font-bold">{noc.expiryDate || 'N/A'}</span></span>
                      </div>

                      {noc.expiryDate && noc.status === 'Approved' && isExpired(noc.expiryDate) && (
                        <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-350 font-bold rounded-lg flex items-center gap-1.5 text-[9px]">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>{isAr ? '⚠️ منتهي الصلاحية!' : '⚠️ Expired Permit! Renewal Required.'}</span>
                        </div>
                      )}

                      {noc.expiryDate && noc.status === 'Approved' && isExpiringSoon(noc.expiryDate) && (
                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-350 font-bold rounded-lg flex items-center gap-1.5 text-[9px]">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          <span>{isAr ? `⚠️ ينتهي خلال ${getDaysRemaining(noc.expiryDate)} يوم!` : `⚠️ Expires in ${getDaysRemaining(noc.expiryDate)} days!`}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-850">
                    <button
                      onClick={() => startView(noc)}
                      className="text-brand-navy hover:text-brand-red font-extrabold text-[10px]"
                    >
                      {isAr ? 'عرض تفاصيل الترخيص ➔' : 'View Permit Details ➔'}
                    </button>

                    {!isProjectArchived && (
                      <div className="flex items-center gap-1">
                        {noc.recordStatus === 'Archived' ? (
                          <button
                            onClick={() => handleRestore(noc)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-100 cursor-pointer"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(noc)}
                              className="p-1 text-slate-650 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleArchive(noc)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-100 cursor-pointer"
                              title="Archive"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200">
                <FileCheck className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                <p className="font-bold">{isAr ? 'لا توجد تصاريح ممانعة مسجلة.' : 'No registered permits found.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
