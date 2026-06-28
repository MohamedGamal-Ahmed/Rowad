import { RecordStatus } from '../../enums/RecordStatus';
import { AuditInfo } from './AuditInfo';

export interface BaseEntity {
  id: string;
  recordStatus: RecordStatus;
  auditInfo?: AuditInfo;
  archiveInfo?: {
    archivedBy: string;
    archivedAt: string;
    archiveReason: string;
  };
}
