export interface IProjectNumberGenerator {
  generateProjectCode(tenderCode: string): string;
  preserveTenderReference(tenderCode: string): string;
}
