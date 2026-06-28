export type UserRole =
  | 'Administrator'
  | 'PMO Director'
  | 'Tender Coordinator'
  | 'Contracts Engineer'
  | 'Estimator'
  | 'Project Controls Engineer'
  | 'Document Controller'
  | 'Executive';

export interface RolePermissions {
  role: UserRole;
  allowedActions: string[];
}

/**
 * Enterprise RBAC Permission coordinator. Roles are configured dynamically rather than hardcoded.
 */
export class PermissionService {
  private static instance: PermissionService;
  private policies: Map<UserRole, string[]> = new Map();
  private currentUserRole: UserRole = 'Administrator'; // Default fallback

  private constructor() {
    this.initializeDefaultPolicies();
  }

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  private initializeDefaultPolicies(): void {
    // Dynamically configured access tables rather than static string matches
    this.policies.set('Administrator', ['*']); // Wildcard access
    this.policies.set('Executive', ['view_dashboard', 'view_reports', 'view_projects', 'view_tenders']);
    this.policies.set('PMO Director', ['view_dashboard', 'view_reports', 'view_projects', 'manage_projects', 'view_tenders', 'manage_tenders']);
    this.policies.set('Tender Coordinator', ['view_tenders', 'create_tender', 'edit_tender', 'view_dashboard']);
    this.policies.set('Contracts Engineer', ['view_tenders', 'edit_tender_financials', 'view_dashboard']);
    this.policies.set('Project Controls Engineer', ['view_projects', 'create_ipc', 'edit_claims', 'view_dashboard']);
    this.policies.set('Document Controller', ['view_documents', 'upload_document', 'delete_document']);
  }

  public registerPolicy(role: UserRole, permissions: string[]): void {
    this.policies.set(role, permissions);
  }

  public getCurrentRole(): UserRole {
    return this.currentUserRole;
  }

  public setCurrentRole(role: UserRole): void {
    this.currentUserRole = role;
  }

  public hasPermission(action: string): boolean {
    const list = this.policies.get(this.currentUserRole);
    if (!list) return false;
    return list.includes('*') || list.includes(action);
  }
}
