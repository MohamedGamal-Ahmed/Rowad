import { Money } from '../common/Money';

export interface FinancialInformation {
  estimatedValue: Money;
  estimatedCost?: Money;
  bondAmount: Money;
}
