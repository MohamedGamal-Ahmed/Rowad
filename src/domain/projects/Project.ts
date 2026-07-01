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
  category?: string; // e.g., 'Letters', 'Drawings', 'Photos', 'BOQ', 'Shop Drawings', 'Invoice', 'Letter of Award', 'Signed Contract', 'Award Minutes', 'Clarifications', etc.
  sourceModule?: string; // Traceability: which workflow produced this attachment, e.g. 'Award Confirmation'
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedDate: string;
  downloadUrl?: string;
}

export type ProjectAttachment = ContextualAttachment;

export interface ProjectTeamMember {
  roleId: string;
  employeeId: string;
  assignedAt: string;
  delegation?: string;
  approvalLevel?: string;
}

export interface ProjectDelegation {
  id: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  roleId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  remarks?: string;
}

export interface DistributionList {
  id: string;
  listName: string;
  memberIds: string[];
  isActive: boolean;
}

export interface ApprovalStep {
  sequence: number;
  roleId: string;
  slaDays: number;
}

export interface ApprovalMatrixRule {
  id: string;
  module: 'IPC' | 'VO' | 'Claim' | 'Document' | 'NOC';
  thresholdAmount?: number;
  approvalSteps: ApprovalStep[];
}

export interface ProjectOffice {
  id: string;
  projectId: string;
  teamMembers: ProjectTeamMember[];
  delegations: ProjectDelegation[];
  distributionLists: DistributionList[];
  approvalMatrix: ApprovalMatrixRule[];
}

export interface CommercialSetup {
  baseCurrency: string;
  contractCurrency?: string;
  exchangeRate: number;
  exchangeRateDate?: string;
  exchangeRateSource?: 'Manual' | 'Central Bank' | 'ERP' | 'API';
  contractType: ContractType;
  deliveryMethod?: DeliveryMethod;
  retentionPercentage: number;
  advancePaymentPercentage: number;
  vatPercentage: number;
  costCenterCode: string;
  employer: string;
}

export interface ScheduleSetup {
  startDate: string;
  contractDurationDays: number;
  mobilizationPeriodDays: number;
  workingCalendar: string;
  holidayCalendar: string;
  timeZone: string;
  workingHours: string;
  weekendPattern: string;
}

export interface OfficeSetup {
  teamMembers: ProjectTeamMember[];
}

export interface DocumentsSetup {
  verifiedDocumentCategories: string[];
}

export interface ReviewState {
  isCommercialValid: boolean;
  isScheduleValid: boolean;
  isOfficeValid: boolean;
  isDocsValid: boolean;
}

export interface ProjectSetupDraft {
  projectId: string;
  currentStep: number;
  lastSaved: string;
  /** Step IDs (1-5) the user has advanced through with a passing validation state. Always an array — never undefined. */
  completedSteps: number[];
  commercial?: CommercialSetup;
  schedule?: ScheduleSetup;
  office?: OfficeSetup;
  documents?: DocumentsSetup;
  review?: ReviewState;
}

export enum ProjectLifecycleStage {
  PRE_AWARD = 'Pre-Award',
  PENDING_PROJECT_SETUP = 'Pending Project Setup',
  READY_FOR_MOBILIZATION = 'Ready for Mobilization',
  EXECUTION = 'Execution',
  CLOSING = 'Closing',
  ARCHIVED = 'Archived'
}

export enum ProjectWorkflowState {
  DRAFT = 'Draft',
  PENDING_ACTIVATION = 'Pending Activation',
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  COMPLETED = 'Completed'
}

export enum ContractType {
  LUMP_SUM = 'Lump Sum',
  UNIT_RATE = 'Unit Rate',
  COST_PLUS = 'Cost Plus',
  FRAMEWORK = 'Framework',
  DESIGN_BUILD = 'Design & Build',
  EPC = 'EPC',
  TARGET_COST = 'Target Cost',
  REIMBURSABLE = 'Reimbursable'
}

export enum DeliveryMethod {
  TRADITIONAL = 'Traditional',
  DESIGN_BUILD = 'Design Build',
  EPC = 'EPC',
  FAST_TRACK = 'Fast Track',
  JOINT_VENTURE = 'Joint Venture',
  CONSTRUCTION_MANAGEMENT = 'Construction Management',
  PPP = 'PPP',
  ALLIANCE = 'Alliance'
}

