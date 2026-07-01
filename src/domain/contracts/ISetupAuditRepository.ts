import { SetupAuditEvent } from '../projects/Project';

export interface ISetupAuditRepository {
  save(event: SetupAuditEvent): Promise<boolean>;
  getByProjectId(projectId: string): Promise<SetupAuditEvent[]>;
}
