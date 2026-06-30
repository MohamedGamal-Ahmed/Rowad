import { ClaimStatus } from '../domain/projects/Project';

export class ClaimLifecycleValidator {
  public static getAllowedNextStates(currentState: ClaimStatus): ClaimStatus[] {
    switch (currentState) {
      case 'Prepared':
        return ['Prepared', 'Submitted'];
      case 'Submitted':
        return ['Submitted', 'Under Review', 'Negotiation', 'Rejected'];
      case 'Under Review':
        return ['Under Review', 'Negotiation', 'Counter Proposal', 'Approved', 'Rejected'];
      case 'Negotiation':
        return ['Negotiation', 'Counter Proposal', 'Approved', 'Rejected', 'Disputed'];
      case 'Counter Proposal':
        return ['Counter Proposal', 'Approved', 'Rejected', 'Disputed'];
      case 'Approved':
      case 'Rejected':
      case 'Disputed':
        return [currentState];
    }
  }

  public static isTransitionAllowed(fromState: ClaimStatus, toState: ClaimStatus): boolean {
    const allowed = this.getAllowedNextStates(fromState);
    return allowed.includes(toState);
  }
}
