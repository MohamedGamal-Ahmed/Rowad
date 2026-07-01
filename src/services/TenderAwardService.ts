import { FinancialsCalculator } from '../business-rules/FinancialsCalculator';
import { Project, ProjectAttachment, ProjectLifecycleStage, ProjectStatus, ContractType } from '../domain/projects/Project';
import { RecordStatus } from '../enums/RecordStatus';
import { TenderMapper, LegacyTender } from '../mappers/TenderMapper';
import { BusinessEventRepository } from '../repositories/BusinessEventRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { TenderRepository } from '../repositories/TenderRepository';
import { Clock } from './Clock';
import { ProjectLookupService } from './ProjectLookupService';
import { TenderService } from './TenderService';
import { ProjectNumberGenerator } from '../domain/projects/ProjectNumberGenerator';
import { AwardConfirmationValidator } from '../validators/AwardConfirmationValidator';

interface AwardTenderResult {
  success: boolean;
  tender?: LegacyTender;
  project?: Project;
  alreadyAwarded?: boolean;
  errors: string[];
}

export class TenderAwardService {
  constructor(
    private tenderService: TenderService = new TenderService(),
    private tenderRepository: TenderRepository = new TenderRepository(),
    private projectRepository: ProjectRepository = new ProjectRepository(),
    private eventRepository: BusinessEventRepository = new BusinessEventRepository()
  ) {}

  public async awardLegacyTender(
    tender: LegacyTender,
    userId: string,
    signedContractValue: number,
    contractCurrency: string,
    awardDate: string,
    loaReferenceNumber: string,
    awardAttachments?: ProjectAttachment[]
  ): Promise<AwardTenderResult> {
    const guardErrors = this.validateAwardEligibility(
      tender,
      signedContractValue,
      contractCurrency,
      awardDate,
      loaReferenceNumber
    );
    if (guardErrors.length > 0) {
      return { success: false, errors: guardErrors };
    }

    const existingProject = await this.findExistingProject(tender);
    const awardedAt = awardDate || Clock.now().toISOString();
    const project = existingProject || this.buildProjectFromTender(
      tender,
      awardedAt,
      userId,
      signedContractValue,
      contractCurrency,
      loaReferenceNumber,
      awardAttachments
    );

    if (!existingProject) {
      const projectSaved = await this.projectRepository.save(project);
      if (!projectSaved) {
        return { success: false, errors: ['Project registration failed during Tender Award conversion.'] };
      }
      await this.transferTenderDocuments(tender, project.id, userId);
      await this.transferAwardAttachments(project, userId);
      await this.transferTenderHistory(tender, project.id, userId);
    }

    // NOTE (D-003): Award status is set directly here rather than routing through
    // TenderService.transitionTenderStatus().
    const awardedTender: LegacyTender = {
      ...tender,
      awardedProjectId: project.id,
      awardedAt,
      projectStatus: { en: 'Awarded', ar: 'تمت الترسية' },
      awardStatus: { en: 'Awarded to ROWAD', ar: 'تمت الترسية إلى رواد' },
      workflowStatus: 'Awarded',
      health: 'Archived'
    };

    const commitResult = await this.tenderService.commitLegacyTender(awardedTender);
    if (!commitResult.success) {
      return { success: false, errors: commitResult.errors };
    }

    await this.logAwardEvent(tender, project, userId, existingProject ? 'Existing Project Linked' : 'Tender Awarded');
    await ProjectLookupService.getInstance().refresh();

    return {
      success: true,
      tender: awardedTender,
      project,
      alreadyAwarded: Boolean(existingProject),
      errors: []
    };
  }

  public isTenderReadOnly(tender: Pick<LegacyTender, 'awardedProjectId' | 'awardStatus' | 'projectStatus'>): boolean {
    return Boolean(tender.awardedProjectId) ||
      tender.awardStatus.en === 'Awarded to ROWAD' ||
      tender.projectStatus.en === 'Awarded';
  }

