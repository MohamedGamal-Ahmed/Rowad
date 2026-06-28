import { Clock } from './Clock';

export interface AuditLogPayload {
  action: 'Create Tender' | 'Archive Tender' | 'Workflow Transition' | 'Document Upload' | 'Status Change' | 'Financial Update'
    | 'Milestone Created' | 'Milestone Started' | 'Milestone Completed' | 'Milestone Verified' | 'Milestone Reopened'
    | 'Submission Date Changed' | 'Due Date Recalculated' | 'Responsible User Changed' | 'Verification Status Changed' | 'Notes Updated';
  resourceId: string;
  actor: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

export interface IAuditStorageProvider {
  write(payload: AuditLogPayload): Promise<boolean>;
}

export class MockVaultAuditStorage implements IAuditStorageProvider {
  public async write(payload: AuditLogPayload): Promise<boolean> {
    console.log(`[Corporate Security Vault] Audit Event Sealed: [${payload.action}] by actor [${payload.actor}] on resource [${payload.resourceId}]`);
    return true;
  }
}

/**
 * Enterprise Sealed Audit Trail Logging manager for secure transactional tracing
 */
export class AuditService {
  private static instance: AuditService;
  private storage: IAuditStorageProvider;

  private constructor() {
    this.storage = new MockVaultAuditStorage();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public setStorageProvider(provider: IAuditStorageProvider): void {
    this.storage = provider;
  }

  public async record(
    action: AuditLogPayload['action'],
    resourceId: string,
    actor: string,
    previousValue?: string,
    newValue?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const payload: AuditLogPayload = {
      action,
      resourceId,
      actor,
      timestamp: Clock.now().toISOString(),
      previousValue,
      newValue,
      metadata
    };
    return await this.storage.write(payload);
  }
}
