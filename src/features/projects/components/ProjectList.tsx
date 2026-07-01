import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Plus, ChevronRight, Download, Building2, 
  Briefcase, DollarSign, Calendar, ListFilter, Eye, MoreVertical, 
  Settings2, Check, ChevronsUpDown, ChevronUp, ChevronDown,
  Edit3, Archive, RotateCcw
} from 'lucide-react';
import { Project, ProjectStatus, ProjectLifecycleStage } from '../../../domain/projects/Project';
import { BiText } from '../../../components/BiText';
import { ProjectKpiBoard } from './ProjectKpiBoard';
import { useDialog } from '../../../components/ui/DialogProvider';
import { Clock as ClockService } from '../../../services/Clock';
import { Currency } from '../../../enums/Currency';
import { FinancialsCalculator } from '../../../business-rules/FinancialsCalculator';
import { AppConstants } from '../../../constants/AppConstants';
import { ProjectStatusBadge } from '../../../components/ProjectStatusBadges';

interface ProjectListProps {
  projects: Project[];
  lang: 'ar' | 'en';
  onSelectProject: (id: string) => void;
  onAddNew: () => void;
  onViewMasters: () => void;
  onEditProject?: (project: Project) => void;
  onArchiveProject?: (project: Project, reason: string) => void;
  onRestoreProject?: (project: Project) => void;
}

