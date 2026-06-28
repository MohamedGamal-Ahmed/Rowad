import React from 'react';
import { X } from 'lucide-react';

interface TenderSearchProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isAr: boolean;
}

export function TenderSearch({ searchQuery, setSearchQuery, isAr }: TenderSearchProps) {
  return (
    <div className="relative w-full lg:max-w-md">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={isAr ? "ابحث برمز المشروع، أو الكود، أو المنسق، أو المهندس..." : "Search Project Code, Tender #, Coordinator, Eng..."}
        className="w-full bg-gray-50 border border-gray-150 focus:border-brand-navy rounded-2xl py-3.5 pl-5 pr-12 rtl:pr-5 rtl:pl-12 text-[14px] text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-navy/5 focus:bg-white transition-all animate-all shadow-inner"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute inset-y-0 right-3 ltr:right-3 rtl:left-3 rtl:right-auto flex items-center px-2 text-gray-400 hover:text-brand-red text-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
