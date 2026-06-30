import { ProjectIPC } from '../domain/projects/Project';

export interface IpcValidationResult {
  isValid: boolean;
  errors: string[];
}

export class IpcValidator {
  /**
   * Validates an IPC record against commercial and state-transition rules.
   * 
   * @param ipc The IPC record to validate.
   * @param previousIpcs All other IPC records for this project.
   */
  public static validate(ipc: ProjectIPC, previousIpcs: ProjectIPC[]): IpcValidationResult {
    const errors: string[] = [];

    // 1. Basic Fields
    if (!ipc.ipcNumber || !ipc.ipcNumber.trim()) {
      errors.push('IPC number is required.');
    }
    if (!ipc.workTill) {
      errors.push('Work period till date is required.');
    }
    if (!ipc.ipcSubmissionDate) {
      errors.push('IPC submission date is required.');
    }

    // 2. Claim values must be non-negative
    if (ipc.invoiceGrossValue < 0) {
      errors.push('Invoice Gross value cannot be negative.');
    }
    if (ipc.invoiceNetValue < 0) {
      errors.push('Invoice Net value cannot be negative.');
    }

    // 3. Certified Fields checks
    const isCertifiedOrPaid = ipc.status === 'Certified' || ipc.status === 'Paid';
    if (isCertifiedOrPaid) {
      if (ipc.certifiedGrossValue === undefined || ipc.certifiedGrossValue < 0) {
        errors.push('Certified Gross value is required and cannot be negative for Certified or Paid status.');
      }
      if (ipc.netCertifiedAmount === undefined || ipc.netCertifiedAmount < 0) {
        errors.push('Net Certified amount is required and cannot be negative.');
      }
      
      // Retention, recovery, tax must be non-negative
      if (ipc.retentionDeduction !== undefined && ipc.retentionDeduction < 0) {
        errors.push('Retention deduction cannot be negative.');
      }
      if (ipc.advanceRecovery !== undefined && ipc.advanceRecovery < 0) {
        errors.push('Advance recovery cannot be negative.');
      }
      if (ipc.withholdingTax !== undefined && ipc.withholdingTax < 0) {
        errors.push('Withholding tax cannot be negative.');
      }
    }

    // 4. Net Amount can never be negative
    if (ipc.netCertifiedAmount !== undefined && ipc.netCertifiedAmount < 0) {
      errors.push('Net Certified amount cannot be negative.');
    }

    // 5. Paid Amount cannot exceed Net Certified Amount
    const totalPaid = (ipc.payments || [])
      .filter(p => p.recordStatus !== 'Archived' && p.status !== 'Rejected')
      .reduce((sum, p) => sum + p.paymentAmount, 0);

    const netCertified = ipc.netCertifiedAmount ?? 0;
    if (totalPaid > netCertified && netCertified > 0) {
      errors.push(`Total paid amount (${totalPaid}) cannot exceed net certified amount (${netCertified}).`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
