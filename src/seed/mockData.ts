import { ExecutionRecord } from '../domain/project-controls/ProjectControlsRecord';
import { ProjectDocument } from '../domain/projects/Project';
import { RecordStatus } from '../enums/RecordStatus';

export const mockExecutionData: ExecutionRecord[] = [
  {
    id: 'E-001',
    projectId: 'p-1',
    type: 'IPC',
    code: 'IPC-08-NEOM',
    projectName: { en: 'Neom Spine Ground Terminal Expansion', ar: 'توسعة محطة النفق الأرضية بمشروع نيوم' },
    submittedDate: '2026-06-15',
    valueAED: 'AED 12,450,000',
    status: { en: 'Awaiting Consultant Signature', ar: 'بانتظار توقيع الاستشاري' },
    health: 'Healthy',
    department: { en: 'Infrastructure', ar: 'البنية التحتية' },
    contractor: 'Rowad General Contracting',
    progress: 75
  },
  {
    id: 'E-002',
    projectId: 'p-1',
    type: 'Claim',
    code: 'CLM-03-ZAYED',
    projectName: { en: 'Zayed Boulevard Commercial Corridor', ar: 'الممر التجاري بمحور الشيخ زايد' },
    submittedDate: '2026-06-10',
    valueAED: 'AED 3,200,000',
    status: { en: 'Pending PMO Escalation', ar: 'معلق بانتظار تصعيد إدارة المشاريع' },
    health: 'Urgent',
    department: { en: 'Commercial Claims', ar: 'المطالبات التجارية' },
    contractor: 'Al-Suwaidi Electrical Co.',
    progress: 30
  },
  {
    id: 'E-003',
    projectId: 'p-3',
    type: 'Variation Order',
    code: 'VO-12-LOG',
    projectName: { en: 'Cairo Capital East Logistics Hub', ar: 'المركز اللوجستي لشرق العاصمة الإدارية' },
    submittedDate: '2026-06-18',
    valueAED: 'AED 1,850,000',
    status: { en: 'Approved & Signed', ar: 'تم الاعتماد والتوقيع' },
    health: 'Healthy',
    department: { en: 'Design & Engineering', ar: 'التصميم والهندسة' },
    contractor: 'Egyptian Steel Structures',
    progress: 100
  },
  {
    id: 'E-004',
    projectId: 'p-2',
    type: 'NOC',
    code: 'NOC-44-DIR',
    projectName: { en: 'Diriyah Blvd District Substructure', ar: 'البنية التحتية لمنطقة بوليفارد الدرعية التاريخية' },
    submittedDate: '2026-06-12',
    valueAED: 'N/A (Regulatory)',
    status: { en: 'Under Municipality Review', ar: 'قيد مراجعة البلدية والهيئة' },
    health: 'Under Review',
    department: { en: 'Permits & Relations', ar: 'التصاريح والعلاقات الحكومية' },
    contractor: 'Saudi Geotechnical Lab',
    progress: 55
  },
  {
    id: 'E-005',
    projectId: 'p-1',
    type: 'IPC',
    code: 'IPC-21-ALM',
    projectName: { en: 'Al Maktoum Terminal Cargo Ramp', ar: 'مدرج الشحن بمطار آل مكتوم الدولي الجديد' },
    submittedDate: '2026-06-20',
    valueAED: 'AED 45,000,000',
    status: { en: 'Approved & Certified', ar: 'تم الاعتماد والصرف الفعلي' },
    health: 'Healthy',
    department: { en: 'Executive Operations', ar: 'العمليات التنفيذية' },
    contractor: 'Rowad Aviation Infras',
    progress: 90
  }
];

export const mockDocuments: ProjectDocument[] = [
  {
    id: 'D-001',
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: { createdBy: 'System', createdAt: '2026-06-19T00:00:00Z' },
    projectId: 'p-1',
    code: 'ROWAD-NEOM-CIV-DRW-042',
    titleEn: 'Slab reinforcement details at station 3+400',
    titleAr: 'تفاصيل تسليح البلاطة الخرسانية عند المحطة ٣+٤٠٠',
    category: 'Drawing',
    docTypeId: 'dt-1',
    sender: 'Rowad Civil Design Team',
    recipient: 'Lead Construction Consultant',
    dateReceived: '2026-06-19',
    status: 'Approved for Construction',
    priority: 'High',
    version: 'Rev 2.0'
  },
  {
    id: 'D-002',
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: { createdBy: 'System', createdAt: '2026-06-20T00:00:00Z' },
    projectId: 'p-2',
    code: 'TRN-DIR-8812',
    titleEn: 'Transmittal of Soil compaction test reports',
    titleAr: 'محضر إرسال تقارير اختبارات دك التربة',
    category: 'Transmittal',
    docTypeId: 'dt-2',
    sender: 'SGS Soils Laboratory LLC',
    recipient: 'Rowad QA/QC Department',
    dateReceived: '2026-06-20',
    status: 'Under Verification',
    priority: 'Medium',
    version: 'Rev 1.0'
  },
  {
    id: 'D-003',
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: { createdBy: 'System', createdAt: '2026-06-14T00:00:00Z' },
    projectId: 'p-3',
    code: 'INC-MUNI-0994',
    titleEn: 'Municipality site access and load permit letter',
    titleAr: 'خطاب البلدية بشأن تصريح الدخول ومطابقة الحمولات',
    category: 'Incoming',
    docTypeId: 'dt-3',
    sender: 'Cairo Urban Development Authority',
    recipient: 'Rowad Project Director',
    dateReceived: '2026-06-14',
    status: 'Awaiting Response Letter',
    priority: 'High',
    version: 'Original'
  },
  {
    id: 'D-004',
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: { createdBy: 'System', createdAt: '2026-06-18T00:00:00Z' },
    projectId: 'p-1',
    code: 'OUT-EXP-ROWG-771',
    titleEn: 'Notice of major structural excavation clearance',
    titleAr: 'إخطار رسمي بانتهاء أعمال الحفر الهيكلي الرئيسي',
    category: 'Outgoing',
    docTypeId: 'dt-4',
    sender: 'Rowad HSE Manager',
    recipient: 'General Civil Aviation Authority',
    dateReceived: '2026-06-18',
    status: 'Delivered & Stamped',
    priority: 'Medium',
    version: 'Rev 1.1'
  }
];

