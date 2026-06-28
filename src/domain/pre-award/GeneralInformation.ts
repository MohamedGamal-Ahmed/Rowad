import { BilingualString } from '../common/BilingualString';
import { Priority } from '../../enums/Priority';

export interface GeneralInformation {
  location: BilingualString;
  priority: Priority;
  department: string;
  clientName: BilingualString;
  consultant?: BilingualString;
  branch?: BilingualString;
  businessUnit?: BilingualString;
  tenderType: BilingualString;
}
