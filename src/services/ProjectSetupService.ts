import { Project, ProjectSetupDraft, ProjectLifecycleStage, ProjectWorkflowState, ProjectStatus, SetupAuditEvent, ProjectAttachment } from '../domain/projects/Project';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { ISetupAuditRepository } from '../domain/contracts/ISetupAuditRepository';
import { LocalStorageSetupAuditRepository } from '../repositories/LocalStorageSetupAuditRepository';
import { IDocumentRequirementsProvider } from '../domain/projects/IDocumentRequirementsProvider';
import { ConfigurationDocumentRequirementsProvider } from './ConfigurationDocumentRequirementsProvider';
import { ProjectSetupValidationResult } from '../domain/projects/ProjectSetupValidationResult';
import { ProjectActivationPolicy, ActivationPolicyResult } from '../domain/projects/policies/ProjectActivationPolicy';
import { ProjectLookupService } from './ProjectLookupService';
import { Clock } from './Clock';
import { RecordStatus } from '../enums/RecordStatus';

export interface ActivationLogEntry {
  timestamp: string;
  stage: 'VALIDATION' | 'POLICY_CHECK' | 'COMPLETE_SETUP' | 'ACTIVATE' | 'PERSIST' | 'ERROR';
  message: string;
  details?: any;
}

export class ProjectSetupService {
  private sessionId: string;
  private activationLogs: ActivationLogEntry[] = [];

