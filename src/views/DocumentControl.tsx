import React, { useState, useEffect } from 'react';
import { 
  Folder, FilePlus2, FileType, Search, Filter, LayoutGrid, 
  ListFilter, Eye, CheckCircle2, AlertCircle, X, Download, Plus,
  FileCheck2, CheckSquare, History, FileText,
  Settings2, ChevronUp, ChevronDown, ChevronsUpDown, Check
} from 'lucide-react';
import { BiText } from '../components/BiText';
import { Settings } from '../domain/administration/Settings';
import { NumberingService } from '../services/NumberingService';
import { Clock as AppClock } from '../services/Clock';
import { Lock, Unlock, Paperclip } from 'lucide-react';
import { ProjectDocument } from '../domain/projects/Project';
import { mockDocuments } from '../seed/mockData';
import { useProjects } from '../hooks/useProjects';
import { SearchableAutocomplete } from '../components/SearchableAutocomplete';
import { RecordStatus } from '../enums/RecordStatus';
import { useDialog } from '../components/ui/DialogProvider';

export function DocumentControl({ 
  lang, 
  documents, 
  onUpdateDocuments,
  settings
}: { 
  lang: 'ar' | 'en'; 
  documents: ProjectDocument[]; 
  onUpdateDocuments: React.Dispatch<React.SetStateAction<ProjectDocument[]>>;
  settings: Settings;
}) {
  const isAr = lang === 'ar';
  const dialog = useDialog();
  const { projects } = useProjects();
  const setDocuments = onUpdateDocuments;
  const [selectedDocId, setSelectedDocId] = useState<string | null>('D-001');
  const selectedDoc = documents.find(d => d.id === selectedDocId);

  // Metadata Modification & Revision states
  const [isEditingSidebar, setIsEditingSidebar] = useState(false);
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editTitleAr, setEditTitleAr] = useState('');
  const [editSender, setEditSender] = useState('');
  const [editRecipient, setEditRecipient] = useState('');
  const [editCategory, setEditCategory] = useState<'Incoming' | 'Outgoing' | 'Drawing' | 'Transmittal'>('Drawing');
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [editStatus, setEditStatus] = useState('');
  const [editProjectId, setEditProjectId] = useState('');

  // Revision Form States
  const [showRevForm, setShowRevForm] = useState(false);
  const [newRevVer, setNewRevVer] = useState('');
  const [newRevDate, setNewRevDate] = useState('');
  const [newRevRem, setNewRevRem] = useState('');
  const [newRevFile, setNewRevFile] = useState('');

  useEffect(() => {
    if (selectedDoc) {
      setEditTitleEn(selectedDoc.titleEn);
      setEditTitleAr(selectedDoc.titleAr || '');
      setEditSender(selectedDoc.sender);
      setEditRecipient(selectedDoc.recipient);
      setEditCategory(selectedDoc.category);
      setEditPriority(selectedDoc.priority);
      setEditStatus(selectedDoc.status);
      setEditProjectId(selectedDoc.projectId);
      setIsEditingSidebar(false);
      setShowRevForm(false);
    }
  }, [selectedDocId]);

  const handleSaveSidebarMetadata = () => {
    if (!selectedDoc) return;
    const updated = documents.map(d => {
      if (d.id === selectedDoc.id) {
        return {
          ...d,
          titleEn: editTitleEn,
          titleAr: editTitleAr,
          sender: editSender,
          recipient: editRecipient,
          category: editCategory,
          priority: editPriority,
          status: editStatus,
          projectId: editProjectId
        };
      }
      return d;
    });
    setDocuments(updated);
    localStorage.setItem('pmo_project_documents', JSON.stringify(updated));
    setIsEditingSidebar(false);
    setToastAlert({ type: 'success', message: 'Document metadata updated successfully!' });
  };

  const handleCheckoutDoc = (doc: ProjectDocument) => {
    const updated = documents.map(d => {
      if (d.id === doc.id) {
        return {
          ...d,
          isLocked: true,
          checkedOutBy: 'EDMS Admin',
          checkedOutAt: new Date().toISOString()
        };
      }
      return d;
    });
    setDocuments(updated);
    localStorage.setItem('pmo_project_documents', JSON.stringify(updated));
    setToastAlert({ type: 'success', message: 'Document checked out and locked!' });
  };

  const handleCheckinDoc = (doc: ProjectDocument) => {
    const updated = documents.map(d => {
      if (d.id === doc.id) {
        return {
          ...d,
          isLocked: false,
          checkedOutBy: undefined,
          checkedOutAt: undefined
        };
      }
      return d;
    });
    setDocuments(updated);
    localStorage.setItem('pmo_project_documents', JSON.stringify(updated));
    setToastAlert({ type: 'success', message: 'Document checked in and unlocked!' });
  };

  const handleAddRevSidebar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !newRevVer.trim()) return;

    const nextRev = {
      id: 'rev-' + Date.now(),
      version: newRevVer.trim(),
      date: newRevDate || new Date().toISOString().substring(0, 10),
      remarks: newRevRem.trim() || 'Manual revision upload',
      fileAttachmentId: newRevFile.trim() ? 'file-' + Date.now() : undefined,
      fileAttachmentName: newRevFile.trim() ? newRevFile.trim() : undefined
    };

    const updatedRevisions = selectedDoc.revisions ? [...selectedDoc.revisions, nextRev] : [nextRev];

    const updated = documents.map(d => {
      if (d.id === selectedDoc.id) {
        return {
          ...d,
          version: newRevVer.trim(),
          revisions: updatedRevisions
        };
      }
      return d;
    });

    setDocuments(updated);
    localStorage.setItem('pmo_project_documents', JSON.stringify(updated));
    setShowRevForm(false);
    setNewRevVer('');
    setNewRevDate('');
    setNewRevRem('');
    setNewRevFile('');
    setToastAlert({ type: 'success', message: 'Revision registered successfully!' });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [toastAlert, setToastAlert] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Unification configs (density, column selector, sorting, pagination)
  const [density, setDensity] = useState<'compact' | 'standard'>('compact');
  const [showColSelector, setShowColSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    category: true,
    code: true,
    title: true,
    sender: true,
    version: true,
    status: true,
  });
  const [sortBy, setSortBy] = useState<keyof ProjectDocument | 'title' | 'projectName'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getProjectInfo = (projId: string) => {
    const p = projects.find(x => x.id === projId);
    return {
      code: p ? p.code : '',
      nameEn: p ? p.nameEn : '',
      nameAr: p ? p.nameAr || p.nameEn : '',
      name: p ? (isAr ? p.nameAr || p.nameEn : p.nameEn) : ''
    };
  };

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  // Auto clean toast alert
  useEffect(() => {
    if (toastAlert) {
      const timer = setTimeout(() => setToastAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastAlert]);

  // Submittal registration form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [category, setCategory] = useState<'Incoming' | 'Outgoing' | 'Drawing' | 'Transmittal'>('Drawing');
  const [code, setCode] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [statusEn, setStatusEn] = useState('');
  const [statusAr, setStatusAr] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [version, setVersion] = useState('Rev 1.0');

  // Interactive autofill based on Category
  useEffect(() => {
    if (isAddModalOpen) {
      const nextNum = documents.length + 1;
      if (category === 'Drawing') {
        setCode(`ROWAD-NEOM-CIV-DRW-0${nextNum}2`);
        setSender('Rowad Civil Design Team');
        setRecipient('Lead Construction Consultant');
        setStatusEn('Approved for Construction');
        setStatusAr('معتمد للتنفيذ ومطابق للمواصفات الهيكلية');
        setPriority('High');
        setVersion('Rev 1.0');
      } else if (category === 'Transmittal') {
        setCode(`TRN-DIR-88${nextNum}`);
        setSender('SGS Soils Laboratory LLC');
        setRecipient('Rowad QA/QC Department');
        setStatusEn('Under Verification');
        setStatusAr('تحت التدقيق والمطابقة الهندسية');
        setPriority('Medium');
        setVersion('Rev 1.0');
      } else if (category === 'Incoming') {
        setCode(`INC-MUNI-09${nextNum}`);
        setSender('Cairo Urban Development Authority');
        setRecipient('Rowad Project Director');
        setStatusEn('Awaiting Response Letter');
        setStatusAr('بانتظار خطاب الرد والتعليق الرسمي');
        setPriority('High');
        setVersion('Original');
      } else {
        setCode(`OUT-EXP-ROWG-7${nextNum}1`);
        setSender('Rowad HSE Manager');
        setRecipient('General Civil Aviation Authority');
        setStatusEn('Delivered & Stamped');
        setStatusAr('تم التسليم والختم بالوارد رسمياً');
        setPriority('Medium');
        setVersion('Rev 1.0');
      }
    }
  }, [category, isAddModalOpen, documents.length]);

  // Filtering, sorting and pagination
  const sortedDocs = React.useMemo(() => {
    let result = documents.filter(doc => {
      const projInfo = getProjectInfo(doc.projectId);
      const matchesSearch = doc.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            doc.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (doc.titleAr && doc.titleAr.includes(searchQuery)) ||
                            projInfo.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            projInfo.nameAr.includes(searchQuery) ||
                            projInfo.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortBy === 'title') {
        aVal = isAr ? a.titleAr || a.titleEn : a.titleEn;
        bVal = isAr ? b.titleAr || b.titleEn : b.titleEn;
      } else if (sortBy === 'projectName') {
        aVal = getProjectInfo(a.projectId).name;
        bVal = getProjectInfo(b.projectId).name;
      } else {
        aVal = a[sortBy] ?? '';
        bVal = b[sortBy] ?? '';
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return result;
  }, [documents, searchQuery, categoryFilter, sortBy, sortOrder, isAr, projects]);

  const totalPages = Math.max(Math.ceil(sortedDocs.length / itemsPerPage), 1);
  const paginatedDocs = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedDocs.slice(start, start + itemsPerPage);
  }, [sortedDocs, currentPage, itemsPerPage]);

  const handleSort = (field: keyof ProjectDocument | 'title' | 'projectName') => {
    if (sortBy === field) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Document Code', 'Title (EN)', 'Title (AR)', 'Category', 'Project (EN)', 'Project (AR)', 'Sender', 'Recipient', 'Date Received', 'Revision', 'Status'];
      const rows = sortedDocs.map(d => {
        const projInfo = getProjectInfo(d.projectId);
        return [
          d.code,
          `"${d.titleEn.replace(/"/g, '""')}"`,
          `"${(d.titleAr || d.titleEn).replace(/"/g, '""')}"`,
          d.category,
          `"${projInfo.nameEn.replace(/"/g, '""')}"`,
          `"${projInfo.nameAr.replace(/"/g, '""')}"`,
          `"${d.sender.replace(/"/g, '""')}"`,
          `"${d.recipient.replace(/"/g, '""')}"`,
          d.dateReceived,
          d.version,
          `"${d.status.replace(/"/g, '""')}"`
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Document_Control_Export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export CSV', e);
    }
  };

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn || !titleAr || !selectedProjectId) {
      await dialog.alert(isAr ? 'الرجاء اختيار المشروع وتعبئة جميع الحقول المطلوبة' : 'Please choose a project and fill in all required fields');
      return;
    }

    const nextId = 'D-' + (documents.length + 1).toString().padStart(3, '0');
    const newDoc: ProjectDocument = {
      id: nextId,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: {
        createdBy: 'User',
        createdAt: AppClock.todayISO()
      },
      projectId: selectedProjectId,
      code: code || NumberingService.generateDocumentCode(
        settings.numberingSettings,
        category,
        documents.length + 1
      ),
      titleEn,
      titleAr,
      category,
      docTypeId: 'dt-1',
      sender: sender || 'Rowad General Contracting',
      recipient: recipient || 'Lead Representative',
      dateReceived: AppClock.todayISO(),
      status: statusEn || 'Archived',
      priority,
      version: version || 'Rev 1.0'
    };

    setDocuments([newDoc, ...documents]);
    setSelectedDocId(newDoc.id);
    setIsAddModalOpen(false);

    // Reset Form Input
    setTitleEn('');
    setTitleAr('');
    setSelectedProjectId('');
    setSender('');
    setRecipient('');
  };

  return (
    <div className="px-6 py-6 max-w-[1800px] mx-auto space-y-6 animate-in fade-in duration-500 relative select-none">
      
      {/* Dynamic Toast Alert for architecture extension clicks */}
      {toastAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-brand-navy border border-gray-700 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-6 duration-300 font-sans">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[13px] font-bold">{toastAlert.message}</span>
          <button onClick={() => setToastAlert(null)} className="text-gray-400 hover:text-white transition-colors p-1 leading-none font-sans font-black">×</button>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-[32px] font-black text-brand-navy tracking-tight leading-tight font-sans">
            {isAr ? "نظام مراقبة وتدفق المستندات" : "Document Control EDMS"}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {isAr ? "المنبثق الرقمي لمطابقة الوارد والصادر وإدارة المخططات التفصيلية للتنفيذ." : "Unified engineering document management, transmittals ledger, & drawings catalog."}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl shadow-md flex items-center gap-2 text-[15px] font-bold transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? "تسجيل مستند وارد/صادر" : "Register Document / Drawing"}</span>
          </button>
        </div>
      </div>

      {/* Pluggable Architecture Extension Bar for future EDMS systems */}
      <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 font-sans flex items-center justify-between gap-5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-[#183B63] uppercase shrink-0">
            {isAr ? "بوابات التوسعة الرقمية" : "Architecture Extensions"}
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'register', en: 'Document Register', ar: 'سجل المستندات' },
            { id: 'transmittals', en: 'Transmittals Hub', ar: 'محاضر الصادر' },
            { id: 'incoming', en: 'Incoming Letters', ar: 'مراسلات الوارد' },
            { id: 'outgoing', en: 'Outgoing Letters', ar: 'مراسلات الصادر' },
            { id: 'history', en: 'Revision History logs', ar: 'تاريخ المراجعة والمطابقة' },
            { id: 'workflow', en: 'Makers Approval Workflow', ar: 'أعمال المراجعة والاعتماد' },
            { id: 'distribution', en: 'Electronic Distribution', ar: 'التوزيع الإلكتروني للمخططات' },
            { id: 'metadata', en: 'Metadata Deep Search', ar: 'البحث المتقدم بالبيانات الفوقية' }
          ].map((mod) => (
            <button
              key={mod.id}
              onClick={() => {
                setToastAlert({
                  type: 'info',
                  message: isAr
                    ? `بوابة التوسعة: تم ربط هيكلية ومخرجات "${mod.ar}" مسبقاً في نظام ROWAD Enterprise الأساسي.`
                    : `EDMS Gate: "${mod.en}" is verified structural gateway, registered in the platform routing matrix.`
                });
              }}
              className="px-3 py-2 bg-white hover:bg-white/80 border border-gray-150 text-gray-500 hover:text-brand-navy text-[10px] font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <div className="w-1 h-1 rounded-full bg-gray-400" />
              <span>{isAr ? mod.ar : mod.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Micro Dashboard summaries for Document Control */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: isAr ? 'خطابات واردة ومحاضر' : 'Incoming Letters', val: '43 Actionable', change: '8 Urgent', color: 'border-l-indigo-600', count: '98% Response compliant' },
          { label: isAr ? 'خطابات صادرة رسمية' : 'Outgoing Dispatched', val: '12 Letters', change: '2 Drafts', color: 'border-l-blue-600', count: '100% Stamped and archived' },
          { label: isAr ? 'المخططات الهندسية (Shop Drawings)' : 'Live Shop Drawings', val: '5,400 Registries', change: 'Rev 2.0 active', color: 'border-l-emerald-600', count: 'Approved for Construction' },
          { label: isAr ? 'محاضر الإرسال (Transmittals)' : 'Active Transmittals', val: '18 Pending Verification', change: '3 Submissions-due', color: 'border-l-brand-red', count: 'Automated notification loops' },
        ].map((met, idx) => (
          <div key={idx} className={`bg-white p-6 rounded-2xl border-l-4 ${met.color} shadow-sm space-y-2`}>
            <p className="text-xs text-gray-400 uppercase font-black tracking-wider">{met.label}</p>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-brand-navy leading-none">{met.val}</span>
              <span className="text-[11px] text-brand-red font-bold">{met.change}</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">{met.count}</p>
          </div>
        ))}
      </div>

      {/* 3. Unified Toolbar & Grid Controls (Unifies Document Control and Project Portfolio style) */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Quick Search on Left */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={isAr ? "البحث السريع بالكود، الاسم، أو المرسل..." : "Quick search by code, name, or sender..."}
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-brand-red transition-all"
            />
          </div>

          {/* Action Buttons on Right */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            
            {/* Column Selector */}
            <div className="relative">
              <button
                onClick={() => setShowColSelector(!showColSelector)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              >
                <Settings2 className="w-4 h-4 text-slate-400" />
                <span>{isAr ? 'الأعمدة' : 'Columns'}</span>
              </button>
              {showColSelector && (
                <div className="absolute right-0 top-11 z-30 w-52 bg-white border border-slate-200 rounded-xl p-3 shadow-xl space-y-2 text-xs text-slate-700">
                  <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-100">{isAr ? 'إظهار الأعمدة' : 'Toggle Columns'}</div>
                  {Object.keys(visibleColumns).map((col) => (
                    <label key={col} className="flex items-center gap-2.5 py-1 px-1.5 hover:bg-slate-50 rounded-md cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col as keyof typeof visibleColumns]}
                        onChange={() => toggleColumn(col as keyof typeof visibleColumns)}
                        className="rounded text-brand-red focus:ring-brand-red w-3.5 h-3.5"
                      />
                      <span className="capitalize font-medium">
                        {col === 'category' ? (isAr ? 'الفئة' : 'Category') :
                         col === 'code' ? (isAr ? 'الكود' : 'Code') :
                         col === 'title' ? (isAr ? 'العنوان' : 'Title') :
                         col === 'sender' ? (isAr ? 'المرسل' : 'Originator') :
                         col === 'version' ? (isAr ? 'الإصدار' : 'Revision') :
                         (isAr ? 'الحالة' : 'Status')}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Density Selector */}
            <button
              onClick={() => setDensity(d => d === 'compact' ? 'standard' : 'compact')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
            >
              <span className="text-[10px] text-slate-400">Density:</span>
              <span className="capitalize text-brand-navy">{density}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>{isAr ? 'تصدير' : 'Export'}</span>
            </button>

            {/* Register New Document Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red/90 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'مستند جديد' : 'New Document'}</span>
            </button>

          </div>
        </div>

        {/* Inline Category Filters & Total count */}
        <div className="flex flex-wrap gap-4 items-center pt-2.5 border-t border-slate-100 text-xs justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider mr-2 rtl:ml-2">{isAr ? 'فئة المستند:' : 'Category Filter:'}</span>
            <button 
              onClick={() => { setCategoryFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${categoryFilter === 'all' ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {isAr ? "الكل" : "All"}
            </button>
            <button 
              onClick={() => { setCategoryFilter('Drawing'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${categoryFilter === 'Drawing' ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              📂 {isAr ? "مخططات هندسية" : "Shop Drawings"}
            </button>
            <button 
              onClick={() => { setCategoryFilter('Transmittal'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${categoryFilter === 'Transmittal' ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              ✉️ {isAr ? "محاضر إرسال" : "Transmittals"}
            </button>
            <button 
              onClick={() => { setCategoryFilter('Incoming'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${categoryFilter === 'Incoming' ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              📥 {isAr ? "مستندات واردة" : "Incoming Docs"}
            </button>
            <button 
              onClick={() => { setCategoryFilter('Outgoing'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${categoryFilter === 'Outgoing' ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              📤 {isAr ? "مستندات صادرة" : "Outgoing Docs"}
            </button>
          </div>

          <div className="text-slate-400 font-semibold font-mono text-[11px]">
            {isAr ? `مطابقة ${sortedDocs.length} مستند` : `Found ${sortedDocs.length} matching documents`}
          </div>
        </div>
      </div>

      {/* 4. Main Document Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Table segment */}
        <div className={`transition-all duration-300 ${selectedDocId ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-4`}>
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] sticky-scrollbar">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-150">
                  <tr>
                    {visibleColumns.category && (
                      <th 
                        onClick={() => handleSort('category')}
                        className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none text-[10px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{isAr ? "فئة المستند" : "Category"}</span>
                          {sortBy === 'category' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.code && (
                      <th 
                        onClick={() => handleSort('code')}
                        className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none text-[10px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{isAr ? "كود المستند" : "Document Code"}</span>
                          {sortBy === 'code' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.title && (
                      <th 
                        onClick={() => handleSort('title')}
                        className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none text-[10px] min-w-[220px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{isAr ? "عنوان المستند" : "Document Title"}</span>
                          {sortBy === 'title' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.sender && (
                      <th 
                        onClick={() => handleSort('sender')}
                        className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none text-[10px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{isAr ? "المصدر" : "Originator"}</span>
                          {sortBy === 'sender' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.version && (
                      <th 
                        onClick={() => handleSort('version')}
                        className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none text-[10px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{isAr ? "شفرة الإصدار" : "Revision"}</span>
                          {sortBy === 'version' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.status && (
                      <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                        {isAr ? "الحالة" : "Status"}
                      </th>
                    )}
                    <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-center text-[10px] w-16">
                      {isAr ? "كشف" : "View"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        {isAr ? "لا توجد مستندات تطابق المعايير المطلوبة." : "No engineering control documents matched selected settings."}
                      </td>
                    </tr>
                  ) : (
                    paginatedDocs.map((doc) => {
                      const isSelected = doc.id === selectedDocId;
                      const rowPadding = density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4';
                      return (
                        <tr 
                          key={doc.id}
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-colors group text-gray-700 font-semibold
                            ${isSelected ? 'bg-brand-navy/5 border-y border-brand-navy/10' : ''}
                          `}
                        >
                          {visibleColumns.category && (
                            <td className={rowPadding}>
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-gray-600 font-extrabold text-[10px] uppercase">
                                {doc.category}
                              </span>
                            </td>
                          )}
                          {visibleColumns.code && (
                            <td className={`${rowPadding} font-mono text-[10px] text-slate-500 font-bold`}>
                              {doc.code}
                            </td>
                          )}
                          {visibleColumns.title && (
                            <td className={rowPadding}>
                              <BiText 
                                text={{ en: doc.titleEn, ar: doc.titleAr || doc.titleEn }} 
                                primaryLang={lang}
                                primaryClassName="font-bold text-brand-navy text-xs block tracking-tight group-hover:text-brand-red transition-colors"
                                secondaryClassName="text-[10px] text-gray-400 leading-normal block mt-0.5"
                              />
                            </td>
                          )}
                          {visibleColumns.sender && (
                            <td className={`${rowPadding} text-[11px] font-medium text-slate-500 max-w-[120px] truncate`}>
                              {doc.sender}
                            </td>
                          )}
                          {visibleColumns.version && (
                            <td className={`${rowPadding} font-mono text-[10px] text-slate-500`}>
                              {doc.version}
                            </td>
                          )}
                          {visibleColumns.status && (
                            <td className={rowPadding}>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-black rounded text-[10px] uppercase">
                                {doc.status}
                              </span>
                            </td>
                          )}
                          <td className={`${rowPadding} text-center`} onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => setSelectedDocId(doc.id)}
                              className="p-1 bg-slate-50 hover:bg-brand-red hover:text-white text-slate-500 rounded-lg transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls (Unified styled like ProjectList) */}
          {sortedDocs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-150 rounded-xl px-5 py-3 text-xs font-bold gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <span>
                  {isAr 
                    ? `عرض ${Math.min((currentPage - 1) * itemsPerPage + 1, sortedDocs.length)} - ${Math.min(currentPage * itemsPerPage, sortedDocs.length)} من إجمالي ${sortedDocs.length} مستندات`
                    : `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, sortedDocs.length)} to ${Math.min(currentPage * itemsPerPage, sortedDocs.length)} of ${sortedDocs.length} documents`
                  }
                </span>
                <span className="text-slate-200">|</span>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span>{isAr ? 'صفوف لكل صفحة:' : 'Rows per page:'}</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-slate-50 border rounded p-1 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isAr ? 'السابق' : 'Prev'}
                </button>
                <span className="px-3.5 py-1.5 bg-brand-red/5 text-brand-red border border-brand-red/10 rounded-lg font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isAr ? 'التالي' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audit drawer (Right side) */}
        {selectedDoc && (
          <div className="xl:col-span-4 bg-white rounded-[32px] border border-gray-150 shadow-xl p-7 space-y-7 animate-in slide-in-from-right-8 duration-300 xl:sticky xl:top-4 overflow-y-auto max-h-[85vh] no-scrollbar text-xs">
            
            <div className="flex justify-between items-start pb-5 border-b border-gray-150">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block font-sans">
                  {selectedDoc.code + ' • EDMS CONTROLLER'}
                </span>
                
                {isEditingSidebar ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      value={editTitleEn}
                      onChange={e => setEditTitleEn(e.target.value)}
                      placeholder="Title (English)"
                      className="w-full p-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      value={editTitleAr}
                      onChange={e => setEditTitleAr(e.target.value)}
                      placeholder="Title (Arabic)"
                      className="w-full p-2 border rounded-lg text-right"
                    />
                  </div>
                ) : (
                  <h3 className="text-[20px] font-black text-brand-navy leading-tight font-sans">
                    {isAr ? selectedDoc.titleAr || selectedDoc.titleEn : selectedDoc.titleEn}
                  </h3>
                )}
              </div>
              <button 
                onClick={() => setSelectedDocId(null)}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-brand-red transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checkout & Lock controls */}
            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'حالة القفل' : 'Lock Status'}</span>
                <span className="font-extrabold text-slate-700">
                  {selectedDoc.isLocked ? ('Locked by ' + selectedDoc.checkedOutBy) : 'Unlocked / Free'}
                </span>
              </div>
              <div>
                {selectedDoc.isLocked ? (
                  selectedDoc.checkedOutBy === 'EDMS Admin' && (
                    <button
                      onClick={() => handleCheckinDoc(selectedDoc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Check In</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handleCheckoutDoc(selectedDoc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Check Out</span>
                  </button>
                )}
              </div>
            </div>

            {/* General Specs */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-150 space-y-3">
                <span className="text-[11px] text-gray-400 uppercase font-black block tracking-wider font-sans">{isAr ? "تفاصيل الإرسال وتراخيص العمل" : "Dispatched Parties & Core Permits"}</span>
                
                {isEditingSidebar ? (
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400">Sender</label>
                      <input type="text" value={editSender} onChange={e => setEditSender(e.target.value)} className="w-full p-1.5 border rounded bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400">Recipient</label>
                      <input type="text" value={editRecipient} onChange={e => setEditRecipient(e.target.value)} className="w-full p-1.5 border rounded bg-white" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-gray-400 block font-bold mb-0.5">{isAr ? "من الجهة المصدرة" : "From (Sender)"}</label>
                      <p className="font-bold text-gray-800">{selectedDoc.sender}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 block font-bold mb-0.5">{isAr ? "إلى الجهة المستلمة" : "To (Recipient)"}</label>
                      <p className="font-bold text-gray-800">{selectedDoc.recipient}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-150 space-y-3">
                <span className="text-[11px] text-gray-400 uppercase font-black block tracking-wider font-sans">{isAr ? "مطابقة المعايير والمراجعة الفنية" : "Verifications & Critical Checks"}</span>
                
                {isEditingSidebar ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400">Category</label>
                      <select value={editCategory} onChange={e => setEditCategory(e.target.value as any)} className="w-full p-1.5 border rounded bg-white">
                        <option value="Drawing">Drawing</option>
                        <option value="Transmittal">Transmittal</option>
                        <option value="Incoming">Incoming</option>
                        <option value="Outgoing">Outgoing</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400">Priority</label>
                      <select value={editPriority} onChange={e => setEditPriority(e.target.value as any)} className="w-full p-1.5 border rounded bg-white">
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[9px] font-bold text-gray-400">Status</label>
                      <input type="text" value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full p-1.5 border rounded bg-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">{isAr ? "شفرة المراجعة" : "Revision Log"}</span>
                      <span className="font-mono text-gray-800 font-extrabold">{selectedDoc.version}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">{isAr ? "درجة المتابعة" : "Priority"}</span>
                      <span className={'px-2 py-0.5 rounded font-black text-[10px] ' + (selectedDoc.priority === 'High' ? 'bg-red-50 text-brand-red' : 'bg-gray-150 text-gray-600')}>{selectedDoc.priority}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Reassignment */}
              <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-150 space-y-3">
                <span className="text-[11px] text-gray-400 uppercase font-black block tracking-wider font-sans">{isAr ? "إعادة توجيه وإسناد المشروع" : "Project Reassignment"}</span>
                <div className="space-y-2 text-xs">
                  {isEditingSidebar ? (
                    <select
                      value={editProjectId}
                      onChange={e => setEditProjectId(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white font-bold"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.code + ' - ' + p.nameEn}</option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <label className="text-gray-400 block font-bold mb-0.5">{isAr ? "المشروع المسند الحالي" : "Assigned Project"}</label>
                      <p className="font-bold text-brand-navy">
                        {getProjectInfo(selectedDoc.projectId).code + ' - ' + getProjectInfo(selectedDoc.projectId).name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Actions buttons */}
            <div className="flex gap-2 justify-end border-t pt-4">
              {isEditingSidebar ? (
                <>
                  <button
                    onClick={() => setIsEditingSidebar(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSidebarMetadata}
                    className="px-4 py-2 bg-brand-navy text-white hover:bg-brand-navy/95 rounded-xl font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                !(selectedDoc.isLocked && selectedDoc.checkedOutBy !== 'EDMS Admin') && (
                  <button
                    onClick={() => setIsEditingSidebar(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold cursor-pointer"
                  >
                    Edit Details
                  </button>
                )
              )}
            </div>

            {/* Revisions Log in EDMS controller */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-[11px] text-gray-400 uppercase font-black block tracking-wide font-sans">
                  {isAr ? "تاريخ تعديلات وإصدارات المستند" : "EDMS Revision Logs"}
                </span>
                {!(selectedDoc.isLocked && selectedDoc.checkedOutBy !== 'EDMS Admin') && !showRevForm && (
                  <button
                    type="button"
                    onClick={() => { setShowRevForm(true); }}
                    className="px-2 py-1 bg-brand-red text-white rounded text-[9px] font-bold cursor-pointer"
                  >
                    Add Rev
                  </button>
                )}
              </div>

              {showRevForm && (
                <form onSubmit={handleAddRevSidebar} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-250/50 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-400">Rev Code *</label>
                      <input type="text" required value={newRevVer} onChange={e => setNewRevVer(e.target.value)} placeholder="Rev 1.1" className="w-full p-1.5 border rounded bg-white" />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-400">Date *</label>
                      <input type="date" required value={newRevDate} onChange={e => setNewRevDate(e.target.value)} className="w-full p-1.5 border rounded bg-white" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400">File Name</label>
                    <input type="text" value={newRevFile} onChange={e => setNewRevFile(e.target.value)} placeholder="rev-file.pdf" className="w-full p-1.5 border rounded bg-white font-mono" />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400">Remarks *</label>
                    <textarea required value={newRevRem} onChange={e => setNewRevRem(e.target.value)} rows={2} className="w-full p-1.5 border rounded bg-white" />
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button type="button" onClick={() => setShowRevForm(false)} className="px-2 py-1 bg-slate-100 hover:bg-slate-250 border rounded text-[9px] font-bold">Cancel</button>
                    <button type="submit" className="px-3.5 py-1 bg-brand-red text-white rounded text-[9px] font-bold">Save Rev</button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {selectedDoc.revisions && selectedDoc.revisions.map((rev, idx) => (
                  <div key={rev.id || idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-1">
                    <div className="flex justify-between items-center font-bold text-[10px] text-slate-650">
                      <span className="text-brand-navy">Version: {rev.version}</span>
                      <span className="font-mono">{rev.date}</span>
                    </div>
                    <p className="text-slate-700 italic">"{rev.remarks}"</p>
                    {rev.fileAttachmentName && (
                      <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-mono mt-1 font-bold">
                        <Paperclip className="w-3 h-3" />
                        <span>{rev.fileAttachmentName}</span>
                      </div>
                    )}
                  </div>
                ))}
                {(!selectedDoc.revisions || selectedDoc.revisions.length === 0) && (
                  <div className="bg-slate-55/40 p-2 rounded-xl text-center text-slate-400 text-[10px] italic">No revisions registered.</div>
                )}
              </div>
            </div>

            {/* Download Attachment Actions */}
            <div className="space-y-3 border-t border-gray-100 pt-6">
              <span className="text-[11px] text-gray-400 uppercase font-black block tracking-wide font-sans">
                {isAr ? "الملفات الهندسية المرفقة (CAD/PDF)" : "Engineering File Attachments (CAD/PDF)"}
              </span>
              <div className="p-4 bg-brand-navy/5 border border-brand-navy/10 rounded-2xl flex items-center justify-between text-xs font-semibold text-brand-navy">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 text-brand-red shrink-0" />
                  <span className="truncate">{selectedDoc.code + '.pdf'}</span>
                </div>
                <button className="px-3 py-1.5 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 text-[11px] font-black cursor-pointer">
                  DOWNLOAD
                </button>
              </div>
            </div>

          </div>
        )}


      </div>

      {/* Stateful Document Registration Overlay Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-2xl border border-gray-150 shadow-2xl overflow-hidden p-8 space-y-6 relative border-t-8 border-brand-navy max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-black text-brand-navy font-sans flex items-center gap-2">
                  <Folder className="w-5 h-5 text-brand-red" />
                  <span>{isAr ? "تسجيل مستنىد أو مخطط هندسي" : "Register Engineering Document / Drawing"}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isAr ? "إضافة مخطط تفصيلي، خطاب وارد، أو صادر في قاعدة البيانات الموحدة." : "Commit a new drawing standard, incoming memo, or dispatched dispatch to the EDMS."}
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-brand-red rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Category & Autogenerated Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                    {isAr ? "فئة وتصنيف المستند" : "EDMS Document Category"}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 cursor-pointer"
                  >
                    <option value="Drawing">📂 Drawing (مخطط فني للهيكل)</option>
                    <option value="Transmittal">✉️ Transmittal (محضر إرسال ومطابقة)</option>
                    <option value="Incoming">📥 Incoming (مستند وارد رسمي)</option>
                    <option value="Outgoing">📤 Outgoing (مستند صادر مفوض)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                    {isAr ? "كود ومعرف المستند" : "EDMS Document Code"}
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. ROWAD-NEOM-CIV-DRW-043"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-navy rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 transition-all"
                  />
                </div>
              </div>

              {/* Title (English & Arabic) */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                  {isAr ? "عنوان المستند أو المعاملة" : "Document & Revision Title"}
                </label>
                <div>
                  {isAr ? (
                    <input
                      type="text"
                      required
                      value={titleAr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTitleAr(val);
                        setTitleEn(val);
                      }}
                      placeholder="عنوان المستند (بالعربية) *"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-brand-navy text-right rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 transition-all"
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      value={titleEn}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTitleEn(val);
                        setTitleAr(val);
                      }}
                      placeholder="Document Title (English) *"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-brand-navy rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 transition-all"
                    />
                  )}
                </div>
              </div>

              {/* Project Selection Dropdown */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                  {isAr ? "المشروع التابع له المستند *" : "Target Infrastructure Project *"}
                </label>
                <SearchableAutocomplete
                  options={projects.map(p => ({
                    id: p.id,
                    code: p.code,
                    name: isAr ? p.nameAr || p.nameEn : p.nameEn,
                    subtitle: isAr ? p.client : p.client
                  }))}
                  selectedValue={selectedProjectId}
                  onSelect={(val) => setSelectedProjectId(val)}
                  placeholder={isAr ? 'اختر المشروع التابع له...' : 'Choose target project...'}
                />
              </div>

              {/* Sender & Recipient */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                    {isAr ? "الجهة الصادرة (المرسل)" : "Originator / Sender"}
                  </label>
                  <input
                    type="text"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-navy rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                    {isAr ? "الجهة المستقبلة (المرسل إليه)" : "Dispatched To / Recipient"}
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-navy rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 transition-all"
                  />
                </div>
              </div>

              {/* Status (English & Arabic) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                    {isAr ? "حالة المستند باللغة الإنجليزية" : "EDMS Workflow Status (English)"}
                  </label>
                  <input
                    type="text"
                    value={statusEn}
                    onChange={(e) => setStatusEn(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-navy rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                    {isAr ? "الحالة باللغة العربية" : "EDMS Workflow Status (Arabic)"}
                  </label>
                  <input
                    type="text"
                    value={statusAr}
                    onChange={(e) => setStatusAr(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-navy text-right rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 transition-all"
                  />
                </div>
              </div>

              {/* Priority & Version */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                    {isAr ? "مستوى الأولوية أو الخطورة" : "Action Priority"}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 cursor-pointer"
                  >
                    <option value="High">🔴 High Priority (أولوية قصوى بمراجعة للمهندس)</option>
                    <option value="Medium">🟡 Medium Priority (متوسط الأهمية ومراجعة خلال يومين)</option>
                    <option value="Low">🟢 Low Priority (عادي للمطابقة الدورية)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                    {isAr ? "شفرة الإصدار أو المخطط" : "Revision Version Code"}
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. Rev 1.0 or Original"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-navy rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 transition-all"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-150 rounded-xl text-xs font-black text-gray-500 cursor-pointer"
                >
                  {isAr ? "إلغاء الأمر" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 shadow-md active:translate-y-0 transition-all"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? "تسجيل المخطط / المستند" : "Register & Submit Document"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
