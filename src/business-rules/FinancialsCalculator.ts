import { Money } from '../domain/common/Money';
import { Currency } from '../enums/Currency';
import { FinancialSettings } from '../domain/administration/Settings';

export class FinancialsCalculator {
  /**
   * Safely parses formatted raw values or currencies into a clean float value.
   * E.g., "AED 50,200.50" -> 50200.50
   */
  public static parseToNumber(formattedStr: string | undefined): number {
    if (!formattedStr) return 0;
    // Strip everything except digits and decimal point
    const clean = formattedStr.replace(/[^\d.]/g, '');
    return parseFloat(clean) || 0;
  }

  /**
   * Translates amount with thousands delimiters and decimal padding.
   */
  public static formatAmount(amount: number): string {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  /**
   * Aggregates multiple Money objects into a single currency representation.
   */
  public static sumAmounts(moneyItems: Money[], targetCurrency: Currency = Currency.AED): Money {
    const conversionToAED: Record<Currency, number> = {
      [Currency.AED]: 1.0,
      [Currency.SAR]: 0.98,
      [Currency.EGP]: 0.076,
      [Currency.USD]: 3.67
    };

    let totalAED = 0;
    for (const item of moneyItems) {
      const rate = conversionToAED[item.currency] || 1.0;
      totalAED += item.amount * rate;
    }

    const targetRate = conversionToAED[targetCurrency] || 1.0;
    const finalAmount = totalAED / targetRate;

    return {
      amount: Math.round(finalAmount * 100) / 100,
      currency: targetCurrency
    };
  }

  /**
   * BR-001: Calculates Bid Bond amount based on project value and settings.
   */
  public static calculateBidBond(value: number, settings: FinancialSettings): number {
    return value * (settings.bidBondPercentage / 100);
  }

  /**
   * BR-002: Calculates Performance Bond amount based on signed contract value and settings.
   */
  public static calculatePerformanceBond(signedContractValue: number, settings: FinancialSettings): number {
    return signedContractValue * (settings.performanceBondPercentage / 100);
  }

  /**
   * BR-003: Calculates Retention amount from certified payment and settings.
   */
  public static calculateRetention(certifiedAmount: number, settings: FinancialSettings): number {
    return certifiedAmount * (settings.retentionPercentage / 100);
  }

  /**
   * Calculates complete payment lifecycle metrics for IPCs.
   * Given a gross value, calculates retention, subtotal, VAT, and net value.
   */
  public static calculateIpcLifecycle(
    grossValue: number,
    settings: FinancialSettings
  ): {
    retention: number;
    subtotal: number;
    vat: number;
    netValue: number;
  } {
    const retention = this.calculateRetention(grossValue, settings);
    const subtotal = grossValue - retention;
    const vat = this.calculateVAT(subtotal, settings);
    const netValue = subtotal + vat;
    return {
      retention: Math.round(retention * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      netValue: Math.round(netValue * 100) / 100,
    };
  }

  /**
   * BR-004: Calculates VAT based on certified subtotal and settings.
   */
  public static calculateVAT(amount: number, settings: FinancialSettings): number {
    return amount * (settings.vatPercentage / 100);
  }

  /**
   * BR-017: Calculates Advance Payment based on contract value and settings.
   */
  public static calculateAdvancePayment(contractSum: number, settings: FinancialSettings): number {
    return contractSum * (settings.advancePaymentPercentage / 100);
  }

  /**
   * Evaluates the dynamic Financial Progress of a project.
   * Returns undefined if no calculation engine is implemented.
   */
  public static calculateFinancialProgress(project: any): number | undefined {
    return undefined;
  }
}
