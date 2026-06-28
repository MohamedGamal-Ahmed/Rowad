/**
 * Milestone Audit Entry
 * 
 * Immutable record of every milestone state change.
 * Embedded within each Milestone entity for complete traceability.
 * Enterprise-grade: maps directly to PostgreSQL audit tables.
 */
export interface MilestoneAuditEntry {
  id: string;
  action:
    | 'Milestone Created'
    | 'Milestone Started'
    | 'Milestone Completed'
    | 'Milestone Verified'
    | 'Milestone Reopened'
    | 'Submission Date Changed'
    | 'Due Date Recalculated'
    | 'Responsible User Changed'
    | 'Verification Status Changed'
    | 'Notes Updated';
  actor: string;                 // User ID (not display name) - Backend Ready
  timestamp: string;             // ISO 8601 full timestamp
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}
