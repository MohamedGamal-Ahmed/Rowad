export interface Client {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
}

export interface Employer {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
}

export interface Consultant {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
}

export interface Contractor {
  id: string;
  code: string;
  companyName: string;
  companyNameAr?: string;
  trade: string;
  email: string;
  phone: string;
  country: string;
  commercialContact: string;
  technicalContact: string;
  vendorNumber: string;
  taxNumber: string;
  commercialRegistration: string;
  status: 'Active' | 'Under Review' | 'Suspended';
}

export interface ScopeOfWork {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
}

export interface Currency {
  id: string;
  code: string; // e.g. 'AED', 'SAR', 'EGP', 'USD'
  name: string;
  symbol: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
}

export interface Department {
  id: string;
  name: string;
  nameAr?: string;
}

export interface DocumentType {
  id: string;
  name: string;
  nameAr?: string;
}

export interface ContractType {
  id: string;
  name: string;
  nameAr?: string;
}

export const baselineScopes: ScopeOfWork[] = [
  { id: 'sc-1', code: 'CIV', name: 'Civil', nameAr: 'أعمال مدنية' },
  { id: 'sc-2', code: 'ARC', name: 'Architectural', nameAr: 'أعمال معمارية' },
  { id: 'sc-3', code: 'INF', name: 'Infrastructure', nameAr: 'أعمال البنية التحتية' },
  { id: 'sc-4', code: 'RDS', name: 'Roads', nameAr: 'أعمال الطرق' },
  { id: 'sc-5', code: 'UTL', name: 'Utilities', nameAr: 'الخدمات والمرافق' },
  { id: 'sc-6', code: 'MEC', name: 'Mechanical', nameAr: 'أعمال ميكانيكية' },
  { id: 'sc-7', code: 'ELE', name: 'Electrical', nameAr: 'أعمال كهربائية' },
  { id: 'sc-8', code: 'MEP', name: 'MEP', nameAr: 'الكهرومايكانيك' },
  { id: 'sc-9', code: 'STL', name: 'Steel', nameAr: 'أعمال الهياكل المعدنية' },
  { id: 'sc-10', code: 'ICT', name: 'ICT', nameAr: 'أعمال الاتصالات والشبكات' },
  { id: 'sc-11', code: 'FIR', name: 'Fire Fighting', nameAr: 'مكافحة الحريق' },
  { id: 'sc-12', code: 'LND', name: 'Landscape', nameAr: 'أعمال التنسيق والحدائق' },
  { id: 'sc-13', code: 'FIN', name: 'Finishes', nameAr: 'أعمال التشطيبات' },
  { id: 'sc-14', code: 'SRV', name: 'Survey', nameAr: 'أعمال المساحة' },
  { id: 'sc-15', code: 'TST', name: 'Testing', nameAr: 'الاختبارات والتشغيل' },
  { id: 'sc-16', code: 'OTH', name: 'Other', nameAr: 'أخرى' },
];

export const baselineContractors: Contractor[] = [
  {
    id: 'ctr-1',
    code: 'CTR-RGC',
    companyName: 'Rowad General Contracting',
    companyNameAr: 'الرواد للمقاولات العمومية',
    trade: 'General Construction',
    email: 'info@rowad.co',
    phone: '+96611223344',
    country: 'Saudi Arabia',
    commercialContact: 'Ahmad Al-Harbi',
    technicalContact: 'Eng. Hani Shaker',
    vendorNumber: 'VEND-2024-991',
    taxNumber: '300021485900003',
    commercialRegistration: '1010324859',
    status: 'Active'
  },
  {
    id: 'ctr-2',
    code: 'CTR-ASW',
    companyName: 'Al-Suwaidi Electrical Co.',
    companyNameAr: 'السويدي للصناعات الكهربائية',
    trade: 'Electrical Works',
    email: 'contact@alsuwaidi.com',
    phone: '+20227591000',
    country: 'Egypt',
    commercialContact: 'Mohamed Hegazi',
    technicalContact: 'Eng. Amjad Tawfik',
    vendorNumber: 'VEND-2024-512',
    taxNumber: '100-245-812',
    commercialRegistration: '88412-Cairo',
    status: 'Active'
  },
  {
    id: 'ctr-3',
    code: 'CTR-ESS',
    companyName: 'Egyptian Steel Structures (EGYPT-STEEL)',
    companyNameAr: 'المصرية للمنشآت المعدنية',
    trade: 'Steel & Metal Fabrication',
    email: 'eng@egyptsteel.com.eg',
    phone: '+20224195100',
    country: 'Egypt',
    commercialContact: 'Sherif Abdel-Baky',
    technicalContact: 'Eng. Tamer Fahmy',
    vendorNumber: 'VEND-2024-603',
    taxNumber: '211-584-912',
    commercialRegistration: '95123-Giza',
    status: 'Active'
  },
  {
    id: 'ctr-4',
    code: 'CTR-SGL',
    companyName: 'Saudi Geotechnical Lab',
    companyNameAr: 'المختبر الجيوتقني السعودي',
    trade: 'Soil Testing & Geotech',
    email: 'lab@saudigeo.com',
    phone: '+96612665899',
    country: 'Saudi Arabia',
    commercialContact: 'Faisal Bin Turki',
    technicalContact: 'Dr. Ibrahim Al-Nasser',
    vendorNumber: 'VEND-2024-118',
    taxNumber: '31245891100003',
    commercialRegistration: '4030112458',
    status: 'Active'
  }
];

