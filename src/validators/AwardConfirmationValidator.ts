export class AwardConfirmationValidator {
  /**
   * Validates the parameters for a project award confirmation.
   * Returns an array of error messages. If empty, validation passed.
   */
  public static validate(
    signedContractValue: number,
    contractCurrency: string,
    awardDate: string,
    loaReferenceNumber: string
  ): string[] {
    const errors: string[] = [];

    if (signedContractValue === undefined || signedContractValue === null || isNaN(signedContractValue)) {
      errors.push('Signed Contract Value must be a valid number.');
    } else if (signedContractValue <= 0) {
      errors.push('Signed Contract Value must be strictly greater than zero.');
    }

    if (!contractCurrency || !contractCurrency.trim()) {
      errors.push('Contract Currency is mandatory.');
    }

    if (!awardDate || !awardDate.trim()) {
      errors.push('Award Date is mandatory.');
    }

    if (!loaReferenceNumber || !loaReferenceNumber.trim()) {
      errors.push('LOA Reference Number is mandatory.');
    }

    return errors;
  }
}
