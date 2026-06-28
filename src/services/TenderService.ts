import { Tender } from '../domain/pre-award/Tender';
import { TenderRepository } from '../repositories/TenderRepository';
import { TenderValidator } from '../validators/TenderValidator';
import { TimelineCalculator } from '../business-rules/TimelineCalculator';
import { HealthCalculator } from '../business-rules/HealthCalculator';
import { Settings } from '../domain/administration/Settings';
import { TimelineRules } from '../domain/administration/TimelineRules';
import { AppConstants } from '../constants/AppConstants';
import { TenderMapper, LegacyTender } from '../mappers/TenderMapper';
import { Clock } from './Clock';
import { MilestoneService } from './MilestoneService';
import { DEFAULT_MILESTONE_TEMPLATES } from '../constants/MilestoneTemplates';
import { RecordStatus } from '../enums/RecordStatus';

export class TenderService {
  private repository: TenderRepository;
  private healthCalc: HealthCalculator;

  constructor(
    repository: TenderRepository = new TenderRepository(),
    healthCalc: HealthCalculator = new HealthCalculator()
  ) {
    this.repository = repository;
    this.healthCalc = healthCalc;
  }

  /**
   * Retrieves all tenders, automatically solving calculated timeline markers and health flags on-the-fly.
   */
  public async getTenders(settings?: Settings): Promise<Tender[]> {
    const list = await this.repository.getAll();
    const activeRules = settings ? settings.timelineRules : this.getFallbackRules();
    const activeCalendar = settings ? settings.businessCalendar : undefined;
    const activeHealth = settings ? settings.healthSettings : undefined;
    const milestoneService = new MilestoneService();

    return list.map(tender => {
      // Initialize milestones if missing
      let milestones = tender.milestones || [];
      if (milestones.length === 0) {
        milestones = milestoneService.initializeMilestones(tender.id, 'tender', 'user-1', 'system');
      }

      // Solve dynamic timelines chronologically
      const calculatedTimeline = TimelineCalculator.calculateMilestones(
        tender.timeline.submission.techSubmissionDate,
        activeRules,
        activeCalendar
      );

      // Solve dynamic health indicator from milestones
      const recStatusArchived = tender.recordStatus === RecordStatus.ARCHIVED;
      const derivedHealth = HealthCalculator.calculateFromMilestones(
        milestones,
        DEFAULT_MILESTONE_TEMPLATES,
        tender.timeline.submission.techSubmissionDate,
        recStatusArchived,
        activeCalendar
      );

      return {
        ...tender,
        milestones,
        timeline: {
          ...tender.timeline,
          calculated: calculatedTimeline
        }
      };
    });
  }

  /**
   * Translates all active database domain aggregates into presentation legacy models to feed React.
   */
  public async getLegacyTenders(settings?: Settings): Promise<LegacyTender[]> {
    const domainTenders = await this.getTenders(settings);
    return domainTenders.map(t => TenderMapper.toLegacy(t));
  }

  /**
   * Accepts presentation models, performs mapping internally, and persists to repository.
   */
  public async commitLegacyTender(legacy: LegacyTender): Promise<{ success: boolean; errors: string[] }> {
    const domainTender = TenderMapper.toDomain(legacy);
    return await this.commitTender(domainTender);
  }

  /**
   * Validates and submits a tender aggregate into the database.
   */
  public async commitTender(tender: Tender): Promise<{ success: boolean; errors: string[] }> {
    const validation = TenderValidator.validate(tender);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const milestoneService = new MilestoneService();
    let milestones = tender.milestones || [];
    if (milestones.length === 0) {
      milestones = milestoneService.initializeMilestones(tender.id, 'tender', 'user-1', 'system');
    } else {
      const existingList = await this.repository.getAll();
      const existing = existingList.find(t => t.id === tender.id);
      if (existing && existing.timeline.submission.techSubmissionDate !== tender.timeline.submission.techSubmissionDate) {
        milestones = milestoneService.handleSubmissionDateChange(
          milestones,
          DEFAULT_MILESTONE_TEMPLATES,
          existing.timeline.submission.techSubmissionDate,
          tender.timeline.submission.techSubmissionDate,
          undefined,
          'system'
        );
      }
    }
    tender.milestones = milestones;

    const saved = await this.repository.save(tender);
    return { success: saved, errors: saved ? [] : ['PostgreSQL Storage Transaction Failure'] };
  }

  private getFallbackRules(): TimelineRules {
    return {
      kickOffOffset: AppConstants.OFFSETS.DEFAULT_KICKOFF,
      riskAssessmentOffset: AppConstants.OFFSETS.DEFAULT_RISK,
      contractQualificationOffset: AppConstants.OFFSETS.DEFAULT_QUALIFICATION,
      alignmentOffset: AppConstants.OFFSETS.DEFAULT_ALIGNMENT,
      intermediateFollowUpOffset: AppConstants.OFFSETS.DEFAULT_FOLLOW_UP
    };
  }
}