export interface CalendarFoundation {
  workingCalendar: string;
  holidayCalendar: string;
  timeZone: string;
  workingHours: string;
  weekendPattern: string;
}

export interface ProjectCommercialSettings {
  contractCurrency: string;
  baseCurrency: string;
  exchangeRate: number;
  exchangeRateDate?: string;
  exchangeRateSource?: 'Manual' | 'Central Bank' | 'ERP' | 'API';
  retentionPercentage: number;
  advancePaymentPercentage: number;
  vatPercentage: number;
  costCenterCode: string;
}

export interface SetupAuditEvent {
  id: string;
  projectId: string;
  userId: string;
  timestamp: string;
  sessionId: string;
  correlationId: string;
  step: 'COMMERCIAL' | 'SCHEDULE' | 'OFFICE' | 'DOCUMENTS' | 'ACTIVATION';
  action: 'DRAFT_SAVED' | 'STEP_COMPLETED' | 'SETUP_COMPLETED' | 'ACTIVATED';
  payload: string;
}

export enum ProjectStatus {
  INACTIVE = 'Inactive',
  MOBILIZING = 'Mobilizing',
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  COMPLETED = 'Completed',
  CLOSED = 'Closed',
  ARCHIVED = 'Archived'
}

export interface Project extends BaseEntity {
  code: string; // Project Code
  sourceTenderId?: string;
  sourceTenderNumber?: string;
  awardedAt?: string;
  loaReferenceNumber?: string; // LOA reference
  nameEn: string; // Project Name (English) - Required
  nameAr?: string; // Project Name (Arabic) - Optional
  client: string; // References Client Name/ID
  employer: string; // References Employer Name/ID
  consultant: string; // References Consultant Name/ID
  mainContractor: string; // References Contractor Name/ID
  contractType: ContractType; // Refined contract type
  deliveryMethod?: DeliveryMethod; // Refined delivery method
  signedContractValue: number; // Signed Contract Value at Project Award
  currency: string; // Legacy field (represents Contract Currency)
  country: string; // Country
  city: string; // City
  projectManager: string; // Project Manager (Legacy / Fallback string)
  coordinator: string; // Coordinator (Legacy / Fallback string)
  department: string; // Department
  businessUnit: string; // Business Unit (SSOT field)
  startDate: string; // ISO Date YYYY-MM-DD
  completionDate: string; // ISO Date YYYY-MM-DD
  contractDurationDays?: number; // Duration in calendar days
  approvedEotDays?: number; // Total approved EOT days
  contractualCompletionDate?: string; // Contractual completion date
  revisedCompletionDate?: string; // Calculated: startDate + contractDurationDays + approvedEotDays
  forecastCompletionDate?: string; // Planning forecast completion date
  mobilizationPeriodDays?: number;
  mobilizationDate?: string;
  
  status: ProjectStatus;
  lifecycleStage: ProjectLifecycleStage;
  workflowState?: ProjectWorkflowState;
  awardAttachments?: ProjectAttachment[];
  description?: string;
  settings?: ProjectSettings; // Project-level settings override
  isSetupComplete?: boolean; // Set to true after Setup Wizard completion
  projectOffice?: ProjectOffice; // Dynamic team, approvals, delegations (optional for seeds/backward compatibility)
  setupDraft?: ProjectSetupDraft; // Setup draft payload
  calendarFoundation?: CalendarFoundation; // Scheduling parameters
  commercialSettings?: ProjectCommercialSettings; // Commercial/Financial configuration
 
  // Advanced Change Management Baseline Fields
  revisedContractValue?: number;
  approvedVariationTotal?: number;
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

  // Advanced Commercial IPC Engine Fields
  certifiedGrossValue?: number;
  retentionDeduction?: number;
  advanceRecovery?: number;
  withholdingTax?: number;
  netCertifiedAmount?: number;
  previousIpcGrossCumulative?: number;
  previousIpcNetCumulative?: number;
  
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
    approvedEotDays?: number;
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
