import { Project, ProjectWorkflowState, ProjectAttachment } from '../Project';

export interface ActivationPolicyResult {
  readinessScore: number;
  passedPolicies: { name: string; details: string }[];
  failedPolicies: { name: string; errors: string[]; warnings: string[] }[];
  warnings: string[];
  errors: string[];
  activationAllowed: boolean;
  stepResults: {
    commercial: { pass: boolean; errors: string[]; warnings: string[] };
    schedule: { pass: boolean; errors: string[]; warnings: string[] };
    office: { pass: boolean; errors: string[]; warnings: string[] };
    documents: { pass: boolean; errors: string[]; warnings: string[] };
  };
}

export class ProjectActivationPolicy {
  /**
   * Evaluates Commercial parameters.
   * Contains the authoritative commercial validation rules.
   */
  public static evaluateCommercial(comm?: any): { errors: string[]; warnings: string[]; info: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    if (!comm) {
      errors.push('Commercial parameters are completely missing.');
      return { errors, warnings, info };
    }

    if (!comm.costCenterCode || !comm.costCenterCode.trim()) {
      errors.push('Cost Center is required.');
    }

    if (!comm.employer || !comm.employer.trim()) {
      errors.push('Employer Name is required.');
    }

    if (comm.retentionPercentage === undefined || comm.retentionPercentage < 0 || comm.retentionPercentage > 20) {
      errors.push('Retention % must be between 0 and 20.');
    }

    if (comm.advancePaymentPercentage === undefined || comm.advancePaymentPercentage < 0 || comm.advancePaymentPercentage > 30) {
      errors.push('Advance Payment % must be between 0 and 30.');
    }

    if (comm.vatPercentage === undefined || comm.vatPercentage < 0 || comm.vatPercentage > 50) {
      errors.push('VAT % must be between 0 and 50.');
    }

    if (comm.baseCurrency && comm.contractCurrency && comm.baseCurrency !== comm.contractCurrency) {
      if (!comm.exchangeRate || comm.exchangeRate <= 0) {
        errors.push('Exchange Rate must be greater than zero when Contract and Base currencies differ.');
      }
      if (!comm.exchangeRateDate) {
        errors.push('Exchange Rate Date is required when currencies differ.');
      }
      if (!comm.exchangeRateSource) {
        errors.push('Exchange Rate Source is required when currencies differ.');
      }
    }

    if (!comm.contractType) {
      errors.push('Contract Type is required.');
    }

    return { errors, warnings, info };
  }

  /**
   * Evaluates Schedule parameters.
   * Contains the authoritative schedule validation rules.
   */
  public static evaluateSchedule(sched?: any): { errors: string[]; warnings: string[]; info: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    if (!sched) {
      errors.push('Schedule parameters are missing.');
      return { errors, warnings, info };
    }

    if (!sched.startDate) {
      errors.push('Commencement Date is required.');
    }

    if (!sched.contractDurationDays || sched.contractDurationDays <= 0) {
      errors.push('Contract Duration must be a positive number of days.');
    }

    if (sched.mobilizationPeriodDays === undefined || sched.mobilizationPeriodDays < 0) {
      errors.push('Mobilization Period must be a non-negative number.');
    }

    if (!sched.workingCalendar) errors.push('Working Calendar is required.');
    if (!sched.holidayCalendar) errors.push('Holiday Calendar is required.');
    if (!sched.timeZone) errors.push('Time Zone is required.');
    if (!sched.workingHours) errors.push('Working Hours are required.');
    if (!sched.weekendPattern) errors.push('Weekend Pattern is required.');

    return { errors, warnings, info };
  }

  /**
   * Evaluates Project Office assignments.
   * Contains the authoritative team members validation rules.
   */
  public static evaluateOffice(office?: any): { errors: string[]; warnings: string[]; info: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    if (!office || !Array.isArray(office.teamMembers)) {
      errors.push('Project Office team list is missing.');
      return { errors, warnings, info };
    }

    const members = office.teamMembers;
    const hasPM = members.some((m: any) => m.roleId === 'PM' && m.employeeId && m.employeeId.trim());
    const hasSM = members.some((m: any) => m.roleId === 'SM' && m.employeeId && m.employeeId.trim());
    const hasCA = members.some((m: any) => m.roleId === 'CA' && m.employeeId && m.employeeId.trim());

    if (!hasPM) errors.push('Project Manager (PM) must be assigned.');
    if (!hasSM) errors.push('Site Manager (SM) must be assigned.');
    if (!hasCA) errors.push('Contract Administrator (CA) must be assigned.');

    if (members.length < 5) {
      warnings.push('Fewer than 5 members assigned to Project Office.');
    }

    return { errors, warnings, info };
  }

