import React, { useState } from 'react';
import { Paperclip, FileText, Download } from 'lucide-react';
import { Project, ContextualAttachment } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';

interface AttachmentsPanelProps {
  project: Project;
  lang: 'ar' | 'en';
  attachments: ContextualAttachment[];
  reloadAllProjectData: () => void;
}

export function AttachmentsPanel({
  project,
  lang,
  attachments,
  reloadAllProjectData
}: AttachmentsPanelProps) {
  const isAr = lang === 'ar';
  const projectRepo = ProjectLookupService.getInstance();
  const [isDragging, setIsDragging] = useState(false);

  const handleMockUpload = async () => {
    if (!project) return;
    const mockFiles = [
      { name: 'Infrastructure_Excavation_Report_REV2.pdf', size: '4.8 MB' },
      { name: 'Sewer_Bypass_Alignment_Cross_Section.dwg', size: '12.1 MB' },
      { name: 'Commercial_Risk_Matrix_DGDA.xlsx', size: '2.5 MB' }
    ];

    const chosen = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    const newAtt: ContextualAttachment = {
      id: `att-${Date.now()}`,
      projectId: project.id,
      fileName: chosen.name,
      fileSize: chosen.size,
      uploadedBy: 'Estimator Pro',
      uploadedDate: new Date().toISOString().substring(0, 10)
    };

    await projectRepo.saveAttachment(newAtt);
    await projectRepo.addHistory(project.id, 'Attachment Uploaded', 'System', `Uploaded attachment: ${chosen.name}`);
    reloadAllProjectData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="attachments-panel-container">
      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
        {isAr ? 'مستودع المرفقات والملفات التعاقدية الداعم للمشروع' : 'Project Attachments & Contractual PDF Vault'}
      </h3>

      <div 
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); handleMockUpload(); }}
        className={`border-2 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
          isDragging 
            ? 'border-brand-red bg-brand-red/5 text-brand-red' 
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950/20'
        }`}
        onClick={handleMockUpload}
        id="drag-drop-vault"
      >
        <Paperclip className="w-12 h-12 text-slate-300 mx-auto" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isAr 
              ? 'اسحب وأفلت الملفات هنا أو اضغط لتحديد ملف من جهازك' 
              : 'Drag & drop contract papers, PDF drawings, or excel sheets, or click to upload'
            }
          </p>
          <p className="text-[10px] text-slate-400">Supports PDF, DWG, XLSX, DOCX up to 50MB</p>
        </div>
      </div>

      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono" id="attachments-list">
          {attachments.map(att => (
            <div key={att.id} className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between hover:shadow-sm transition-all">
              <div className="min-w-0 flex-1 flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-red/5 text-brand-red rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate pr-2" title={att.fileName}>{att.fileName}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{att.fileSize} | Uploaded: {att.uploadedDate}</p>
                </div>
              </div>

              <button 
                onClick={() => alert('Downloading file is in process...')}
                className="p-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-500 rounded-lg shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
