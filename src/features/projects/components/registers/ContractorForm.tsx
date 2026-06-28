import React, { useState } from 'react';
import { Contractor } from '../../../../domain/master/MasterData';

interface ContractorFormProps {
  initialData?: Contractor;
  isAr: boolean;
  onSave: (data: Contractor) => void;
  onCancel: () => void;
}

export function ContractorForm({ initialData, isAr, onSave, onCancel }: ContractorFormProps) {
  const [code, setCode] = useState(initialData?.code || `CTR-${Math.floor(Math.random() * 900) + 100}`);
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [companyNameAr, setCompanyNameAr] = useState(initialData?.companyNameAr || '');
  const [trade, setTrade] = useState(initialData?.trade || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [country, setCountry] = useState(initialData?.country || 'Saudi Arabia');
  const [commercialContact, setCommercialContact] = useState(initialData?.commercialContact || '');
  const [technicalContact, setTechnicalContact] = useState(initialData?.technicalContact || '');
  const [vendorNumber, setVendorNumber] = useState(initialData?.vendorNumber || '');
  const [taxNumber, setTaxNumber] = useState(initialData?.taxNumber || '');
  const [commercialRegistration, setCommercialRegistration] = useState(initialData?.commercialRegistration || '');
  const [status, setStatus] = useState<'Active' | 'Under Review' | 'Suspended'>(initialData?.status || 'Active');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: { [key: string]: string } = {};

    if (!companyName.trim()) {
      tempErrors.company = isAr ? 'اسم الشركة بالإنجليزية إلزامي' : 'English Company Name is required';
    }
    if (!trade.trim()) {
      tempErrors.trade = isAr ? 'التخصص الإنشائي مطلوب' : 'Construction Trade is required';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    onSave({
      id: initialData?.id || `ctr-${Date.now()}`,
      code,
      companyName,
      companyNameAr: companyNameAr.trim() ? companyNameAr : undefined,
      trade,
      email,
      phone,
      country,
      commercialContact,
      technicalContact,
      vendorNumber: vendorNumber || `VEND-${Date.now().toString().slice(-4)}`,
      taxNumber,
      commercialRegistration,
      status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-sm space-y-5 animate-in slide-in-from-top-2 duration-200">
      <h3 className="text-sm font-extrabold text-brand-navy dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-850">
        {initialData ? (isAr ? 'تعديل بيانات المنشأة' : 'Edit Company Master') : (isAr ? 'تسجيل منشأة جديدة' : 'Register New Enterprise / Contractor')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'كود المنشأة' : 'Entity Code'}</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'اسم الشركة (EN) - مطلوب' : 'Company Name (EN) *'}</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={`w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-lg focus:outline-none ${errors.company ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-brand-red'}`}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'اسم الشركة (AR) - اختياري' : 'Company Name (AR)'}</label>
          <input
            type="text"
            value={companyNameAr}
            onChange={(e) => setCompanyNameAr(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'التخصص الفني الإنشائي' : 'Technical Trade *'}</label>
          <input
            type="text"
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className={`w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-lg focus:outline-none ${errors.trade ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-brand-red'}`}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'البريد الإلكتروني' : 'Commercial Email'}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رقم الهاتف' : 'Contact Phone'}</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الدولة / المقر الرئيسي' : 'Country / HQ'}</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المسؤول التجاري' : 'Commercial Contact'}</label>
          <input
            type="text"
            value={commercialContact}
            onChange={(e) => setCommercialContact(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المسؤول الفني' : 'Technical Director'}</label>
          <input
            type="text"
            value={technicalContact}
            onChange={(e) => setTechnicalContact(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رقم السجل التجاري' : 'CR Registration'}</label>
          <input
            type="text"
            value={commercialRegistration}
            onChange={(e) => setCommercialRegistration(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الرقم الضريبي VAT' : 'Tax ID (VAT)'}</label>
          <input
            type="text"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'حالة الاعتماد' : 'Verification Status'}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
          >
            <option value="Active">{isAr ? 'نشط معتمد' : 'Verified Active'}</option>
            <option value="Under Review">{isAr ? 'تحت التدقيق والتقييم' : 'Under Review'}</option>
            <option value="Suspended">{isAr ? 'موقوف مؤقتاً' : 'Suspended'}</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-850">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
        >
          {isAr ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          {isAr ? 'حفظ البيانات' : 'Save Details'}
        </button>
      </div>
    </form>
  );
}