  /**
   * Evaluates Documents checklist and attachments.
   * Contains the authoritative document validation rules.
   */
  public static evaluateDocuments(
    docs?: any,
    requiredDocs: string[] = [],
    attachments: ProjectAttachment[] = []
  ): { errors: string[]; warnings: string[]; info: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    const checked = docs?.verifiedDocumentCategories || [];

    // Make attachment categories lookup set (case-insensitive and trimmed)
    const attachmentCats = new Set(
      attachments
        .filter(a => a.category)
        .map(a => a.category!.toLowerCase().trim())
    );

    requiredDocs.forEach(category => {
      const lowerCat = category.toLowerCase().trim();
      const isChecked = checked.some((c: string) => c.toLowerCase().trim() === lowerCat);
      const isAttached = attachmentCats.has(lowerCat);
                         
      if (!isChecked && !isAttached) {
        errors.push(`Mandatory document category "${category}" must be verified.`);
      }
    });

    return { errors, warnings, info };
  }

  /**
   * Evaluates ALL activation policies against the project aggregate, draft, and attachments in-memory.
   * This is the SINGLE authoritative validation engine.
   */
  public static evaluate(
    project: Project,
    draft: any | undefined,
    attachments: ProjectAttachment[],
    requiredDocCategories: string[]
  ): ActivationPolicyResult {
    const activeDraft = draft || project.setupDraft;
    const passedPolicies: { name: string; details: string }[] = [];
    const failedPolicies: { name: string; errors: string[]; warnings: string[] }[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Step-level validations
    const commRes = this.evaluateCommercial(activeDraft?.commercial);
    const schedRes = this.evaluateSchedule(activeDraft?.schedule);
    const officeRes = this.evaluateOffice(activeDraft?.office);
    const docRes = this.evaluateDocuments(activeDraft?.documents, requiredDocCategories, attachments);

    const stepResults = {
      commercial: { pass: commRes.errors.length === 0, errors: commRes.errors, warnings: commRes.warnings },
      schedule: { pass: schedRes.errors.length === 0, errors: schedRes.errors, warnings: schedRes.warnings },
      office: { pass: officeRes.errors.length === 0, errors: officeRes.errors, warnings: officeRes.warnings },
      documents: { pass: docRes.errors.length === 0, errors: docRes.errors, warnings: docRes.warnings }
    };

    // Calculate readinessScore: weighted sum of the 4 steps (25% each)
    let totalScore = 0;
    const scoreStep = (stepPass: boolean, stepWarnings: string[]) => {
      if (!stepPass) {
        return 0;
      }
      return Math.max(0, 25 - stepWarnings.length * 2);
    };

    totalScore += scoreStep(stepResults.commercial.pass, stepResults.commercial.warnings);
    totalScore += scoreStep(stepResults.schedule.pass, stepResults.schedule.warnings);
    totalScore += scoreStep(stepResults.office.pass, stepResults.office.warnings);
    totalScore += scoreStep(stepResults.documents.pass, stepResults.documents.warnings);

    // Administrative gates (block activation but do NOT affect 4-step readiness score)
    const adminErrors: string[] = [];
    
    // Check workflow state
    if (project.workflowState !== ProjectWorkflowState.PENDING_ACTIVATION) {
      const msg = `Project setup must be completed first (current state: ${project.workflowState || 'Draft'}).`;
      adminErrors.push(msg);
      failedPolicies.push({ name: 'Workflow State', errors: [msg], warnings: [] });
    } else {
      passedPolicies.push({ name: 'Workflow State', details: 'Project is in Pending Activation state.' });
    }

    // Check setup completeness flag
    if (!project.isSetupComplete) {
      const msg = 'Project setup is marked as incomplete.';
      adminErrors.push(msg);
      failedPolicies.push({ name: 'Setup Completeness', errors: [msg], warnings: [] });
    } else {
      passedPolicies.push({ name: 'Setup Completeness', details: 'Setup is marked complete.' });
    }

    if (!activeDraft) {
      const msg = 'No setup draft found.';
      adminErrors.push(msg);
      failedPolicies.push({ name: 'Setup Draft', errors: [msg], warnings: [] });
    } else {
      passedPolicies.push({ name: 'Setup Draft', details: 'Draft exists.' });
    }

    // Accumulate errors & warnings from steps
    const stepErrors = [
      ...commRes.errors,
      ...schedRes.errors,
      ...officeRes.errors,
      ...docRes.errors
    ];
    const stepWarnings = [
      ...commRes.warnings,
      ...schedRes.warnings,
      ...officeRes.warnings,
      ...docRes.warnings
    ];

    errors.push(...adminErrors, ...stepErrors);
    warnings.push(...stepWarnings);

    if (stepErrors.length === 0) {
      passedPolicies.push({ name: 'Wizard Steps Validation', details: 'All setup steps are valid.' });
    } else {
      failedPolicies.push({ name: 'Wizard Steps Validation', errors: stepErrors, warnings: stepWarnings });
    }

    return {
      readinessScore: Math.max(0, Math.min(100, Math.round(totalScore))),
      passedPolicies,
      failedPolicies,
      warnings,
      errors,
      activationAllowed: errors.length === 0,
      stepResults
    };
  }

  /**
   * Thin wrapper over evaluate() for callers that only need a boolean gate check.
   */
  public static canActivate(
    project: Project,
    requiredDocCategories: string[],
    attachments: ProjectAttachment[] = []
  ): { allowed: boolean; errors: string[] } {
    const result = ProjectActivationPolicy.evaluate(project, undefined, attachments, requiredDocCategories);
    return { allowed: result.activationAllowed, errors: result.errors };
  }
}