  constructor(
    private projectRepository: ProjectRepository = new ProjectRepository(),
    private auditRepository: ISetupAuditRepository = new LocalStorageSetupAuditRepository(),
    private docProvider: IDocumentRequirementsProvider = new ConfigurationDocumentRequirementsProvider()
  ) {
    let sess = sessionStorage.getItem('pmo_session_id');
    if (!sess) {
      sess = `session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      sessionStorage.setItem('pmo_session_id', sess);
    }
    this.sessionId = sess;
  }

  private log(stage: ActivationLogEntry['stage'], message: string, details?: any): void {
    const entry: ActivationLogEntry = {
      timestamp: Clock.now().toISOString(),
      stage,
      message,
      details,
    };
    this.activationLogs.push(entry);
    console.log(`[ActivationLog:${stage}] ${message}`, details || '');
  }

  public getActivationLogs(): ActivationLogEntry[] {
    return [...this.activationLogs];
  }

  public clearActivationLogs(): void {
    this.activationLogs = [];
  }

  /**
   * Resumes the existing setup draft for a project.
   *
   * Sprint 4A Persistence Hotfix — RULE 2 — PURE READ.
   * This method NEVER writes to the repository. If a draft exists on the
   * project it is returned as-is (with a defensive shallow normalization of
   * completedSteps in memory only). If no draft exists, a temporary
   * in-memory default draft is returned. The default is NOT persisted —
   * it becomes real only when the wizard's Save Draft roundtrip persists it
   * via saveDraft().
   */
  public async resumeDraft(projectId: string): Promise<ProjectSetupDraft> {
    console.log(`[RepositoryAudit] resumeDraft — getById(${projectId}) [read-only]`);
    const project = await this.projectRepository.getById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    if (project.setupDraft) {
      // In-memory normalization only — DO NOT persist.
      const stored = project.setupDraft;
      if (!Array.isArray(stored.completedSteps)) {
        return { ...stored, completedSteps: [] };
      }
      return stored;
    }

    // Hydrate from active Project aggregate fields if setup is already complete/activated
    if (project.workflowState === ProjectWorkflowState.ACTIVE || project.isSetupComplete === true) {
      const attachments = await this.projectRepository.getAttachments(projectId);
      const requiredDocs = this.docProvider.getRequiredDocuments();
      const attachmentCats = attachments
        .filter(a => a.category)
        .map(a => a.category!);

      const verifiedDocs = Array.from(new Set([
        ...requiredDocs,
        ...attachmentCats
      ]));

      return {
        projectId,
        currentStep: 0,
        lastSaved: project.auditInfo.createdAt || Clock.now().toISOString(),
        completedSteps: [1, 2, 3, 4],
        commercial: {
          baseCurrency: project.commercialSettings?.baseCurrency || 'EGP',
          contractCurrency: project.commercialSettings?.contractCurrency || project.currency || 'AED',
          exchangeRate: project.commercialSettings?.exchangeRate ?? 1,
          exchangeRateDate: project.commercialSettings?.exchangeRateDate,
          exchangeRateSource: project.commercialSettings?.exchangeRateSource || 'Manual',
          contractType: project.contractType || 'Lump Sum' as any,
          deliveryMethod: project.deliveryMethod,
          retentionPercentage: project.commercialSettings?.retentionPercentage ?? 10,
          advancePaymentPercentage: project.commercialSettings?.advancePaymentPercentage ?? 10,
          vatPercentage: project.commercialSettings?.vatPercentage ?? 15,
          costCenterCode: project.commercialSettings?.costCenterCode || '',
          employer: project.employer || project.client || 'Employer Default'
        },
        schedule: {
          startDate: project.startDate || '',
          contractDurationDays: project.contractDurationDays || 365,
          mobilizationPeriodDays: project.mobilizationPeriodDays || 30,
          workingCalendar: project.calendarFoundation?.workingCalendar || '5-Day Week',
          holidayCalendar: project.calendarFoundation?.holidayCalendar || 'Egypt Holidays',
          timeZone: project.calendarFoundation?.timeZone || 'Africa/Cairo',
          workingHours: project.calendarFoundation?.workingHours || '08:00-17:00',
          weekendPattern: project.calendarFoundation?.weekendPattern || 'Friday-Saturday'
        },
        office: {
          teamMembers: project.projectOffice?.teamMembers || []
        },
        documents: {
          verifiedDocumentCategories: verifiedDocs
        },
        review: {
          isCommercialValid: true,
          isScheduleValid: true,
          isOfficeValid: true,
          isDocsValid: true
        }
      };
    }

    // Temporary in-memory default. NOT persisted. Wizard is responsible for
    // upgrading this to a real stored draft via saveDraft() when the user
    // takes an action (Save Draft / advance step).
    const draft: ProjectSetupDraft = {
      projectId,
      currentStep: 0,
      lastSaved: Clock.now().toISOString(),
      completedSteps: [],
      commercial: {
        baseCurrency: project.currency || 'EGP',
        exchangeRate: 1,
        exchangeRateDate: undefined,
        exchangeRateSource: 'Manual',
        contractType: project.contractType || 'Lump Sum' as any,
        deliveryMethod: undefined,
        retentionPercentage: 10,
        advancePaymentPercentage: 10,
        vatPercentage: 15,
        costCenterCode: 'CC-' + project.code,
        employer: project.employer || project.client
      },
      schedule: {
        startDate: '',
        contractDurationDays: 365,
        mobilizationPeriodDays: 30,
        workingCalendar: '5-Day Week',
        holidayCalendar: 'Egypt Holidays',
        timeZone: 'Africa/Cairo',
        workingHours: '08:00-17:00',
        weekendPattern: 'Friday-Saturday'
      },
      office: {
        teamMembers: project.projectOffice?.teamMembers || []
      },
      documents: {
        verifiedDocumentCategories: []
      },
      review: {
        isCommercialValid: false,
        isScheduleValid: false,
        isOfficeValid: false,
        isDocsValid: false
      }
    };
    return draft;
  }

  /**
   * Saves the draft payload into the Project aggregate root and logs a step audit event.
   *
   * Sprint 4A Persistence Hotfix — RULE 1 (deterministic Save Draft pipeline):
   *   1. Load latest project from Repository (deep-cloned via getById).
   *   2. Replace ONLY setupDraft on that clone (aggregate root is untouched otherwise).
   *   3. Persist via Repository.save().
   *   4. Reload project via Repository.getById().
   *   5. Verify persisted draft matches the payload (currentStep + key data).
   *   6. Refresh ProjectLookupService cache so downstream views (Workspace,
   *      Dashboard, sidebar) never observe stale project data (RULE 4).
   *   7. Return true only if verification succeeded — otherwise false so the
   *      wizard shows "Save failed" instead of "Project Saved Successfully" (RULE 5).
   */
  public async saveDraft(projectId: string, draft: ProjectSetupDraft): Promise<boolean> {
    // Step 1 — load latest project
    console.log(`[RepositoryAudit] saveDraft — getById(${projectId})`);
    const project = await this.projectRepository.getById(projectId);
    if (!project) {
      console.warn(`[saveDraft] project ${projectId} not found — save aborted`);
      return false;
    }

    // Step 2 — replace only setupDraft
    project.setupDraft = draft;

    // Step 3 — persist
    console.log('[RepositoryAudit] saveDraft — Repository.save(project)');
    const saved = await this.projectRepository.save(project);
    if (!saved) {
      console.warn('[saveDraft] Repository.save returned false');
      return false;
    }

    // Step 4 — reload
    const reloaded = await this.projectRepository.getById(projectId);
    if (!reloaded || !reloaded.setupDraft) {
      console.warn('[saveDraft] verification failed — reloaded project has no setupDraft');
      return false;
    }

    // Step 5 — verify persisted draft matches payload on the key fields
    const persisted = reloaded.setupDraft;
    const verified =
      persisted.currentStep === draft.currentStep &&
      persisted.commercial?.contractCurrency === draft.commercial?.contractCurrency &&
      persisted.commercial?.costCenterCode === draft.commercial?.costCenterCode &&
      persisted.schedule?.startDate === draft.schedule?.startDate &&
      persisted.schedule?.contractDurationDays === draft.schedule?.contractDurationDays &&
      (persisted.office?.teamMembers?.length || 0) === (draft.office?.teamMembers?.length || 0) &&
      (persisted.documents?.verifiedDocumentCategories?.length || 0)
        === (draft.documents?.verifiedDocumentCategories?.length || 0);
    if (!verified) {
      console.warn('[saveDraft] verification failed — persisted draft does not match payload', {
        expected: {
          currentStep: draft.currentStep,
          startDate: draft.schedule?.startDate,
          docs: draft.documents?.verifiedDocumentCategories?.length
        },
        actual: {
          currentStep: persisted.currentStep,
          startDate: persisted.schedule?.startDate,
          docs: persisted.documents?.verifiedDocumentCategories?.length
        }
      });
      return false;
    }

    // Step 6 — refresh the shared cache so downstream views don't hand back
    // a pre-save copy of this project.
    try {
      await ProjectLookupService.getInstance().refresh();
    } catch (e) {
      // Refresh failure is non-fatal for persistence itself (data is on disk)
      // but log it so a stale-cache regression is visible.
      console.error('[saveDraft] cache refresh failed — persistence succeeded but cache may be stale', e);
    }

    // Step 7 — audit trail (only on verified success)
    let stepName: any = 'COMMERCIAL';
    if (draft.currentStep === 2) stepName = 'SCHEDULE';
    if (draft.currentStep === 3) stepName = 'OFFICE';
    if (draft.currentStep === 4) stepName = 'DOCUMENTS';
    if (draft.currentStep === 5) stepName = 'ACTIVATION';

    const corrId = `corr-save-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await this.logSetupAuditEvent(projectId, stepName, 'DRAFT_SAVED', JSON.stringify({
      currentStep: draft.currentStep,
      lastSaved: draft.lastSaved
    }), corrId);

    return true;
  }

  /**
   * Evaluates validations for all wizard steps and calculates a dynamic readiness score based on the current draft and attachments.
   */
  public validateDraft(draft: ProjectSetupDraft, attachments?: ProjectAttachment[]): {
    commercial: ProjectSetupValidationResult;
    schedule: ProjectSetupValidationResult;
    office: ProjectSetupValidationResult;
    documents: ProjectSetupValidationResult;
    readinessScore: number;
  } {
    const mockProject: Project = {
      id: draft.projectId,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: { createdBy: 'System', createdAt: '' },
      code: '',
      nameEn: '',
      client: '',
      employer: '',
      consultant: '',
      mainContractor: '',
      contractType: draft.commercial?.contractType as any,
      signedContractValue: 0,
      currency: draft.commercial?.contractCurrency || 'EGP',
      country: '',
      city: '',
      projectManager: '',
      coordinator: '',
      department: '',
      businessUnit: '',
      startDate: draft.schedule?.startDate || '',
      completionDate: '',
      status: ProjectStatus.INACTIVE,
      lifecycleStage: ProjectLifecycleStage.PENDING_PROJECT_SETUP,
      workflowState: ProjectWorkflowState.PENDING_ACTIVATION, // force pending activation so state check passes
      isSetupComplete: true, // force true so state check passes
      setupDraft: draft
    };

    const policyResult = ProjectActivationPolicy.evaluate(
      mockProject,
      draft,
      attachments || [],
      this.docProvider.getRequiredDocuments()
    );

    return {
      commercial: new ProjectSetupValidationResult(policyResult.stepResults.commercial.errors, policyResult.stepResults.commercial.warnings),
      schedule: new ProjectSetupValidationResult(policyResult.stepResults.schedule.errors, policyResult.stepResults.schedule.warnings),
      office: new ProjectSetupValidationResult(policyResult.stepResults.office.errors, policyResult.stepResults.office.warnings),
      documents: new ProjectSetupValidationResult(policyResult.stepResults.documents.errors, policyResult.stepResults.documents.warnings),
      readinessScore: policyResult.readinessScore
    };
  }

  /**
   * Evaluates the authoritative policy result for the project.
   * All UI components must consume this. No independent calculations.
   */
  public async evaluatePolicy(projectId: string): Promise<ActivationPolicyResult> {
    console.log(`[RepositoryAudit] calling Repository.getById(${projectId})`);
    const project = await this.projectRepository.getById(projectId);
    if (!project) {
      return {
        readinessScore: 0,
        passedPolicies: [],
        failedPolicies: [{ name: 'Project Not Found', errors: ['Project not found.'], warnings: [] }],
        warnings: [],
        errors: ['Project not found.'],
        activationAllowed: false,
        stepResults: {
          commercial: { pass: false, errors: ['Project not found.'], warnings: [] },
          schedule: { pass: false, errors: ['Project not found.'], warnings: [] },
          office: { pass: false, errors: ['Project not found.'], warnings: [] },
          documents: { pass: false, errors: ['Project not found.'], warnings: [] },
        },
      };
    }

    const attachments = await this.projectRepository.getAttachments(projectId);
    return ProjectActivationPolicy.evaluate(project, undefined, attachments, this.docProvider.getRequiredDocuments());
  }

  /**
   * Evaluates validations for all wizard steps and calculates a dynamic readiness score.
   */
  public async validateSteps(projectId: string): Promise<{
    commercial: ProjectSetupValidationResult;
    schedule: ProjectSetupValidationResult;
    office: ProjectSetupValidationResult;
    documents: ProjectSetupValidationResult;
    readinessScore: number;
  }> {
    const draft = await this.resumeDraft(projectId);
    const attachments = await this.projectRepository.getAttachments(projectId);
    return this.validateDraft(draft, attachments);
  }

  /**
   * Completes the administrative setup of the project, moving stage to Pending Activation.
   */
  public async completeSetup(projectId: string, draft: ProjectSetupDraft): Promise<{ success: boolean; errors: string[] }> {
    this.log('COMPLETE_SETUP', 'Starting completeSetup', { projectId, currentStep: draft.currentStep });

    console.log(`[RepositoryAudit] calling Repository.getById(${projectId})`);
    const project = await this.projectRepository.getById(projectId);
    if (!project) {
      this.log('ERROR', 'Project not found', { projectId });
      return { success: false, errors: ['Project not found.'] };
    }

    // Validate the PASSED draft (current UI state), not the stored one
    this.log('VALIDATION', 'Validating passed draft', { completedSteps: draft.completedSteps });
    const attachments = await this.projectRepository.getAttachments(projectId);
    const validations = this.validateDraft(draft, attachments);
    const allErrors = [
      ...validations.commercial.errors,
      ...validations.schedule.errors,
      ...validations.office.errors,
      ...validations.documents.errors
    ];

    if (allErrors.length > 0) {
      this.log('ERROR', 'Validation failed', { errors: allErrors });
      return { success: false, errors: allErrors };
    }

    this.log('VALIDATION', 'All validations passed');

    // Save the draft first, then transition
    project.setupDraft = draft;
    ActivationHandler.completeSetup(project);

    this.log('PERSIST', `Saving project with PENDING_ACTIVATION. Status: ${project.status}, Lifecycle: ${project.lifecycleStage}`);
    console.log('[RepositoryAudit] calling Repository.save(project)');
    const saved = await this.projectRepository.save(project);
    if (!saved) {
      this.log('ERROR', 'Failed to persist project setup status');
      return { success: false, errors: ['Failed to persist project setup status.'] };
    }

    // RULE 9: RELOAD AFTER SAVE
    console.log(`[RepositoryAudit] calling Repository.getById(${projectId})`);
    const reloaded = await this.projectRepository.getById(projectId);
    if (reloaded) {
      const corrId = `corr-complete-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await this.logSetupAuditEvent(projectId, 'ACTIVATION', 'SETUP_COMPLETED', 'Wizard steps validated and completed.', corrId);
      this.log('COMPLETE_SETUP', 'Setup completed successfully and reloaded');
    }

    return { success: !!reloaded, errors: reloaded ? [] : ['Failed to reload project setup status.'] };
  }

  /**
   * Activates the project, verifying policies and setting it to active execution.
   * Uses ProjectActivationPolicy.evaluate() as the authoritative gate.
   */
  public async activateProject(projectId: string): Promise<{ success: boolean; errors: string[]; policyResult?: ActivationPolicyResult }> {
    console.log(`[RepositoryAudit] calling Repository.getById(${projectId})`);
    let project = await this.projectRepository.getById(projectId);

    this.log('ACTIVATE', 'Starting activateProject', { projectId });
    this.clearActivationLogs();

    if (!project) {
      this.log('ERROR', 'Project not found', { projectId });
      return { success: false, errors: ['Project not found.'] };
    }

    this.log('VALIDATION', `Workflow before: ${project.workflowState || 'undefined'}, Lifecycle before: ${project.lifecycleStage || 'undefined'}, Status before: ${project.status || 'undefined'}, Draft exists: ${Boolean(project.setupDraft)}`);

    const attachments = await this.projectRepository.getAttachments(projectId);
    const requiredDocs = this.docProvider.getRequiredDocuments();

    // Use the authoritative evaluate() for rich logging
    const policyResult = ProjectActivationPolicy.evaluate(project, undefined, attachments, requiredDocs);
    this.log('POLICY_CHECK', 'Policy evaluation complete', {
      activationAllowed: policyResult.activationAllowed,
      readinessScore: policyResult.readinessScore,
      commercial: policyResult.stepResults.commercial.pass ? 'PASS' : 'FAIL',
      schedule: policyResult.stepResults.schedule.pass ? 'PASS' : 'FAIL',
      office: policyResult.stepResults.office.pass ? 'PASS' : 'FAIL',
      documents: policyResult.stepResults.documents.pass ? 'PASS' : 'FAIL'
    });

    if (!policyResult.activationAllowed) {
      this.log('ERROR', 'Activation blocked by policy', { errors: policyResult.errors });
      return { success: false, errors: policyResult.errors, policyResult };
    }

    const draft = project.setupDraft;
    if (!draft) {
      this.log('ERROR', 'Draft missing after policy pass — race condition');
      return { success: false, errors: ['No setup draft found.'], policyResult };
    }

    this.log('ACTIVATE', 'Applying baseline settings and transitioning states');
    ActivationHandler.activateProject(project, draft);

    this.log('PERSIST', `Saving activated project. Workflow target: ${project.workflowState}, Lifecycle target: ${project.lifecycleStage}, Status target: ${project.status}`);
    console.log('[RepositoryAudit] calling Repository.save(project)');
    const saved = await this.projectRepository.save(project);
    if (!saved) {
      this.log('ERROR', 'Failed to persist activated project');
      return { success: false, errors: ['Failed to activate project repository records.'], policyResult };
    }

    // RULE 9: RELOAD AFTER SAVE
    this.log('PERSIST', 'Reloading project from repository after save');
    console.log(`[RepositoryAudit] calling Repository.getById(${projectId})`);
    const reloadedProject = await this.projectRepository.getById(projectId);
    if (!reloadedProject) {
      this.log('ERROR', 'Failed to reload project after save');
      return { success: false, errors: ['Failed to reload project after save.'], policyResult };
    }

    // Verify transitions persisted correctly
    this.log('PERSIST', `Reload verification. Workflow after: ${reloadedProject.workflowState}, Lifecycle after: ${reloadedProject.lifecycleStage}, Status after: ${reloadedProject.status}, Draft exists: ${Boolean(reloadedProject.setupDraft)}`);

    const corrId = `corr-activate-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await this.logSetupAuditEvent(projectId, 'ACTIVATION', 'ACTIVATED', 'Project officially activated.', corrId);
    this.log('ACTIVATE', 'Project activated successfully');

    return {
      success: true,
      errors: [],
      policyResult,
    };
  }

  /**
   * Sourced dynamic config-driven list of required document types.
   */
  public getRequiredDocumentsList(): string[] {
    return this.docProvider.getRequiredDocuments();
  }

  /**
   * Saves a setup audit log event.
   */
  private async logSetupAuditEvent(
    projectId: string,
    step: 'COMMERCIAL' | 'SCHEDULE' | 'OFFICE' | 'DOCUMENTS' | 'ACTIVATION',
    action: 'DRAFT_SAVED' | 'STEP_COMPLETED' | 'SETUP_COMPLETED' | 'ACTIVATED',
    payload: string,
    correlationId: string
  ): Promise<void> {
    try {
      const event: SetupAuditEvent = {
        id: `setup-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        projectId,
        userId: 'Admin (Setup Engine)',
        // RECOVERED FROM TRUNCATED FILE — completes the .toISOString() call that was cut mid-word.
        timestamp: Clock.now().toISOString(),
        sessionId: this.sessionId,
        correlationId,
        step,
        action,
        payload
      };
      await this.auditRepository.save(event);
    } catch (e) {
      console.error('Failed to log setup audit event:', e);
    }
  }
}

// RECOVERED FROM TRUNCATED FILE — VERIFY
// Sole reason this class is being reintroduced: ProjectSetupService.completeSetup
// (line 354) and ProjectSetupService.activateProject (line 420) call
// ActivationHandler.completeSetup / .activateProject as static methods. Without
// this declaration esbuild fails ("Expected '}' but found end of file") because
// the tail of this file was previously truncated mid-word during a Cowork write.
//
// Transitions below are the exact set documented in CLAUDE.md §8 (Project
// Lifecycle) and ADR-014 (lifecycle / workflow / status separation):
//
//   completeSetup:
//     workflowState  → PENDING_ACTIVATION
//     status         → INACTIVE                    (unchanged from pre-state)
//     lifecycleStage → PENDING_PROJECT_SETUP       (unchanged from pre-state)
//     isSetupComplete → true
//
//   activateProject:
//     copy draft.commercial   → project.commercialSettings
//     copy draft.schedule     → project.calendarFoundation
//     copy draft.office.teamMembers → project.projectOffice.teamMembers
//     copy schedule dates     → project.startDate / mobilizationPeriodDays / contractDurationDays
//     compute project.completionDate = startDate + contractDurationDays
//     workflowState  → ACTIVE
//     status         → MOBILIZING
//     lifecycleStage → READY_FOR_MOBILIZATION
//     setupDraft     → undefined
//
// No new business rules. If any transition looks wrong, halt and cross-check
// against ADR-014 before shipping.
class ActivationHandler {
  public static completeSetup(project: Project): void {
    // RECOVERED FROM TRUNCATED FILE
    project.workflowState = ProjectWorkflowState.PENDING_ACTIVATION;
    project.status = ProjectStatus.INACTIVE;
    project.lifecycleStage = ProjectLifecycleStage.PENDING_PROJECT_SETUP;
    project.isSetupComplete = true;
  }

  public static activateProject(project: Project, draft: ProjectSetupDraft): void {
    // RECOVERED FROM TRUNCATED FILE
    const comm = draft.commercial!;
    const sched = draft.schedule!;
    const office = draft.office!;

    // Schedule baseline copy
    project.startDate = sched.startDate;
    project.contractDurationDays = sched.contractDurationDays;
    project.mobilizationPeriodDays = sched.mobilizationPeriodDays;

    if (sched.startDate) {
      try {
        const start = new Date(sched.startDate);
        start.setDate(start.getDate() + sched.contractDurationDays);
        project.completionDate = start.toISOString().split('T')[0];
        project.contractualCompletionDate = project.completionDate;
      } catch (_e) {
        project.completionDate = '';
      }
    }

    // Project Office copy (preserves any pre-existing metadata fields on the aggregate)
    project.projectOffice = {
      id: project.projectOffice?.id || `po-${project.id}`,
      projectId: project.id,
      teamMembers: office.teamMembers,
      delegations: project.projectOffice?.delegations || [],
      distributionLists: project.projectOffice?.distributionLists || [],
      approvalMatrix: project.projectOffice?.approvalMatrix || []
    };

    // Commercial promotion
    project.employer = comm.employer;
    project.contractType = comm.contractType as any;
    project.deliveryMethod = comm.deliveryMethod;
    project.commercialSettings = {
      contractCurrency: project.currency,
      baseCurrency: comm.baseCurrency,
      exchangeRate: comm.exchangeRate,
      exchangeRateDate: comm.exchangeRateDate,
      exchangeRateSource: comm.exchangeRateSource,
      retentionPercentage: comm.retentionPercentage,
      advancePaymentPercentage: comm.advancePaymentPercentage,
      vatPercentage: comm.vatPercentage,
      costCenterCode: comm.costCenterCode
    };

    // Calendar baseline
    project.calendarFoundation = {
      workingCalendar: sched.workingCalendar,
      holidayCalendar: sched.holidayCalendar,
      timeZone: sched.timeZone,
      workingHours: sched.workingHours,
      weekendPattern: sched.weekendPattern
    };

    // Lifecycle transitions (ADR-014, CLAUDE.md §8)
    project.workflowState = ProjectWorkflowState.ACTIVE;
    project.status = ProjectStatus.MOBILIZING;
    project.lifecycleStage = ProjectLifecycleStage.READY_FOR_MOBILIZATION;

    // Setup complete — draft graduates into aggregate fields
    project.setupDraft = undefined;
  }
}

