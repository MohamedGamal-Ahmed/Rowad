import { RecordStatus } from '../../enums/RecordStatus';
import { WorkflowStatus } from '../../enums/WorkflowStatus';
import { BilingualString } from '../common/BilingualString';

export interface StatusInformation {
  recordStatus: RecordStatus;
  workflowStatus: WorkflowStatus;
  projectStatus: BilingualString; // Backward-compatibility display label
  awardStatus: BilingualString;   // Backward-compatibility display label
}
