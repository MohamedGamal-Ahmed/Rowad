import { Tender } from '../domain/pre-award/Tender';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class TenderValidator {
  /**
   * Evaluates if a tender aggregate contains chronologically and financially correct attributes before saving.
   */
  public static validate(tender: Tender): ValidationResult {
    const errors: string[] = [];

    // General Validation
    if (!tender.projectCode?.trim()) {
      errors.push('Project Code is required.');
    }
    if (!tender.tenderNumber?.trim()) {
      errors.push('Tender Number is required.');
    }
    if (!tender.projectName?.en?.trim() || !tender.projectName?.ar?.trim()) {
      errors.push('Bilingual Project Name (English and Arabic) is required.');
    }

    // Timeline Chronological Validation
    const techDateStr = tender.timeline.submission.techSubmissionDate;
    const commDateStr = tender.timeline.submission.commSubmissionDate;

    if (!techDateStr) {
      errors.push('Technical Submission Date is required.');
    }
    if (!commDateStr) {
      errors.push('Commercial Submission Date is required.');
    }

    if (techDateStr && commDateStr) {
      const techDate = new Date(techDateStr);
      const commDate = new Date(commDateStr);
      if (isNaN(techDate.getTime())) {
        errors.push('Technical Submission Date is an invalid ISO date.');
      }
      if (isNaN(commDate.getTime())) {
        errors.push('Commercial Submission Date is an invalid ISO date.');
      }
    }

    // Financial Boundary Validation
    if (tender.financials.estimatedValue.amount < 0) {
      errors.push('Estimated Value cannot be negative.');
    }
    if (tender.financials.bondAmount.amount < 0) {
      errors.push('Bid Security Bond Amount cannot be negative.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