export const baselineClients: Client[] = [
  { id: 'cl-1', code: 'CL-ORA', name: 'ORA Developers', nameAr: 'أورا للتطوير العقاري' },
  { id: 'cl-2', code: 'CL-NEOM', name: 'NEOM Authority', nameAr: 'هيئة نيوم' },
  { id: 'cl-3', code: 'CL-DGDA', name: 'Diriyah Gate Development Authority (DGDA)', nameAr: 'هيئة تطوير بوابة الدرعية' },
  { id: 'cl-4', code: 'CL-SODIC', name: 'SODIC Developers', nameAr: 'سوديك للتطوير العقاري' },
  { id: 'cl-5', code: 'CL-Emaar', name: 'Emaar Properties', nameAr: 'إعمار العقارية' }
];

export const baselineEmployers: Employer[] = [
  { id: 'emp-1', code: 'EMP-ORA', name: 'ORA Developers Group', nameAr: 'مجموعة أورا للتطوير' },
  { id: 'emp-2', code: 'EMP-NEOM', name: 'NEOM Joint Venture Corp', nameAr: 'شركة نيوم للمشاريع المشتركة' },
  { id: 'emp-3', code: 'EMP-DGDA', name: 'DGDA Executive Office', nameAr: 'المكتب التنفيذي لهيئة الدرعية' },
  { id: 'emp-4', code: 'EMP-SODIC', name: 'Sixth of October Development & Investment', nameAr: 'السادس من أكتوبر للتنمية والاستثمار' }
];

export const baselineConsultants: Consultant[] = [
  { id: 'con-1', code: 'CON-ECO', name: 'ECOGIM Engineering', nameAr: 'إيكوجيم للاستشارات الهندسية' },
  { id: 'con-2', code: 'CON-DAR', name: 'Dar Al-Handasah', nameAr: 'دار الهندسة' },
  { id: 'con-3', code: 'CON-AECOM', name: 'AECOM Middle East', nameAr: 'آيكوم الشرق الأوسط' },
  { id: 'con-4', code: 'CON-KEO', name: 'KEO International Consultants', nameAr: 'كيو للاستشارات الدولية' }
];

