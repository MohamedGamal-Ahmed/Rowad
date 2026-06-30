import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, ArrowRight, Building2, HelpCircle } from 'lucide-react';
import { Project } from '../../../domain/projects/Project';
import { MasterDataRepository } from '../../../repositories/MasterDataRepository';
import { SearchableAutocomplete } from '../../../components/SearchableAutocomplete';
import { RecordStatus } from '../../../enums/RecordStatus';

interface AddProjectProps {
  lang: 'ar' | 'en';
  mode: 'create' | 'edit' | 'view';
  entity?: Project | null;
  onSave: (project: Project) => void;
  onCancel: () => void;
}

export function AddProject({
  lang,
  mode,
  entity,
  onSave,
  onCancel
}: AddProjectProps) {
  const isAr = lang === 'ar';
  const repo = new MasterDataRepository();

  // Form State
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [client, setClient] = useState('');
  const [employer, setEmployer] = useState('');
  const [consultant, setConsultant] = useState('');
  const [mainContractor, setMainContractor] = useState('');
  const [contractType, setContractType] = useState('');
  const [signedContractValue, setSignedContractValue] = useState(0);
  const [currency, setCurrency] = useState('EGP');
  const [country, setCountry] = useState('Egypt');
  const [city, setCity] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [coordinator, setCoordinator] = useState('');
  const [department, setDepartment] = useState('Infrastructure');
  const [startDate, setStartDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [status, setStatus] = useState<'Active' | 'Pre-Award' | 'Completed' | 'Closed'>('Active');
  const [description, setDescription] = useState('');

  // Master Lists (Loaded dynamically)
  const [clients, setClients] = useState<{ id: string; code: string; name: string }[]>([]);
  const [employers, setEmployers] = useState<{ id: string; code: string; name: string }[]>([]);
  const [consultants, setConsultants] = useState<{ id: string; code: string; name: string }[]>([]);
  const [contractors, setContractors] = useState<{ id: string; code: string; name: string }[]>([]);
  const [currencies, setCurrencies] = useState<{ id: string; code: string; name: string }[]>([]);
  const [countries, setCountries] = useState<{ id: string; code: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; code: string; name: string }[]>([]);
  const [contractTypes, setContractTypes] = useState<{ id: string; code: string; name: string }[]>([]);

  // Errors State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    async function loadMasters() {
      const cls = await repo.getClients();
      setClients(cls.map(c => ({ id: c.name, code: c.code, name: isAr && c.nameAr ? c.nameAr : c.name })));

      const emps = await repo.getEmployers();
      setEmployers(emps.map(e => ({ id: e.name, code: e.code, name: isAr && e.nameAr ? e.nameAr : e.name })));

      const cons = await repo.getConsultants();
      setConsultants(cons.map(c => ({ id: c.name, code: c.code, name: isAr && c.nameAr ? c.nameAr : c.name })));

      const ctrs = await repo.getContractors();
      setContractors(ctrs.map(c => ({ id: c.companyName, code: c.code, name: isAr && c.companyNameAr ? c.companyNameAr : c.companyName })));

      const currs = await repo.getCurrencies();
      setCurrencies(currs.map(c => ({ id: c.code, code: c.code, name: `${c.name} (${c.symbol})` })));

      const cnts = await repo.getCountries();
      setCountries(cnts.map(c => ({ id: c.name, code: c.code, name: isAr && c.nameAr ? c.nameAr : c.name })));

      const depts = await repo.getDepartments();
      setDepartments(depts.map(d => ({ id: d.name, code: 'DEPT', name: isAr && d.nameAr ? d.nameAr : d.name })));

      const cts = await repo.getContractTypes();
      setContractTypes(cts.map(ct => ({ id: ct.name, code: 'TYPE', name: isAr && ct.nameAr ? ct.nameAr : ct.name })));
    }
    loadMasters();

    if (mode === 'create') {
      setCode(`PRJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`);
    }
  }, [lang, mode]);

  useEffect(() => {
    if (entity && (mode === 'edit' || mode === 'view')) {
      setCode(entity.code || '');
      setNameEn(entity.nameEn || '');
      setNameAr(entity.nameAr || '');
      setClient(entity.client || '');
      setEmployer(entity.employer || '');
      setConsultant(entity.consultant || '');
      setMainContractor(entity.mainContractor || '');
      setContractType(entity.contractType || '');
      setSignedContractValue(entity.signedContractValue || 0);
      setCurrency(entity.currency || 'EGP');
      setCountry(entity.country || 'Egypt');
      setCity(entity.city || '');
      setProjectManager(entity.projectManager || '');
      setCoordinator(entity.coordinator || '');
      setDepartment(entity.department || 'Infrastructure');
      setStartDate(entity.startDate || '');
      setCompletionDate(entity.completionDate || '');
      setStatus(entity.status || 'Active');
      setDescription(entity.description || '');
    }
  }, [entity, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!code.trim()) newErrors.code = isAr ? 'كود المشروع مطلوب' : 'Project Code is required';
    if (!nameEn.trim()) newErrors.nameEn = isAr ? 'اسم المشروع بالإنجليزية مطلوب' : 'English Project Name is required';
    if (!client) newErrors.client = isAr ? 'العميل مطلوب' : 'Client is required';
    if (!employer) newErrors.employer = isAr ? 'صاحب العمل مطلوب' : 'Employer is required';
    if (!consultant) newErrors.consultant = isAr ? 'الاستشاري مطلوب' : 'Consultant is required';
    if (!mainContractor) newErrors.mainContractor = isAr ? 'المقاول الرئيسي مطلوب' : 'Main Contractor is required';
    if (!startDate) newErrors.startDate = isAr ? 'تاريخ البدء مطلوب' : 'Start Date is required';
    if (!completionDate) newErrors.completionDate = isAr ? 'تاريخ الانتهاء مطلوب' : 'Completion Date is required';
    if (signedContractValue <= 0) newErrors.signedContractValue = isAr ? 'قيمة العقد يجب أن تكون أكبر من صفر' : 'Contract Value must be greater than zero';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const project: Project = {
      id: entity?.id || `p-${Date.now()}`,
      recordStatus: entity?.recordStatus || RecordStatus.ACTIVE,
      auditInfo: entity?.auditInfo || {
        createdBy: 'System',
        createdAt: new Date().toISOString()
      },
      code,
      nameEn,
      nameAr: nameAr.trim() ? nameAr : undefined,
      client,
      employer,
      consultant,
      mainContractor,
      contractType,
      signedContractValue,
      revisedContractValue: signedContractValue + (entity?.approvedVariationTotal ?? 0),
      approvedVariationTotal: entity ? entity.approvedVariationTotal : 0,
      approvedEotDays: entity ? entity.approvedEotDays : 0,
      currency,
      country,
      city,
      projectManager,
      coordinator,
      department,
      businessUnit: entity?.businessUnit || (department + " Unit"),
      startDate,
      completionDate,
      status,
      lifecycleStage: status === 'Active' ? 'Execution' : (status === 'Pre-Award' ? 'Pre-Award' : (status === 'Completed' ? 'Closing' : 'Archived')),
      description: description.trim() ? description : undefined,
      settings: entity?.settings
    };

    onSave(project);
  };

  const ArrowIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-brand-navy rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowIcon className="w-4 h-4" />
          <span>{isAr ? 'العودة للمشاريع' : 'Back to Projects'}</span>
        </button>
        <h2 className="text-xl font-black text-brand-navy dark:text-slate-100">
          {mode === 'view' 
            ? (isAr ? 'تفاصيل المشروع' : 'Project Details')
            : mode === 'edit'
              ? (isAr ? 'تعديل بيانات المشروع' : 'Edit Project Details')
              : (isAr ? 'إضافة مشروع جديد للمحفظة' : 'Add New Portfolio Project')}
        </h2>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-8">
        
        {/* Basic Info Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-brand-navy dark:text-brand-red border-b pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>{isAr ? 'المعلومات التعريفية للمشروع' : 'Project Identity & Profile'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'كود المشروع (مطلوب)' : 'Project Code (Required)'}
              </label>
              <input
                disabled={mode === 'view'}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none ${
                  errors.code ? 'border-rose-500 ring-1 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-brand-red'
                }`}
              />
              {errors.code && <p className="text-[10px] text-rose-500 font-bold">{errors.code}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'حالة التشغيل' : 'Initial Status'}
              </label>
              <select
                disabled={mode === 'view'}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red"
              >
                <option value="Active">{isAr ? 'نشط (تحت التنفيذ)' : 'Active (Under Execution)'}</option>
                <option value="Pre-Award">{isAr ? 'قبل الترسية (بانتظار العقد)' : 'Pre-Award (Under Tendering)'}</option>
                <option value="Completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                <option value="Closed">{isAr ? 'مغلق' : 'Closed'}</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'اسم المشروع بالإنجليزية (مطلوب)' : 'Project Name (English) - Required'}
              </label>
              <input
                disabled={mode === 'view'}
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Neom Expansion Zone C"
                className={`w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none ${
                  errors.nameEn ? 'border-rose-500 ring-1 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-brand-red'
                }`}
              />
              {errors.nameEn && <p className="text-[10px] text-rose-500 font-bold">{errors.nameEn}</p>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'اسم المشروع بالعربية (اختياري)' : 'Project Name (Arabic) - Optional'}
              </label>
              <input
                disabled={mode === 'view'}
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: مشروع توسعة نيوم - المنطقة ج"
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red"
              />
            </div>

          </div>
        </div>

        {/* Master Relationships Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-brand-navy dark:text-brand-red border-b pb-2">
            {isAr ? 'أطراف المشروع ومرجعيات البيانات' : 'Project Stakeholders & Master Data'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1">
              <SearchableAutocomplete
                disabled={mode === 'view'}
                options={clients}
                selectedValue={client}
                onSelect={(val) => setClient(val)}
                label={isAr ? 'العميل' : 'Client'}
                placeholder={isAr ? 'اختر العميل...' : 'Select Client...'}
              />
              {errors.client && <p className="text-[10px] text-rose-500 font-bold">{errors.client}</p>}
            </div>

            <div className="space-y-1">
              <SearchableAutocomplete
                disabled={mode === 'view'}
                options={employers}
                selectedValue={employer}
                onSelect={(val) => setEmployer(val)}
                label={isAr ? 'صاحب العمل' : 'Employer / Owner'}
                placeholder={isAr ? 'اختر صاحب العمل...' : 'Select Employer...'}
              />
              {errors.employer && <p className="text-[10px] text-rose-500 font-bold">{errors.employer}</p>}
            </div>

            <div className="space-y-1">
              <SearchableAutocomplete
                disabled={mode === 'view'}
                options={consultants}
                selectedValue={consultant}
                onSelect={(val) => setConsultant(val)}
                label={isAr ? 'الاستشاري الهندسي' : 'Consultant'}
                placeholder={isAr ? 'اختر الاستشاري...' : 'Select Consultant...'}
              />
              {errors.consultant && <p className="text-[10px] text-rose-500 font-bold">{errors.consultant}</p>}
            </div>

            <div className="space-y-1">
              <SearchableAutocomplete
                disabled={mode === 'view'}
                options={contractors}
                selectedValue={mainContractor}
                onSelect={(val) => setMainContractor(val)}
                label={isAr ? 'المقاول الرئيسي للمشروع' : 'Main Contractor'}
                placeholder={isAr ? 'اختر المقاول الرئيسي...' : 'Select Main Contractor...'}
              />
              {errors.mainContractor && <p className="text-[10px] text-rose-500 font-bold">{errors.mainContractor}</p>}
            </div>

            <div className="space-y-1">
              <SearchableAutocomplete
                disabled={mode === 'view'}
                options={departments}
                selectedValue={department}
                onSelect={(val) => setDepartment(val)}
                label={isAr ? 'القسم التشغيلي' : 'Department'}
                placeholder={isAr ? 'اختر القسم...' : 'Select Department...'}
              />
            </div>

            <div className="space-y-1">
              <SearchableAutocomplete
                disabled={mode === 'view'}
                options={contractTypes}
                selectedValue={contractType}
                onSelect={(val) => setContractType(val)}
                label={isAr ? 'نوع العقد الإنشائي' : 'Contract Type'}
                placeholder={isAr ? 'اختر نوع العقد...' : 'Select Contract Type...'}
              />
            </div>

          </div>
        </div>

        {/* Commercials, Schedule & Geography */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-brand-navy dark:text-brand-red border-b pb-2">
            {isAr ? 'القيم المالية والموقع والتواريخ' : 'Commercials, Schedule & Geography'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'قيمة العقد الإجمالية التأسيسية' : 'Initial Signed Contract Value'}
              </label>
              <input
                disabled={mode === 'view'}
                type="number"
                value={signedContractValue || ''}
                onChange={(e) => setSignedContractValue(Number(e.target.value))}
                placeholder="e.g. 1500000"
                className={`w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none ${
                  errors.signedContractValue ? 'border-rose-500 ring-1 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-brand-red'
                }`}
              />
              {errors.signedContractValue && <p className="text-[10px] text-rose-500 font-bold">{errors.signedContractValue}</p>}
            </div>

            <div className="space-y-1">
              <SearchableAutocomplete
                disabled={mode === 'view'}
                options={currencies}
                selectedValue={currency}
                onSelect={(val) => setCurrency(val)}
                label={isAr ? 'عملة التقديم والعقد' : 'Currency'}
                placeholder="Select Currency..."
              />
            </div>

            <div className="space-y-1">
              <SearchableAutocomplete
                disabled={mode === 'view'}
                options={countries}
                selectedValue={country}
                onSelect={(val) => setCountry(val)}
                label={isAr ? 'الدولة' : 'Country'}
                placeholder="Select Country..."
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'المدينة / المنطقة' : 'City / Region'}
              </label>
              <input
                disabled={mode === 'view'}
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Riyadh, New Cairo"
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'تاريخ البدء (مطلوب)' : 'Commencement Date (Required)'}
              </label>
              <input
                disabled={mode === 'view'}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none ${
                  errors.startDate ? 'border-rose-500 ring-1 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-brand-red'
                }`}
              />
              {errors.startDate && <p className="text-[10px] text-rose-500 font-bold">{errors.startDate}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'تاريخ الانتهاء المخطط (مطلوب)' : 'Target Completion Date (Required)'}
              </label>
              <input
                disabled={mode === 'view'}
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className={`w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none ${
                  errors.completionDate ? 'border-rose-500 ring-1 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-brand-red'
                }`}
              />
              {errors.completionDate && <p className="text-[10px] text-rose-500 font-bold">{errors.completionDate}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'مدير المشروع الرئيسي' : 'Project Manager (PM)'}
              </label>
              <input
                disabled={mode === 'view'}
                type="text"
                value={projectManager}
                onChange={(e) => setProjectManager(e.target.value)}
                placeholder="e.g. Eng. Sherif Kamel"
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'منسق المشروع التنفيذي' : 'Project Coordinator'}
              </label>
              <input
                disabled={mode === 'view'}
                type="text"
                value={coordinator}
                onChange={(e) => setCoordinator(e.target.value)}
                placeholder="e.g. Ahmed Mansour"
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red"
              />
            </div>

          </div>
        </div>

        {/* Description Textarea */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isAr ? 'الوصف الفني للمشروع ونطاق الأعمال' : 'Technical Description & Works Scope'}
          </label>
          <textarea
            disabled={mode === 'view'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={isAr ? 'اكتب ملخصاً لنطاق أعمال العقد والتفاصيل الأساسية هنا...' : 'Provide a high level brief of the scope of works and physical constraints...'}
            className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {mode === 'view' ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'إلغاء' : 'Cancel')}
          </button>
          {mode !== 'view' && (
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-red/10 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {mode === 'edit'
                  ? (isAr ? 'حفظ التغييرات' : 'Save Changes')
                  : (isAr ? 'حفظ وتسجيل المشروع' : 'Save & Register Project')}
              </span>
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
