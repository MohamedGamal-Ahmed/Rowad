export interface Payment {
  id: string;
  ipcId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string;
  receiptNumber?: string;
  bank: string;
  currency: string;
  exchangeRate: number;
  status: 'Pending' | 'Received' | 'Verified' | 'Rejected';
  recordStatus: string;
  auditInfo: {
    createdBy: string;
    createdAt: string;
  };
}

export interface ClaimNegotiation {
  id: string;
  claimId: string;
  negotiationDate: string;
  proposalAmount: number;
  eotDaysProposed: number;
  negotiatedBy: string;
  summary: string;
  statusAtStep: string;
}

export interface VOApprovalHistory {
  id: string;
  voId: string;
  stepName: string;
  action: string;
  actorName: string;
  actionDate: string;
  comments: string;
}

import { BaseEntity } from '../common/BaseEntity';

export interface WBSPackage {
  id: string;
  projectId: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  parentId?: string; // Supports unlimited hierarchy
  description?: string;
}

export interface ProjectSettings {
  workingCalendar: string; // e.g., 'Standard'
  workingDays: number[]; // e.g., [0, 1, 2, 3, 4]
  currency: string;
  timeZone: string;
  departments: string[];
  approvers: string[];
  projectRoles: string[];
  riskMatrix: string; // e.g., '5x5'
  notificationRules: string[];
  meetingRules: string[];
  conflictRules: {
    minGapBetweenMeetings: number;
    travelBuffer: number;
    conflictThreshold: number;
  };
  documentNumberingRules: string;
  approvalWorkflow: string;
  escalationRules: string;
}

export interface ContextualAttachment {
  id: string;
  projectId: string;
  entityType?: 'Claim' | 'VO' | 'IPC' | 'NOC' | 'Meeting' | 'Document' | 'Project' | 'Subcontract' | string;
  entityId?: string; // References the specific entity ID
  category?: string; // e.g., 'Letters', 'Drawings', 'Photos', 'BOQ', 'Shop Drawings', 'Invoice', etc.
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedDate: string;
  downloadUrl?: string;
}

export type ProjectAttachment = ContextualAttachment;

export interface Project extends BaseEntity {
  code: string; // Project Code
  sourceTenderId?: string;
  sourceTenderNumber?: string;
  awardedAt?: string;
  nameEn: string; // Project Name (English) - Required
  nameAr?: string; // Project Name (Arabic) - Optional
  client: string; // References Client Name/ID
  employer: string; // References Employer Name/ID
  consultant: string; // References Consultant Name/ID
  mainContractor: string; // References Contractor Name/ID
  contractType: string; // Contract Type
  contractValue: number; // Contract Value
  currency: string; // Currency (e.g., AED, SAR, EGP)
  country: string; // Country
  city: string; // City
  projectManager: string; // Project Manager
  coordinator: string; // Coordinator
  department: string; // Department
  businessUnit: string; // Business Unit (SSOT field)
  startDate: string; // ISO Date YYYY-MM-DD
  completionDate: string; // ISO Date YYYY-MM-DD
  status: 'Active' | 'Pre-Award' | 'Completed' | 'Closed';
  lifecycleStage: 'Pre-Award' | 'Awarded' | 'Execution' | 'Closing' | 'Archived';
  description?: string;
  settings?: ProjectSettings; // Project-level settings override
}

export interface ProjectMeeting extends BaseEntity {
  projectId: string;
  wbsId?: string; // WBS Relationship
  title: string;
  titleAr?: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType: string;
  locationOrLink?: string;
  attendees: string[];
  remarks?: string;

  relatedEntityType?: string;
  relatedEntityId?: string;
  decisions?: string[];
  actionItems?: {
    taskDescription: string;
    assignee: string;
    dueDate: string;
    status: 'Open' | 'Closed' | 'Cancelled';
  }[];
  outcome?: string;
  
  // Cross-Module Relationships
  relatedClaimIds?: string[];
  relatedVOIds?: string[];
  relatedDocumentIds?: string[];
}

export interface ProjectIPC extends BaseEntity {
  projectId: string;
  wbsId?: string; // WBS Relationship
  ipcNumber: string;
  workTill: string; // YYYY-MM-DD
  invoiceGrossValue: number;
  ipcSubmissionDate: string;
  invoiceNetValue: number;
  ipcReceiptDate?: string;
  ipcDueDate?: string;
  certifiedAmount?: number;
  paymentDueDate?: string;
  paymentReceiptDate?: string;
  delayTillDate?: string;
  actualPaidCertified?: number;
  remarks?: string;
  status: string;
  payments?: Payment[];
  
