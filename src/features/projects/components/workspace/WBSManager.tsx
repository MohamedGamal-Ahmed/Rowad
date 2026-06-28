import React, { useState, useEffect } from 'react';
import { 
  Plus, Folder, FolderPlus, Trash2, Edit2, AlertCircle, ChevronDown, ChevronRight, 
  CheckCircle2, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { WBSPackage } from '../../../../domain/projects/Project';
import { ProjectRepository } from '../../../../repositories/ProjectRepository';
import { BiText } from '../../../../components/BiText';

interface WBSManagerProps {
  lang: 'ar' | 'en';
  projectId: string;
  onRefreshProjectData: () => void;
}

export function WBSManager({
  lang,
  projectId,
  onRefreshProjectData
}: WBSManagerProps) {
  const isAr = lang === 'ar';
  const projectRepo = new ProjectRepository();

  const [wbsList, setWbsList] = useState<WBSPackage[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadWBS = async () => {
    const list = await projectRepo.getWBSPackages(projectId);
    setWbsList(list);
  };

  useEffect(() => {
    loadWBS();
  }, [projectId]);

  const handleToggleCollapse = (nodeId: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !nameEn) {
      setErrorMsg(isAr ? 'الرجاء إدخال الكود والاسم بالإنجليزية.' : 'Please enter the code and English name.');
      return;
    }

    // Check duplicate code
    if (wbsList.some(w => w.code.toUpperCase() === code.toUpperCase())) {
      setErrorMsg(isAr ? 'هذا الكود مستخدم بالفعل.' : 'This WBS code is already in use.');
      return;
    }

    const newWbs: WBSPackage = {
      id: `wbs-${Date.now()}`,
      projectId,
      code: code.toUpperCase(),
      nameEn,
      nameAr: nameAr || undefined,
      parentId: parentId || undefined,
      description: description || undefined
    };

    const res = await projectRepo.saveWBSPackage(newWbs);
    if (res) {
      await projectRepo.addHistory(
        projectId, 
        'WBS Package Created', 
        'System', 
        `Added WBS code ${newWbs.code}: ${newWbs.nameEn}`,
        'WBS',
        newWbs.id,
        newWbs.code
      );
      setCode('');
      setNameEn('');
      setNameAr('');
      setParentId('');
      setDescription('');
      setErrorMsg('');
      setShowForm(false);
      await loadWBS();
      onRefreshProjectData();
    } else {
      setErrorMsg(isAr ? 'حدث خطأ أثناء الحفظ.' : 'An error occurred while saving.');
    }
  };

  const handleDeletePackage = async (id: string, codeStr: string) => {
    if (confirm(isAr ? `هل أنت متأكد من حذف الحزمة ${codeStr}؟` : `Are you sure you want to delete package ${codeStr}?`)) {
      // Check if it has children
      const hasChildren = wbsList.some(w => w.parentId === id);
      if (hasChildren) {
        alert(isAr ? 'لا يمكن حذف حزمة تحتوي على حزم فرعية.' : 'Cannot delete a WBS package that has sub-packages.');
        return;
      }

      await projectRepo.deleteWBSPackage(id);
      await projectRepo.addHistory(
        projectId, 
        'WBS Package Deleted', 
        'System', 
        `Removed WBS package code: ${codeStr}`,
        'WBS',
        id,
        codeStr
      );
      await loadWBS();
      onRefreshProjectData();
    }
  };

  // Helper to build a recursive tree structure
  const renderTreeNodes = (parent?: string, level = 0) => {
    const nodes = wbsList.filter(w => w.parentId === parent);
    if (nodes.length === 0) return null;

    return (
      <div className={`space-y-2 ${level > 0 ? (isAr ? 'pr-6 border-r border-slate-100' : 'pl-6 border-l border-slate-100') : ''}`}>
        {nodes.map(node => {
          const isCollapsed = collapsedNodes[node.id];
          const hasChildren = wbsList.some(w => w.parentId === node.id);

          return (
            <div key={node.id} className="space-y-2">
              <div className="flex items-center justify-between p-3.5 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/60 rounded-2xl hover:shadow-2xs transition-all text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {hasChildren ? (
                    <button 
                      onClick={() => handleToggleCollapse(node.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 shrink-0 cursor-pointer"
                    >
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  ) : (
                    <div className="w-6 shrink-0" />
                  )}
                  <Folder className="w-4 h-4 text-brand-red shrink-0" />
                  <span className="font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[10px] font-bold">
                    {node.code}
                  </span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                      {isAr && node.nameAr ? node.nameAr : node.nameEn}
                    </p>
                    {node.description && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {node.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDeletePackage(node.id, node.code)}
                    className="p-1.5 text-slate-400 hover:text-brand-red hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all shrink-0 cursor-pointer"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {!isCollapsed && renderTreeNodes(node.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Ribbons */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
        <div>
          <h3 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-widest font-mono">
            {isAr ? 'هيكل تقسيم أعمال المشروع (WBS)' : 'Work Breakdown Structure (WBS)'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {isAr 
              ? 'إنشاء حزم وتصنيفات الأعمال بجميع مستوياتها وربطها بالسجلات المالية.' 
              : 'Create hierarchical work packages to group tasks, IPCs, claims, and documents.'}
          </p>
        </div>

        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red hover:bg-brand-red-dark text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة حزمة جديدة' : 'Add WBS Package'}</span>
          </button>
        )}
      </div>

      {/* Show Form */}
      {showForm && (
        <form onSubmit={handleSavePackage} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl space-y-4 text-xs">
          <h4 className="font-bold border-b pb-1.5 text-slate-600 dark:text-slate-300">
            {isAr ? 'استمارة إنشاء حزمة أعمال جديدة' : 'Create New WBS Package'}
          </h4>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'كود الحزمة (مطلوب)' : 'WBS Code (Required)'}
              </label>
              <input 
                required 
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. CIV-01"
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-brand-red focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'الحزمة الرئيسية (اختياري - لتحديد المستوى)' : 'Parent Package (Optional)'}
              </label>
              <select 
                value={parentId} 
                onChange={e => setParentId(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-brand-red focus:outline-hidden"
              >
                <option value="">{isAr ? 'مستوى رئيسي أول' : '[Root Level / No Parent]'}</option>
                {wbsList.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'الاسم بالإنجليزية (مطلوب)' : 'Name (EN - Required)'}
              </label>
              <input 
                required 
                type="text" 
                value={nameEn} 
                onChange={e => setNameEn(e.target.value)}
                placeholder="e.g. Concrete Structure"
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'الاسم بالعربية (اختياري)' : 'Name (AR - Optional)'}
              </label>
              <input 
                type="text" 
                value={nameAr} 
                onChange={e => setNameAr(e.target.value)}
                placeholder="e.g. الهيكل الخرساني"
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                {isAr ? 'الوصف والتفاصيل' : 'Description'}
              </label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Detailed scope or breakdown items..."
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              type="submit"
              className="px-4 py-1.5 bg-brand-red text-white hover:bg-brand-red-dark rounded-lg font-bold"
            >
              {isAr ? 'حفظ الحزمة' : 'Save Package'}
            </button>
          </div>
        </form>
      )}

      {/* Render tree */}
      <div className="space-y-4">
        {wbsList.length > 0 ? (
          renderTreeNodes(undefined)
        ) : (
          <div className="text-center text-slate-400 py-10">
            {isAr ? 'لا يوجد هيكل أعمال WBS مسجل حالياً.' : 'No Work Breakdown Structure registered.'}
          </div>
        )}
      </div>

    </div>
  );
}
