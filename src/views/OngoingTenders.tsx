import React from 'react';
import { X, Settings2 } from 'lucide-react';
import { Settings } from '../domain/administration/Settings';
import { Tender } from '../features/pre-award/ongoing-tenders/types';
import { initialTenders } from '../features/pre-award/ongoing-tenders/constants/initialTenders';
import { useOngoingTenders } from '../features/pre-award/ongoing-tenders/hooks/useOngoingTenders';

// Re-export decomposed feature subcomponents and types for external consuming files
import { TenderToolbar } from '../features/pre-award/ongoing-tenders/components/TenderToolbar';
import { TenderKPICards } from '../features/pre-award/ongoing-tenders/components/TenderKPICards';
import { TenderFilters } from '../features/pre-award/ongoing-tenders/components/TenderFilters';
import { TenderActions } from '../features/pre-award/ongoing-tenders/components/TenderActions';
import { TenderTable } from '../features/pre-award/ongoing-tenders/components/TenderTable';
import { TenderDetailsDrawer } from '../features/pre-award/ongoing-tenders/components/TenderDetailsDrawer';
import { TenderImportModal } from '../features/pre-award/ongoing-tenders/components/TenderImportModal';
import { TenderWizardModal } from '../features/pre-award/ongoing-tenders/components/TenderWizardModal';

export type { Tender };
export { initialTenders };

interface OngoingTendersProps {
  lang: 'ar' | 'en';
  list: Tender[];
  onUpdateList: React.Dispatch<React.SetStateAction<Tender[]>>;
  settings: Settings;
}

