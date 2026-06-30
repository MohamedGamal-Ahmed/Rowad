import { ProjectVariationOrder } from '../domain/projects/Project';

export interface VOValidationResult {
  isValid: boolean;
  errors: string[];
}

export class VOLifecycleValidator {
  /**
   * Enforces transition rules and field validation for Variation Orders.
   * 
   * @param vo The current state of the VO.
   * @param oldVo The previous state of the VO (if editing).
   * @param allowApprovedValueOverride Whether the user chose to bypass the approved-cannot-exceed-proposed check.
   */
  public static validate(
    vo: ProjectVariationOrder,
    oldVo: ProjectVariationOrder | null,
    allowApprovedValueOverride = false
  ): VOValidationResult {
    const errors: string[] = [];

    // 1. General validations
    if (!vo.voNumber || !vo.voNumber.trim()) {
      errors.push('VO Number is required.');
    }
    if (!vo.title || !vo.title.trim()) {
      errors.push('VO Title is required.');
    }

    // Time impact cannot be negative
    if (vo.scheduleImpactDays < 0) {
      errors.push('Time impact (Schedule Impact days) cannot be negative.');
    }
    if (vo.commercialOffer?.extensionOfTimeDays && vo.commercialOffer.extensionOfTimeDays < 0) {
      errors.push('Proposed EOT days cannot be negative.');
    }

    // 2. State Transition validations
    if (oldVo) {
      const from = oldVo.status;
      const to = vo.status;
      
      if (from !== to) {
        const allowedTransitions: Record<string, string[]> = {
          'Draft': ['Draft', 'Submitted', 'Rejected'],
          'Submitted': ['Submitted', 'Under Review', 'Rejected'],
          'Under Review': ['Under Review', 'Approved', 'Rejected'],
          'Approved': ['Approved', 'Implemented'],
          'Implemented': ['Implemented'], // Terminal state
          'Rejected': ['Rejected', 'Draft'] // Can go back to Draft for rework
        };

        const allowed = allowedTransitions[from] || [];
        if (!allowed.includes(to)) {
          errors.push(`Invalid state transition: Cannot change status from "${from}" to "${to}".`);
        }
      }
    }

    // 3. Status-Specific Field validations
    if (vo.status === 'Approved' || vo.status === 'Implemented') {
      if (!vo.approval?.approvalDate) {
        errors.push('Approval Date is required for Approved variation orders.');
      }
      if (vo.approval?.approvedAmount === undefined || vo.approval.approvedAmount < 0) {
        errors.push('Approved Amount is required and cannot be negative for Approved status.');
      }
      if (!vo.approval?.approvalReference || !vo.approval.approvalReference.trim()) {
        errors.push('Approval Reference is required for Approved variation orders.');
      }

      // Approved value cannot exceed Proposed value unless overridden
      const proposedAmount = vo.commercialOffer?.amount ?? 0;
      const approvedAmount = vo.approval?.approvedAmount ?? 0;
      if (approvedAmount > proposedAmount && !allowApprovedValueOverride) {
        errors.push(`Approved amount (${approvedAmount}) cannot exceed proposed amount (${proposedAmount}) unless explicitly overridden.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
