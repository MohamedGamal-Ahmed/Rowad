import { FinancialsCalculator } from '../business-rules/FinancialsCalculator';
import { Project, ProjectAttachment } from '../domain/projects/Project';
import { RecordStatus } from '../enums/RecordStatus';
import { TenderMapper, LegacyTender } from '../mappers/TenderMapper';
import { BusinessEventRepository } from '../repositories/BusinessEventRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { TenderRepository } from '../repositories/TenderRepository';
import { Clock } from './Clock';
import { ProjectLookupService } from './ProjectLookupService';
import { TenderService } from './TenderService';

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

  public async awardLegacyTender(tender: LegacyTender, userId: string): Promise<AwardTenderResult> {
    const guardErrors = this.validateAwardEligibility(tender);
    if (guardErrors.length > 0) {
      return { success: false, errors: guardErrors };
    }

    const existingProject = await this.findExistingProject(tender);
    const awardedAt = tender.awardedAt || Clock.now().toISOString();
    const project = existingProject || this.buildProjectFromTender(tender, awardedAt, userId);

    if (!existingProject) {
      const projectSaved = await this.projectRepository.save(project);
      if (!projectSaved) {
        return { success: false, errors: ['Project registration failed during Tender Award conversion.'] };
      }
      await this.transferTenderDocuments(tender, project.id, userId);
      await this.transferTenderHistory(tender, project.id, userId);
    }

    // NOTE (D-003): Award status is set directly here rather than routing through
    // TenderService.transitionTenderStatus(). Reason: transitionTenderStatus() would
    // (a) reload the tender from the repository before awardedProjectId is persisted,
    // causing a stale-read; and (b) log a generic status-change BusinessEvent that
    // duplicates the richer award event logged by logAwardEvent() below.
    // The single canonical Award path is: awardLegacyTender() → validateAwardEligibility()
    // → buildProjectFromTender() → commitLegacyTender() → logAwardEvent().
    // TenderLifecycleValidator.isTransitionAllowed() is enforced via validateAwardEligibility().
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

  private validateAwardEligibility(tender: LegacyTender): string[] {
    const errors: string[] = [];

    if (this.isTenderReadOnly(tender)) {
      return errors;
    }

    if (tender.recordStatus === 'Archived') {
      errors.push('Archived tenders cannot be awarded.');
    }

    const value = FinancialsCalculator.parseToNumber(tender.estimatedValue);
    if (value <= 0) {
      errors.push('Award requires a valid non-zero estimated value.');
    }

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
      project.code === tender.projectCode ||
      project.id === tender.awardedProjectId
    );
  }

  private buildProjectFromTender(tender: LegacyTender, awardedAt: string, userId: string): Project {
    const location = this.parseLocation(tender.location.en);
    const contractValue = FinancialsCalculator.parseToNumber(tender.estimatedValue);

    return {
      id: `p-award-${tender.id}`,
      recordStatus: RecordStatus.ACTIVE,
      auditInfo: {
        createdBy: userId,
        createdAt: awardedAt
      },
      sourceTenderId: tender.id,
      sourceTenderNumber: tender.tenderNumber,
      awardedAt,
      code: tender.projectCode,
      nameEn: tender.projectName.en,
      nameAr: tender.projectName.ar,
      client: tender.clientName.en,
      employer: tender.clientName.en,
      consultant: tender.consultant?.en || '',
      mainContractor: 'Rowad General Contracting',
      contractType: tender.tenderType.en,
      signedContractValue: contractValue,
      revisedContractValue: contractValue,
      approvedVariationTotal: 0,
      approvedEotDays: 0,
      currency: tender.currency,
      country: location.country,
      city: location.city,
      projectManager: tender.contractsEngineer.en,
      coordinator: tender.coordinator.en,
      department: tender.department || 'Contracts Administration',
      businessUnit: tender.businessUnit?.en || tender.department || 'Contracts Administration',
      startDate: '',
      completionDate: '',
      status: 'Active',
      lifecycleStage: 'Awarded',
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