export function ProjectList({
  projects,
  lang,
  onSelectProject,
  onAddNew,
  onViewMasters,
  onEditProject,
  onArchiveProject,
  onRestoreProject
}: ProjectListProps) {
  const isAr = lang === 'ar';
  const dialog = useDialog();

  // Grid configuration states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortBy, setSortBy] = useState<keyof Project | 'name'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showColSelector, setShowColSelector] = useState(false);
  const [density, setDensity] = useState<'compact' | 'standard'>('compact');

  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    client: true,
    dates: true,
    value: true,
    dept: true,
    status: true,
    progress: true,
  });

  // KPI Calculations
  const kpis = useMemo(() => {
    const nonArchived = projects.filter(p => p.recordStatus !== 'Archived');
    const total = nonArchived.length;
    const active = nonArchived.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.MOBILIZING).length;
    
    // Near Due Projects calculation referencing NEAR_DUE_THRESHOLD_DAYS
    const nearDue = nonArchived.filter(p => {
      if (p.status !== ProjectStatus.ACTIVE && p.status !== ProjectStatus.MOBILIZING) return false;
      if (!p.completionDate) return false;
      const daysRemaining = ClockService.diffInDays(p.completionDate);
      return daysRemaining >= 0 && daysRemaining <= AppConstants.NEAR_DUE_THRESHOLD_DAYS;
    }).length;

    // Portfolio value: Sum contract values and dynamically convert to EGP using FinancialsCalculator
    const moneyItems = nonArchived.map(p => ({
      amount: p.revisedContractValue ?? p.signedContractValue ?? 0,
      currency: p.currency as any
    }));
    const value = FinancialsCalculator.sumAmounts(moneyItems, Currency.EGP).amount;

    return { total, active, nearDue, value };
  }, [projects]);

  // Filtering and Sorting
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Quick/Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.code.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        p.client.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    }

    // Status Filter / Active vs Archived
    if (statusFilter === 'Archived') {
      result = result.filter(p => p.recordStatus === 'Archived');
    } else {
      result = result.filter(p => p.recordStatus !== 'Archived');
      if (statusFilter !== 'all') {
        result = result.filter(p => p.status === statusFilter);
      }
    }

    // Department Filter
    if (deptFilter !== 'all') {
      result = result.filter(p => p.department === deptFilter);
    }

    // Sort Handler
    result.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortBy === 'name') {
        aVal = isAr && a.nameAr ? a.nameAr : a.nameEn;
        bVal = isAr && b.nameAr ? b.nameAr : b.nameEn;
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
  }, [projects, searchQuery, statusFilter, deptFilter, sortBy, sortOrder, isAr]);

  // Pagination
  const totalPages = Math.max(Math.ceil(filteredAndSortedProjects.length / itemsPerPage), 1);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProjects.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProjects, currentPage, itemsPerPage]);

  const handleSort = (field: keyof Project | 'name') => {
    if (sortBy === field) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Project Code', 'Project Name (EN)', 'Project Name (AR)', 'Client', 'Employer', 'Consultant', 'Contract Type', 'Contract Value', 'Currency', 'Country', 'City', 'Status', 'Start Date', 'Completion Date'];
      const rows = filteredAndSortedProjects.map(p => [
        p.code,
        `"${p.nameEn.replace(/"/g, '""')}"`,
        p.nameAr ? `"${p.nameAr.replace(/"/g, '""')}"` : '',
        `"${p.client.replace(/"/g, '""')}"`,
        `"${p.employer.replace(/"/g, '""')}"`,
        `"${p.consultant.replace(/"/g, '""')}"`,
        p.contractType,
        p.signedContractValue,
        p.currency,
        p.country,
        p.city,
        p.status,
        p.startDate,
        p.completionDate
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Project_Portfolio_Export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export CSV', e);
    }
  };

  const formatCurrency = (val: number, curr: string) => {
    if (val >= 1000000000) {
      return `${(val / 1000000000).toFixed(2)}B ${curr}`;
    }
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M ${curr}`;
    }
    return `${val.toLocaleString()} ${curr}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI Stats Panel */}
      <ProjectKpiBoard kpis={kpis} isAr={isAr} formatCurrency={formatCurrency} />

      {/* Grid Controls Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={isAr ? 'البحث السريع بالكود، الاسم، أو العميل...' : 'Quick search by code, name, or client...'}
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            {/* Master Registers Link */}
            <button
              onClick={onViewMasters}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            >
              <ListFilter className="w-4 h-4 text-slate-400" />
              <span>{isAr ? 'السجلات الأساسية' : 'Registers'}</span>
            </button>

            {/* Column Visibility Selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowColSelector(!showColSelector)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
              >
                <Settings2 className="w-4 h-4 text-slate-400" />
                <span>{isAr ? 'الأعمدة' : 'Columns'}</span>
              </button>
              {showColSelector && (
                <div className="absolute right-0 top-11 z-30 w-52 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-100 dark:border-slate-850">{isAr ? 'إظهار الأعمدة' : 'Toggle Columns'}</div>
                  {Object.keys(visibleColumns).map((col) => (
                    <label key={col} className="flex items-center gap-2.5 py-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col as keyof typeof visibleColumns]}
                        onChange={() => toggleColumn(col as keyof typeof visibleColumns)}
                        className="rounded text-brand-red focus:ring-brand-red w-3.5 h-3.5"
                      />
                      <span className="capitalize font-medium">{col === 'dept' ? 'Department' : col}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Density Selector */}
            <button
              onClick={() => setDensity(d => d === 'compact' ? 'standard' : 'compact')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            >
              <span className="text-[10px] text-slate-400">Density:</span>
              <span className="capitalize text-brand-navy dark:text-slate-200">{density}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>{isAr ? 'تصدير' : 'Export'}</span>
            </button>

            {/* Add Project */}
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'مشروع جديد' : 'Add Project'}</span>
            </button>
          </div>
        </div>

        {/* Inline filtering */}
        <div className="flex flex-wrap gap-4 items-center pt-2.5 border-t border-slate-100 dark:border-slate-850 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">{isAr ? 'تصفية الحالة:' : 'Status:'}</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2.5 bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-brand-red"
            >
              <option value="all">{isAr ? 'الكل النشطة' : 'Active Portfolio'}</option>
              <option value="Active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="Pre-Award">{isAr ? 'قبل الترسية' : 'Pre-Award'}</option>
              <option value="Completed">{isAr ? 'مكتمل' : 'Completed'}</option>
              <option value="Closed">{isAr ? 'مغلق' : 'Closed'}</option>
              <option value="Archived">{isAr ? 'المشاريع المؤرشفة' : 'Archived Projects'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">{isAr ? 'القسم المسؤول:' : 'Department:'}</span>
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2.5 bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-brand-red"
            >
              <option value="all">{isAr ? 'الكل' : 'All Departments'}</option>
              <option value="Infrastructure">{isAr ? 'البنية التحتية' : 'Infrastructure'}</option>
              <option value="Design & Engineering">{isAr ? 'التصميم والهندسة' : 'Design & Engineering'}</option>
              <option value="Commercial Claims">{isAr ? 'المطالبات التجارية' : 'Commercial Claims'}</option>
              <option value="Executive Operations">{isAr ? 'العمليات التنفيذية' : 'Executive Operations'}</option>
            </select>
          </div>

          <div className="text-slate-400 font-semibold ml-auto rtl:mr-auto rtl:ml-0 font-mono text-[11px]">
            {isAr ? `مطابقة ${filteredAndSortedProjects.length} مشروع` : `Found ${filteredAndSortedProjects.length} matching records`}
          </div>
        </div>
      </div>

      {/* High-density ERP Data Grid Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] sticky-scrollbar">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950/80 sticky top-0 z-10 border-b border-slate-150 dark:border-slate-850">
              <tr>
                {visibleColumns.code && (
                  <th 
                    onClick={() => handleSort('code')}
                    className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 select-none text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isAr ? 'كود المشروع' : 'Project Code'}</span>
                      {sortBy === 'code' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                    </div>
                  </th>
                )}
                {visibleColumns.name && (
                  <th 
                    onClick={() => handleSort('name')}
                    className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 select-none text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isAr ? 'اسم المشروع' : 'Project Title'}</span>
                      {sortBy === 'name' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                    </div>
                  </th>
                )}
                {visibleColumns.client && (
                  <th 
                    onClick={() => handleSort('client')}
                    className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 select-none text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isAr ? 'العميل' : 'Client'}</span>
                      {sortBy === 'client' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                    </div>
                  </th>
                )}
                {visibleColumns.dates && (
                  <th 
                    onClick={() => handleSort('startDate')}
                    className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 select-none text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isAr ? 'التاريخ (البدء / الإنجاز)' : 'Timeline'}</span>
                      {sortBy === 'startDate' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                    </div>
                  </th>
                )}
                {visibleColumns.value && (
                  <th 
                    onClick={() => handleSort('signedContractValue')}
                    className="p-3 font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 select-none text-right rtl:text-left text-[10px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{isAr ? 'قيمة العقد الإجمالية' : 'Contract Budget'}</span>
                      {sortBy === 'signedContractValue' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                    </div>
                  </th>
                )}
                {visibleColumns.dept && (
                  <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                    {isAr ? 'القسم المسؤول' : 'Department'}
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                    {isAr ? 'حالة العمل' : 'Status'}
                  </th>
                )}
                {visibleColumns.progress && (
                  <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                    {isAr ? 'الإنجاز المالي' : 'Fin Progress'}
                  </th>
                )}
                <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-right rtl:text-left text-[10px] w-20">
                  {isAr ? 'إجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {paginatedProjects.length > 0 ? (
                paginatedProjects.map((p) => {
                  // Dynamic Financial Progress computation or business layer fallback
                  const progressVal = FinancialsCalculator.calculateFinancialProgress(p);
                  const progressPct = (p.status === 'Completed' || p.status === 'Closed') 
                    ? '100%' 
                    : p.lifecycleStage === ProjectLifecycleStage.PRE_AWARD 
                    ? '0%' 
                    : progressVal !== undefined 
                    ? `${progressVal}%` 
                    : '—';

                  const rowPadding = density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4';
                  
                  return (
                    <tr 
                      key={p.id}
                      onClick={() => onSelectProject(p.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850/40 cursor-pointer transition-colors group"
                    >
                      {visibleColumns.code && (
                        <td className={`${rowPadding} font-mono font-bold text-slate-600 dark:text-slate-300`}>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/50 dark:border-slate-700/50 text-[10px]">
                            {p.code}
                          </span>
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className={`${rowPadding} font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate`}>
                          <div className="truncate group-hover:text-brand-red transition-colors" title={p.nameEn}>
                            {isAr && p.nameAr ? p.nameAr : p.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium font-sans truncate">
                            {p.city}, {p.country}
                          </div>
                        </td>
                      )}
                      {visibleColumns.client && (
                        <td className={`${rowPadding} text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px]`}>
                          {p.client}
                        </td>
                      )}
                      {visibleColumns.dates && (
                        <td className={`${rowPadding} text-slate-500 dark:text-slate-400 font-mono text-[10px] whitespace-nowrap`}>
                          <div className="flex flex-col">
                            <span>S: {p.startDate}</span>
                            <span className="text-slate-400 font-semibold">C: {p.completionDate}</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.value && (
                        <td className={`${rowPadding} text-right rtl:text-left font-bold text-slate-800 dark:text-slate-200 font-mono`}>
                          {formatCurrency(p.signedContractValue, p.currency)}
                        </td>
                      )}
                      {visibleColumns.dept && (
                        <td className={`${rowPadding} text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap`}>
                          {p.department}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className={`${rowPadding} whitespace-nowrap`}>
                          <ProjectStatusBadge status={p.status} lang={lang} />
                        </td>
                      )}
                      {visibleColumns.progress && (
                        <td className={`${rowPadding} min-w-[100px]`}>
                          {progressPct === '—' ? (
                            <span className="text-slate-400 font-semibold">{isAr ? 'غير متوفر' : 'Not Available'}</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">{progressPct}</span>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-red" style={{ width: progressPct }} />
                              </div>
                            </div>
                          )}
                        </td>
                      )}
                      <td className={`${rowPadding} text-right rtl:text-left`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectProject(p.id)}
                            className="p-1.5 bg-slate-50 hover:bg-brand-navy hover:text-white dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-lg transition-all cursor-pointer"
                            title={isAr ? 'فتح مساحة العمل' : 'Open Workspace'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          {p.status !== 'Closed' && p.recordStatus !== 'Archived' && onEditProject && (
                            <button
                              onClick={() => onEditProject(p)}
                              className="p-1.5 bg-slate-50 hover:bg-brand-red hover:text-white dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-lg transition-all cursor-pointer"
                              title={isAr ? 'تعديل بيانات المشروع' : 'Edit Project'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {p.recordStatus === 'Archived' ? (
                            onRestoreProject && (
                              <button
                                onClick={() => onRestoreProject(p)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-lg transition-all cursor-pointer"
                                title={isAr ? 'استعادة المشروع' : 'Restore Project'}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )
                          ) : (
                            onArchiveProject && (
                              <button
                                onClick={async () => {
                                  const reason = await dialog.promptText(
                                    isAr
                                      ? 'أدخل سبب أرشفة المشروع (إلزامي):'
                                      : 'Enter project archive reason (mandatory):',
                                    { required: true, title: isAr ? 'أرشفة المشروع' : 'Archive Project' }
                                  );
                                  if (reason && reason.trim()) {
                                    onArchiveProject(p, reason.trim());
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg transition-all cursor-pointer"
                                title={isAr ? 'أرشفة المشروع' : 'Archive Project'}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-brand-navy dark:text-slate-300">{isAr ? 'لا توجد مشاريع مطابقة' : 'No projects matched current filters.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination & Grid Size Controls */}
      {filteredAndSortedProjects.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-5 py-3 text-xs font-bold gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span>
              {isAr 
                ? `عرض ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedProjects.length)} - ${Math.min(currentPage * itemsPerPage, filteredAndSortedProjects.length)} من إجمالي ${filteredAndSortedProjects.length} مشاريع`
                : `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedProjects.length)} to ${Math.min(currentPage * itemsPerPage, filteredAndSortedProjects.length)} of ${filteredAndSortedProjects.length} projects`
              }
            </span>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>{isAr ? 'صفوف لكل صفحة:' : 'Rows per page:'}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-50 dark:bg-slate-800 border rounded p-1 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
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
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAr ? 'السابق' : 'Prev'}
            </button>
            <span className="px-3.5 py-1.5 bg-brand-red/5 text-brand-red border border-brand-red/10 rounded-lg font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAr ? 'التالي' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