  private validateAwardEligibility(
    tender: LegacyTender,
    signedContractValue: number,
    contractCurrency: string,
    awardDate: string,
    loaReferenceNumber: string
  ): string[] {
    let errors: string[] = [];

    if (this.isTenderReadOnly(tender)) {
      return errors;
    }

    if (tender.recordStatus === 'Archived') {
      errors.push('Archived tenders cannot be awarded.');
    }

    // Delegate to shared validator
    const validationErrors = AwardConfirmationValidator.validate(
      signedContractValue,
      contractCurrency,
      awardDate,
      loaReferenceNumber
    );
    errors = [...errors, ...validationErrors];

    const projectState = tender.projectStatus.en.toLowerCase();
    const awardState = tender.awardStatus.en.toLowerCase();
    const canAward =
      projectState.includes('submitted') ||
      awardState.includes('negotiation') ||
      awardState.includes('preferred bidder');

    if (!canAward) {
      errors.push('Award is allowed only after submission, preferred bidder selection, or negotiation.');
    }

    return errors;
  }

  private async findExistingProject(tender: LegacyTender): Promise<Project | undefined> {
    const projects = await this.projectRepository.getAll();
    return projects.find(project =>
      project.sourceTenderId === tender.id ||
      project.code === ProjectNumberGenerator.generateProjectCode(tender.projectCode) ||
      project.id === tender.awardedProjectId
    );
  }

  private buildProjectFromTender(
    tender: LegacyTender,
    awardedAt: string,
    userId: string,
    signedContractValue: number,
    contractCurrency: string,
    loaReferenceNumber: string,
    awardAttachments?: ProjectAttachment[]
  ): Project {
    const location = this.parseLocation(tender.location.en);
    const projectCode = ProjectNumberGenerator.generateProjectCode(tender.projectCode);

    return {
      id: `p-award-${tender.id}`,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: {
        createdBy: userId,
        createdAt: awardedAt
      },
      sourceTenderId: tender.id,
      sourceTenderNumber: ProjectNumberGenerator.preserveTenderReference(tender.tenderNumber),
      awardedAt,
      loaReferenceNumber,
      awardAttachments: awardAttachments || [],
      code: projectCode,
      nameEn: tender.projectName.en,
      nameAr: tender.projectName.ar,
      client: tender.clientName.en,
      employer: tender.clientName.en, // Decoupled; defaults to Client
      consultant: tender.consultant?.en || '',
      mainContractor: 'Rowad General Contracting',
      contractType: ContractType.LUMP_SUM, // Initial default
      signedContractValue: signedContractValue,
      revisedContractValue: signedContractValue,
      approvedVariationTotal: 0,
      approvedEotDays: 0,
      currency: contractCurrency,
      country: location.country,
      city: location.city,
      projectManager: tender.contractsEngineer.en,
      coordinator: tender.coordinator.en,
      department: tender.department || 'Contracts Administration',
      businessUnit: tender.businessUnit?.en || tender.department || 'Contracts Administration',
      startDate: '',
      completionDate: '',
      status: ProjectStatus.INACTIVE,
      lifecycleStage: ProjectLifecycleStage.PENDING_PROJECT_SETUP,
      isSetupComplete: false,
      commercialSettings: {
        contractCurrency: contractCurrency,
        baseCurrency: contractCurrency,
        exchangeRate: 1,
        exchangeRateDate: undefined,
        exchangeRateSource: 'Manual',
        retentionPercentage: 10,
        advancePaymentPercentage: 10,
        vatPercentage: 15,
        costCenterCode: 'CC-' + projectCode
      },
      calendarFoundation: {
        workingCalendar: '5-Day Week',
        holidayCalendar: 'Egypt Holidays',
        timeZone: 'Africa/Cairo',
        workingHours: '08:00-17:00',
        weekendPattern: 'Friday-Saturday'
      },
      projectOffice: {
        id: `po-p-award-${tender.id}`,
        projectId: `p-award-${tender.id}`,
        teamMembers: [
          {
            roleId: 'PM',
            employeeId: 'EMP-' + tender.contractsEngineer.en.replace(/\s+/g, '-'),
            assignedAt: awardedAt
          },
          {
            roleId: 'Coordinator',
            employeeId: 'EMP-' + tender.coordinator.en.replace(/\s+/g, '-'),
            assignedAt: awardedAt
          }
        ],
        delegations: [],
        distributionLists: [],
        approvalMatrix: []
      },
      description: this.buildAwardScopeDescription(tender)
    };
  }

