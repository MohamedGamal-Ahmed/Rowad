import { Tender as NewTender } from '../domain/pre-award/Tender';
import { Priority } from '../enums/Priority';
import { RecordStatus } from '../enums/RecordStatus';
import { WorkflowStatus } from '../enums/WorkflowStatus';
import { Currency } from '../enums/Currency';
import { Money } from '../domain/common/Money';
import { Clock } from '../services/Clock';
import { HealthCalculator } from '../business-rules/HealthCalculator';
import { HealthStatus } from '../enums/HealthStatus';
import { Milestone } from '../domain/common/Milestone';
import { DEFAULT_MILESTONE_TEMPLATES } from '../constants/MilestoneTemplates';
import { baselineEmployees } from '../domain/master/MasterData';

// Explicit Legacy Tender interface to map against
export interface LegacyTender {
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
  notes: Array<{ id: string; author: string; date: string; text: string }>;
  documents: Array<{ id: string; name: string; size: string; link: string }>;
  checklistReceived?: boolean;
  checklistDrawings?: boolean;
  checklistBOQ?: boolean;
  checklistSpecs?: boolean;
  siteVisitRequired?: boolean;
  siteVisitDate?: string;
  milestones?: Milestone[];
  assignments?: any[];
  businessEvents?: any[];
}

export class TenderMapper {
  private static parseAmount(valStr: string | undefined): number {
    if (!valStr) return 0;
    const clean = valStr.replace(/[^\d.]/g, '');
    return parseFloat(clean) || 0;
  }

  private static formatAmount(amount: number, currency: string): string {
    return `${currency} ${amount.toLocaleString('en-US')}`;
  }

  private static mapPriority(priorityStr: string | undefined): Priority {
    switch (priorityStr) {
      case 'Critical': return Priority.CRITICAL;
      case 'High': return Priority.HIGH;
      case 'Medium': return Priority.MEDIUM;
      case 'Low': return Priority.LOW;
      default:
        return Priority.MEDIUM;
    }
  }

  private static mapWorkflowStatus(projectStatus: string | undefined, awardStatus: string | undefined): WorkflowStatus {
    const proj = projectStatus?.toLowerCase() || '';
    const aw = awardStatus?.toLowerCase() || '';

    if (aw.includes('awarded')) return WorkflowStatus.AWARDED;
    if (aw.includes('lost')) return WorkflowStatus.LOST;
    if (aw.includes('under negotiation')) return WorkflowStatus.UNDER_NEGOTIATION;
    
    if (proj.includes('ready') || proj.includes('submission')) return WorkflowStatus.READY_FOR_SUBMISSION;
    if (proj.includes('preparing')) return WorkflowStatus.UNDER_STUDY;
    if (proj.includes('draft')) return WorkflowStatus.DRAFT;
    if (proj.includes('cancel')) return WorkflowStatus.CANCELLED;

    return WorkflowStatus.UNDER_STUDY;
  }

