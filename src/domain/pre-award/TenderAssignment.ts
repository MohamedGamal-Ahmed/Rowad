export interface TenderAssignment {
  assignmentId: string;
  tenderId: string;
  employeeId: string;
  roleId: string;
  status: 'Active' | 'Archived';
  assignedDate: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes?: string;
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
  archivedAt: string | null;
  archivedBy: string | null;
  recordStatus: 'Active' | 'Archived';
}