  private parseLocation(location: string): { city: string; country: string } {
    const parts = location.split('-').map(part => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { city: parts[0], country: parts[parts.length - 1] };
    }
    return { city: location || 'Unspecified', country: location || 'Unspecified' };
  }

  private buildAwardScopeDescription(tender: LegacyTender): string {
    const scopeLines = [
      `Awarded from Tender ${tender.tenderNumber}.`,
      `Tender type: ${tender.tenderType.en}.`,
      `Original pre-award code: ${tender.projectCode}.`
    ];

    if (tender.notes.length > 0) {
      scopeLines.push(`Latest tender note: ${tender.notes[tender.notes.length - 1].text}`);
    }

    return scopeLines.join(' ');
  }

  private async transferTenderDocuments(tender: LegacyTender, projectId: string, userId: string): Promise<void> {
    for (const document of tender.documents) {
      const attachment: ProjectAttachment = {
        id: `att-award-${tender.id}-${document.id}`,
        projectId,
        entityType: 'Project',
        entityId: projectId,
        category: 'Tender Award Package',
        fileName: document.name,
        fileSize: document.size,
        uploadedBy: userId,
        uploadedDate: Clock.todayISO(),
        downloadUrl: document.link
      };
      await this.projectRepository.saveAttachment(attachment);
    }
  }

  /**
   * Migrates the attachments captured in the Award Confirmation wizard (LOA, Signed
   * Contract, Award Minutes, Clarifications, ...) into the project's canonical
   * attachment record (the same `ProjectAttachment` store used everywhere else in the
   * app — Documents/Attachments panels), then clears the transient carrier field on
   * the Project aggregate so the data has exactly one home (Part 1.4 / BUG: award
   * attachments were captured but never reached any document list — "disappearing" LOA).
   */
  private async transferAwardAttachments(project: Project, userId: string): Promise<void> {
    const pending = project.awardAttachments || [];
    for (const attachment of pending) {
      await this.projectRepository.saveAttachment({
        ...attachment,
        projectId: project.id,
        entityType: attachment.entityType || 'Project',
        entityId: attachment.entityId || project.id,
        category: attachment.category || 'Clarifications',
        sourceModule: attachment.sourceModule || 'Award Confirmation',
        uploadedBy: attachment.uploadedBy || userId
      });
    }

    if (pending.length > 0) {
      project.awardAttachments = [];
      await this.projectRepository.save(project);
    }
  }

  private async transferTenderHistory(tender: LegacyTender, projectId: string, userId: string): Promise<void> {
    await this.projectRepository.addHistory(
      projectId,
      'Tender Award Conversion',
      userId,
      `Created from Tender ${tender.tenderNumber}`,
      'Pre-Award',
      tender.id,
      tender.tenderNumber
    );

    const events = await this.eventRepository.getByTenderId(tender.id);
    for (const event of events) {
      await this.projectRepository.addHistory(
        projectId,
        event.action,
        event.userId,
        event.remarks,
        event.moduleId,
        event.entityId,
        tender.tenderNumber
      );
    }
  }

  private async logAwardEvent(
    tender: LegacyTender,
    project: Project,
    userId: string,
    action: string
  ): Promise<void> {
    const priorEvents = await this.eventRepository.getByTenderId(tender.id);
    const alreadyLogged = priorEvents.some(event =>
      event.action === action &&
      event.entityId === project.id
    );

    if (alreadyLogged) {
      return;
    }

    await this.eventRepository.logEvent({
      eventId: `event-award-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenderId: tender.id,
      timestamp: Clock.now().toISOString(),
      userId,
      source: 'User',
      moduleId: 'Pre-Award',
      entityType: 'Project',
      entityId: project.id,
      action,
      changedFields: ['projectStatus', 'awardStatus', 'awardedProjectId'],
      oldValue: TenderMapper.toDomain(tender).status.workflowStatus,
      newValue: 'Awarded',
      remarks: `Tender ${tender.tenderNumber} linked to Project ${project.code}.`
    });
  }
}
