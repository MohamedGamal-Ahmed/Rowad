import { 
  ProjectMeeting, ProjectIPC, ProjectClaim, ProjectVariationOrder, ProjectNOC, 
  ProjectSPR, ProjectSubcontract 
} from '../domain/projects/Project';
import { RecordStatus } from '../enums/RecordStatus';

const defaultAudit = {
  createdBy: "System",
  createdAt: "2026-06-20T00:00:00Z"
};

export const baselineMeetings: ProjectMeeting[] = [
  {
    id: "meet-1",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-1",
    wbsId: "wbs-1",
    title: "Monthly Technical Coordination Meeting",
    titleAr: "الاجتماع الفني التنسيقي الشهري",
    date: "2026-06-25",
    startTime: "10:00",
    endTime: "11:30",
    meetingType: "online",
    locationOrLink: "https://teams.microsoft.com/l/meetup-join/19-project-zed",
    attendees: ["Eng. Sherif Kamel", "ECOGIM Consultant", "ORA Rep", "Site Engineer Ali"],
    remarks: "Reviewing shop drawing status of sewer crossings.",
    relatedClaimIds: ["clm-1"],
    relatedVOIds: ["vo-1"],
    relatedDocumentIds: ["pdoc-1"]
  },
  {
    id: "meet-2",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-2",
    wbsId: "wbs-5",
    title: "Commercial Pre-Award Alignment Session",
    titleAr: "جلسة التنسيق التجاري لمرحلة ما قبل الترسية",
    date: "2026-06-26",
    startTime: "13:00",
    endTime: "14:30",
    meetingType: "physical",
    locationOrLink: "DGDA Headquarters, Boardroom B, Riyadh",
    attendees: ["Eng. Abdulrahman Al-Saud", "DGDA Estimators", "Contracts Lead Rowad"],
    remarks: "Discussing unit pricing anomalies in bid item series 4.",
    relatedClaimIds: [],
    relatedVOIds: [],
    relatedDocumentIds: []
  }
];

export const baselineIPCs: ProjectIPC[] = [
  {
    id: "ipc-1",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-1",
    wbsId: "wbs-1",
    ipcNumber: "IPC-ZED-08",
    workTill: "2026-05-31",
    invoiceGrossValue: 12450000,
    ipcSubmissionDate: "2026-06-15",
    invoiceNetValue: 10582500,
    ipcDueDate: "2026-07-15",
    certifiedAmount: 12450000,
    paymentDueDate: "2026-08-15",
    status: "Under Review",
    remarks: "Submitted to ECOGIM for verification. Measured work is 100% physically surveyed.",
    relatedVOIds: ["vo-1"],
    relatedDocumentIds: ["pdoc-1"]
  },
  {
    id: "ipc-2",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-3",
    wbsId: "wbs-1",
    ipcNumber: "IPC-EASTOWN-14",
    workTill: "2026-04-30",
    invoiceGrossValue: 8500000,
    ipcSubmissionDate: "2026-05-10",
    invoiceNetValue: 7225000,
    ipcReceiptDate: "2026-06-18",
    certifiedAmount: 8350000,
    paymentReceiptDate: "2026-06-20",
    status: "Paid",
    remarks: "Certified and payment received net of standard retention and advance recovery.",
    relatedVOIds: [],
    relatedDocumentIds: []
  }
];

export const baselineClaims: ProjectClaim[] = [
  {
    id: "clm-1",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-1",
    wbsId: "wbs-1",
    claimNumber: "CLM-03-ZED",
    claimType: "Extension of Time",
    submissionDate: "2026-06-10",
    requestedCompletionExtensionDays: 45,
    additionalClaimedAmount: 0,
    status: "Under Review",
    notes: "Claim submitted due to delayed handover of underground electricity duct corridors.",
    relatedVOIds: ["vo-1"],
    relatedMeetingIds: ["meet-1"],
    relatedDocumentIds: ["pdoc-1"]
  },
  {
    id: "clm-2",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-3",
    wbsId: "wbs-1",
    claimNumber: "CLM-02-EASTOWN",
    claimType: "Both",
    submissionDate: "2026-03-15",
    requestedCompletionExtensionDays: 30,
    approvedCompletionExtensionDays: 20,
    additionalClaimedAmount: 3200000,
    approvedAmount: 2800000,
    invoicedAmount: 2800000,
    status: "Approved",
    notes: "Approved variation to structural foundation parameters due to unexpected limestone strata.",
    relatedVOIds: [],
    relatedMeetingIds: [],
    relatedDocumentIds: []
  }
];

