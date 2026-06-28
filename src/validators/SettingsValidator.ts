import { Settings } from '../domain/administration/Settings';
import { ValidationResult } from './TenderValidator';

export class SettingsValidator {
  /**
   * Enforces business-analyst and structural validation rules for the entire Enterprise Configuration Settings object.
   */
  public static validate(settings: Settings): ValidationResult {
    const errors: string[] = [];

    // 1. Timeline Rules validation
    const rules = settings.timelineRules;
    if (rules) {
      if (rules.kickOffOffset > 0) {
        errors.push('Kick-off alignment offset must be negative or zero (days prior to submission).');
      }
      if (rules.riskAssessmentOffset > 0) {
        errors.push('Risk assessment review offset must be negative or zero (days prior to submission).');
      }
      if (rules.contractQualificationOffset > 0) {
        errors.push('Contractual qualifications offset must be negative or zero (days prior to submission).');
      }
      if (rules.alignmentOffset > 0) {
        errors.push('Alignment and consensus offset must be negative or zero (days prior to submission).');
      }
      if (rules.intermediateFollowUpOffset > 0) {
        errors.push('Intermediate follow-up offset must be negative or zero (days prior to submission).');
      }
      if (rules.reminderDays < 0 || rules.reminderDays > 30) {
        errors.push('Reminder lead days must be between 0 and 30 days.');
      }
    }

    // 2. Financial Settings validation
    const fin = settings.financialSettings;
    if (fin) {
      if (fin.bidBondPercentage < 0 || fin.bidBondPercentage > 100) {
        errors.push('Bid Bond percentage must be between 0% and 100%.');
      }
      if (fin.performanceBondPercentage < 0 || fin.performanceBondPercentage > 100) {
        errors.push('Performance Bond percentage must be between 0% and 100%.');
      }
      if (fin.retentionPercentage < 0 || fin.retentionPercentage > 100) {
        errors.push('Retention percentage must be between 0% and 100%.');
      }
      if (fin.vatPercentage < 0 || fin.vatPercentage > 100) {
        errors.push('VAT percentage must be between 0% and 100%.');
      }
      if (fin.advancePaymentPercentage < 0 || fin.advancePaymentPercentage > 100) {
        errors.push('Advance Payment percentage must be between 0% and 100%.');
      }
      if (!fin.defaultCurrency) {
        errors.push('Default currency must be specified (e.g. AED, SAR, USD).');
      }
    }

    // 3. Business Calendar validation
    const cal = settings.businessCalendar;
    if (cal) {
      if (!cal.country.trim()) {
        errors.push('Calendar Country name cannot be empty.');
      }
      // Weekend days must be valid week index numbers (0 = Sun, ..., 6 = Sat)
      const invalidWeekends = cal.weekendDays.filter(day => day < 0 || day > 6);
      if (invalidWeekends.length > 0) {
        errors.push('Weekend days must be valid numbers between 0 (Sunday) and 6 (Saturday).');
      }
      // Check working hours format HH:MM
      const hourRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!hourRegex.test(cal.workingHoursStart) || !hourRegex.test(cal.workingHoursEnd)) {
        errors.push('Working hours must be specified in 24-hour HH:MM format (e.g. "08:00").');
      }
    }

    // 4. Numbering Settings validation
    const num = settings.numberingSettings;
    if (num) {
      const formatKeys: (keyof typeof num)[] = [
        'projectFormat', 'tenderFormat', 'ipcFormat', 'claimFormat', 'voFormat', 'nocFormat', 'documentFormat'
      ];
      for (const key of formatKeys) {
        const val = num[key];
        if (!val || !val.trim()) {
          errors.push(`Numbering pattern for ${key} cannot be empty.`);
        } else if (!val.includes('{SEQ}')) {
          errors.push(`Numbering pattern for ${key} must include the "{SEQ}" placeholder for sequence enumeration.`);
        }
      }
    }

    // 5. Workload Settings validation
    const wl = settings.workloadSettings;
    if (wl) {
      if (wl.maxTasksPerEngineer <= 0) {
        errors.push('Maximum concurrent workload tasks per engineer must be at least 1.');
      }
      if (wl.warningThreshold < 10 || wl.warningThreshold > 100) {
        errors.push('Workload warning threshold percentage must be between 10% and 100%.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
