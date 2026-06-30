import { BaseEntity } from '../common/BaseEntity';
import { BilingualString } from '../common/BilingualString';
import { TenderDocument } from '../common/TenderDocument';
import { NoteRecord } from '../common/NoteRecord';
import { GeneralInformation } from './GeneralInformation';
import { TimelineInformation } from './TimelineInformation';
import { FinancialInformation } from './FinancialInformation';
import { StatusInformation } from './StatusInformation';
import { ChecklistInformation } from './ChecklistInformation';
import { Milestone } from '../common/Milestone';

export interface Tender extends BaseEntity {
  projectCode: string;
  tenderNumber: string;
  awardedProjectId?: string;
  awardedAt?: string;
  projectName: BilingualString;
  general: GeneralInformation;
  timeline: TimelineInformation;
  financials: FinancialInformation;
  status: StatusInformation;
  checklist: ChecklistInformation;
  documents: TenderDocument[];
  notes: NoteRecord[];
  milestones: Milestone[];
}

