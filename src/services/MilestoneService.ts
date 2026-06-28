import { Milestone } from '../domain/common/Milestone';
import { MilestoneTemplate } from '../domain/common/MilestoneTemplate';
import { MilestoneWorkflowState } from '../enums/MilestoneWorkflowState';
import { DEFAULT_MILESTONE_TEMPLATES } from '../constants/MilestoneTemplates';
import { MilestoneBusinessRules } from '../business-rules/MilestoneBusinessRules';
import { AuditService } from './AuditService';
import { Clock } from './Clock';
import { BusinessCalendar } from '../domain/administration/Settings';
import { MilestoneAuditEntry } from '../domain/common/MilestoneAuditEntry';

/**
 * Milestone Service
 * 
 * Orchestrates milestone lifecycles, workflow transitions, dependency validations,
 * and immutable audit trail logging.
 * 
 * Completely generic and reusable across all domain modules.
 */
export class MilestoneService {
  private auditService: AuditService;

  constructor(auditService: AuditService = AuditService.getInstance()) {
    this.auditService = auditService;
  }

  /**
   * Initializes milestone instances for a parent entity from templates.
   */
  public initializeMilestones(
    parentId: string,
    parentType: Milestone['parentType'],
    responsibleUserId: string = 'user-1',
    creatorId: string = 'system'
  ): Milestone[] {
    const timestamp = Clock.now().toISOString();
    return DEFAULT_MILESTONE_TEMPLATES.map(template => {
      const milestoneId = `ms-${parentId}-${template.id}`;
      const newMilestone: Milestone = {
        id: milestoneId,
        parentId,
        parentType,
        templateId: template.id,
        workflowState: template.defaultWorkflow,
        isCompleted: false,
        completedDate: null,
        responsibleUserId,
        verificationStatus: 'pending',
        verifiedByUserId: '',
        verifiedAt: null,
        verificationNotes: '',
        notes: '',
        auditHistory: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Add creation audit entry
      this.addAuditEntry(
        newMilestone,
        'Milestone Created',
        creatorId,
        undefined,
        template.id
      );

      return newMilestone;
    });
  }

  /**
   * Records submission date changes and triggers due date recalculation audit entries.
   */
  public handleSubmissionDateChange(
    milestones: Milestone[],
    templates: MilestoneTemplate[],
    previousSubmissionDate: string,
    newSubmissionDate: string,
    calendar: BusinessCalendar | undefined,
    actorId: string
  ): Milestone[] {
    if (previousSubmissionDate === newSubmissionDate) {
      return milestones;
    }

    const timestamp = Clock.now().toISOString();
    return milestones.map(m => {
      const template = templates.find(t => t.id === m.templateId);
      if (!template || template.offsetFromSubmission === null) {
        return m; // Manual date milestones don't change
      }

      const prevDueDate = MilestoneBusinessRules.calculateMilestoneDueDate(
        previousSubmissionDate,
        template,
        calendar
      );
      const newDueDate = MilestoneBusinessRules.calculateMilestoneDueDate(
        newSubmissionDate,
        template,
        calendar
      );

      if (prevDueDate === newDueDate) {
        return m;
      }

      const updatedMilestone = { ...m, updatedAt: timestamp };
      
      this.addAuditEntry(
        updatedMilestone,
        'Submission Date Changed',
        actorId,
        previousSubmissionDate,
        newSubmissionDate
      );

      this.addAuditEntry(
        updatedMilestone,
        'Due Date Recalculated',
        actorId,
        prevDueDate || 'None',
        newDueDate || 'None'
      );

      // Log globally
      this.auditService.record(
        'Due Date Recalculated',
        m.id,
        actorId,
        prevDueDate || undefined,
        newDueDate || undefined,
        { parentId: m.parentId, templateId: m.templateId }
      );

      return updatedMilestone;
    });
  }

  /**
   * Transitions a milestone's workflow state with validation.
   */
  public async transitionWorkflow(
    milestone: Milestone,
    toState: MilestoneWorkflowState,
    allMilestones: Milestone[],
    templates: MilestoneTemplate[],
    actorId: string,
    completedDate: string = Clock.todayISO()
  ): Promise<{ success: boolean; errors: string[]; updatedMilestone: Milestone }> {
    const template = templates.find(t => t.id === milestone.templateId);
    if (!template) {
      return { success: false, errors: ['Milestone template not found'], updatedMilestone: milestone };
    }

    // 1. Validate state transition
    const transitionVal = MilestoneBusinessRules.validateWorkflowTransition(milestone.workflowState, toState);
    if (!transitionVal.isValid) {
      return { success: false, errors: transitionVal.errors, updatedMilestone: milestone };
    }

    // 2. Validate dependencies if completing
    if (toState === MilestoneWorkflowState.COMPLETED) {
      const depVal = MilestoneBusinessRules.validateDependencies(milestone, template, allMilestones, templates);
      if (!depVal.isValid) {
        return { success: false, errors: depVal.messages, updatedMilestone: milestone };
      }
    }

    const timestamp = Clock.now().toISOString();
    const prevWorkflowState = milestone.workflowState;

    const updatedMilestone: Milestone = {
      ...milestone,
      workflowState: toState,
      updatedAt: timestamp
    };

    let auditAction: MilestoneAuditEntry['action'] = 'Milestone Started';
    if (toState === MilestoneWorkflowState.STARTED) {
      auditAction = 'Milestone Started';
    } else if (toState === MilestoneWorkflowState.COMPLETED) {
      auditAction = 'Milestone Completed';
      updatedMilestone.isCompleted = true;
      updatedMilestone.completedDate = completedDate;
    } else if (toState === MilestoneWorkflowState.VERIFIED) {
      auditAction = 'Milestone Verified';
      updatedMilestone.verificationStatus = 'verified';
      updatedMilestone.verifiedAt = timestamp;
      updatedMilestone.verifiedByUserId = actorId;
    }

    // Log internally
    this.addAuditEntry(
      updatedMilestone,
      auditAction,
      actorId,
      prevWorkflowState,
      toState
    );

    // Log globally
    await this.auditService.record(
      auditAction as any,
      milestone.id,
      actorId,
      prevWorkflowState,
      toState,
      { parentId: milestone.parentId, templateId: milestone.templateId }
    );

    return { success: true, errors: [], updatedMilestone };
  }

  /**
   * Reopens a completed/verified milestone.
   */
  public async reopenMilestone(
    milestone: Milestone,
    actorId: string
  ): Promise<{ success: boolean; errors: string[]; updatedMilestone: Milestone }> {
    const timestamp = Clock.now().toISOString();
    const prevWorkflowState = milestone.workflowState;

    const updatedMilestone: Milestone = {
      ...milestone,
      workflowState: MilestoneWorkflowState.PENDING,
      isCompleted: false,
      completedDate: null,
      verificationStatus: 'pending',
      verifiedByUserId: '',
      verifiedAt: null,
      updatedAt: timestamp
    };

    this.addAuditEntry(
      updatedMilestone,
      'Milestone Reopened',
      actorId,
      prevWorkflowState,
      MilestoneWorkflowState.PENDING
    );

    await this.auditService.record(
      'Status Change',
      milestone.id,
      actorId,
      prevWorkflowState,
      MilestoneWorkflowState.PENDING,
      { parentId: milestone.parentId, action: 'Reopened' }
    );

    return { success: true, errors: [], updatedMilestone };
  }

  /**
   * Updates the responsible user for a milestone.
   */
  public async updateResponsibleUser(
    milestone: Milestone,
    newUserId: string,
    actorId: string
  ): Promise<Milestone> {
    const timestamp = Clock.now().toISOString();
    const prevUser = milestone.responsibleUserId;

    if (prevUser === newUserId) {
      return milestone;
    }

    const updatedMilestone: Milestone = {
      ...milestone,
      responsibleUserId: newUserId,
      updatedAt: timestamp
    };

    this.addAuditEntry(
      updatedMilestone,
      'Responsible User Changed',
      actorId,
      prevUser,
      newUserId
    );

    await this.auditService.record(
      'Status Change',
      milestone.id,
      actorId,
      prevUser,
      newUserId,
      { parentId: milestone.parentId, action: 'Responsible User Changed' }
    );

    return updatedMilestone;
  }

  /**
   * Performs verification on a completed milestone (Approval Engine ready).
   */
  public async verifyMilestone(
    milestone: Milestone,
    status: 'verified' | 'rejected',
    verifierId: string,
    notes: string
  ): Promise<Milestone> {
    const timestamp = Clock.now().toISOString();
    const prevStatus = milestone.verificationStatus;

    const updatedMilestone: Milestone = {
      ...milestone,
      verificationStatus: status,
      verifiedByUserId: verifierId,
      verifiedAt: timestamp,
      verificationNotes: notes,
      updatedAt: timestamp
    };

    // If verified, transition state automatically to VERIFIED if allowed
    if (status === 'verified') {
      updatedMilestone.workflowState = MilestoneWorkflowState.VERIFIED;
    } else if (status === 'rejected') {
      // Revert to Started so it can be completed again
      updatedMilestone.workflowState = MilestoneWorkflowState.STARTED;
      updatedMilestone.isCompleted = false;
      updatedMilestone.completedDate = null;
    }

    this.addAuditEntry(
      updatedMilestone,
      'Verification Status Changed',
      verifierId,
      prevStatus,
      status,
      { notes }
    );

    await this.auditService.record(
      'Status Change',
      milestone.id,
      verifierId,
      prevStatus,
      status,
      { parentId: milestone.parentId, action: `Verified as ${status}`, notes }
    );

    return updatedMilestone;
  }

  /**
   * Helper to append an audit entry into a milestone's internal log.
   */
  private addAuditEntry(
    milestone: Milestone,
    action: MilestoneAuditEntry['action'],
    actor: string,
    previousValue?: string,
    newValue?: string,
    metadata?: Record<string, any>
  ): void {
    const entry: MilestoneAuditEntry = {
      id: `ms-audit-${Clock.now().getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      actor,
      timestamp: Clock.now().toISOString(),
      previousValue,
      newValue,
      metadata
    };
    milestone.auditHistory.push(entry);
  }
}
