import { BaseEntity } from '../common/BaseEntity';
import { BilingualString } from '../common/BilingualString';
import { Money } from '../common/Money';

export type ProjectControlsRecordType = 'IPC' | 'Claim' | 'Variation Order' | 'NOC';

export interface ProjectControlsRecord extends BaseEntity {
  projectId: string; // Required link to Project Master (SSOT)
  type: ProjectControlsRecordType;
  code: string;
  projectName: BilingualString;
  submittedDate: string; // ISO String (YYYY-MM-DD)
  valueAED: Money;       // Custom Money Value Object
  status: BilingualString;
  health: 'Healthy' | 'Urgent' | 'Under Review';
  department: BilingualString;
  contractor: string;
  progress: number;      // 0 to 100
}

/**
 * ExecutionRecord represents a read-only Presentation DTO / ViewModel
 * used to display aggregated site controls inside Dashboard tables.
 * It is NOT a database domain entity and has no independent lifecycle.
 */
export interface ExecutionRecord {
  id: string;
  projectId: string; // Required link to Project Master
  type: 'IPC' | 'Claim' | 'Variation Order' | 'NOC';
  code: string;
  projectName: { en: string; ar: string };
  submittedDate: string;
  valueAED: string;
  status: { en: string; ar: string };
  health: 'Healthy' | 'Urgent' | 'Under Review';
  department: { en: string; ar: string };
  contractor: string;
  progress: number;
}