export function OngoingTenders({
  lang,
  list,
  onUpdateList,
  settings,
}: OngoingTendersProps) {
  const isAr = lang === 'ar';

  const {
    selectedTenderId,
    setSelectedTenderId,
    selectedRowIds,
    setSelectedRowIds,
    showImportWizard,
    setShowImportWizard,
    showManualForm,
    setShowManualForm,
    dragActive,
    analyzingFile,
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
    handleAwardTender,
    handleStatusTransition,
    handleDrag,
    handleDrop,
    triggerAnalysis,
  } = useOngoingTenders({
    list,
    onUpdateList,
    settings,
    isAr,
  });

  // Unified Grid Configuration States (Unifies Ongoing Tenders with Project Portfolio look)
  const [density, setDensity] = React.useState<'compact' | 'standard'>('compact');
  const [showColSelector, setShowColSelector] = React.useState(false);
  const [visibleColumns, setVisibleColumns] = React.useState({
    health: true,
    projectCode: true,
    tenderNumber: true,
    projectName: true,
    location: true,
    coordinator: true,
    contractsEngineer: true,
    techSubmissionDate: false,
    commSubmissionDate: false,
    riskDue: false,
    qualDue: false,
    compliance: false,
    completion: false,
    currentMilestone: false,
    delay: false,
    milestoneStatus: false,
    daysRemaining: true,
  });
  const [sortBy, setSortBy] = React.useState<string>('daysRemaining');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col as keyof typeof prev] }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Sort and Pagination calculations
  const sortedTenders = React.useMemo(() => {
    let result = [...filteredTenders];

    result.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortBy === 'projectName') {
        aVal = isAr ? a.projectName.ar : a.projectName.en;
        bVal = isAr ? b.projectName.ar : b.projectName.en;
      } else if (sortBy === 'location') {
        aVal = isAr ? a.location.ar : a.location.en;
        bVal = isAr ? b.location.ar : b.location.en;
      } else if (sortBy === 'coordinator') {
        aVal = isAr ? a.coordinator.ar : a.coordinator.en;
        bVal = isAr ? b.coordinator.ar : b.coordinator.en;
      } else if (sortBy === 'contractsEngineer') {
        aVal = isAr ? a.contractsEngineer.ar : a.contractsEngineer.en;
        bVal = isAr ? b.contractsEngineer.ar : b.contractsEngineer.en;
      } else {
        aVal = a[sortBy as keyof Tender] ?? '';
        bVal = b[sortBy as keyof Tender] ?? '';
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return result;
  }, [filteredTenders, sortBy, sortOrder, isAr]);

  const totalPages = Math.max(Math.ceil(sortedTenders.length / itemsPerPage), 1);
  const paginatedTenders = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTenders.slice(start, start + itemsPerPage);
  }, [sortedTenders, currentPage, itemsPerPage]);

  return (
    <div className="px-6 py-6 max-w-[1800px] mx-auto space-y-6 animate-in fade-in duration-500 relative">
      {/* Dynamic Toast Alert Portal */}
      {toastAlert && (
        <div className="fixed top-24 right-8 rtl:left-8 rtl:right-auto z-50 bg-brand-navy border border-white/10 text-white flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              toastAlert.type === 'success'
                ? 'bg-emerald-500'
                : toastAlert.type === 'warn'
                ? 'bg-brand-red'
                : 'bg-blue-400'
            }`}
          />
          <span className="text-xs font-semibold">{toastAlert.message}</span>
          <button
            onClick={() => setToastAlert(null)}
            className="p-0.5 hover:bg-white/10 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-white/50 hover:text-white" />
          </button>
        </div>
      )}

      {/* ------------------ IMPORT WIZARD MODAL ------------------ */}
      {showImportWizard && (
        <TenderImportModal
          onClose={() => {
            setShowImportWizard(false);
            setImportStep(1);
          }}
          isAr={isAr}
          importStep={importStep}
          setImportStep={setImportStep}
          dragActive={dragActive}
          handleDrag={handleDrag}
          handleDrop={handleDrop}
          analyzingFile={analyzingFile}
          triggerAnalysis={triggerAnalysis}
          executeImportMerge={executeImportMerge}
        />
      )}

      {/* ------------------ GUIDED TENDER CREATION WIZARD ------------------ */}
      {showManualForm && (
        <TenderWizardModal
          onClose={() => setShowManualForm(false)}
          isAr={isAr}
          lang={lang}
          onUpdateList={onUpdateList}
          setSelectedTenderId={setSelectedTenderId}
          setToastAlert={setToastAlert}
          settings={settings}
          list={list}
        />
      )}

      {/* 1. Page Header Section */}
      <TenderToolbar
        isAr={isAr}
        onImportClick={() => setShowImportWizard(true)}
        onManualClick={() => setShowManualForm(true)}
      />

      {/* KPI Overlays */}
      <TenderKPICards list={list} isAr={isAr} />

      {/* 2. Global Search and Filters Section */}
      <TenderFilters
        searchQuery={searchQuery}
        setSearchQuery={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        statusFilter={statusFilter}
        setStatusFilter={(val) => { setStatusFilter(val); setCurrentPage(1); }}
        recordFilter={recordFilter}
        setRecordFilter={(val) => { setRecordFilter(val); setCurrentPage(1); }}
        locationFilter={locationFilter}
        setLocationFilter={(val) => { setLocationFilter(val); setCurrentPage(1); }}
        coordinatorFilter={coordinatorFilter}
        setCoordinatorFilter={(val) => { setCoordinatorFilter(val); setCurrentPage(1); }}
        engineerFilter={engineerFilter}
        setEngineerFilter={(val) => { setEngineerFilter(val); setCurrentPage(1); }}
        tenderTypeFilter={tenderTypeFilter}
        setTenderTypeFilter={(val) => { setTenderTypeFilter(val); setCurrentPage(1); }}
        clearFilters={() => { clearFilters(); setCurrentPage(1); }}
        isAr={isAr}
      />

      {/* Batch Operations Actions Toolbar Overlay */}
      <TenderActions
        selectedCount={selectedRowIds.length}
        onBulkArchive={handleBulkArchive}
        onBulkExport={handleBulkExport}
        isAr={isAr}
      />

      {/* 3. Main Data Canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start relative select-none">
        {/* Table Column - Master view */}
        <div className={`transition-all duration-300 space-y-4 ${selectedTenderId ? 'xl:col-span-8' : 'xl:col-span-12'}`}>
          
          {/* Unified Controls bar (matches Project Portfolio aesthetic) */}
          <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-slate-400 font-semibold font-mono text-[11px]">
              {isAr ? `مطابقة ${filteredTenders.length} مناقصة جارية` : `Found ${filteredTenders.length} matching ongoing tenders`}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
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
                          onChange={() => toggleColumn(col)}
                          className="rounded text-brand-red focus:ring-brand-red w-3.5 h-3.5"
                        />
                        <span className="capitalize font-medium">
                          {col === 'health' ? (isAr ? 'الصحة' : 'Health') :
                           col === 'projectCode' ? (isAr ? 'كود المشروع' : 'Project Code') :
                           col === 'tenderNumber' ? (isAr ? 'رقم المناقصة' : 'Tender No') :
                           col === 'projectName' ? (isAr ? 'اسم المشروع' : 'Project Name') :
                           col === 'location' ? (isAr ? 'الموقع' : 'Location') :
                           col === 'coordinator' ? (isAr ? 'المنسق' : 'Coordinator') :
                           col === 'contractsEngineer' ? (isAr ? 'مهندس العقود' : 'Contracts Eng') :
                           col === 'techSubmissionDate' ? (isAr ? 'التسليم الفني' : 'Tech Sub') :
                           col === 'commSubmissionDate' ? (isAr ? 'التسليم المالي' : 'Comm Sub') :
                           col === 'riskDue' ? (isAr ? 'استحقاق المخاطر' : 'Risk Due') :
                           col === 'qualDue' ? (isAr ? 'استحقاق التأهيل' : 'Qual Due') :
                           col === 'compliance' ? (isAr ? 'الامتثال' : 'Compliance') :
                           col === 'completion' ? (isAr ? 'الاكتمال %' : 'Completion %') :
                           col === 'currentMilestone' ? (isAr ? 'المرحلة الحالية' : 'Current Milestone') :
                           col === 'delay' ? (isAr ? 'التأخير' : 'Delay') :
                           col === 'milestoneStatus' ? (isAr ? 'حالة المرحلة' : 'Milestone Status') :
                           (isAr ? 'الأيام المتبقية' : 'Days Left')}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Density Toggle */}
              <button
                onClick={() => setDensity(d => d === 'compact' ? 'standard' : 'compact')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              >
                <span className="text-[10px] text-slate-400">Density:</span>
                <span className="capitalize text-brand-navy">{density}</span>
              </button>
            </div>
          </div>

          <TenderTable
            filteredTenders={paginatedTenders}
            selectedTenderId={selectedTenderId}
            selectedRowIds={selectedRowIds}
            setSelectedRowIds={setSelectedRowIds}
            isAr={isAr}
            lang={lang}
            onSelect={setSelectedTenderId}
            onShowAlert={msg => setToastAlert({ type: 'info', message: msg })}
            density={density}
            visibleColumns={visibleColumns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {/* Pagination controls */}
          {filteredTenders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-150 rounded-xl px-5 py-3 text-xs font-bold gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <span>
                  {isAr 
                    ? `عرض ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredTenders.length)} - ${Math.min(currentPage * itemsPerPage, filteredTenders.length)} من إجمالي ${filteredTenders.length} مناقصات`
                    : `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredTenders.length)} to ${Math.min(currentPage * itemsPerPage, filteredTenders.length)} of ${filteredTenders.length} tenders`
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

        {/* 4. Inspection Panel - Detail Drawer view */}
        {selectedTenderId && (
          <div className="xl:col-span-4 transition-all duration-300 animate-in slide-in-from-right duration-300 xl:sticky xl:top-4 overflow-y-auto max-h-[85vh] no-scrollbar">
            <TenderDetailsDrawer
              selectedTender={selectedTender}
              onClose={() => setSelectedTenderId(null)}
              isAr={isAr}
              lang={lang}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              newNoteText={newNoteText}
              setNewNoteText={setNewNoteText}
              onAddNote={handleAddNoteToTender}
              newDocName={newDocName}
              setNewDocName={setNewDocName}
              newDocSize={newDocSize}
              setNewDocSize={setNewDocSize}
              onAddDoc={handleAddDocToTender}
              onShowAlert={msg => setToastAlert({ type: 'info', message: msg })}
              onUpdateTender={(updated) => onUpdateList(prev => prev.map(t => t.id === updated.id ? updated : t))}
              onAwardTender={handleAwardTender}
              onStatusTransition={handleStatusTransition}
            />
          </div>
        )}
      </div>
    </div>
  );
}
