import React from 'react';
import { AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Tender } from '../types';
import { TenderRow } from './TenderRow';

interface TenderTableProps {
  filteredTenders: Tender[];
  selectedTenderId: string | null;
  selectedRowIds: string[];
  setSelectedRowIds: React.Dispatch<React.SetStateAction<string[]>>;
  isAr: boolean;
  lang: 'ar' | 'en';
  onSelect: (id: string | null) => void;
  onShowAlert: (msg: string) => void;
  density?: 'compact' | 'standard';
  visibleColumns?: { [key: string]: boolean };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function TenderTable({
  filteredTenders,
  selectedTenderId,
  selectedRowIds,
  setSelectedRowIds,
  isAr,
  lang,
  onSelect,
  onShowAlert,
  density = 'compact',
  visibleColumns = {
    health: true,
    projectCode: true,
    tenderNumber: true,
    projectName: true,
    location: true,
    coordinator: true,
    contractsEngineer: true,
    techSubmissionDate: true,
    commSubmissionDate: true,
    daysRemaining: true,
  },
  sortBy = '',
  sortOrder = 'asc',
  onSort = () => {},
}: TenderTableProps) {
  const isAllChecked =
    filteredTenders.length > 0 && selectedRowIds.length === filteredTenders.length;

  const handleHeaderCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(filteredTenders.map(t => t.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleToggleCheck = (id: string) => {
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const renderSortIcon = (field: string) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-red font-black" /> : <ChevronDown className="w-3 h-3 text-brand-red font-black" />;
    }
    return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
  };

  const headerPadding = density === 'compact' ? 'p-2.5 text-[10px]' : 'p-4 text-xs';

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
      {/* Table wrapper containing true data alignment with vertical and horizontal containment */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] sticky-scrollbar relative">
        <table className="w-full text-left rtl:text-right border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-150">
            <tr>
              <th className={`${headerPadding} text-center w-10`}>
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={handleHeaderCheckboxChange}
                  className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy cursor-pointer w-3.5 h-3.5"
                />
              </th>
              
              {visibleColumns.health && (
                <th 
                  onClick={() => onSort('health')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الصحة' : 'Health'}</span>
                    {renderSortIcon('health')}
                  </div>
                </th>
              )}

              {visibleColumns.projectCode && (
                <th 
                  onClick={() => onSort('projectCode')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'كود المشروع' : 'Project Code'}</span>
                    {renderSortIcon('projectCode')}
                  </div>
                </th>
              )}

              {visibleColumns.tenderNumber && (
                <th 
                  onClick={() => onSort('tenderNumber')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'رقم المناقصة' : 'Tender No'}</span>
                    {renderSortIcon('tenderNumber')}
                  </div>
                </th>
              )}

              {visibleColumns.projectName && (
                <th 
                  onClick={() => onSort('projectName')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none min-w-[210px]`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'اسم المشروع' : 'Project Name'}</span>
                    {renderSortIcon('projectName')}
                  </div>
                </th>
              )}

              {visibleColumns.location && (
                <th 
                  onClick={() => onSort('location')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الموقع' : 'Location'}</span>
                    {renderSortIcon('location')}
                  </div>
                </th>
              )}

              {visibleColumns.coordinator && (
                <th 
                  onClick={() => onSort('coordinator')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'المنسق' : 'Coordinator'}</span>
                    {renderSortIcon('coordinator')}
                  </div>
                </th>
              )}

              {visibleColumns.contractsEngineer && (
                <th 
                  onClick={() => onSort('contractsEngineer')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'مهندس العقود' : 'Contracts Eng'}</span>
                    {renderSortIcon('contractsEngineer')}
                  </div>
                </th>
              )}

              {visibleColumns.techSubmissionDate && (
                <th 
                  onClick={() => onSort('techSubmissionDate')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'التسليم الفني' : 'Tech Sub'}</span>
                    {renderSortIcon('techSubmissionDate')}
                  </div>
                </th>
              )}

              {visibleColumns.commSubmissionDate && (
                <th 
                  onClick={() => onSort('commSubmissionDate')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'التسليم المالي' : 'Comm Sub'}</span>
                    {renderSortIcon('commSubmissionDate')}
                  </div>
                </th>
              )}

              {visibleColumns.riskDue && (
                <th 
                  onClick={() => onSort('riskDue')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'استحقاق المخاطر' : 'Risk Due'}</span>
                    {renderSortIcon('riskDue')}
                  </div>
                </th>
              )}

              {visibleColumns.qualDue && (
                <th 
                  onClick={() => onSort('qualDue')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'استحقاق التأهيل' : 'Qual Due'}</span>
                    {renderSortIcon('qualDue')}
                  </div>
                </th>
              )}

              {visibleColumns.compliance && (
                <th 
                  onClick={() => onSort('compliance')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الامتثال' : 'Compliance'}</span>
                    {renderSortIcon('compliance')}
                  </div>
                </th>
              )}

              {visibleColumns.completion && (
                <th 
                  onClick={() => onSort('completion')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الاكتمال %' : 'Completion %'}</span>
                    {renderSortIcon('completion')}
                  </div>
                </th>
              )}

              {visibleColumns.currentMilestone && (
                <th 
                  onClick={() => onSort('currentMilestone')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'المرحلة الحالية' : 'Current Milestone'}</span>
                    {renderSortIcon('currentMilestone')}
                  </div>
                </th>
              )}

              {visibleColumns.delay && (
                <th 
                  onClick={() => onSort('delay')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'التأخير' : 'Delay'}</span>
                    {renderSortIcon('delay')}
                  </div>
                </th>
              )}

              {visibleColumns.milestoneStatus && (
                <th 
                  onClick={() => onSort('milestoneStatus')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'حالة المرحلة' : 'Milestone Status'}</span>
                    {renderSortIcon('milestoneStatus')}
                  </div>
                </th>
              )}

              {visibleColumns.daysRemaining && (
                <th 
                  onClick={() => onSort('daysRemaining')}
                  className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap`}
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الأيام المتبقية' : 'Days Left'}</span>
                    {renderSortIcon('daysRemaining')}
                  </div>
                </th>
              )}

              <th className={`${headerPadding} font-extrabold text-slate-500 uppercase tracking-wider text-center w-14`}>
                {isAr ? 'الإجراءات' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredTenders.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-12 text-center text-sans">
                  <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                    <AlertTriangle className="w-12 h-12 text-brand-red animate-pulse" />
                    <h3 className="font-bold text-brand-navy text-sm font-sans">
                      {isAr ? 'المزايدة لم يعثر عليها' : 'No ongoing tenders match your criteria.'}
                    </h3>
                    <p className="text-xs text-gray-400 font-sans">
                      {isAr
                        ? 'يمكنك بسهولة مراجعة فلاتر التصفية أو البدء باستيراد كشف الـ PMO بضغطة زر واحدة.'
                        : 'Try resetting parameters or launch the Import Wizard for instant PMO sync.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTenders.map(t => (
                <TenderRow
                  key={t.id}
                  t={t}
                  isSelected={selectedTenderId === t.id}
                  isChecked={selectedRowIds.includes(t.id)}
                  isAr={isAr}
                  lang={lang}
                  onSelect={id => onSelect(id)}
                  onToggleCheck={handleToggleCheck}
                  onShowAlert={onShowAlert}
                  density={density}
                  visibleColumns={visibleColumns}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
