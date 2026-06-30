import React, { useState, useEffect } from 'react';
import { 
  Building2, Calendar, DollarSign, FileText, Pickaxe, Award, Receipt, 
  AlertTriangle, PenTool, Clock, Settings, Paperclip, Plus, ArrowLeft, 
  ArrowRight, Save, Trash2, CheckCircle2, AlertCircle, Eye, Download, Landmark,
  Send, ListFilter, Activity, Link, Users, FilePlus2, Play, Folder, Search
} from 'lucide-react';
import { 
  Project, ProjectMeeting, ProjectIPC, ProjectClaim, ProjectVariationOrder, ProjectNOC, 
  ProjectSPR, ProjectSubcontract, ProjectDocument, ContextualAttachment, ProjectHistory, WBSPackage 
} from '../../../domain/projects/Project';
import { ProjectLookupService } from '../../../services/ProjectLookupService';
import { Contractor, ScopeOfWork, DocumentType } from '../../../domain/master/MasterData';
import { RecordStatus } from '../../../enums/RecordStatus';
import { BiText } from '../../../components/BiText';
import { FinancialsCalculator } from '../../../business-rules/FinancialsCalculator';

// Enterprise modular components imports
import { ProjectDashboard } from './workspace/ProjectDashboard';
import { WBSManager } from './workspace/WBSManager';
import { ProjectSettingsPanel } from './workspace/ProjectSettingsPanel';
import { ContextualAttachmentsList } from './workspace/ContextualAttachmentsList';
import { ActivityFeedTimeline } from './workspace/ActivityFeedTimeline';
import { GlobalSearchPanel } from './workspace/GlobalSearchPanel';
import { SprReportingEngine } from './registers/SprReportingEngine';
import { SubcontractorsPanel } from './workspace/SubcontractorsPanel';
import { DocumentsPanel } from './workspace/DocumentsPanel';
import { AttachmentsPanel } from './workspace/AttachmentsPanel';
import { MeetingsPanel } from './workspace/MeetingsPanel';
import { IPCsPanel } from './workspace/IPCsPanel';
import { ClaimsPanel } from './workspace/ClaimsPanel';
import { VOsPanel } from './workspace/VOsPanel';
import { NOCsPanel } from './workspace/NOCsPanel';

interface ProjectWorkspaceProps {
  projectId: string;
  lang: 'ar' | 'en';
  onBack: () => void;
}

const TABS = [
  { id: 'dashboard', icon: Building2, label: { en: 'Dashboard', ar: 'لوحة التحكم' } },
  { id: 'wbs', icon: Folder, label: { en: 'WBS Hierarchy', ar: 'هيكل الأعمال (WBS)' } },
  { id: 'overview', icon: Building2, label: { en: 'Overview', ar: 'ميثاق المشروع' } },
  { id: 'meetings', icon: Users, label: { en: 'Meetings', ar: 'الاجتماعات' } },
  { id: 'ipc', icon: Receipt, label: { en: 'IPC Accounts', ar: 'المستخلصات' } },
  { id: 'claims', icon: AlertTriangle, label: { en: 'Claims', ar: 'المطالبات' } },
  { id: 'vo', icon: PenTool, label: { en: 'Variation Orders', ar: 'الأوامر التغييرية' } },
  { id: 'noc', icon: Award, label: { en: 'NOC Permits', ar: 'تصاريح عدم الممانعة' } },
  { id: 'spr', icon: Activity, label: { en: 'SPR Reporting', ar: 'تقارير الإنجاز الشهرية' } },
  { id: 'subcontractors', icon: Pickaxe, label: { en: 'Subcontractors', ar: 'المقاولات الباطنة' } },
  { id: 'documents', icon: FileText, label: { en: 'Documents', ar: 'المستندات' } },
  { id: 'search', icon: Search, label: { en: 'Global Search', ar: 'البحث المؤسسي' } },
  { id: 'settings', icon: Settings, label: { en: 'Project Settings', ar: 'إعدادات المشروع' } },
  { id: 'history', icon: Clock, label: { en: 'Activity Feed', ar: 'شريط الأحداث الميداني' } },
];

