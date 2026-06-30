import { WorkflowStatus } from '../enums/WorkflowStatus';

const TRANSITION_MAP: Record<WorkflowStatus, WorkflowStatus[]> = {
  [WorkflowStatus.DRAFT]: [WorkflowStatus.UNDER_STUDY, WorkflowStatus.CANCELLED],
  [WorkflowStatus.UNDER_STUDY]: [WorkflowStatus.READY_FOR_SUBMISSION, WorkflowStatus.LOST, WorkflowStatus.CANCELLED],
  [WorkflowStatus.READY_FOR_SUBMISSION]: [WorkflowStatus.SUBMITTED, WorkflowStatus.LOST, WorkflowStatus.CANCELLED],
  [WorkflowStatus.SUBMITTED]: [WorkflowStatus.UNDER_NEGOTIATION, WorkflowStatus.LOST, WorkflowStatus.CANCELLED],
  [WorkflowStatus.UNDER_NEGOTIATION]: [WorkflowStatus.AWARDED, WorkflowStatus.LOST, WorkflowStatus.CANCELLED],
  [WorkflowStatus.AWARDED]: [],
  [WorkflowStatus.LOST]: [],
  [WorkflowStatus.CANCELLED]: [],
};

export class TenderLifecycleValidator {
  public static getAllowedNextStates(currentState: WorkflowStatus): WorkflowStatus[] {
    return TRANSITION_MAP[currentState] ?? [];
  }

  public static isTransitionAllowed(fromState: WorkflowStatus, toState: WorkflowStatus): boolean {
    return this.getAllowedNextStates(fromState).includes(toState);
  }
}
