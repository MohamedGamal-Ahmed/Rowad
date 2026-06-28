import React from 'react';
import { TenderSearch } from './TenderSearch';

interface TenderFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  recordFilter: string;
  setRecordFilter: (val: string) => void;
  locationFilter: string;
  setLocationFilter: (val: string) => void;
  coordinatorFilter: string;
  setCoordinatorFilter: (val: string) => void;
  engineerFilter: string;
  setEngineerFilter: (val: string) => void;
  tenderTypeFilter: string;
  setTenderTypeFilter: (val: string) => void;
  clearFilters: () => void;
  isAr: boolean;
}

export function TenderFilters({
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
  clearFilters,
  isAr,
}: TenderFiltersProps) {
  return (
    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* Universal Search Frame */}
        <TenderSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} isAr={isAr} />

        {/* Quick Clear controls */}
        <div className="flex flex-wrap items-center gap-2 text-[14px] font-sans">
          <button
            onClick={clearFilters}
            className="text-brand-red hover:underline font-bold cursor-pointer"
          >
            {isAr ? 'إعادة تعيين الفلاتر' : 'Clear Filters'}
          </button>
        </div>
      </div>

      {/* Multi-Parameter Filter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-100 select-none">
        <div>
          <label className="text-[14px] uppercase font-bold text-gray-400 block mb-1.5">
            {isAr ? 'حالة الملف الفني' : 'Project Status'}
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-[14px] text-gray-600 font-bold focus:outline-none focus:ring-4 focus:ring-brand-navy/5 w-full cursor-pointer"
          >
            <option value="all">{isAr ? 'حالة الملف: الكل' : 'All Status'}</option>
            <option value="Ready for Submittal">Ready for Submittal</option>
            <option value="Preparing Proposal">Preparing Proposal</option>
            <option value="Submitted">Submitted</option>
            <option value="Reviewing Scope">Reviewing Scope</option>
          </select>
        </div>

        <div>
          <label className="text-[14px] uppercase font-bold text-gray-400 block mb-1.5">
            {isAr ? 'حالة السجل بالجدول' : 'Record Status'}
          </label>
          <select
            value={recordFilter}
            onChange={e => setRecordFilter(e.target.value)}
            className="bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-[14px] text-gray-600 font-bold focus:outline-none focus:ring-4 focus:ring-brand-navy/5 w-full cursor-pointer"
          >
            <option value="all">{isAr ? 'سجلات: الكل' : 'All Records'}</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="text-[14px] uppercase font-bold text-gray-400 block mb-1.5">
            {isAr ? 'الموقع الإقليمي' : 'Location'}
          </label>
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-[14px] text-gray-600 font-bold focus:outline-none focus:ring-4 focus:ring-brand-navy/5 w-full cursor-pointer"
          >
            <option value="all">{isAr ? 'الموقع: الكل' : 'All Locations'}</option>
            <option value="NEOM font-sans">NEOM</option>
            <option value="Riyadh">Riyadh</option>
            <option value="Dubai">Dubai</option>
            <option value="Cairo">Cairo</option>
          </select>
        </div>

        <div>
          <label className="text-[14px] uppercase font-bold text-gray-400 block mb-1.5">
            {isAr ? 'المنسق' : 'Coordinator'}
          </label>
          <select
            value={coordinatorFilter}
            onChange={e => setCoordinatorFilter(e.target.value)}
            className="bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-[14px] text-gray-600 font-bold focus:outline-none focus:ring-4 focus:ring-brand-navy/5 w-full cursor-pointer"
          >
            <option value="all">{isAr ? 'المنسقين: الكل' : 'All Coordinators'}</option>
            <option value="Eng. Khalid Al-Saeed">Eng. Khalid Al-Saeed</option>
            <option value="Eng. Sherif Amin">Eng. Sherif Amin</option>
            <option value="Eng. Ramy Fawzy">Eng. Ramy Fawzy</option>
            <option value="Eng. Yasmin Omar">Eng. Yasmin Omar</option>
          </select>
        </div>

        <div>
          <label className="text-[14px] uppercase font-bold text-gray-400 block mb-1.5">
            {isAr ? 'مهندس العقود' : 'Contracts Eng'}
          </label>
          <select
            value={engineerFilter}
            onChange={e => setEngineerFilter(e.target.value)}
            className="bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-[14px] text-gray-600 font-bold focus:outline-none focus:ring-4 focus:ring-brand-navy/5 w-full cursor-pointer"
          >
            <option value="all">{isAr ? 'مهندس العقود: الكل' : 'All Engineers'}</option>
            <option value="Ahmed Mostafa">Ahmed Mostafa</option>
            <option value="Khaled Hassan">Khaled Hassan</option>
            <option value="Fatma Amer">Fatma Amer</option>
            <option value="Salim Mansoor">Salim Mansoor</option>
          </select>
        </div>

        <div>
          <label className="text-[14px] uppercase font-bold text-gray-400 block mb-1.5">
            {isAr ? 'نوع المزايدة' : 'Tender Type'}
          </label>
          <select
            value={tenderTypeFilter}
            onChange={e => setTenderTypeFilter(e.target.value)}
            className="bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-[14px] text-gray-600 font-bold focus:outline-none focus:ring-4 focus:ring-brand-navy/5 w-full cursor-pointer"
          >
            <option value="all">{isAr ? 'الأنواع: الكل' : 'All Types'}</option>
            <option value="Design & Build">Design & Build</option>
            <option value="EPC Contract">EPC Contract</option>
            <option value="Lump Sum Turnkey">Lump Sum Turnkey</option>
          </select>
        </div>
      </div>
    </div>
  );
}
