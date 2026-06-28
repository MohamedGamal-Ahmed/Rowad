import React, { useState, useEffect } from 'react';
import { 
  Paperclip, Plus, Download, Trash2, Eye, FileText, Upload, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { ContextualAttachment } from '../../../../domain/projects/Project';
import { ProjectRepository } from '../../../../repositories/ProjectRepository';
import { BiText } from '../../../../components/BiText';

interface ContextualAttachmentsListProps {
  lang: 'ar' | 'en';
  projectId: string;
  entityType: 'Claim' | 'VO' | 'IPC' | 'NOC' | 'Meeting' | 'Document' | 'Project' | 'Subcontract';
  entityId: string;
  onRefresh?: () => void;
}

export function ContextualAttachmentsList({
  lang,
  projectId,
  entityType,
  entityId,
  onRefresh
}: ContextualAttachmentsListProps) {
  const isAr = lang === 'ar';
  const projectRepo = new ProjectRepository();

  const [attachments, setAttachments] = useState<ContextualAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Determine category options based on entityType
  const getCategories = () => {
    switch (entityType) {
      case 'Claim':
        return ['Letters', 'Emails', 'Drawings', 'Photos', 'Approvals', 'Meeting Minutes'];
      case 'VO':
        return ['Engineer Instructions', 'BOQ', 'Shop Drawings', 'Cost Breakdown', 'Approval Letter'];
      case 'IPC':
        return ['Invoice', 'Certificate', 'Payment Receipt', 'Consultant Approval', 'Supporting Documents'];
      default:
        return ['Letters', 'Drawings', 'Photos', 'Approvals', 'Other'];
    }
  };

  const categories = getCategories();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const loadAttachments = async () => {
    const list = await projectRepo.getContextualAttachments(projectId, entityType, entityId);
    setAttachments(list);
  };

  useEffect(() => {
    loadAttachments();
  }, [projectId, entityType, entityId]);

  const handleMockUpload = async (customFileName?: string) => {
    const mockFiles = [
      { name: 'Official_Contractor_Submittal_R03.pdf', size: '2.4 MB' },
      { name: 'Signed_BOQ_Addendum_Calculations.xlsx', size: '1.8 MB' },
      { name: 'Site_Condition_Structural_Photo.jpg', size: '3.1 MB' },
      { name: 'Consultant_Official_Instruction_Letter.pdf', size: '940 KB' }
    ];

    const chosen = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    const finalName = customFileName || `${selectedCategory.replace(' ', '_')}_${chosen.name}`;

    const newAtt: ContextualAttachment = {
      id: `catt-${Date.now()}`,
      projectId,
      entityType,
      entityId,
      category: selectedCategory,
      fileName: finalName,
      fileSize: chosen.size,
      uploadedBy: 'Ahmed PMO Estimator',
      uploadedDate: new Date().toISOString().substring(0, 10)
    };

    const res = await projectRepo.saveContextualAttachment(newAtt);
    if (res) {
      await projectRepo.addHistory(
        projectId, 
        'Attachment Uploaded', 
        'System', 
        `Uploaded contextual file: ${finalName} for ${entityType}`,
        entityType,
        entityId,
        undefined
      );
      setSuccessMsg(isAr ? 'تم رفع الملف المرفق بنجاح!' : 'Attachment uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
      await loadAttachments();
      if (onRefresh) onRefresh();
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (confirm(isAr ? `هل أنت متأكد من حذف المرفق ${fileName}؟` : `Are you sure you want to delete attachment ${fileName}?`)) {
      await projectRepo.deleteContextualAttachment(id);
      await projectRepo.addHistory(
        projectId, 
        'Attachment Deleted', 
        'System', 
        `Deleted file: ${fileName} from ${entityType}`,
        entityType,
        entityId,
        undefined
      );
      await loadAttachments();
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* Category selector + simulated upload trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">
            {isAr ? 'تصنيف الملف والوثيقة المرفقة' : 'Attachment Category / Type'}
          </label>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-lg bg-white text-slate-800 focus:outline-hidden min-w-[200px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => handleMockUpload()}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{isAr ? 'رفع ملف تجريبي مصنّف' : 'Upload Categorized File'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex gap-1.5 items-center font-bold text-[11px]">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Attachments List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
        {attachments.length > 0 ? (
          attachments.map(att => (
            <div 
              key={att.id} 
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl hover:shadow-2xs transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-700 dark:text-slate-300 truncate" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {att.fileSize} • <span className="font-bold text-brand-red">{att.category}</span> • {att.uploadedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button 
                  type="button"
                  onClick={() => alert(`Simulating download of ${att.fileName}`)}
                  className="p-1.5 text-slate-400 hover:text-brand-navy rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isAr ? 'تحميل' : 'Download'}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={() => handleDelete(att.id, att.fileName)}
                  className="p-1.5 text-slate-400 hover:text-brand-red rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                  title={isAr ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-400 py-6 text-[11px] border border-dashed rounded-2xl p-4">
            {isAr 
              ? 'لا توجد مرفقات مصنفة حالياً لهذا المستند.' 
              : 'No contextual attachments categorized for this record yet.'}
          </div>
        )}
      </div>

    </div>
  );
}