  public static toDomain(legacy: LegacyTender): NewTender {
    const currency = (legacy.currency as Currency) || Currency.AED;

    const estimatedValueMoney: Money = {
      amount: this.parseAmount(legacy.estimatedValue),
      currency
    };

    const estimatedCostMoney: Money | undefined = legacy.estimatedCost 
      ? { amount: this.parseAmount(legacy.estimatedCost), currency }
      : undefined;

    const bondAmountMoney: Money = {
      amount: this.parseAmount(legacy.bondAmount),
      currency
    };

    const workflowStatus = this.mapWorkflowStatus(legacy.projectStatus?.en, legacy.awardStatus?.en);

    const mappedRecordStatus = legacy.recordStatus === 'Archived' 
      ? RecordStatus.ARCHIVED 
      : RecordStatus.ACTIVE;

    return {
      id: legacy.id,
      recordStatus: mappedRecordStatus,
      projectCode: legacy.projectCode,
      tenderNumber: legacy.tenderNumber,
      projectName: legacy.projectName,
      general: {
        location: legacy.location,
        priority: this.mapPriority(legacy.priority),
        department: legacy.department || 'Pre-Award Civil Core',
        clientName: legacy.clientName,
        consultant: legacy.consultant,
        branch: legacy.branch,
        businessUnit: legacy.businessUnit,
        tenderType: legacy.tenderType
      },
      timeline: {
        submission: {
          techSubmissionDate: legacy.techSubmissionDate,
          commSubmissionDate: legacy.commSubmissionDate,
          overallSubmissionDate: legacy.overallSubmissionDate,
          closingDate: legacy.closingDate
        },
        internal: {
          siteVisitRequired: legacy.siteVisitRequired,
          siteVisitDate: legacy.siteVisitDate
        },
        calculated: {
          kickOffDate: legacy.kickOffDate,
          alignmentDate: legacy.alignmentDate,
          followUpDate: legacy.followUpDate,
          riskDueDate: legacy.riskDueDate,
          contractQualsDueDate: legacy.contractQualsDueDate
        }
      },
      financials: {
        estimatedValue: estimatedValueMoney,
        estimatedCost: estimatedCostMoney,
        bondAmount: bondAmountMoney
      },
      status: {
        recordStatus: mappedRecordStatus,
        workflowStatus,
        projectStatus: legacy.projectStatus,
        awardStatus: legacy.awardStatus
      },
      checklist: {
        checklistReceived: legacy.checklistReceived,
        checklistDrawings: legacy.checklistDrawings,
        checklistBOQ: legacy.checklistBOQ,
        checklistSpecs: legacy.checklistSpecs
      },
      documents: legacy.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
        link: doc.link
      })),
      notes: legacy.notes.map(note => ({
        id: note.id,
        author: note.author,
        date: note.date,
        text: note.text
      })),
      milestones: legacy.milestones || []
    };
  }

  public static toLegacy(domain: NewTender): LegacyTender {
    const rawCurrency = domain.financials.estimatedValue.currency;

    let priorityStr: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
    if (domain.general.priority === Priority.CRITICAL) priorityStr = 'Critical';
    else if (domain.general.priority === Priority.HIGH) priorityStr = 'High';
    else if (domain.general.priority === Priority.MEDIUM) priorityStr = 'Medium';
    else if (domain.general.priority === Priority.LOW) priorityStr = 'Low';

    let recStatus: 'Active' | 'Under Review' | 'Archived' | 'On Hold' = 'Active';
    if (domain.status.recordStatus === RecordStatus.ARCHIVED) {
      recStatus = 'Archived';
    } else {
      // Intelligently maps to support backward compatibility
      if (domain.status.workflowStatus === WorkflowStatus.DRAFT) {
        recStatus = 'Under Review';
      }
    }

    // Days remaining and Health will be dynamically computed during UI integration,
    // but we support populating default fallback legacy values here.
    const daysRemaining = Clock.diffInDays(domain.timeline.submission.techSubmissionDate);
    const calculatedHealth = HealthCalculator.calculateFromMilestones(
      domain.milestones || [],
      DEFAULT_MILESTONE_TEMPLATES,
      domain.timeline.submission.techSubmissionDate,
      recStatus === 'Archived'
    );
    
    let healthStr: 'Healthy' | 'Due Soon' | 'Overdue' | 'Archived' = 'Healthy';
    if (calculatedHealth === HealthStatus.ARCHIVED) {
      healthStr = 'Archived';
    } else if (calculatedHealth === HealthStatus.OVERDUE) {
      healthStr = 'Overdue';
    } else if (calculatedHealth === HealthStatus.DUE_SOON) {
      healthStr = 'Due Soon';
    }

    // TODO: Remove after Backend Migration
    const getLegacyAssignments = (tenderId: string) => {
      try {
        const raw = localStorage.getItem('preaward_assignments_db');
        if (raw) {
          const list: any[] = JSON.parse(raw);
          return list.filter(a => a.tenderId === tenderId && a.status === 'Active');
        }
      } catch (e) {}
      return [];
    };

    // TODO: Remove after Backend Migration
    const getEmployeeName = (empId: string | undefined) => {
      if (!empId) return { en: 'Unassigned', ar: 'غير معين' };
      try {
        const raw = localStorage.getItem('master_employees');
        if (raw) {
          const list: any[] = JSON.parse(raw);
          const emp = list.find(e => e.id === empId);
          if (emp) return { en: emp.nameEn, ar: emp.nameAr };
        }
      } catch (e) {}
      const baseline = baselineEmployees.find(e => e.id === empId);
      if (baseline) return { en: baseline.nameEn, ar: baseline.nameAr };
      return { en: 'Unassigned', ar: 'غير معين' };
    };

    const activeAssignments = getLegacyAssignments(domain.id);
    const coordAsg = activeAssignments.find(a => a.roleId === 'role-coordinator');
    const contractsAsg = activeAssignments.find(a => a.roleId === 'role-contracts-eng');
    const studyAsg = activeAssignments.find(a => a.roleId === 'role-study-eng');

    const coordinator = getEmployeeName(coordAsg?.employeeId);
    const contractsEngineer = getEmployeeName(contractsAsg?.employeeId);
    const tenderStudyEngineer = getEmployeeName(studyAsg?.employeeId);

    const getTenderAssignments = () => {
      try {
        const raw = localStorage.getItem('preaward_assignments_db');
        if (raw) {
          const list: any[] = JSON.parse(raw);
          return list.filter(a => a.tenderId === domain.id);
        }
      } catch (e) {}
      return [];
    };

    const getTenderEvents = () => {
      try {
        const raw = localStorage.getItem('preaward_business_events_db');
        if (raw) {
          const list: any[] = JSON.parse(raw);
          return list.filter(e => e.tenderId === domain.id);
        }
      } catch (e) {}
      return [];
    };

    return {
      id: domain.id,
      projectCode: domain.projectCode,
      tenderNumber: domain.tenderNumber,
      projectName: domain.projectName,
      location: domain.general.location,
      coordinator, // TODO: Remove after Backend Migration
      contractsEngineer, // TODO: Remove after Backend Migration
      tenderStudyEngineer, // TODO: Remove after Backend Migration
      department: domain.general.department,
      priority: priorityStr,
      techSubmissionDate: domain.timeline.submission.techSubmissionDate,
      commSubmissionDate: domain.timeline.submission.commSubmissionDate,
      overallSubmissionDate: domain.timeline.submission.overallSubmissionDate,
      closingDate: domain.timeline.submission.closingDate,
      kickOffDate: domain.timeline.calculated.kickOffDate,
      alignmentDate: domain.timeline.calculated.alignmentDate,
      followUpDate: domain.timeline.calculated.followUpDate,
      riskDueDate: domain.timeline.calculated.riskDueDate,
      contractQualsDueDate: domain.timeline.calculated.contractQualsDueDate,
      projectStatus: domain.status.projectStatus,
      awardStatus: domain.status.awardStatus,
      recordStatus: recStatus,
      daysRemaining: isNaN(daysRemaining) ? 0 : daysRemaining,
      health: healthStr,
      estimatedValue: this.formatAmount(domain.financials.estimatedValue.amount, rawCurrency),
      estimatedCost: domain.financials.estimatedCost 
        ? this.formatAmount(domain.financials.estimatedCost.amount, rawCurrency)
        : undefined,
      bondAmount: this.formatAmount(domain.financials.bondAmount.amount, rawCurrency),
      currency: rawCurrency,
      tenderType: domain.general.tenderType,
      clientName: domain.general.clientName,
      consultant: domain.general.consultant,
      branch: domain.general.branch,
      businessUnit: domain.general.businessUnit,
      notes: domain.notes,
      documents: domain.documents,
      checklistReceived: domain.checklist.checklistReceived,
      checklistDrawings: domain.checklist.checklistDrawings,
      checklistBOQ: domain.checklist.checklistBOQ,
      checklistSpecs: domain.checklist.checklistSpecs,
      siteVisitRequired: domain.timeline.internal.siteVisitRequired,
      siteVisitDate: domain.timeline.internal.siteVisitDate,
      milestones: domain.milestones || [],
      assignments: getTenderAssignments(),
      businessEvents: getTenderEvents()
    };
  }
}
