/**
 * Milestone Workflow State Enum
 * 
 * Defines the lifecycle progression of any milestone across all business modules.
 * Transitions are validated through MilestoneBusinessRules - not the UI.
 * 
 * Flow: PENDING → STARTED → COMPLETED → VERIFIED
 * Future: REJECTED, CANCELLED, REOPENED
 */
export enum MilestoneWorkflowState {
  PENDING = 'Pending',
  STARTED = 'Started',
  COMPLETED = 'Completed',
  VERIFIED = 'Verified',
  // Future workflow states (reserved for Approval Engine integration)
  // REJECTED = 'Rejected',
  // CANCELLED = 'Cancelled',
  // REOPENED = 'Reopened',
}