export function ProjectWorkspace({
  projectId,
  lang,
  onBack
}: ProjectWorkspaceProps) {
  const isAr = lang === 'ar';
  const projectRepo = ProjectLookupService.getInstance();

  const getFinancialSettings = () => {
    const saved = localStorage.getItem('pmo_enterprise_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.financialSettings) {
          return parsed.financialSettings;
        }
      } catch (e) {}
    }
    return {
      retentionPercentage: 10,
      vatPercentage: 15,
      bidBondPercentage: 2,
      performanceBondPercentage: 10,
      advancePaymentPercentage: 10,
      defaultCurrency: 'AED'
    };
  };

  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [allProjectsList, setAllProjectsList] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wbsPackages, setWbsPackages] = useState<WBSPackage[]>([]);
  
  // Track expanded cards and search focuses
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [focusedRecordId, setFocusedRecordId] = useState<string | null>(null);
  const [selectedWbsId, setSelectedWbsId] = useState('');

  // Related data states
  const [meetings, setMeetings] = useState<ProjectMeeting[]>([]);
  const [ipcs, setIpcs] = useState<ProjectIPC[]>([]);
  const [claims, setClaims] = useState<ProjectClaim[]>([]);
  const [vos, setVos] = useState<ProjectVariationOrder[]>([]);
  const [nocs, setNocs] = useState<ProjectNOC[]>([]);
  const [sprs, setSprs] = useState<ProjectSPR[]>([]);
  const [subcontracts, setSubcontracts] = useState<ProjectSubcontract[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [attachments, setAttachments] = useState<ContextualAttachment[]>([]);
  const [history, setHistory] = useState<ProjectHistory[]>([]);

  // Master Lists (for forms)
  const [masterContractors, setMasterContractors] = useState<Contractor[]>([]);
  const [masterScopes, setMasterScopes] = useState<ScopeOfWork[]>([]);
  const [masterDocTypes, setMasterDocTypes] = useState<DocumentType[]>([]);

  // Form Visibility States
  const [showForm, setShowForm] = useState(false);

  // --- Specialized Fields State ---

  // 1. Meeting Form States
  const [meetTitle, setMeetTitle] = useState('');
  const [meetTitleAr, setMeetTitleAr] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetStart, setMeetStart] = useState('09:00');
  const [meetDuration, setMeetDuration] = useState(60); // minutes
  const [meetType, setMeetType] = useState<'online' | 'physical'>('online');
  const [meetLocation, setMeetLocation] = useState('');
  const [meetAttendees, setMeetAttendees] = useState('');

  // 2. IPC Form States
  const [ipcNum, setIpcNum] = useState('');
  const [ipcWorkTill, setIpcWorkTill] = useState('');
  const [ipcGross, setIpcGross] = useState(0);
  const [ipcNet, setIpcNet] = useState(0);
  const [ipcSubDate, setIpcSubDate] = useState('');
  const [ipcRecDate, setIpcRecDate] = useState('');
  const [ipcDueDate, setIpcDueDate] = useState('');
  const [ipcCert, setIpcCert] = useState(0);
  const [ipcPayDue, setIpcPayDue] = useState('');
  const [ipcPayRec, setIpcPayRec] = useState('');
  const [ipcDelay, setIpcDelay] = useState('');
  const [ipcPaidCert, setIpcPaidCert] = useState(0);
  const [ipcRemarks, setIpcRemarks] = useState('');
  const [ipcStatus, setIpcStatus] = useState<ProjectIPC['status']>('Draft');

  // 3. Claim Form States
  const [clmNum, setClmNum] = useState('');
  const [clmType, setClmType] = useState<ProjectClaim['claimType']>('Extension of Time');
  const [clmSubDate, setClmSubDate] = useState('');
  const [clmReqEot, setClmReqEot] = useState(0);
  const [clmAppEot, setClmAppEot] = useState(0);
  const [clmAmt, setClmAmt] = useState(0);
  const [clmAppAmt, setClmAppAmt] = useState(0);
  const [clmInvAmt, setClmInvAmt] = useState(0);
  const [clmNotes, setClmNotes] = useState('');
  const [clmStatus, setClmStatus] = useState<ProjectClaim['status']>('Prepared');

  // 4. VO Form States
  const [voNum, setVoNum] = useState('');
  const [voAddOmit, setVoAddOmit] = useState<'Addition' | 'Omission' | 'Transfer'>('Addition');
  const [voTechDesc, setVoTechDesc] = useState('');
  const [voMerits, setVoMerits] = useState('');
  const [voInstType, setVoInstType] = useState<'EI' | 'AI' | 'VO' | 'Other'>('EI');
  const [voInstRef, setVoInstRef] = useState('');
  const [voInstDate, setVoInstDate] = useState('');
  const [voSubStatus, setVoSubStatus] = useState<'Pending' | 'Submitted' | 'Approved'>('Pending');
  const [voRfvRef, setVoRfvRef] = useState('');
  const [voCommDate, setVoCommDate] = useState('');
  const [voCommAmt, setVoCommAmt] = useState(0);
  const [voCommEot, setVoCommEot] = useState(0);
  const [voAppDate, setVoAppDate] = useState('');
  const [voAppAmt, setVoAppAmt] = useState(0);
  const [voAppRef, setVoAppRef] = useState('');
  const [voRemarks, setVoRemarks] = useState('');
  const [voStatus, setVoStatus] = useState<'Draft' | 'Submitted' | 'Approved' | 'Rejected'>('Draft');

  // 5. NOC Form States
  const [nocNum, setNocNum] = useState('');
  const [nocRef, setNocRef] = useState('');
  const [nocSubj, setNocSubj] = useState('');
  const [nocAction, setNocAction] = useState('');
  const [nocRemarks, setNocRemarks] = useState('');
  const [nocStatus, setNocStatus] = useState<ProjectNOC['status']>('Pending');
  const [editingNocId, setEditingNocId] = useState<string | null>(null);
  const [nocSearch, setNocSearch] = useState('');
  const [nocStatusFilter, setNocStatusFilter] = useState('all');

  // 6. SPR Form States
  const [sprMonth, setSprMonth] = useState('');
  const [sprProgress, setSprProgress] = useState(0);
  const [sprSchVar, setSprSchVar] = useState(0);
  const [sprCostVar, setSprCostVar] = useState(0);
  const [sprAchieve, setSprAchieve] = useState('');
  const [sprRisk, setSprRisk] = useState('');
  const [sprPmo, setSprPmo] = useState('');

  // 7. Subcontract Form States
  const [subNum, setSubNum] = useState('');
  const [subCtrId, setSubCtrId] = useState('');
  const [subScopeId, setSubScopeId] = useState('');
  const [subTotalAmt, setSubTotalAmt] = useState(0);
  const [subInvAmt, setSubInvAmt] = useState(0);
  const [subCompPct, setSubCompPct] = useState(0);
  const [subRemarks, setSubRemarks] = useState('');

  // 8. Document Form States
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

  // 9. File drag states
  const [isDragging, setIsDragging] = useState(false);

  // Load project details
  const reloadAllProjectData = async (targetId: string = currentProjectId) => {
    const list = await projectRepo.getProjects();
    setAllProjectsList(list);
    const found = list.find(p => p.id === targetId);
    if (found) {
      setProject(found);
      
      const [wbs, m, i, c, v, n, s, sub, d, a, h] = await Promise.all([
        projectRepo.getWBSPackages(found.id),
        projectRepo.getMeetings(found.id),
        projectRepo.getIPCs(found.id),
        projectRepo.getClaims(found.id),
        projectRepo.getVariationOrders(found.id),
        projectRepo.getNOCs(found.id),
        projectRepo.getSPRs(found.id),
        projectRepo.getSubcontracts(found.id),
        projectRepo.getDocuments(found.id),
        projectRepo.getAttachments(found.id),
        projectRepo.getHistory(found.id)
      ]);

      setWbsPackages(wbs);
      setMeetings(m);
      setIpcs(i);
      setClaims(c);
      setVos(v);
      setNocs(n);
      setSprs(s);
      setSubcontracts(sub);
      setDocuments(d);
      setAttachments(a);
      setHistory(h.sort((x, y) => y.timestamp.localeCompare(x.timestamp)));
    }
  };

  useEffect(() => {
    reloadAllProjectData(currentProjectId);
    
    // Load Master Lists once
    async function loadMasters() {
      const ctrs = await projectRepo.getContractors();
      setMasterContractors(ctrs);

      const scopes = await projectRepo.getScopes();
      setMasterScopes(scopes);

      const dts = await projectRepo.getDocTypes();
      setMasterDocTypes(dts);
    }
    loadMasters();
  }, [currentProjectId]);

  // BR-CAL-005: Automatic End Time calculation for meetings based on Start Time + Duration
  const calculatedEndTime = React.useMemo(() => {
    if (!meetStart) return '';
    try {
      const [hrs, mins] = meetStart.split(':').map(Number);
      const totalMins = hrs * 60 + mins + Number(meetDuration);
      const endHrs = Math.floor(totalMins / 60) % 24;
      const endMins = totalMins % 60;
      return `${String(endHrs).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    } catch (e) {
      return '';
    }
  }, [meetStart, meetDuration]);

  // Submit handlers for specialized forms

  /* Deleted legacy handler const handleCreateMeeting = async */;

  const handleIpcGrossChange = (val: number) => {
    setIpcGross(val);
    const finSettings = getFinancialSettings();
    const calc = FinancialsCalculator.calculateIpcLifecycle(val, finSettings as any);
    setIpcNet(calc.netValue);
    setIpcCert(calc.subtotal);
  };

  /* Deleted legacy handler const handleCreateIPC = async */;

  /* Deleted legacy handler const handleUpdateClaimStatus = async */;

  /* Deleted legacy handler const handleCreateClaim = async */;

  /* Deleted legacy handler const handleCreateVO = async */;

  /* Deleted legacy handler const handleCreateNOC = async */;

  const handleEditNOC = (noc: ProjectNOC) => {
    setNocNum(noc.nocNumber);
    setNocRef(noc.reference);
    setNocSubj(noc.subject);
    setNocAction(noc.pendingActionBy);
    setNocRemarks(noc.remarks || '');
    setNocStatus(noc.status);
    setSelectedWbsId(noc.wbsId || '');
    setEditingNocId(noc.id);
    setShowForm(true);
  };

  const handleDeleteNOC = async (id: string, code: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا التصريح؟' : 'Are you sure you want to delete this permit?')) return;
    await projectRepo.deleteNOC(id);
    await projectRepo.addHistory(project!.id, 'NOC Deleted', 'System', `Deleted NOC Permit: ${code}`, 'NOC', id, code);
    reloadAllProjectData();
  };

  const handleCreateSPR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !sprMonth) return;

    const newSpr: ProjectSPR = {
      id: `spr-${Date.now()}`,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: {
        createdBy: 'User',
        createdAt: new Date().toISOString()
      },
      projectId: project.id,
      reportingMonth: sprMonth,
      overallProgressPercentage: sprProgress,
      scheduleVariance: sprSchVar,
      costVariance: sprCostVar,
      keyAchievements: sprAchieve,
      bottlenecksAndRisks: sprRisk,
      pmoSummary: sprPmo,
      status: 'Submitted'
    };

    await projectRepo.saveSPR(newSpr);
    await projectRepo.addHistory(project.id, 'SPR Submitted', 'System', `Submitted Performance Report for ${sprMonth}`);
    setShowForm(false);
    setSprMonth('');
    reloadAllProjectData();
  };

  const handleSubTotalAmtChange = (val: number) => {
    setSubTotalAmt(val);
    if (val > 0 && subInvAmt > 0) {
      setSubCompPct(Math.round((subInvAmt / val) * 100));
    } else if (val > 0 && subCompPct > 0) {
      setSubInvAmt(Math.round(val * (subCompPct / 100)));
    }
  };

  const handleSubInvAmtChange = (val: number) => {
    setSubInvAmt(val);
    if (subTotalAmt > 0) {
      setSubCompPct(Math.min(Math.round((val / subTotalAmt) * 100), 100));
    }
  };

  const handleSubCompPctChange = (val: number) => {
    setSubCompPct(val);
    if (subTotalAmt > 0) {
      setSubInvAmt(Math.round(subTotalAmt * (val / 100)));
    }
  };

  const handleCreateSubcontract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !subNum || !subCtrId || !subScopeId) return;

    const newSub: ProjectSubcontract = {
      id: `sub-${Date.now()}`,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: {
        createdBy: 'User',
        createdAt: new Date().toISOString()
      },
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

    await projectRepo.saveSubcontract(newSub);
    await projectRepo.addHistory(
      project.id, 
      'Subcontract Created', 
      'System', 
      `Assigned Subcontract: ${subNum}`,
      'Subcontract',
      newSub.id,
      subNum
    );
    setShowForm(false);
    setSubNum('');
    setSelectedWbsId('');
    reloadAllProjectData();
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !docCode || !docTitleEn) return;

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
    setDocCode('');
    setDocTitleEn('');
    setSelectedWbsId('');
    reloadAllProjectData();
  };

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

  const formatMoney = (val: number | undefined, curr: string) => {
    if (val === undefined) return 'N/A';
    return `${val.toLocaleString()} ${curr}`;
  };

  const ArrowIcon = isAr ? ArrowRight : ArrowLeft;

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <Activity className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Workspace Header Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-navy/5 dark:bg-brand-red/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>

        <div className="flex gap-4 items-start z-10 w-full md:w-auto">
          <button 
            onClick={onBack}
            className="p-3 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl bg-white dark:bg-slate-900 shadow-sm shrink-0 transition-all cursor-pointer"
          >
            <ArrowIcon className="w-5 h-5 text-slate-500" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold rounded-lg border font-mono">
                {project.code}
              </span>

              {/* Single Source of Truth Project Switcher Selector */}
              <select
                value={currentProjectId}
                onChange={(e) => setCurrentProjectId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-850 text-[10px] font-extrabold text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-850 rounded-lg px-2.5 py-0.5 outline-none focus:border-brand-red cursor-pointer"
                title="Switch active Project Master"
              >
                {allProjectsList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {lang === 'ar' && p.nameAr ? p.nameAr : p.nameEn}
                  </option>
                ))}
              </select>

              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-100/50 text-[10px] font-bold rounded-full">
                {isAr ? 'مشروع منفذ نشط' : 'PROJECT ACTIVE'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-brand-navy dark:text-slate-100 tracking-tight leading-tight truncate">
              {isAr && project.nameAr ? project.nameAr : project.nameEn}
            </h1>
            <p className="text-xs text-slate-400 truncate mt-1">
              {isAr ? 'العميل: ' : 'Client: '} <span className="font-bold text-slate-500">{project.client}</span> | {isAr ? 'المدينة: ' : 'City: '} <span className="font-bold text-slate-500">{project.city}</span>
            </p>
          </div>
        </div>

        {/* Commercial stats rail */}
        <div className="flex gap-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 z-10 w-full md:w-auto text-xs shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">
              {isAr ? 'موازنة العقد المعتمدة' : 'Contract Baseline'}
            </span>
            <div className="text-sm font-black text-brand-navy dark:text-slate-200">
              {formatMoney(project.revisedContractValue ?? project.signedContractValue, project.currency)}
            </div>
            {project.approvedVariationTotal !== undefined && project.approvedVariationTotal !== 0 && (
              <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                {isAr ? 'الأصل: ' : 'Original: '} {formatMoney(project.signedContractValue, project.currency)} 
                {project.approvedVariationTotal > 0 ? ` (+${project.approvedVariationTotal.toLocaleString()})` : ` (${project.approvedVariationTotal.toLocaleString()})`}
              </div>
            )}
          </div>
          <div className="w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">
              {isAr ? 'تاريخ الإنجاز المستهدف' : 'Completion Date'}
            </span>
            <div className="text-sm font-bold text-brand-red font-mono">
              {project.completionDate}
            </div>
            {project.approvedEotDays !== undefined && project.approvedEotDays > 0 && (
              <div className="text-[9px] text-emerald-600 dark:text-emerald-450 font-bold mt-0.5">
                +{project.approvedEotDays} {isAr ? 'أيام تمديد معتمدة' : 'EOT Days Approved'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notion-style Tabs Ribbon */}
      <div className="overflow-x-auto premium-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-5 min-w-max px-2">
          {TABS.map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
              className={`flex items-center gap-2 pb-3.5 px-1 border-b-2 transition-all font-bold text-xs cursor-pointer
                ${activeTab === tab.id 
                  ? 'border-brand-red text-brand-red' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
                }
              `}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-red' : 'text-slate-400'}`} />
              <BiText text={tab.label} primaryLang={lang} stacked={false} />
            </button>
          ))}
        </div>
      </div>

      {/* Tab Workstations Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-6 shadow-sm min-h-[450px]">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <ProjectDashboard
            lang={lang}
            project={project}
            meetings={meetings}
            ipcs={ipcs}
            claims={claims}
            vos={vos}
            nocs={nocs}
            documents={documents}
            attachments={attachments}
            history={history}
            onNavigateTab={(tabId) => setActiveTab(tabId)}
            onNavigateToRecord={(tabId, recordId) => {
              setActiveTab(tabId);
              setFocusedRecordId(recordId);
              setExpandedRecordId(recordId);
            }}
          />
        )}

        {/* WBS HIERARCHY TAB */}
        {activeTab === 'wbs' && (
          <WBSManager
            lang={lang}
            projectId={project.id}
            onRefreshProjectData={reloadAllProjectData}
          />
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4 font-mono">
                  {isAr ? 'ملخص ميثاق المشروع' : 'Project Charter Profile'}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'العميل المباشر' : 'Client'}</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1">{project.client}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'الجهة المالكة (صاحب العمل)' : 'Employer'}</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1">{project.employer}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'الاستشاري الهندسي' : 'Consultant'}</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1">{project.consultant}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'المقاول الرئيسي' : 'Main Contractor'}</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1">{project.mainContractor}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4 font-mono">
                  {isAr ? 'البرنامج والمنطقة الجغرافية' : 'Schedule & Geography'}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-sans block">{isAr ? 'تاريخ البدء المعتمد' : 'Commencement Date'}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-300 mt-1">{project.startDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-sans block">{isAr ? 'تاريخ الإنجاز التعاقدي' : 'Contract Completion'}</span>
                    <p className="font-bold text-brand-red mt-1">{project.completionDate}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 font-bold font-sans block">{isAr ? 'الدولة والمدينة' : 'Country / City'}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-300 mt-1 font-sans">{project.country}, {project.city}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 font-bold font-sans block">{isAr ? 'نوع العقد الإنشائي' : 'Contract Type'}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-300 mt-1 font-sans">{project.contractType}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4 font-mono">
                  {isAr ? 'إدارة المشروع والمتابعة' : 'Leadership & Management'}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'مدير المشروع (PM)' : 'Project Manager'}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 mt-1">{project.projectManager || 'Unassigned'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'منسق المشروع' : 'Project Coordinator'}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 mt-1">{project.coordinator || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              {project.description && (
                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b pb-2 mb-3 font-mono">
                    {isAr ? 'نطاق الأعمال والملاحظات الفنية' : 'Scope Brief & Details'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
                    {project.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEETINGS TAB */}
        {activeTab === 'meetings' && project && (
          <MeetingsPanel
            lang={lang}
            projectId={project.id}
            projectCode={project.code}
            isProjectArchived={project.recordStatus === 'Archived'}
            onRefresh={reloadAllProjectData}
          />
        )}

        {/* IPC ACCOUNTS TAB */}
        {activeTab === 'ipc' && project && (
          <IPCsPanel
            lang={lang}
            projectId={project.id}
            projectCode={project.code}
            isProjectArchived={project.recordStatus === 'Archived'}
            onRefresh={reloadAllProjectData}
          />
        )}

        {/* CLAIMS TAB */}
        {activeTab === 'claims' && project && (
          <ClaimsPanel
            lang={lang}
            projectId={project.id}
            projectCode={project.code}
            isProjectArchived={project.recordStatus === 'Archived'}
            onRefresh={reloadAllProjectData}
          />
        )}

        {/* VARIATION ORDERS TAB */}
        {activeTab === 'vo' && project && (
          <VOsPanel
            lang={lang}
            projectId={project.id}
            projectCode={project.code}
            isProjectArchived={project.recordStatus === 'Archived'}
            onRefresh={reloadAllProjectData}
          />
        )}

        {/* NOC PERMITS TAB */}
        {activeTab === 'noc' && project && (
          <NOCsPanel
            lang={lang}
            projectId={project.id}
            projectCode={project.code}
            isProjectArchived={project.recordStatus === 'Archived'}
            onRefresh={reloadAllProjectData}
          />
        )}

        {/* SPR REPORTING TAB */}
        {activeTab === 'spr' && (
          <SprReportingEngine
            project={project}
            meetings={meetings}
            ipcs={ipcs}
            claims={claims}
            vos={vos}
            nocs={nocs}
            documents={documents}
            subcontracts={subcontracts}
            lang={lang}
            savedSnapshots={sprs}
            onSaveSnapshot={async (snapshot) => {
              await projectRepo.saveSPR(snapshot);
              await projectRepo.addHistory(project.id, 'SPR Submitted', 'System', `Submitted Performance Report for ${snapshot.reportingMonth}`);
              reloadAllProjectData();
            }}
          />
        )}

        {activeTab === 'subcontractors' && (
          <SubcontractorsPanel
            project={project}
            lang={lang}
            subcontracts={subcontracts}
            wbsPackages={wbsPackages}
            reloadAllProjectData={reloadAllProjectData}
            expandedRecordId={expandedRecordId}
            setExpandedRecordId={setExpandedRecordId}
            focusedRecordId={focusedRecordId}
            setFocusedRecordId={setFocusedRecordId}
          />
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <DocumentsPanel
            project={project}
            lang={lang}
            documents={documents}
            wbsPackages={wbsPackages}
            reloadAllProjectData={reloadAllProjectData}
            expandedRecordId={expandedRecordId}
            setExpandedRecordId={setExpandedRecordId}
            focusedRecordId={focusedRecordId}
            setFocusedRecordId={setFocusedRecordId}
          />
        )}

        {/* ATTACHMENTS TAB */}
        {activeTab === 'attachments' && (
          <AttachmentsPanel
            project={project}
            lang={lang}
            attachments={attachments}
            reloadAllProjectData={reloadAllProjectData}
          />
        )}

        {/* GLOBAL SEARCH TAB */}
        {activeTab === 'search' && (
          <GlobalSearchPanel
            lang={lang}
            project={project}
            meetings={meetings}
            ipcs={ipcs}
            claims={claims}
            vos={vos}
            nocs={nocs}
            subcontracts={subcontracts}
            documents={documents}
            sprs={sprs}
            onNavigateToRecord={(tabId, recordId) => {
              setActiveTab(tabId);
              setFocusedRecordId(recordId);
              setExpandedRecordId(recordId);
            }}
          />
        )}

        {/* PROJECT SETTINGS TAB */}
        {activeTab === 'settings' && (
          <ProjectSettingsPanel
            lang={lang}
            project={project}
            onRefreshProjectData={reloadAllProjectData}
          />
        )}

        {/* AUDIT HISTORY / ACTIVITY TIMELINE TAB */}
        {activeTab === 'history' && (
          <ActivityFeedTimeline
            lang={lang}
            projectId={project.id}
          />
        )}

      </div>

    </div>
  );
}
