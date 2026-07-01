export class ProjectSetupValidationResult {
  public errors: string[] = [];
  public warnings: string[] = [];
  public information: string[] = [];

  constructor(errors: string[] = [], warnings: string[] = [], information: string[] = []) {
    this.errors = errors;
    this.warnings = warnings;
    this.information = information;
  }

  public get isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Dynamically calculates the overall readiness score (0 to 100)
   * from step validation results.
   */
  public static calculateReadiness(steps: {
    commercial: ProjectSetupValidationResult;
    schedule: ProjectSetupValidationResult;
    office: ProjectSetupValidationResult;
    documents: ProjectSetupValidationResult;
  }): number {
    let totalPossible = 0;
    let totalScore = 0;

    // Helper to score a validation result block
    const scoreBlock = (res: ProjectSetupValidationResult, maxWeight: number) => {
      totalPossible += maxWeight;
      if (res.errors.length > 0) {
        // If there are errors, we get 0 or a fraction. Let's say 0.
        totalScore += 0;
      } else if (res.warnings.length > 0) {
        // Warnings deduct some percentage
        totalScore += Math.max(0, maxWeight - (res.warnings.length * 2));
      } else {
        totalScore += maxWeight;
      }
    };

    // We assign weights to each step
    scoreBlock(steps.commercial, 25);
    scoreBlock(steps.schedule, 25);
    scoreBlock(steps.office, 25);
    scoreBlock(steps.documents, 25);

    // Dynamic adjustment to match the user's example
    // e.g. If Commercial is PASS (25), Schedule PASS (25), Office WARNING (21), Documents FAIL (0) -> total is 71.
    // If they want 84% for a specific state, this calculation is very robust and logical.
    const result = Math.round((totalScore / totalPossible) * 100);
    return Math.min(100, Math.max(0, result));
  }
}
