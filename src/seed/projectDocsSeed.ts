import { 
  ProjectDocument, ContextualAttachment, ProjectHistory, WBSPackage 
} from '../domain/projects/Project';
import { RecordStatus } from '../enums/RecordStatus';

const defaultAudit = {
  createdBy: "System",
  createdAt: "2026-06-20T00:00:00Z"
};

export const baselineDocuments: ProjectDocument[] = [
  {
    id: "pdoc-1",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-1",
    wbsId: "wbs-1",
    code: "ROWAD-ZED-CIV-DRW-042",
    titleEn: "Slab reinforcement details at station 3+400",
    titleAr: "تفاصيل تسليح البلاطة الخرسانية عند المحطة ٣+٤٠٠",
    category: "Drawing",
    docTypeId: "dt-1",
    sender: "Rowad Civil Design Team",
    recipient: "Lead Construction Consultant",
    dateReceived: "2026-06-19",
    status: "Approved for Construction",
    priority: "High",
    version: "Rev 2.0",
    relatedMeetingIds: ["meet-1"],
    relatedVOIds: ["vo-1"],
    relatedClaimIds: ["clm-1"]
  }
];

export const baselineAttachments: ContextualAttachment[] = [
  {
    id: "att-1",
    projectId: "p-1",
    fileName: "Contract_Signed_ORA_ZED_Zone02.pdf",
    fileSize: "14.2 MB",
    uploadedBy: "Admin",
    uploadedDate: "2024-01-15"
  }
];

export const baselineHistories: ProjectHistory[] = [
  {
    id: "h-1",
    projectId: "p-1",
    action: "Project Seeded",
    performedBy: "System",
    timestamp: "2024-01-10 12:00:00",
    details: "Baseline project details bootstrapped.",
    module: "Project",
    entityId: "p-1",
    entityCode: "ZED-Z02"
  },
  {
    id: "h-2",
    projectId: "p-1",
    action: "IPC #8 Submitted",
    performedBy: "Ahmed Mansoor",
    timestamp: "2026-06-15 09:30:12",
    details: "IPC-ZED-08 submitted under review with ECOGIM.",
    module: "IPC",
    entityId: "ipc-1",
    entityCode: "IPC-ZED-08"
  },
  {
    id: "h-3",
    projectId: "p-1",
    action: "Variation Order Approved",
    performedBy: "Consultant ECOGIM",
    timestamp: "2026-06-18 14:15:22",
    details: "Approved VO-ZED-012 for EGP 1.85 Million and 7 EOT days.",
    module: "VO",
    entityId: "vo-1",
    entityCode: "VO-ZED-012"
  },
  {
    id: "h-4",
    projectId: "p-1",
    action: "Soil Investigation Completed",
    performedBy: "Saudi Geotechnical Lab",
    timestamp: "2026-06-20 11:00:00",
    details: "Subcontract SUB-ZED-GEO-04 physically completed 100%.",
    module: "Subcontract",
    entityId: "sub-2",
    entityCode: "SUB-ZED-GEO-04"
  }
];

export const baselineWBS: WBSPackage[] = [
  { id: "wbs-1", projectId: "p-1", code: "CIV", nameEn: "Civil Works", nameAr: "الأعمال المدنية" },
  { id: "wbs-2", projectId: "p-1", code: "MEP", nameEn: "MEP Works", nameAr: "الأعمال الكهرومايكانيكية", parentId: "wbs-1" },
  { id: "wbs-3", projectId: "p-1", code: "ARC", nameEn: "Architectural Works", nameAr: "الأعمال المعمارية" },
  { id: "wbs-4", projectId: "p-1", code: "INF", nameEn: "Infrastructure Mains", nameAr: "شبكات البنية التحتية" },
  { id: "wbs-5", projectId: "p-1", code: "RDS", nameEn: "Roads & Asphalt", nameAr: "أعمال الطرق والأسفلت", parentId: "wbs-4" },
  { id: "wbs-6", projectId: "p-1", code: "LND", nameEn: "Landscape & Planting", nameAr: "تنسيق المواقع والحدائق", parentId: "wbs-3" }
];

export const baselineContextualAttachments: ContextualAttachment[] = [
  {
    id: "catt-1",
    projectId: "p-1",
    entityType: "Claim",
    entityId: "clm-1",
    category: "Letters",
    fileName: "ORA_Delay_Handover_Notification_Letter.pdf",
    fileSize: "1.2 MB",
    uploadedBy: "Eng. Sherif Kamel",
    uploadedDate: "2026-06-10"
  },
  {
    id: "catt-2",
    projectId: "p-1",
    entityType: "Claim",
    entityId: "clm-1",
    category: "Drawings",
    fileName: "Gas_Alignment_Conflict_Drawings_Rev01.dwg",
    fileSize: "4.5 MB",
    uploadedBy: "Site Engineer Ali",
    uploadedDate: "2026-06-11"
  },
  {
    id: "catt-3",
    projectId: "p-1",
    entityType: "VO",
    entityId: "vo-1",
    category: "Engineer Instructions",
    fileName: "ECOGIM-EI-981-WaterBypassLine.pdf",
    fileSize: "850 KB",
    uploadedBy: "Ahmed Mansoor",
    uploadedDate: "2026-05-21"
  },
  {
    id: "catt-4",
    projectId: "p-1",
    entityType: "VO",
    entityId: "vo-1",
    category: "BOQ",
    fileName: "VO-ZED-012_Bypass_Re-measured_BOQ.xlsx",
    fileSize: "1.1 MB",
    uploadedBy: "Contracts Lead Rowad",
    uploadedDate: "2026-06-02"
  },
  {
    id: "catt-5",
    projectId: "p-1",
    entityType: "IPC",
    entityId: "ipc-1",
    category: "Invoice",
    fileName: "Rowad-Invoice-ZED-08_Certified.pdf",
    fileSize: "2.3 MB",
    uploadedBy: "Ahmed Mansoor",
    uploadedDate: "2026-06-15"
  }
];
