import React, { useState, useEffect } from 'react';
import { Plus, Folder, Eye, Pickaxe, Save, Edit3, X, Trash2 } from 'lucide-react';
import { Project, ProjectSubcontract, WBSPackage } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';
import { Contractor, ScopeOfWork } from '../../../../domain/master/MasterData';
import { RecordStatus } from '../../../../enums/RecordStatus';
import { ContextualAttachmentsList } from './ContextualAttachmentsList';
import { useDialog } from '../../../../components/ui/DialogProvider';

interface SubcontractorsPanelProps {
  project: Project;
  lang: 'ar' | 'en';
  subcontracts: ProjectSubcontract[];
  wbsPackages: WBSPackage[];
  reloadAllProjectData: () => void;
  expandedRecordId: string | null;
  setExpandedRecordId: (id: string | null) => void;
  focusedRecordId: string | null;
  setFocusedRecordId: (id: string | null) => void;
}

export function SubcontractorsPanel({
  project,
  lang,
  subcontracts,
  wbsPackages,
  reloadAllProjectData,
  expandedRecordId,
  setExpandedRecordId,
  focusedRecordId,
  setFocusedRecordId
}: SubcontractorsPanelProps) {
  const isAr = lang === 'ar';
  const projectRepo = ProjectLookupService.getInstance();
  const dialog = useDialog();

  const [masterContractors, setMasterContractors] = useState<Contractor[]>([]);
  const [masterScopes, setMasterScopes] = useState<ScopeOfWork[]>([]);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  const [subNum, setSubNum] = useState('');
  const [subCtrId, setSubCtrId] = useState('');
  const [subScopeId, setSubScopeId] = useState('');
  const [subTotalAmt, setSubTotalAmt] = useState(0);
  const [subInvAmt, setSubInvAmt] = useState(0);
  const [subCompPct, setSubCompPct] = useState(0);
  const [subRemarks, setSubRemarks] = useState('');
  const [selectedWbsId, setSelectedWbsId] = useState('');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [wbsFilter, setWbsFilter] = useState('');

  useEffect(() => {
    async function loadMasterData() {
      const [ctrls, scps] = await Promise.all([
        projectRepo.getContractors(),
        projectRepo.getScopes()
      ]);
      setMasterContractors(ctrls);
      setMasterScopes(scps);
    }
    loadMasterData();
  }, []);

  const filteredSubcontracts = React.useMemo(() => {
    return subcontracts.filter(sub => {
      const ctr = masterContractors.find(c => c.id === sub.contractorId);
      const scope = masterScopes.find(s => s.id === sub.scopeId);
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        sub.subcontractNumber.toLowerCase().includes(q) ||
        (ctr && ctr.companyName.toLowerCase().includes(q)) ||
        (ctr && ctr.companyNameAr && ctr.companyNameAr.toLowerCase().includes(q)) ||
        (scope && scope.name.toLowerCase().includes(q)) ||
        (scope && scope.nameAr && scope.nameAr.toLowerCase().includes(q));

      const matchesWbs = !wbsFilter || sub.wbsId === wbsFilter;

      return matchesSearch && matchesWbs;
    });
  }, [subcontracts, searchQuery, wbsFilter, masterContractors, masterScopes]);

  const handleSubTotalAmtChange = (val: number) => {
    setSubTotalAmt(val);
  };

  const handleSubInvAmtChange = (val: number) => {
    setSubInvAmt(val);
  };

  const handleSubCompPctChange = (val: number) => {
    setSubCompPct(val);
  };

  const handleSaveSubcontract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !subNum || !subCtrId || !subScopeId) return;

    if (project.recordStatus === 'Archived') {
      await dialog.alert(isAr ? 'لا يمكن تعديل السجلات لأن المشروع مؤرشف حالياً.' : 'Cannot save changes because the project is currently archived.');
      return;
    }

    // Commercial validations
    if (subTotalAmt <= 0) {
      await dialog.alert(isAr ? 'خطأ: قيمة العقد الكلية يجب أن تكون أكبر من صفر.' : 'Error: Total Subcontract Amount must be greater than zero.');
      return;
    }

    if (subInvAmt < 0) {
      await dialog.alert(isAr ? 'خطأ: المبالغ المفوترة لا يمكن أن تكون قيمة سالبة.' : 'Error: Till Date Invoiced Amount cannot be negative.');
      return;
    }

    if (subInvAmt > subTotalAmt) {
      await dialog.alert(isAr ? 'خطأ: المبالغ المفوترة لا يمكن أن تتجاوز القيمة الكلية للعقد من الباطن.' : 'Error: Till Date Invoiced Amount cannot exceed Total Subcontract Amount.');
      return;
    }

    if (subCompPct < 0 || subCompPct > 100) {
      await dialog.alert(isAr ? 'خطأ: نسبة الإنجاز يجب أن تكون بين 0 و 100.' : 'Error: Completion Percentage must be between 0 and 100.');
      return;
    }

    const isEdit = formMode === 'edit';
    const targetId = isEdit && editingSubId ? editingSubId : `sub-${Date.now()}`;

    // Project baseline budget overrun validation
    const otherSubsSum = subcontracts
      .filter(s => s.id !== targetId)
      .reduce((sum, s) => sum + s.totalSubcontractAmount, 0);

    const projectBaseline = project.revisedContractValue ?? project.signedContractValue;

    if (otherSubsSum + subTotalAmt > projectBaseline) {
      await dialog.alert(isAr
        ? `خطأ: مجموع ميزانية عقود الباطن (${(otherSubsSum + subTotalAmt).toLocaleString()}) سيتجاوز القيمة المعتمدة لموازنة المشروع (${projectBaseline.toLocaleString()}).`
        : `Error: The sum of all subcontracts (${(otherSubsSum + subTotalAmt).toLocaleString()}) will exceed the project commercial baseline (${projectBaseline.toLocaleString()}).`
      );
      return;
    }
    
    // Retrieve original audit info if editing
    let auditInfo = {
      createdBy: 'User',
      createdAt: new Date().toISOString()
    };
    if (isEdit) {
      const original = subcontracts.find(s => s.id === targetId);
      if (original) {
        auditInfo = original.auditInfo;
      }
    }

    const subRecord: ProjectSubcontract = {
      id: targetId,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo,
      projectId: project.id,
      wbsId: selectedWbsId || undefined,
      subcontractNumber: subNum,
      contractorId: subCtrId,
      scopeId: subScopeId,
      totalSubcontractAmount: subTotalAmt,
      tillDateInvoicedAmount: subInvAmt,
      completionPercentage: subCompPct,
      status: 'Active',
      remarks: subRemarks || undefined
    };

    await projectRepo.saveSubcontract(subRecord);
    await projectRepo.addHistory(
      project.id, 
      isEdit ? 'Subcontract Settings Updated' : 'Subcontract Created', 
      'User', 
      isEdit ? `Updated Subcontract: ${subNum}` : `Assigned Subcontract: ${subNum}`,
      'Subcontract',
      targetId,
      subNum
    );
    
    setShowForm(false);
    resetForm();
    reloadAllProjectData();
  };

  const handleDeleteSubcontract = async (sub: ProjectSubcontract) => {
    if (project.recordStatus === 'Archived') return;

    const confirmed = await dialog.confirm(
      isAr ? `هل أنت متأكد من حذف العقد ${sub.subcontractNumber} نهائياً؟` : `Are you sure you want to delete subcontract ${sub.subcontractNumber} permanently?`,
      { danger: true, title: isAr ? 'حذف عقد الباطن' : 'Delete Subcontract', confirmLabel: isAr ? 'حذف' : 'Delete' }
    );

    if (confirmed) {
      const success = await projectRepo.deleteSubcontract(sub.id);
      if (success) {
        await projectRepo.addHistory(
          project.id,
          'Subcontract Deleted',
          'User',
          `Deleted Subcontract: ${sub.subcontractNumber}`,
          'Subcontract',
          sub.id,
          sub.subcontractNumber
        );
        reloadAllProjectData();
      }
    }
  };

  const startCreate = () => {
    resetForm();
    setFormMode('create');
    setShowForm(true);
  };

  const startEdit = (sub: ProjectSubcontract) => {
    setFormMode('edit');
    setEditingSubId(sub.id);
    setSubNum(sub.subcontractNumber);
    setSubCtrId(sub.contractorId);
    setSubScopeId(sub.scopeId);
    setSubTotalAmt(sub.totalSubcontractAmount);
    setSubInvAmt(sub.tillDateInvoicedAmount);
    setSubCompPct(sub.completionPercentage);
    setSubRemarks(sub.remarks || '');
    setSelectedWbsId(sub.wbsId || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingSubId(null);
    setSubNum('');
    setSelectedWbsId('');
    setSubCtrId('');
    setSubScopeId('');
    setSubTotalAmt(0);
    setSubInvAmt(0);
    setSubCompPct(0);
    setSubRemarks('');
  };

  const formatMoney = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="subcontractors-panel-container">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
          {isAr ? 'عقود وإسنادات مقاولي الباطن المعتمدين' : 'Relational Subcontract Register & Work Allocation'}
        </h3>
        {!showForm && project.recordStatus !== 'Archived' && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red text-white hover:bg-brand-red-dark rounded-lg text-[10px] font-bold transition-all cursor-pointer"
            id="assign-subcontractor-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إسناد حزمة أعمال لمقاول باطن' : 'Assign Subcontractor'}</span>
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSaveSubcontract} className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-850 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs" id="subcontractor-form">
          <div className="md:col-span-2 font-bold border-b pb-1 text-slate-650 dark:text-slate-300 flex justify-between items-center">
            <span>{formMode === 'edit' ? (isAr ? 'تعديل عقد المقاولة الباطنة الحالي' : 'Edit Subcontract Allocation') : (isAr ? 'إسناد حزمة أعمال من الباطن لشركة معتمدة' : 'Relational Subcontract Assignment Form')}</span>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رقم العقد من الباطن (مطلوب)' : 'Subcontract Number'}</label>
            <input 
              required 
              type="text" 
              disabled={formMode === 'edit'} 
              value={subNum} 
              onChange={e => setSubNum(e.target.value)} 
              placeholder="e.g. SUB-ZED-CIV-105" 
              className="w-full p-2.5 border rounded-lg bg-white text-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-900 focus:outline-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المقاول من الباطن (من السجل المعتمد)' : 'Subcontractor (from certified register)'}</label>
            <select 
              required 
              disabled={formMode === 'edit'} 
              value={subCtrId} 
              onChange={e => setSubCtrId(e.target.value)} 
              className="w-full p-2.5 border rounded-lg bg-white text-slate-850 disabled:bg-slate-100 dark:disabled:bg-slate-900"
            >
              <option value="">-- Choose Contractor --</option>
              {masterContractors.map(c => (
                <option key={c.id} value={c.id}>{isAr && c.companyNameAr ? c.companyNameAr : c.companyName} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'مجال العمل الفني المسند' : 'Scope of Work (Relational)'}</label>
            <select required value={subScopeId} onChange={e => setSubScopeId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-slate-805">
              <option value="">-- Choose Scope --</option>
              {masterScopes.map(s => (
                <option key={s.id} value={s.id}>{isAr && s.nameAr ? s.nameAr : s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'قيمة العقد الكلية من الباطن' : 'Total Subcontract Amount'}</label>
            <input required type="number" value={subTotalAmt || ''} onChange={e => handleSubTotalAmtChange(Number(e.target.value))} className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المبالغ المفتورة المصروفة حتى تاريخه' : 'Till Date Invoiced Amount'}</label>
            <input type="number" value={subInvAmt || ''} onChange={e => handleSubInvAmtChange(Number(e.target.value))} className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'حزمة العمل (WBS)' : 'WBS Work Package'}</label>
            <select value={selectedWbsId} onChange={e => setSelectedWbsId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-slate-800">
              <option value="">{isAr ? '-- اختر حزمة العمل --' : '-- Select WBS Package --'}</option>
              {wbsPackages.map(w => (
                <option key={w.id} value={w.id}>{w.code} - {isAr && w.nameAr ? w.nameAr : w.nameEn}</option>
              ))}
            </select>
            {wbsPackages.length === 0 && (
              <p className="text-[10px] text-amber-600 font-bold mt-1">
                {isAr 
                  ? '⚠️ لم يتم العثور على حزم عمل. يرجى تعريف حزم العمل في تبويب WBS أولاً.' 
                  : '⚠️ No WBS packages found. Please define WBS packages in the WBS tab first.'
                }
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'نسبة الإنجاز المالي الفعلي (%)' : 'Completion Percentage'}</label>
            <input type="number" min={0} max={100} value={subCompPct || ''} onChange={e => handleSubCompPctChange(Number(e.target.value))} className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'ملاحظات وتوجيهات خاصة' : 'Special Directives & Remarks'}</label>
            <textarea value={subRemarks} onChange={e => setSubRemarks(e.target.value)} placeholder="e.g. Backcharge conditions apply" className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:outline-none" rows={2} />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t mt-2">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-brand-red text-white hover:bg-brand-red-dark rounded-lg font-bold">{formMode === 'edit' ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إسناد المقاول' : 'Assign Subcontractor')}</button>
          </div>
        </form>
      ) : null}

      {!showForm && subcontracts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'البحث برقم العقد، اسم المقاول، أو المجال...' : 'Search by subcontract #, contractor, or scope...'}
            className="w-full sm:w-80 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
          />
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-slate-400 font-bold">{isAr ? 'حزمة WBS:' : 'WBS Filter:'}</span>
            <select
              value={wbsFilter}
              onChange={e => setWbsFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-850 rounded p-1.5 bg-white text-slate-700 dark:text-slate-200 font-bold focus:outline-none"
            >
              <option value="">{isAr ? 'كل الحزم' : 'All Packages'}</option>
              {wbsPackages.map(w => (
                <option key={w.id} value={w.id}>{w.code} - {isAr && w.nameAr ? w.nameAr : w.nameEn}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {subcontracts.length > 0 ? (
        filteredSubcontracts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="subcontractors-list">
            {filteredSubcontracts.map(sub => {
              const ctr = masterContractors.find(c => c.id === sub.contractorId);
              const scope = masterScopes.find(s => s.id === sub.scopeId);
              const isExpanded = expandedRecordId === sub.id;
              const isFocused = focusedRecordId === sub.id;
              const linkedWbs = wbsPackages.find(w => w.id === sub.wbsId);

              return (
                <div 
                  key={sub.id} 
                  className={`bg-slate-50 dark:bg-slate-950/20 border p-5 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-all text-xs space-y-4
                    ${isFocused ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/5' : 'border-slate-100 dark:border-slate-850'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-500 bg-white dark:bg-slate-900 border px-2 py-0.5 rounded font-bold">{sub.subcontractNumber}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 text-[10px] font-bold rounded-full font-sans uppercase">
                        {isAr ? 'نسبة الإنجاز الفعلي' : 'Physical Progress'} {sub.completionPercentage}%
                      </span>
                      
                      {project.recordStatus !== 'Archived' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(sub)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 border border-slate-200 cursor-pointer"
                            title="Edit allocation"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubcontract(sub)}
                            className="p-1 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 rounded text-rose-500 border border-rose-100/50 cursor-pointer"
                            title="Delete subcontract"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setExpandedRecordId(isExpanded ? null : sub.id);
                          if (isFocused) setFocusedRecordId(null);
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 border border-slate-200 cursor-pointer"
                        title="Toggle details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {linkedWbs && (
                    <div className="flex items-center gap-1.5 text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono max-w-max">
                      <Folder className="w-3.5 h-3.5 text-brand-red" />
                      <span className="font-bold">{linkedWbs.code}</span>
                      <span>-</span>
                      <span className="truncate max-w-[150px]">{isAr && linkedWbs.nameAr ? linkedWbs.nameAr : linkedWbs.nameEn}</span>
                    </div>
                  )}

                  <div className="space-y-1 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                      {ctr ? (isAr && ctr.companyNameAr ? ctr.companyNameAr : ctr.companyName) : 'Unknown Contractor'}
                    </h4>
                    <p className="text-[10px] font-bold text-brand-red font-mono uppercase tracking-wider">
                      Package Scope: {scope ? (isAr && scope.nameAr ? scope.nameAr : scope.name) : 'Unassigned'}
                    </p>
                  </div>

                  {sub.remarks && (
                    <p className="text-[11px] text-slate-500 bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-xl leading-relaxed">
                      {sub.remarks}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">{isAr ? 'قيمة العقد من الباطن' : 'Package Amount'}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(sub.totalSubcontractAmount, project.currency)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">{isAr ? 'المصروف الفعلي لغاية اليوم' : 'Total Invoiced'}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(sub.tillDateInvoicedAmount, project.currency)}</p>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-150 dark:border-slate-850">
                      <span className="text-[10px] text-slate-400 font-sans block">{isAr ? 'الالتزام المتبقي (الرصيد غير المفوتر)' : 'Outstanding Commitment'}</span>
                      <p className="font-bold text-amber-600 dark:text-amber-400">
                        {formatMoney(Math.max(0, sub.totalSubcontractAmount - sub.tillDateInvoicedAmount), project.currency)}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-150 dark:border-slate-850 space-y-3">
                      <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        {isAr ? 'مرفقات عقد الباطن المرتبطة' : 'Contextual Attachments'}
                      </h5>
                      <ContextualAttachmentsList
                        projectId={project.id}
                        entityType="Subcontract"
                        entityId={sub.id}
                        lang={lang}
                        onRefresh={reloadAllProjectData}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-10 text-xs">
            {isAr ? 'لا توجد عقود تطابق خيارات البحث.' : 'No subcontracts match the search filters.'}
          </div>
        )
      ) : (
        <div className="text-center text-slate-400 py-10 text-xs">
          {isAr ? 'لا توجد عقود باطن مسندة حالياً لهذا المشروع.' : 'No subcontracts assigned yet.'}
        </div>
      )}
    </div>
  );
}
