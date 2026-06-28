import { TimelineRules } from './TimelineRules';

export interface BusinessConfiguration {
  id: string;
  timelineRules: TimelineRules;
  defaultCurrency: string;
  isBilingualEnabled: boolean;
}
