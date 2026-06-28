import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, FileText, Briefcase, FileSignature, Scale, X } from 'lucide-react';
import { BiText } from './BiText';

const searchDatabase = [
  { category: 'Projects', title: { en: 'Zayed Industrial Complex', ar: 'مجمع زايد الصناعي' }, desc: { en: 'Active • Ahmed Mostafa', ar: 'منفذ • أحمد مصطفى' }, type: 'project' },
  { category: 'Projects', title: { en: 'New Capital Hub', ar: 'مركز العاصمة الجديد' }, desc: { en: 'Pre-Award', ar: 'ما قبل الترسية' }, type: 'project' },
  { category: 'Projects', title: { en: 'Diriyah II - Boulevard', ar: 'البوليفارد بمدينة الدرعية' }, desc: { en: 'Delayed • Risk High', ar: 'متأخر • مخاطر عالية' }, type: 'project' },
  { category: 'Contracts', title: { en: 'Main Build Contract - Sector C', ar: 'عقد البناء الرئيسي - قطاع ج' }, desc: { en: 'Approved • Rowad Co.', ar: 'معتمد • شركة رواد' }, type: 'contract' },
  { category: 'Contracts', title: { en: 'Subcontract for Steel Works', ar: 'عقد باطن لأعمال الحديد' }, desc: { en: 'Under Review', ar: 'تحت المراجعة' }, type: 'contract' },
  { category: 'Claims', title: { en: 'EOT Claim #4 - Eastown', ar: 'طلب تمديد زمن رقم 4 - إيستاون' }, desc: { en: 'AED 4.2M Pending', ar: '4.2 مليون درهم معلق' }, type: 'claim' },
  { category: 'Claims', title: { en: 'Material Escalation Sector 2', ar: 'فروق أسعار توريدات القطاع الثاني' }, desc: { en: 'Approved • Sector 2', ar: 'معتمد • القطاع 2' }, type: 'claim' },
  { category: 'Documents', title: { en: 'Zayed Complex As-Builts.dwg', ar: 'المخططات التفصيلية لمجمع زايد' }, desc: { en: 'CAD Drawing • V3', ar: 'مخطط كاد • إصدار 3' }, type: 'document' },
  { category: 'Documents', title: { en: 'Project Financial Summary 2026.xlsx', ar: 'ملخص مالي للمشروع 2026' }, desc: { en: 'Spreadsheet • Compiled', ar: 'ملف إكسل • مجمع' }, type: 'document' }
];

export function Header({
  lang,
  onToggleLang
}: {
  lang: 'ar' | 'en';
  onToggleLang: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredResults = searchQuery.trim() === ''
    ? []
    : searchDatabase.filter(item => 
        item.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.ar.includes(searchQuery) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Group by category
  const categories = Array.from(new Set(filteredResults.map(r => r.category)));

  return (
    <header className="h-20 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-8 shadow-sm">
      {/* Search */}
      <div ref={containerRef} className="flex-1 max-w-2xl relative group">
        <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-gray-400 group-focus-within:text-brand-navy">
          <Search className="w-5 h-5" />
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={lang === 'ar' ? "البحث الشامل في المشاريع، العقود، المطالبات..." : "Global search projects, contracts, claims..."}
          className="w-full bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-white text-sm rounded-full py-2.5 ps-12 pe-24 focus:outline-none focus:ring-4 focus:ring-brand-navy/5 focus:border-brand-navy/20 focus:bg-white transition-all shadow-inner"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 end-14 flex items-center px-2 text-gray-400 hover:text-brand-red"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
           <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm hidden md:block">
             ⌘ K
           </span>
        </div>

        {/* Search Suggestion Dropdown */}
        {isOpen && searchQuery && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {filteredResults.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                {lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results found.'}
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map(cat => (
                  <div key={cat} className="space-y-1">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-gray-400 px-2">
                      {cat}
                    </h4>
                    {filteredResults.filter(r => r.category === cat).map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-brand-navy">
                          {item.type === 'project' ? <Briefcase className="w-4 h-4 text-brand-navy" /> : 
                           item.type === 'contract' ? <FileSignature className="w-4 h-4 text-emerald-600" /> :
                           item.type === 'claim' ? <Scale className="w-4 h-4 text-amber-500" /> :
                           <FileText className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-brand-navy truncate">
                            {lang === 'ar' ? item.title.ar : item.title.en}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">
                            {lang === 'ar' ? item.desc.ar : item.desc.en}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-6 ms-auto">
        {/* Language Toggle */}
        <button 
          onClick={onToggleLang}
          className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
        >
          <span className={`text-xs font-bold ${lang === 'en' ? 'text-brand-red underline underline-offset-4' : 'text-gray-400'}`}>EN</span>
          <span className="text-xs font-bold text-brand-navy">|</span>
          <span className={`text-xs font-bold font-arabic ${lang === 'ar' ? 'text-brand-red underline underline-offset-4' : 'text-gray-400'}`}>AR</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-brand-navy hover:bg-gray-100 rounded-full transition-all">
          <Bell className="w-5 h-5" strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full border border-white"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center space-x-3 cursor-pointer border-l rtl:border-r rtl:border-l-0 pl-6 rtl:pr-6 rtl:pl-0 border-gray-200">
          <div className="text-right rtl:text-left hidden md:block">
            <BiText 
              text={{ en: "Ahmed Mostafa", ar: "أحمد مصطفى" }} 
              primaryLang={lang} 
              className="text-right rtl:text-left"
              primaryClassName="text-xs font-bold text-gray-900"
              secondaryClassName="text-[10px] text-gray-500 font-medium"
            />
          </div>
          <img 
            src="https://i.pravatar.cc/150?u=ahmed" 
            alt="Ahmed Mostafa" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
          />
        </div>
      </div>
    </header>
  );
}
