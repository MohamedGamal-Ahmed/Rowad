import { NumberingSettings } from '../domain/administration/Settings';
import { Clock } from './Clock';

export class NumberingService {
  private static getYear(): string {
    return Clock.now().getFullYear().toString();
  }

  private static formatSeq(sequence: number, padLength: number = 3): string {
    return sequence.toString().padStart(padLength, '0');
  }

  /**
   * Generates a unique identifier based on a custom configurable format.
   * Format placeholders:
   * - {YEAR}: Current calendar year (e.g. 2026)
   * - {SEQ}: Padded sequence number (e.g. 023)
   * - {PROJECT}: Cleaned project ID or prefix code
   * - {TYPE}: Three-letter submittal identifier
   */
  public static generateIdentifier(
    format: string,
    params: {
      sequence: number;
      project?: string;
      type?: string;
    }
  ): string {
    let result = format;
    result = result.replace(/{YEAR}/g, this.getYear());
    result = result.replace(/{SEQ}/g, this.formatSeq(params.sequence));
    if (params.project) {
      result = result.replace(/{PROJECT}/g, params.project.toUpperCase());
    }
    if (params.type) {
      result = result.replace(/{TYPE}/g, params.type.substring(0, 3).toUpperCase());
    }
    // Clean up empty parameters if they didn't get replaced to avoid raw placeholders in resulting strings
    result = result.replace(/{[A-Z]+}/g, '');
    return result;
  }

  /**
   * Generates project number
   */
  public static generateProjectCode(settings: NumberingSettings, sequence: number): string {
    return this.generateIdentifier(settings.projectFormat || 'PRJ-{YEAR}-{SEQ}', { sequence });
  }

  /**
   * Generates tender/pre-award bid code
   */
  public static generateTenderNumber(settings: NumberingSettings, sequence: number): string {
    return this.generateIdentifier(settings.tenderFormat || 'PA-{YEAR}-{SEQ}', { sequence });
  }

  /**
   * Generates post-award record code (IPC, Claim, VO, NOC)
   */
  public static generateRecordCode(
    settings: NumberingSettings,
    type: 'IPC' | 'Claim' | 'Variation Order' | 'NOC',
    projectCode: string,
    sequence: number
  ): string {
    let format = settings.ipcFormat;
    if (type === 'Claim') format = settings.claimFormat;
    else if (type === 'Variation Order') format = settings.voFormat;
    else if (type === 'NOC') format = settings.nocFormat;

    const shortType = type === 'Variation Order' ? 'VO' : type.substring(0, 3).toUpperCase();

    return this.generateIdentifier(format || `${shortType}-{PROJECT}-{SEQ}`, {
      sequence,
      project: projectCode,
      type: shortType
    });
  }

  /**
   * Generates engineering document reference code
   */
  public static generateDocumentCode(
    settings: NumberingSettings,
    type: string,
    sequence: number
  ): string {
    return this.generateIdentifier(settings.documentFormat || 'DOC-{TYPE}-{SEQ}', {
      sequence,
      type
    });
  }
}
