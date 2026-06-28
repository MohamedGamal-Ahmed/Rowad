import { HealthStatus } from '../enums/HealthStatus';
import { HealthSettings, BusinessCalendar } from '../domain/administration/Settings';
import { Milestone } from '../domain/common/Milestone';
import { MilestoneTemplate } from '../domain/common/MilestoneTemplate';
import { MilestoneBusinessRules } from './MilestoneBusinessRules';

export interface HealthCalculationStrategy {
  calculate(daysRemaining: number, isArchived: boolean, settings?: HealthSettings): HealthStatus;
}

/**
 * Baseline industry strategy measuring tender priority timeline status.
 */
export class StandardTenderHealthStrategy implements HealthCalculationStrategy {
  public calculate(daysRemaining: number, isArchived: boolean, settings?: HealthSettings): HealthStatus {
    if (isArchived) {
      return HealthStatus.ARCHIVED;
    }
    
    const overdueThreshold = settings ? settings.overdueThresholdDays : 0;
    const dueSoonThreshold = settings ? settings.dueSoonThresholdDays : 7;

    if (daysRemaining < overdueThreshold) {
      return HealthStatus.OVERDUE;
    }
    if (daysRemaining <= dueSoonThreshold) {
      return HealthStatus.DUE_SOON;
    }
    return HealthStatus.HEALTHY;
  }
}

/**
 * Enterprise strategy measuring health using weighted milestone scoring.
 */
export class MilestoneHealthStrategy {
  public calculate(
    milestones: Milestone[],
    templates: MilestoneTemplate[],
    submissionDate: string,
    isArchived: boolean,
    calendar?: BusinessCalendar
  ): HealthStatus {
    if (isArchived) {
      return HealthStatus.ARCHIVED;
    }

    if (!submissionDate || !milestones || milestones.length === 0) {
      // Fallback if milestones aren't initialized yet
      return HealthStatus.HEALTHY;
    }

    const scoreResult = MilestoneBusinessRules.calculateHealthScore(
      milestones,
      templates,
      submissionDate,
      calendar
    );

    if (scoreResult.level === 'Critical') {
      return HealthStatus.OVERDUE;
    }
    if (scoreResult.level === 'Warning') {
      return HealthStatus.DUE_SOON;
    }
    return HealthStatus.HEALTHY;
  }
}

export class HealthCalculator {
  private strategy: HealthCalculationStrategy;
  private milestoneStrategy: MilestoneHealthStrategy;

  constructor(
    strategy: HealthCalculationStrategy = new StandardTenderHealthStrategy(),
    milestoneStrategy: MilestoneHealthStrategy = new MilestoneHealthStrategy()
  ) {
    this.strategy = strategy;
    this.milestoneStrategy = milestoneStrategy;
  }

  public setStrategy(strategy: HealthCalculationStrategy): void {
    this.strategy = strategy;
  }

  public evaluate(daysRemaining: number, isArchived: boolean = false, settings?: HealthSettings): HealthStatus {
    return this.strategy.calculate(daysRemaining, isArchived, settings);
  }

  public evaluateMilestones(
    milestones: Milestone[],
    templates: MilestoneTemplate[],
    submissionDate: string,
    isArchived: boolean = false,
    calendar?: BusinessCalendar
  ): HealthStatus {
    return this.milestoneStrategy.calculate(milestones, templates, submissionDate, isArchived, calendar);
  }

  /**
   * Static access method to evaluate health dynamically.
   */
  public static calculate(daysRemaining: number, isArchived: boolean = false, settings?: HealthSettings): HealthStatus {
    const calc = new HealthCalculator();
    return calc.evaluate(daysRemaining, isArchived, settings);
  }

  /**
   * Static access method to evaluate health by milestones dynamically.
   */
  public static calculateFromMilestones(
    milestones: Milestone[],
    templates: MilestoneTemplate[],
    submissionDate: string,
    isArchived: boolean = false,
    calendar?: BusinessCalendar
  ): HealthStatus {
    const calc = new HealthCalculator();
    return calc.evaluateMilestones(milestones, templates, submissionDate, isArchived, calendar);
  }
}

