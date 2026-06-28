import { MilestoneWorkflowState } from '../../enums/MilestoneWorkflowState';
import { MilestoneAuditEntry } from './MilestoneAuditEntry';

/**
 * Milestone Entity
 * 
 * Reusable across ALL business modules: Tenders, Projects, Claims, IPC, VO, NOC,
 * Risk Register, Procurement, RFI, and any future module.
 * 
 * ARCHITECTURE RULES:
 * - Only STORED data lives here. No derived/calculated fields.
 * - dueDate is NEVER stored → calculated from submissionDate + template offset.
 * - autoStatus is NEVER stored → calculated from today, dueDate, completedDate.
 * - daysDifference is NEVER stored → calculated from completedDate - dueDate.
 * - responsibleUser is replaced by responsibleUserId (Backend RBAC ready).
 * - Verification model prepared for Approval Engine integration.
 * 
 * Maps directly to PostgreSQL `milestones` table without transformation.
 */
export interface Milestone {
  /** Unique milestone instance identifier */
  id: string;

  /** Parent entity ID (tender ID, project ID, etc.) */
  parentId: string;

  /** Parent entity type for polymorphic association */
  parentType: 'tender' | 'project' | 'claim' | 'ipc' | 'vo' | 'noc' | 'risk' | 'procurement' | 'rfi';

  /** References MilestoneTemplate.id - defines behavior and rules */
  templateId: string;

  /** Current workflow state - transitions validated by MilestoneBusinessRules */
  workflowState: MilestoneWorkflowState;

  /** Whether this milestone has been completed (workflow reached COMPLETED or VERIFIED) */
  isCompleted: boolean;

  /** ISO date string when milestone was completed - null if not yet completed */
  completedDate: string | null;

  /** User ID of the person responsible for this milestone (RBAC ready - never store names) */
  responsibleUserId: string;

  // ── Verification Model (Approval Engine Ready) ──

  /** Current verification status */
  verificationStatus: 'pending' | 'verified' | 'rejected';

  /** User ID of the verifier (RBAC ready) */
  verifiedByUserId: string;

  /** ISO timestamp of verification action */
  verifiedAt: string | null;

  /** Verification notes or rejection reason */
  verificationNotes: string;

  // ── Metadata ──

  /** Milestone-level notes */
  notes: string;

  /** Immutable audit trail for this milestone */
  auditHistory: MilestoneAuditEntry[];

  /** ISO timestamp of milestone creation */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;
}
