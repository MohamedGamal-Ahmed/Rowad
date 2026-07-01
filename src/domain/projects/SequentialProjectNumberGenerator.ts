import { IProjectNumberGenerator } from './IProjectNumberGenerator';

export class SequentialProjectNumberGenerator implements IProjectNumberGenerator {
  /**
   * Generates a project code based on a tender code.
   * Default policy: TN-2026-001 -> PRJ-2026-001
   */
  public generateProjectCode(tenderCode: string): string {
    if (!tenderCode) {
      return `PRJ-${new Date().getFullYear()}-000`;
    }
    if (tenderCode.startsWith('TN-')) {
      return 'PRJ-' + tenderCode.substring(3);
    }
    return 'PRJ-' + tenderCode;
  }

  /**
   * Returns the tender code to be preserved as a reference.
   */
  public preserveTenderReference(tenderCode: string): string {
    return tenderCode;
  }
}