export const baselineVOs: ProjectVariationOrder[] = [
  {
    id: "vo-1",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-1",
    wbsId: "wbs-1",
    voNumber: "VO-ZED-012",
    title: "Main Water Bypass Lines Portal Zone B",
    titleAr: "خطوط تجاوز المياه الرئيسية لبوابة المنطقة ب",
    additionalValue: 1850000,
    scheduleImpactDays: 7,
    costImpactType: "Addition",
    riskLevel: "Medium",
    technicalDescription: {
      additionOrOmission: "Addition",
      description: "Additional 400mm main water bypass lines near Zone B entry portal.",
      merits: "Required to ensure water pressure continuity for the upcoming district launch."
    },
    employerInstruction: {
      instructionType: "EI",
      reference: "EI-ZED-INF-981",
      date: "2026-05-20"
    },
    commercialOffer: {
      submissionStatus: "Approved",
      rfvReference: "RFV-ZED-442",
      commercialDate: "2026-06-01",
      amount: 1850000,
      extensionOfTimeDays: 7
    },
    approval: {
      approvalDate: "2026-06-18",
      approvedAmount: 1850000,
      approvalReference: "VO-APP-ZED-012"
    },
    status: "Approved",
    remarks: "Formally integrated into the physical work package sequence.",
    relatedClaimIds: ["clm-1"],
    relatedDocumentIds: ["pdoc-1"]
  }
];

export const baselineNOCs: ProjectNOC[] = [
  {
    id: "noc-1",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-1",
    wbsId: "wbs-4",
    nocNumber: "NOC-ZED-CIV-04",
    nocType: "Civil Defense Permit",
    authorityName: "Civil Defense Authority",
    applicationDate: "2026-05-15",
    reference: "NOC-44-ZED-CIV",
    subject: "Civil Defense Approval for Gas Pipelines Zone 02",
    pendingActionBy: "Civil Defense Authority",
    status: "Under Review",
    remarks: "Awaiting final site inspection. All technical document submittals are cleared.",
    relatedDocumentIds: ["pdoc-1"]
  }
];

export const baselineSPRs: ProjectSPR[] = [
  {
    id: "spr-1",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-1",
    reportingMonth: "2026-06",
    overallProgressPercentage: 42,
    scheduleVariance: -1.2,
    costVariance: 45000,
    keyAchievements: "Successfully completed the sewer main pipeline installation under Zone 2 main boulevard.",
    bottlenecksAndRisks: "Delay in municipal clearance for southern electricity bypass connection.",
    pmoSummary: "The project is trending healthy but requires aggressive follow-up on Government Permits.",
    status: "Submitted"
  }
];

export const baselineSubcontracts: ProjectSubcontract[] = [
  {
    id: "sub-1",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-1",
    wbsId: "wbs-2",
    subcontractNumber: "SUB-ZED-CIV-102",
    contractorId: "ctr-2",
    scopeId: "sc-7",
    totalSubcontractAmount: 45000000,
    tillDateInvoicedAmount: 12500000,
    completionPercentage: 35,
    status: "Active",
    remarks: "Electrical duct bank installation and primary cabling."
  },
  {
    id: "sub-2",
    recordStatus: RecordStatus.ACTIVE,
    auditInfo: defaultAudit,
    projectId: "p-1",
    wbsId: "wbs-4",
    subcontractNumber: "SUB-ZED-GEO-04",
    contractorId: "ctr-4",
    scopeId: "sc-14",
    totalSubcontractAmount: 5200000,
    tillDateInvoicedAmount: 5200000,
    completionPercentage: 100,
    status: "Completed",
    remarks: "Soil investigations and pile loading load integrity tests."
  }
];