  // Cross-Module Relationships
  relatedVOIds?: string[];
  relatedDocumentIds?: string[];
}

export type ClaimStatus =
  | 'Prepared'
  | 'Submitted'
  | 'Under Review'
  | 'Negotiation'
  | 'Counter Proposal'
  | 'Approved'
  | 'Rejected'
  | 'Disputed';

export interface ProjectClaim extends BaseEntity {
  projectId: string;
  wbsId?: string; // WBS Relationship
  claimNumber: string;
  claimType: string;
  submissionDate: string;
  requestedCompletionExtensionDays: number;
  approvedCompletionExtensionDays?: number;
  additionalClaimedAmount: number;
  status: ClaimStatus;
  approvedAmount?: number;
  invoicedAmount?: number;
  notes?: string;
  negotiations?: ClaimNegotiation[];

  // Cross-Module Relationships
  relatedVOIds?: string[];
  relatedMeetingIds?: string[];
  relatedDocumentIds?: string[];
}

export interface ProjectVariationOrder extends BaseEntity {
  projectId: string;
  wbsId?: string; // WBS Relationship
  voNumber: string; // Variation Order Number
  title: string;
  titleAr?: string;
  status: string;

  additionalValue: number;
  scheduleImpactDays: number;
  costImpactType: string;
  riskLevel: string;
  remarks?: string;
  approvals?: VOApprovalHistory[];

  technicalDescription?: {
    additionOrOmission: 'Addition' | 'Omission' | 'Transfer';
    description: string;
    merits: string;
  };
  employerInstruction?: {
    instructionType: 'EI' | 'AI' | 'VO' | 'Other';
    reference: string;
    date: string;
  };
  commercialOffer?: {
    submissionStatus: 'Pending' | 'Submitted' | 'Approved';
    rfvReference: string;
    commercialDate: string;
    amount: number;
    extensionOfTimeDays: number;
  };
  approval?: {
    approvalDate: string;
    approvedAmount: number;
    approvalReference: string;
  };

  // Cross-Module Relationships
  relatedClaimIds?: string[];
  relatedDocumentIds?: string[];
}

export interface ProjectNOC extends BaseEntity {
  projectId: string;
  wbsId?: string; // WBS Relationship
  nocNumber: string;
  nocType: string;
  authorityName: string;
  applicationDate: string;
  expiryDate?: string;
  status: string;

  reference?: string;
  subject?: string;
  pendingActionBy?: string;
  remarks?: string;

  // Cross-Module Relationships
  relatedDocumentIds?: string[];
}

export interface ProjectSPR extends BaseEntity {
  projectId: string;
  reportingMonth: string; // YYYY-MM
  overallProgressPercentage: number;
  scheduleVariance: number;
  costVariance: number;
  keyAchievements: string;
  bottlenecksAndRisks: string;
  pmoSummary: string;
  status: 'Draft' | 'Submitted' | 'Reviewed';
}

export interface ProjectSubcontract extends BaseEntity {
  projectId: string;
  wbsId?: string; // WBS Relationship
  subcontractNumber: string;
  contractorId: string; // References ContractorId
  scopeId: string; // References ScopeId
  totalSubcontractAmount: number;
  tillDateInvoicedAmount: number;
  completionPercentage: number;
  status: 'Active' | 'Completed' | 'Terminated';
  remarks?: string;
}

export interface ProjectDocument extends BaseEntity {
  projectId: string;
  wbsId?: string; // WBS Relationship
  code: string;
  titleEn: string;
  titleAr?: string;
  category: 'Drawing' | 'Transmittal' | 'Incoming' | 'Outgoing';
  docTypeId: string; // References DocumentType ID
  sender: string;
  recipient: string;
  dateReceived: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  version: string;

  // Checkout and Locking attributes
  checkedOutBy?: string;
  checkedOutAt?: string;
  isLocked?: boolean;

  // Revisions List
  revisions?: {
    id: string;
    version: string;
    date: string;
    remarks: string;
    fileAttachmentId?: string;
    fileAttachmentName?: string;
  }[];

  // Cross-Module Relationships
  relatedMeetingIds?: string[];
  relatedVOIds?: string[];
  relatedClaimIds?: string[];
}

export interface ProjectHistory {
  id: string;
  projectId: string;
  action: string;
  performedBy: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  details?: string;
  module?: string; // e.g., 'IPC', 'Claim', 'VO'
  entityId?: string; // ID of the business record
  entityCode?: string; // e.g., 'IPC-08'
}
