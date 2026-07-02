/**
 * BI Layer — Core Contracts
 *
 * A monetary value shaped for enterprise consumers (Power BI, Excel, REST),
 * distinct from `domain/common/Money` (which is the operational Value Object
 * used inside Tender/Project entities). This type intentionally carries both
 * the raw transactional amount/currency AND the normalized/base-currency view,
 * per CTO correction #2: consumers get raw values and calculated values —
 * formatting and further conversion belong to the consumer, not this layer.
 */
export interface MultiCurrencyValue {
  /** Raw amount in its original transactional currency. */
  amount: number;
  /** Raw transactional currency code (e.g. 'AED', 'SAR', 'EGP', 'USD'). */
  currency: string;
  /** Exchange rate used to normalize into baseCurrency, if calculated. */
  exchangeRate?: number;
  /** The portfolio/enterprise reporting base currency this value was normalized to. */
  baseCurrency?: string;
  /** amount converted into baseCurrency — CALCULATED, never fabricated if inputs are missing. */
  amountInBaseCurrency?: number;
}
