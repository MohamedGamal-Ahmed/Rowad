import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, ArrowLeft, ArrowRight, Plus, UserCheck, 
  Mail, Phone, ShieldCheck, FileCheck, Landmark, ListPlus, Users,
  Search, Archive, RotateCcw, CheckCircle, AlertTriangle, PenTool,
  Trash2, Edit3, Circle, Filter, ArrowUpDown
} from 'lucide-react';
import { MasterDataRepository } from '../../../repositories/MasterDataRepository';
import { Contractor, Client, Employer, Consultant, ScopeOfWork, Currency, Country, Department, DocumentType, ContractType } from '../../../domain/master/MasterData';
import { ContractorForm } from './registers/ContractorForm';

interface MasterRegistersProps {
  lang: 'ar' | 'en';
  onBack: () => void;
}

interface RegisterConfig {
  key: string;
  labelEn: string;
  labelAr: string;
  hasCode: boolean;
  hasSymbol?: boolean;
  isCompany?: boolean;
  icon: any;
}

export function MasterRegisters({
  lang,
  onBack
}: MasterRegistersProps) {
  const isAr = lang === 'ar';
  const repo = new MasterDataRepository();

  const ArrowIcon = isAr ? ArrowRight : ArrowLeft;

  // Configuration of all 16 registers requested by business specifications
  const REGISTERS: RegisterConfig[] = useMemo(() => [
    { key: 'master_clients', labelEn: 'Clients Register', labelAr: 'سجل العملاء', hasCode: true, icon: UserCheck },
    { key: 'master_employers', labelEn: 'Employers Master', labelAr: 'أصحاب العمل والجهات المالكة', hasCode: true, icon: Landmark },
    { key: 'master_consultants', labelEn: 'Consultants Register', labelAr: 'الاستشاريون الهندسيون', hasCode: true, icon: ShieldCheck },
    { key: 'master_contractors', labelEn: 'Contractors Master', labelAr: 'سجل المقاولين المعتمدين', hasCode: true, isCompany: true, icon: Users },
    { key: 'master_subcontractors', labelEn: 'Subcontractors', labelAr: 'المقاولون من الباطن', hasCode: true, isCompany: true, icon: Users },
    { key: 'master_departments', labelEn: 'Departments Register', labelAr: 'الأقسام الإدارية والتشغيلية', hasCode: false, icon: Building2 },
    { key: 'master_businessunits', labelEn: 'Business Units', labelAr: 'قطاعات الأعمال', hasCode: true, icon: Landmark },
    { key: 'master_disciplines', labelEn: 'Disciplines', labelAr: 'التخصصات الهندسية', hasCode: true, icon: ListPlus },
    { key: 'master_countries', labelEn: 'Countries', labelAr: 'سجل الدول والبلدان', hasCode: true, icon: Landmark },
    { key: 'master_currencies', labelEn: 'Currencies Master', labelAr: 'سجل العملات والرموز', hasCode: true, hasSymbol: true, icon: Landmark },
    { key: 'master_scopes', labelEn: 'Scopes of Work', labelAr: 'نطاقات الأعمال الهندسية', hasCode: true, icon: ListPlus },
    { key: 'master_meetingtypes', labelEn: 'Meeting Types', labelAr: 'أنواع وقوالب الاجتماعات', hasCode: true, icon: Users },
    { key: 'master_doctypes', labelEn: 'Document Types', labelAr: 'تصنيفات مستندات المشروع', hasCode: false, icon: FileCheck },
    { key: 'master_statuses', labelEn: 'Workflow Statuses', labelAr: 'حالات السجلات والمعاملات', hasCode: true, icon: CheckCircle },
    { key: 'master_claimtypes', labelEn: 'Claim Types', labelAr: 'أنواع المطالبات التعاقدية', hasCode: true, icon: AlertTriangle },
    { key: 'master_votypes', labelEn: 'Variation Order Types', labelAr: 'أنواع الأوامر التغييرية', hasCode: true, icon: PenTool },
    { key: 'master_noctypes', labelEn: 'NOC Types', labelAr: 'أنواع تصاريح الممانعة', hasCode: true, icon: FileCheck },
    { key: 'master_ipctypes', labelEn: 'IPC Payment Types', labelAr: 'قوالب الدفعات والمستخلصات', hasCode: true, icon: Landmark },
  ], []);

  // Main UI States
  const [selectedReg, setSelectedReg] = useState<RegisterConfig>(REGISTERS[0]);
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ [key: string]: number }>({});
  
  // Search, sorting and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Archived'>('All');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'status'>('name');

  // Form handling
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Simple record form inputs
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Reload current register items and calculate counts for all registers
  const loadRegisterData = async () => {
    try {
      // 1. Load active register items
      const fetchedItems = await repo.getRegister(selectedReg.key);
      
      // Ensure status exists
      const sanitized = fetchedItems.map((item: any) => ({
        status: 'Active', // Default status for legacy seeded baselines
        ...item
      }));
      setItems(sanitized);

      // 2. Load counts for all 16 registers
      const tempCounts: { [key: string]: number } = {};
      for (const reg of REGISTERS) {
        const list = await repo.getRegister(reg.key);
        tempCounts[reg.key] = list.length;
      }
      setCounts(tempCounts);
    } catch (e) {
      console.error('Failed to load registers', e);
    }
  };

  useEffect(() => {
    loadRegisterData();
    // Close form on register shift
    setShowForm(false);
    setEditingItem(null);
    setSearchQuery('');
    setFormErrors({});
  }, [selectedReg]);

  // Handle generic form submit
  const handleSaveSimpleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (selectedReg.hasCode && !formCode.trim()) {
      errors.code = isAr ? 'الكود التعريفي مطلوب' : 'Record Code is required';
    }
    if (!formName.trim()) {
      errors.name = isAr ? 'الاسم الإنجليزي مطلوب' : 'English Name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newItem = {
      id: editingItem?.id || `reg-${Date.now()}`,
      code: selectedReg.hasCode ? formCode.trim().toUpperCase() : undefined,
      name: formName.trim(),
      nameAr: formNameAr.trim() ? formNameAr.trim() : undefined,
      symbol: selectedReg.hasSymbol ? formSymbol.trim() : undefined,
      status: editingItem?.status || 'Active'
    };

    const success = await repo.saveRegister(selectedReg.key, newItem);
    if (success) {
      setShowForm(false);
      setEditingItem(null);
      setFormCode('');
      setFormName('');
      setFormNameAr('');
      setFormSymbol('');
      setFormErrors({});
      loadRegisterData();
    }
  };

  // Trigger Edit Mode
  const startEdit = (item: any) => {
    setEditingItem(item);
    if (!selectedReg.isCompany) {
      setFormCode(item.code || '');
      setFormName(item.name || '');
      setFormNameAr(item.nameAr || '');
      setFormSymbol(item.symbol || '');
    }
    setShowForm(true);
  };

  // Actions: Archive, Restore, Activate, Deactivate
  const handleUpdateStatus = async (item: any, newStatus: 'Active' | 'Inactive' | 'Archived') => {
    const updated = { ...item, status: newStatus };
    const success = await repo.saveRegister(selectedReg.key, updated);
    if (success) {
      loadRegisterData();
    }
  };

  // Filter & Sort list
  const processedItems = useMemo(() => {
    let result = [...items];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        const itemCode = String(item.code || '').toLowerCase();
        const itemName = String(item.name || item.companyName || '').toLowerCase();
        const itemNameAr = String(item.nameAr || item.companyNameAr || '').toLowerCase();
        return itemCode.includes(q) || itemName.includes(q) || itemNameAr.includes(q);
      });
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortBy === 'code') {
        valA = a.code || '';
        valB = b.code || '';
      } else if (sortBy === 'status') {
        valA = a.status || '';
        valB = b.status || '';
      } else {
        valA = a.name || a.companyName || '';
        valB = b.name || b.companyName || '';
      }

      return valA.localeCompare(valB);
    });

    return result;
  }, [items, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header with back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-brand-navy rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowIcon className="w-4 h-4" />
          <span>{isAr ? 'العودة للمشاريع' : 'Back to Projects'}</span>
        </button>
        <h2 className="text-xl font-black text-brand-navy dark:text-slate-100 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-brand-red shrink-0" />
          <span>{isAr ? 'السجلات والقوالب الموحدة' : 'Centralized Master Registers'}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Register Directory List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 lg:col-span-1 max-h-[700px] overflow-y-auto sticky top-5 sticky-scrollbar">
          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-850">
            {isAr ? 'مستودع السجلات والمتحكمات' : 'System Masters Directory'}
          </div>
          <div className="space-y-1">
            {REGISTERS.map((reg) => {
              const RegIcon = reg.icon;
              const isSelected = selectedReg.key === reg.key;
              return (
                <button
                  key={reg.key}
                  onClick={() => setSelectedReg(reg)}
                  className={`w-full text-left rtl:text-right flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-brand-red/5 dark:bg-brand-red/10 border-l-2 border-brand-red text-brand-red font-bold' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RegIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-red' : 'text-slate-400'}`} />
                    <span className="truncate">{isAr ? reg.labelAr : reg.labelEn}</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-brand-red/10 text-brand-red' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    {counts[reg.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Grid with CRUD actions */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Main Action Header for Active Register */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-brand-navy dark:text-slate-100 uppercase tracking-wide">
                {isAr ? selectedReg.labelAr : selectedReg.labelEn}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'مكتب الإدخال والتحكم في السجلات النشطة والمنسقة والملغاة.' : 'Bilingual corporate record list with status transitions & history tracking.'}
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  if (!selectedReg.isCompany) {
                    setFormCode(selectedReg.hasCode ? `REG-${Math.floor(Math.random() * 900) + 100}` : '');
                    setFormName('');
                    setFormNameAr('');
                    setFormSymbol('');
                  }
                  setShowForm(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة بند جديد' : 'Create Record'}</span>
              </button>
            )}
          </div>

          {/* Render Active Form */}
          {showForm && (
            selectedReg.isCompany ? (
              <ContractorForm
                initialData={editingItem}
                isAr={isAr}
                onSave={async (savedData) => {
                  const success = await repo.saveRegister(selectedReg.key, savedData);
                  if (success) {
                    setShowForm(false);
                    setEditingItem(null);
                    loadRegisterData();
                  }
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
              />
            ) : (
              /* Simple Generic Master Record Form */
              <form onSubmit={handleSaveSimpleItem} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
                <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase border-b pb-2">
                  {editingItem ? (isAr ? 'تعديل السجل الحالي' : 'Modify Record Details') : (isAr ? 'إنشاء سجل نظامي جديد' : 'Add New Entry')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedReg.hasCode && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رمز الكود التعريفي' : 'Register Code *'}</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        className={`w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-lg focus:outline-none ${formErrors.code ? 'border-rose-500' : 'border-slate-200 dark:border-slate-850'}`}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الاسم بالإنجليزية (إلزامي)' : 'Name (English) *'}</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={`w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-lg focus:outline-none ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-850'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الاسم بالعربية (اختياري)' : 'Name (Arabic)'}</label>
                    <input
                      type="text"
                      value={formNameAr}
                      onChange={(e) => setFormNameAr(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none"
                    />
                  </div>

                  {selectedReg.hasSymbol && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الرمز (مثل د.إ، ر.س)' : 'Currency Symbol'}</label>
                      <input
                        type="text"
                        value={formSymbol}
                        onChange={(e) => setFormSymbol(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingItem(null); setFormErrors({}); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    {isAr ? 'حفظ' : 'Save Record'}
                  </button>
                </div>
              </form>
            )
          )}

          {/* ERP Toolbar: search, sorting, and status filter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              
              {/* Filter search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'البحث بالرمز أو الاسم...' : 'Search records by name or code...'}
                  className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red transition-all"
                />
              </div>

              {/* Status and Sort Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">{isAr ? 'ترشيح الحالة:' : 'Status:'}</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-brand-red"
                  >
                    <option value="All">{isAr ? 'الكل' : 'All States'}</option>
                    <option value="Active">{isAr ? 'نشط' : 'Active'}</option>
                    <option value="Inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
                    <option value="Archived">{isAr ? 'مؤرشف' : 'Archived'}</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">{isAr ? 'ترتيب:' : 'Sort:'}</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-brand-red"
                  >
                    <option value="name">{isAr ? 'الاسم' : 'Name'}</option>
                    {selectedReg.hasCode && <option value="code">{isAr ? 'الكود' : 'Code'}</option>}
                    <option value="status">{isAr ? 'الحالة' : 'Status'}</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive ERP Table Grid for Register Items */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto sticky-scrollbar">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-150 dark:border-slate-850">
                  <tr>
                    {selectedReg.hasCode && <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] w-28">{isAr ? 'الكود' : 'Code'}</th>}
                    <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">{isAr ? 'البيان (Bilingual)' : 'Description'}</th>
                    {selectedReg.hasSymbol && <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] w-20">{isAr ? 'الرمز' : 'Symbol'}</th>}
                    {selectedReg.isCompany && <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">{isAr ? 'التخصص والهاتف' : 'Trade & Phone'}</th>}
                    <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] w-28">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right rtl:text-left w-48">{isAr ? 'إجراءات السجل' : 'Record Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {processedItems.length > 0 ? (
                    processedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                        
                        {/* Code Column */}
                        {selectedReg.hasCode && (
                          <td className="p-3 font-mono font-bold text-slate-500 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px]">
                              {item.code || 'N/A'}
                            </span>
                          </td>
                        )}

                        {/* Description / Name Column */}
                        <td className="p-3">
                          <div className="font-extrabold text-slate-800 dark:text-slate-100">
                            {item.name || item.companyName}
                          </div>
                          {(item.nameAr || item.companyNameAr) && (
                            <div className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5">
                              {item.nameAr || item.companyNameAr}
                            </div>
                          )}
                          {selectedReg.isCompany && (
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {item.commercialContact && `Contact: ${item.commercialContact}`}
                            </div>
                          )}
                        </td>

                        {/* Currency Symbol Column */}
                        {selectedReg.hasSymbol && (
                          <td className="p-3 font-mono font-black text-brand-red text-xs">
                            {item.symbol || '—'}
                          </td>
                        )}

                        {/* Company Specific Column */}
                        {selectedReg.isCompany && (
                          <td className="p-3">
                            <div className="text-brand-red font-bold font-mono text-[10px] uppercase">{item.trade}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-mono">{item.email}</div>
                          </td>
                        )}

                        {/* Status Column */}
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            item.status === 'Inactive' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}>
                            {isAr ? {
                              'Active': 'نشط',
                              'Inactive': 'غير نشط',
                              'Archived': 'مؤرشف'
                            }[item.status || 'Active'] : (item.status || 'Active')}
                          </span>
                        </td>

                        {/* Actions buttons */}
                        <td className="p-3 text-right rtl:text-left whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit Action */}
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-350 dark:hover:bg-slate-800 rounded border border-slate-200/50 dark:border-slate-800 transition-all cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Activate / Deactivate Toggle */}
                            {item.status === 'Active' ? (
                              <button
                                onClick={() => handleUpdateStatus(item, 'Inactive')}
                                className="px-1.5 py-1 text-[10px] bg-amber-50/50 text-amber-600 hover:bg-amber-50 rounded border border-amber-100 transition-all cursor-pointer"
                                title="Deactivate Item"
                              >
                                {isAr ? 'تعطيل' : 'Deactivate'}
                              </button>
                            ) : (
                              item.status !== 'Archived' && (
                                <button
                                  onClick={() => handleUpdateStatus(item, 'Active')}
                                  className="px-1.5 py-1 text-[10px] bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-100 transition-all cursor-pointer"
                                  title="Activate Item"
                                >
                                  {isAr ? 'تنشيط' : 'Activate'}
                                </button>
                              )
                            )}

                            {/* Archive / Restore Toggle */}
                            {item.status === 'Archived' ? (
                              <button
                                onClick={() => handleUpdateStatus(item, 'Active')}
                                className="p-1.5 bg-blue-50/50 hover:bg-blue-50 text-blue-600 rounded border border-blue-100 transition-all cursor-pointer"
                                title="Restore Item"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(item, 'Archived')}
                                className="p-1.5 bg-rose-50/50 hover:bg-rose-50 text-rose-500 rounded border border-rose-100 transition-all cursor-pointer"
                                title="Archive Item"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        {isAr ? 'لا توجد سجلات مطابقة للمعايير المحددة.' : 'No master records matching search criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
