import { SequentialProjectNumberGenerator } from './SequentialProjectNumberGenerator';

export class ProjectNumberGenerator {
  private static instance = new SequentialProjectNumberGenerator();

  public static generateProjectCode(tenderCode: string): string {
    return this.instance.generateProjectCode(tenderCode);
  }

  public static preserveTenderReference(tenderCode: string): string {
    return this.instance.preserveTenderReference(tenderCode);
  }
}