export const baselineCurrencies: Currency[] = [
  { id: 'curr-1', code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'د.إ' },
  { id: 'curr-2', code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
  { id: 'curr-3', code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م' },
  { id: 'curr-4', code: 'USD', name: 'United States Dollar', symbol: '$' }
];

export const baselineCountries: Country[] = [
  { id: 'cnt-1', code: 'EG', name: 'Egypt', nameAr: 'مصر' },
  { id: 'cnt-2', code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية' },
  { id: 'cnt-3', code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة' }
];

export const baselineDepartments: Department[] = [
  { id: 'dept-1', name: 'Infrastructure', nameAr: 'البنية التحتية' },
  { id: 'dept-2', name: 'Design & Engineering', nameAr: 'التصميم والهندسة' },
  { id: 'dept-3', name: 'Commercial Claims', nameAr: 'المطالبات التجارية' },
  { id: 'dept-4', name: 'Permits & Relations', nameAr: 'التصاريح والعلاقات الحكومية' },
  { id: 'dept-5', name: 'Executive Operations', nameAr: 'العمليات التنفيذية' }
];

export const baselineContractTypes: ContractType[] = [
  { id: 'ct-1', name: 'Lump Sum', nameAr: 'مقطوعية' },
  { id: 'ct-2', name: 'Unit Rate', nameAr: 'فئات أسعار وحدات' },
  { id: 'ct-3', name: 'Cost Plus', nameAr: 'تكلفة مضافة' },
  { id: 'ct-4', name: 'Design & Build', nameAr: 'تصميم وتنفيذ' }
];

export const baselineDocTypes: DocumentType[] = [
  { id: 'dt-1', name: 'Drawing', nameAr: 'مخطط هندسي' },
  { id: 'dt-2', name: 'Transmittal', nameAr: 'محضر إرسال' },
  { id: 'dt-3', name: 'Incoming Letter', nameAr: 'خطاب وارد' },
  { id: 'dt-4', name: 'Outgoing Letter', nameAr: 'خطاب صادر' }
];

export interface MeetingType {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

export interface ProjectStatus {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

export interface ClaimType {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

export interface VoType {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

export interface NocType {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

export interface IpcType {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

export const baselineMeetingTypes: MeetingType[] = [
  { id: 'mt-1', code: 'KOF', name: 'Kick-off Meeting', nameAr: 'اجتماع ركلة البداية', status: 'Active' },
  { id: 'mt-2', code: 'PRG', name: 'Progress Review Meeting', nameAr: 'اجتماع مراجعة التقدم', status: 'Active' },
  { id: 'mt-3', code: 'TEC', name: 'Technical Coordination', nameAr: 'اجتماع التنسيق الفني', status: 'Active' }
];

export const baselineStatuses: ProjectStatus[] = [
  { id: 'st-1', code: 'DFT', name: 'Draft', nameAr: 'مسودة', status: 'Active' },
  { id: 'st-2', code: 'SUB', name: 'Submitted', nameAr: 'مقدم', status: 'Active' },
  { id: 'st-3', code: 'APP', name: 'Approved', nameAr: 'معتمد', status: 'Active' },
  { id: 'st-4', code: 'REJ', name: 'Rejected', nameAr: 'مرفوض', status: 'Active' }
];

export const baselineClaimTypes: ClaimType[] = [
  { id: 'clt-1', code: 'EOT', name: 'Extension of Time (EOT)', nameAr: 'تمديد زمني', status: 'Active' },
  { id: 'clt-2', code: 'FIN', name: 'Financial Compensation', nameAr: 'تعويض مالي', status: 'Active' },
  { id: 'clt-3', code: 'BO', name: 'Both (EOT & Financial)', nameAr: 'كلاهما (زمني ومالي)', status: 'Active' }
];

export const baselineVoTypes: VoType[] = [
  { id: 'vot-1', code: 'ADD', name: 'Addition (Add)', nameAr: 'إضافة / زيادة أعمال', status: 'Active' },
  { id: 'vot-2', code: 'OMT', name: 'Omission (Omit)', nameAr: 'حذف / تقليص أعمال', status: 'Active' },
  { id: 'vot-3', code: 'SUB', name: 'Substitution', nameAr: 'استبدال بنود', status: 'Active' }
];

export const baselineNocTypes: NocType[] = [
  { id: 'noct-1', code: 'UTL', name: 'Utilities NOC', nameAr: 'ممانعة مرافق وخدمات', status: 'Active' },
  { id: 'noct-2', code: 'ENV', name: 'Environmental Permit', nameAr: 'تصريح بيئي', status: 'Active' },
  { id: 'noct-3', code: 'SFT', name: 'Civil Defense & Safety', nameAr: 'الدفاع المدني والسلامة', status: 'Active' }
];

export const baselineIpcTypes: IpcType[] = [
  { id: 'ipct-1', code: 'MON', name: 'Monthly Progress IPC', nameAr: 'مستخلص شهري جاري', status: 'Active' },
  { id: 'ipct-2', code: 'ADV', name: 'Advance Payment IPC', nameAr: 'مستخلص الدفعة المقدمة', status: 'Active' },
  { id: 'ipct-3', code: 'FIN', name: 'Final Account IPC', nameAr: 'المستخلص النهائي للمشروع', status: 'Active' }
];

export interface BusinessUnit {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

export interface Discipline {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

export const baselineBusinessUnits: BusinessUnit[] = [
  { id: 'bu-1', code: 'INF', name: 'Infrastructure Unit', nameAr: 'قطاع البنية التحتية', status: 'Active' },
  { id: 'bu-2', code: 'BLD', name: 'Buildings Unit', nameAr: 'قطاع المباني والإنشاءات', status: 'Active' },
  { id: 'bu-3', code: 'ENR', name: 'Energy & Power Unit', nameAr: 'قطاع الطاقة والمياه', status: 'Active' }
];

export const baselineDisciplines: Discipline[] = [
  { id: 'dsc-1', code: 'CIV', name: 'Civil Engineering', nameAr: 'الهندسة المدنية', status: 'Active' },
  { id: 'dsc-2', code: 'STR', name: 'Structural Engineering', nameAr: 'الهندسة الإنشائية', status: 'Active' },
  { id: 'dsc-3', code: 'MEP', name: 'MEP (Mechanical/Electrical/Plumbing)', nameAr: 'الأعمال الكهروميكانيكية', status: 'Active' },
  { id: 'dsc-4', code: 'ARC', name: 'Architectural Design', nameAr: 'التصميم المعماري', status: 'Active' }
];

export interface Employee {
  id: string;
  nameEn: string;
  nameAr: string;
  departmentId: string;
  businessUnitId: string;
  positionId: string;
  status: 'Active' | 'Inactive';
}

export interface Role {
  id: string;
  nameEn: string;
  nameAr: string;
}

export const baselineEmployees: Employee[] = [
  { id: 'user-1', nameEn: 'Ahmed Mostafa', nameAr: 'أحمد مصطفى', departmentId: 'dept-2', businessUnitId: 'bu-1', positionId: 'Contracts Engineer', status: 'Active' },
  { id: 'user-2', nameEn: 'Eng. Khalid Al-Saeed', nameAr: 'المهندس خالد السعيد', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Coordinator', status: 'Active' },
  { id: 'user-3', nameEn: 'Eng. Sherif Amin', nameAr: 'المهندس شريف أمين', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Coordinator', status: 'Active' },
  { id: 'user-4', nameEn: 'Eng. Yasmin Omar', nameAr: 'مهندسة ياسمين عمر', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Coordinator', status: 'Active' },
  { id: 'user-5', nameEn: 'Fatma Amer', nameAr: 'فاطمة عامر', departmentId: 'dept-2', businessUnitId: 'bu-1', positionId: 'Contracts Engineer', status: 'Active' },
  { id: 'user-6', nameEn: 'Salim Mansoor', nameAr: 'سليم منصور', departmentId: 'dept-2', businessUnitId: 'bu-1', positionId: 'Contracts Engineer', status: 'Active' },
  { id: 'user-7', nameEn: 'Eng. Salem Al-Awadi', nameAr: 'المهندس سالم العوضي', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Study Engineer', status: 'Active' },
  { id: 'user-8', nameEn: 'Eng. Omar Suleiman', nameAr: 'المهندس عمر سليمان', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Study Engineer', status: 'Active' },
  { id: 'user-9', nameEn: 'Eng. Tamer Al-Gohary', nameAr: 'المهندس تامر الجوهري', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Study Engineer', status: 'Active' },
  { id: 'user-10', nameEn: 'Eng. Hany Roushdy', nameAr: 'المهندس هاني رشدي', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Study Engineer', status: 'Active' },
  { id: 'user-11', nameEn: 'Eng. Kamal Al-Khatib', nameAr: 'المهندس كمال الخطيب', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Study Engineer', status: 'Active' },
  { id: 'user-12', nameEn: 'Eng. Alaa El-Din', nameAr: 'المهندس علاء الدين', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Study Engineer', status: 'Active' },
  { id: 'user-13', nameEn: 'Khaled Hassan', nameAr: 'خالد حسن', departmentId: 'dept-2', businessUnitId: 'bu-1', positionId: 'Contracts Engineer', status: 'Active' },
  { id: 'user-14', nameEn: 'Eng. Ramy Fawzy', nameAr: 'المهندس رامي فوزي', departmentId: 'dept-1', businessUnitId: 'bu-1', positionId: 'Tender Coordinator', status: 'Active' }
];

export const baselineRoles: Role[] = [
  { id: 'role-coordinator', nameEn: 'Coordinator', nameAr: 'منسق دراسة العطاء' },
  { id: 'role-contracts-eng', nameEn: 'Contracts Engineer', nameAr: 'مهندس العقود' },
  { id: 'role-study-eng', nameEn: 'Tender Study Engineer', nameAr: 'مهندس دراسة العطاء' },
  { id: 'role-commercial', nameEn: 'Commercial', nameAr: 'تجاري' },
  { id: 'role-tech-office', nameEn: 'Technical Office', nameAr: 'المكتب الفني' },
  { id: 'role-estimator', nameEn: 'Estimator', nameAr: 'مهندس تقدير تكاليف' },
  { id: 'role-reviewer', nameEn: 'Reviewer', nameAr: 'مراجع فني' },
  { id: 'role-approver', nameEn: 'Approver', nameAr: 'معتمد' },
  { id: 'role-bid-manager', nameEn: 'Bid Manager', nameAr: 'مدير عطاءات' }
];
