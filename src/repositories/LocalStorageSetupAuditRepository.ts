import { ISetupAuditRepository } from '../domain/contracts/ISetupAuditRepository';
import { SetupAuditEvent } from '../domain/projects/Project';

export class LocalStorageSetupAuditRepository implements ISetupAuditRepository {
  private key = 'pmo_setup_audit_logs';

  public async save(event: SetupAuditEvent): Promise<boolean> {
    try {
      const logs = this.getLogsFromStorage();
      logs.push(event);
      localStorage.setItem(this.key, JSON.stringify(logs));
      return true;
    } catch (e) {
      console.error('Error saving setup audit log:', e);
      return false;
    }
  }

  public async getByProjectId(projectId: string): Promise<SetupAuditEvent[]> {
    try {
      const logs = this.getLogsFromStorage();
      return logs.filter(event => event.projectId === projectId);
    } catch (e) {
      console.error('Error reading setup audit logs:', e);
      return [];
    }
  }

  private getLogsFromStorage(): SetupAuditEvent[] {
    const data = localStorage.getItem(this.key);
    if (!data) return [];
    try {
      return JSON.parse(data) as SetupAuditEvent[];
    } catch (e) {
      return [];
    }
  }
}
