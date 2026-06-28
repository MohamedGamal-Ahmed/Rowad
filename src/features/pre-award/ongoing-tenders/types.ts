import { Milestone } from '../../../domain/common/Milestone';

export interface TenderNote {
  id: string;
  author: string;
  date: string;
  text: string;
}

export interface TenderDocument {
  id: string;
  name: string;
  size: string;
  link: string;
}

export interface Tender {
  id: string;
  projectCode: string;
  tenderNumber: string;
  projectName: { en: string; ar: string };
  location: { en: string; ar: string };
  coordinator: { en: string; ar: string };
  contractsEngineer: { en: string; ar: string };
  tenderStudyEngineer?: { en: string; ar: string };
  department?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  techSubmissionDate: string;
  commSubmissionDate: string;
  overallSubmissionDate: string;
  closingDate?: string;
  kickOffDate?: string;
  alignmentDate?: string;
  followUpDate?: string;
  riskDueDate?: string;
  contractQualsDueDate?: string;
  projectStatus: { en: string; ar: string };
  awardStatus: { en: string; ar: string };
  recordStatus: 'Active' | 'Under Review' | 'Archived' | 'On Hold';
  daysRemaining: number;
  health: 'Healthy' | 'Due Soon' | 'Overdue' | 'Archived';
  estimatedValue: string;
  estimatedCost?: string;
  bondAmount: string;
  currency: string;
  tenderType: { en: string; ar: string };
  clientName: { en: string; ar: string };
  consultant?: { en: string; ar: string };
  branch?: { en: string; ar: string };
  businessUnit?: { en: string; ar: string };
  notes: TenderNote[];
  documents: TenderDocument[];
  checklistReceived?: boolean;
  checklistDrawings?: boolean;
  checklistBOQ?: boolean;
  checklistSpecs?: boolean;
  siteVisitRequired?: boolean;
  siteVisitDate?: string;
  technicalNotes?: string;
  milestones?: Milestone[];
}


export interface TimelineRules {
  kickOffOffset: number;
  riskAssessmentOffset: number;
  contractQualificationOffset: number;
  alignmentOffset: number;
  intermediateFollowUpOffset: number;
}

export interface WizardFormState {
  projectCode: string;
  tenderNumber: string;
  projectNameAr: string;
  projectNameEn: string;
  locationEn: string;
  locationAr: string;
  tenderTypeEn: string;
  tenderTypeAr: string;
  currency: string;
  estValue: string;
  estCost: string;
  clientEn: string;
  clientAr: string;
  consultantEn: string;
  consultantAr: string;
  branchEn: string;
  branchAr: string;
  businessUnitEn: string;
  businessUnitAr: string;
  coordinatorEn: string;
  coordinatorAr: string;
  contractsEngineerEn: string;
  contractsEngineerAr: string;
  tenderStudyEngineerEn: string;
  tenderStudyEngineerAr: string;
  departmentEn: string;
  departmentAr: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  techDate: string;
  commDate: string;
  officialDate: string;
  closingDate: string;
  kickOffDate: string;
  alignmentDate: string;
  followUpDate: string;
  riskDueDate: string;
  contractQualsDueDate: string;
  checklistReceived: boolean;
  checklistDrawings: boolean;
  checklistBOQ: boolean;
  checklistSpecs: boolean;
  siteVisitRequired: boolean;
  siteVisitDate: string;
  overriddenFields: {
    commDate?: boolean;
    kickOffDate?: boolean;
    alignmentDate?: boolean;
    followUpDate?: boolean;
    riskDueDate?: boolean;
    contractQualsDueDate?: boolean;
  };
}
