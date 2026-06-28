import React, { useState, useEffect } from 'react';
import { Tender } from '../types';
import { Settings } from '../../../../domain/administration/Settings';
import { FinancialsCalculator } from '../../../../business-rules/FinancialsCalculator';
import { Clock as AppClock } from '../../../../services/Clock';
import { HealthCalculator } from '../../../../business-rules/HealthCalculator';
import { HealthStatus } from '../../../../enums/HealthStatus';

interface UseOngoingTendersProps {
  list: Tender[];
  onUpdateList: React.Dispatch<React.SetStateAction<Tender[]>>;
  settings: Settings;
  isAr: boolean;
}

export function useOngoingTenders({
  list,
  onUpdateList,
  settings,
  isAr,
}: UseOngoingTendersProps) {
  // Selected Row for detailed inspecting drawer - Pre-Opened on the first row by default
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>('t-1');

  // Selection matrices for batch operations
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Local state controls for modals
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1); // 1 = Upload, 2 = Compare & Resolve

  // Search and Advanced filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recordFilter, setRecordFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [coordinatorFilter, setCoordinatorFilter] = useState('all');
  const [engineerFilter, setEngineerFilter] = useState('all');
  const [tenderTypeFilter, setTenderTypeFilter] = useState('all');

  // New Note addition inside inspect drawer
  const [newNoteText, setNewNoteText] = useState('');

  // Active Tab & Simulated Document states for Redesigned Detail Record Viewer
  const [activeTab, setActiveTab] = useState<
    'overview' | 'assignments' | 'timeline' | 'milestones' | 'activities' | 'financial' | 'docs' | 'notes' | 'history'
  >('overview');
  const [newDocName, setNewDocName] = useState('');
  const [newDocSize, setNewDocSize] = useState('1.8 MB');

  // Auto reset active tab on selected tender change
  useEffect(() => {
    setActiveTab('overview');
  }, [selectedTenderId]);

  // Toast notification alert system
  const [toastAlert, setToastAlert] = useState<{
    type: 'success' | 'info' | 'warn';
    message: string;
  } | null>(null);

  // Auto clean toast timer
  useEffect(() => {
    if (toastAlert) {
      const timer = setTimeout(() => setToastAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastAlert]);

  // Handle Drag over style
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Simulate file analysis with high-fidelity summary feedback
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      triggerAnalysis();
    }
  };

  const triggerAnalysis = () => {
    setAnalyzingFile(true);
    setTimeout(() => {
      setAnalyzingFile(false);
      setImportStep(2);
    }, 1200);
  };

  // Confirm and ingest the parsed spreadsheet items
  const executeImportMerge = () => {
    const importedItems: Tender[] = [
      {
        id: `t-import-1`,
        projectCode: 'PC-2026-RCL',
        tenderNumber: 'TN-77121',
        projectName: {
          en: 'Riyadh Central Logistics Ring & Tunnels',
          ar: 'الطريق الدائري والأنفاق اللوجستية المركزية لمدينة الرياض',
        },
        location: { en: 'Riyadh - Saudi Arabia', ar: 'الرياض - المملكة العربية السعودية' },
        coordinator: { en: 'Eng. Khalid Al-Saeed', ar: 'المهندس خالد السعيد' },
        contractsEngineer: { en: 'Ahmed Mostafa', ar: 'أحمد مصطفى' },
        techSubmissionDate: '2026-08-10',
        commSubmissionDate: '2026-08-25',
        overallSubmissionDate: '2026-09-05',
        projectStatus: { en: 'Preparing Proposal', ar: 'جاري إعداد العرض العلمي والمالي' },
        awardStatus: { en: 'Pending Selection', ar: 'في انتظار تحديد المقاول' },
        recordStatus: 'Active',
        daysRemaining: 45,
        health: 'Healthy',
        estimatedValue: 'SAR 520,000,000',
        bondAmount: 'SAR 10,400,000',
        currency: 'SAR',
        tenderType: { en: 'EPC Contract', ar: 'عقد هندسة وتشييد' },
        clientName: { en: 'Ministry of Transport Services', ar: 'وزارة النقل والخدمات اللوجستية' },
        notes: [
          {
            id: 'in1',
            author: 'System Sync',
            date: AppClock.todayISO(),
            text: 'Imported from Tender Department official release file v4.',
          },
        ],
        documents: [],
      },
      {
        id: `t-import-2`,
        projectCode: 'PC-2026-JED',
        tenderNumber: 'TN-30291',
        projectName: {
          en: 'Jeddah Coastal Desalination Intake Pipeline',
          ar: 'مأخذ خط الأنابيب البحري لمحطة تحلية جدة',
        },
        location: { en: 'Jeddah - Saudi Arabia', ar: 'جدة - المملكة العربية السعودية' },
        coordinator: { en: 'Eng. Yasmin Omar', ar: 'مهندسة ياسمين عمر' },
        contractsEngineer: { en: 'Salim Mansoor', ar: 'سليم منصور' },
        techSubmissionDate: '2026-07-02',
        commSubmissionDate: '2026-07-15',
        overallSubmissionDate: '2026-07-28',
        projectStatus: { en: 'Preparing Proposal', ar: 'جاري إعداد العرض العلمي والمالي' },
        awardStatus: { en: 'Pending Selection', ar: 'في انتظار تحديد المقاول' },
        recordStatus: 'Active',
        daysRemaining: 11,
        health: 'Due Soon',
        estimatedValue: 'SAR 280,000,000',
        bondAmount: 'SAR 5,600,000',
        currency: 'SAR',
        tenderType: { en: 'Design & Build', ar: 'تصميم وتشييد' },
        clientName: {
          en: 'Saline Water Conversion Corporation (SWCC)',
          ar: 'المؤسسة العامة لتحلية المياه المالحة',
        },
        notes: [],
        documents: [],
      },
    ];

    onUpdateList(prev => [...importedItems, ...prev]);
    setShowImportWizard(false);
    setImportStep(1);
    setSelectedTenderId(importedItems[0].id);
    setToastAlert({
      type: 'success',
      message: isAr
        ? 'تم دمج و استيراد السجلات وتحديث حالة المشاريع بنجاح!'
        : 'Pre-Award synchronization successfully completed! 2 new tenders added.',
    });
  };

  // Add notes directly into drawer state
  const handleAddNoteToTender = (id: string) => {
    if (!newNoteText.trim()) return;
    onUpdateList(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            notes: [
              ...t.notes,
              {
                id: `note-${Date.now()}`,
                author: isAr ? 'أحمد مصطفى' : 'Ahmed Mostafa',
                date: AppClock.todayISO(),
                text: newNoteText.trim(),
              },
            ],
          };
        }
        return t;
      })
    );
    setNewNoteText('');
    setToastAlert({
      type: 'info',
      message: isAr ? 'تمت إضافة ملحوظتك الهندسية.' : 'Engineering note appended successfully.',
    });
  };

  // Add document link simulation directly to the tender record state
  const handleAddDocToTender = (id: string) => {
    if (!newDocName.trim()) return;
    onUpdateList(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            documents: [
              ...t.documents,
              {
                id: `doc-${Date.now()}`,
                name: newDocName.trim().endsWith('.pdf') ? newDocName.trim() : `${newDocName.trim()}.pdf`,
                size: newDocSize || '1.8 MB',
                link: '#',
              },
            ],
          };
        }
        return t;
      })
    );
    setNewDocName('');
    setToastAlert({
      type: 'success',
      message: isAr
        ? 'تم إدراج المستند وتحديث الملف الرقمي للمشروع بنجاح!'
        : 'Document registered and project file updated successfully!',
    });
  };

  // Bulk archive action
  const handleBulkArchive = () => {
    if (selectedRowIds.length === 0) return;
    onUpdateList(prev =>
      prev.map(t => {
        if (selectedRowIds.includes(t.id)) {
          return { ...t, recordStatus: 'Archived', health: 'Archived' };
        }
        return t;
      })
    );
    setToastAlert({
      type: 'success',
      message: isAr
        ? `تمت أرشفة السجلات الـ ${selectedRowIds.length} المحددة بشكل كامل.`
        : `Archived ${selectedRowIds.length} items successfully`,
    });
    setSelectedRowIds([]);
  };

  const handleBulkExport = () => {
    if (selectedRowIds.length === 0) return;
    setToastAlert({
      type: 'success',
      message: isAr
        ? `تصدير ملفات Excel لـ ${selectedRowIds.length} بنجاح.`
        : `Exporting ${selectedRowIds.length} items as a unified spreadsheet workbook.`,
    });
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setRecordFilter('all');
    setLocationFilter('all');
    setCoordinatorFilter('all');
    setEngineerFilter('all');
    setTenderTypeFilter('all');
    setSearchQuery('');
  };

  // Filter application
  const filteredTenders = list.filter(t => {
    const matchSearch =
      t.projectName.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.projectName.ar.includes(searchQuery) ||
      t.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.coordinator.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.coordinator.ar.includes(searchQuery) ||
      t.contractsEngineer.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contractsEngineer.ar.includes(searchQuery);

    const matchStatus = statusFilter === 'all' || t.projectStatus.en === statusFilter;
    const matchRecord = recordFilter === 'all' || t.recordStatus === recordFilter;
    const matchLocation = locationFilter === 'all' || t.location.en.includes(locationFilter);
    const matchCoordinator = coordinatorFilter === 'all' || t.coordinator.en === coordinatorFilter;
    const matchEngineer = engineerFilter === 'all' || t.contractsEngineer.en === engineerFilter;
    const matchTenderType = tenderTypeFilter === 'all' || t.tenderType.en === tenderTypeFilter;

    return (
      matchSearch &&
      matchStatus &&
      matchRecord &&
      matchLocation &&
      matchCoordinator &&
      matchEngineer &&
      matchTenderType
    );
  });

  const selectedTender = list.find(t => t.id === selectedTenderId) || null;

  return {
    selectedTenderId,
    setSelectedTenderId,
    selectedRowIds,
    setSelectedRowIds,
    showImportWizard,
    setShowImportWizard,
    showManualForm,
    setShowManualForm,
    dragActive,
    setDragActive,
    analyzingFile,
    setAnalyzingFile,
    importStep,
    setImportStep,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    recordFilter,
    setRecordFilter,
    locationFilter,
    setLocationFilter,
    coordinatorFilter,
    setCoordinatorFilter,
    engineerFilter,
    setEngineerFilter,
    tenderTypeFilter,
    setTenderTypeFilter,
    newNoteText,
    setNewNoteText,
    newDocName,
    setNewDocName,
    newDocSize,
    setNewDocSize,
    activeTab,
    setActiveTab,
    toastAlert,
    setToastAlert,
    clearFilters,
    filteredTenders,
    selectedTender,
    executeImportMerge,
    handleAddNoteToTender,
    handleAddDocToTender,
    handleBulkArchive,
    handleBulkExport,
    handleDrag,
    handleDrop,
    triggerAnalysis,
  };
}
