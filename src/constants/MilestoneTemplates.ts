import { MilestoneTemplate } from '../domain/common/MilestoneTemplate';
import { MilestoneWorkflowState } from '../enums/MilestoneWorkflowState';

/**
 * Default Milestone Templates Registry
 * 
 * Pre-configured templates for the Pre-Award Tender module.
 * Future modules (Projects, Claims, IPC, VO, NOC, Procurement, RFI)
 * register their own templates without modifying this file.
 * 
 * Dependency Chain:
 *   Risk Assessment → Contract Qualifications → Technical Submission → Commercial Submission → Tender Submission
 * 
 * Health Weights sum to 100 across all mandatory milestones.
 */
export const DEFAULT_MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  {
    id: 'KICK_OFF',
    name: 'kickOff',
    displayName: { en: 'Internal Kick-off Meeting', ar: 'اجتماع انطلاق المشروع' },
    displayOrder: 1,
    offsetFromSubmission: -30,
    isMandatory: false,
    applicableTenderTypes: [],
    healthWeight: 0,
    canBeSkipped: true,
    defaultWorkflow: MilestoneWorkflowState.PENDING,
    dependsOn: [],
  },
  {
    id: 'RISK_ASSESSMENT',
    name: 'riskAssessment',
    displayName: { en: 'Risk Assessment Due', ar: 'موعد تقييم المخاطر' },
    displayOrder: 2,
    offsetFromSubmission: -20,
    isMandatory: true,
    applicableTenderTypes: [],
    healthWeight: 20,
    canBeSkipped: false,
    defaultWorkflow: MilestoneWorkflowState.PENDING,
    dependsOn: [],
  },
  {
    id: 'CONTRACT_QUALIFICATIONS',
    name: 'contractQualifications',
    displayName: { en: 'Contract Qualifications Due', ar: 'موعد تأهيل العقود' },
    displayOrder: 3,
    offsetFromSubmission: -15,
    isMandatory: true,
    applicableTenderTypes: [],
    healthWeight: 20,
    canBeSkipped: false,
    defaultWorkflow: MilestoneWorkflowState.PENDING,
    dependsOn: ['RISK_ASSESSMENT'],
  },
  {
    id: 'ALIGNMENT_MEETING',
    name: 'alignmentMeeting',
    displayName: { en: '1st Alignment Meeting', ar: 'اجتماع المطابقة والاصطفاف' },
    displayOrder: 4,
    offsetFromSubmission: -10,
    isMandatory: false,
    applicableTenderTypes: [],
    healthWeight: 0,
    canBeSkipped: true,
    defaultWorkflow: MilestoneWorkflowState.PENDING,
    dependsOn: [],
  },
  {
    id: 'INTERMEDIATE_FOLLOW_UP',
    name: 'intermediateFollowUp',
    displayName: { en: 'Intermediate Follow-up', ar: 'اجتماع المتابعة والتقدير' },
    displayOrder: 5,
    offsetFromSubmission: -5,
    isMandatory: false,
    applicableTenderTypes: [],
    healthWeight: 0,
    canBeSkipped: true,
    defaultWorkflow: MilestoneWorkflowState.PENDING,
    dependsOn: [],
  },
  {
    id: 'TECHNICAL_SUBMISSION',
    name: 'technicalSubmission',
    displayName: { en: 'Technical Submission', ar: 'تقديم العرض الفني' },
    displayOrder: 6,
    offsetFromSubmission: 0,
    isMandatory: true,
    applicableTenderTypes: [],
    healthWeight: 20,
    canBeSkipped: false,
    defaultWorkflow: MilestoneWorkflowState.PENDING,
    dependsOn: ['CONTRACT_QUALIFICATIONS'],
  },
  {
    id: 'COMMERCIAL_SUBMISSION',
    name: 'commercialSubmission',
    displayName: { en: 'Commercial Submission', ar: 'تقديم العرض المالي' },
    displayOrder: 7,
    offsetFromSubmission: null,
    isMandatory: true,
    applicableTenderTypes: [],
    healthWeight: 20,
    canBeSkipped: false,
    defaultWorkflow: MilestoneWorkflowState.PENDING,
    dependsOn: ['TECHNICAL_SUBMISSION'],
  },
  {
    id: 'TENDER_SUBMISSION',
    name: 'tenderSubmission',
    displayName: { en: 'Official Tender Submission', ar: 'التسليم الرسمي للمناقصة' },
    displayOrder: 8,
    offsetFromSubmission: null,
    isMandatory: true,
    applicableTenderTypes: [],
    healthWeight: 20,
    canBeSkipped: false,
    defaultWorkflow: MilestoneWorkflowState.PENDING,
    dependsOn: ['COMMERCIAL_SUBMISSION'],
  },
];
