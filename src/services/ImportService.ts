import { Tender } from '../domain/pre-award/Tender';
import { TenderMapper, LegacyTender } from '../mappers/TenderMapper';

export class ImportService {
  /**
   * Processes external spreadsheet file records, converting raw imported sheets into robust aggregates.
   * Assumes integration with cell parsers (like sheetjs / xlsx).
   */
  public parseSpreadsheetRows(rawRows: any[]): Tender[] {
    const validatedTenders: Tender[] = [];

    for (const row of rawRows) {
      try {
        // Enforce required transactional spreadsheet headers
        if (!row.projectCode || !row.tenderNumber || !row.techSubmissionDate) {
          console.warn('Skipping structurally incomplete spreadsheet row:', row);
          continue;
        }

        // Adapter converting parsed tabular cells into LegacyTender properties
        const legacy: LegacyTender = {
          id: row.id || `T-IMP-${Math.floor(Math.random() * 10000)}`,
          projectCode: row.projectCode,
          tenderNumber: row.tenderNumber,
          projectName: { en: row.projectNameEn || row.projectName || '', ar: row.projectNameAr || row.projectName || '' },
          location: { en: row.locationEn || 'KSA', ar: row.locationAr || 'المملكة العربية السعودية' },
          coordinator: { en: row.coordinator || 'SYSTEM IMPORT', ar: 'مستورد تلقائي' },
          contractsEngineer: { en: row.contractsEngineer || 'TBD', ar: 'يحدد لاحقاً' },
          techSubmissionDate: row.techSubmissionDate,
          commSubmissionDate: row.commSubmissionDate || row.techSubmissionDate,
          overallSubmissionDate: row.overallSubmissionDate || row.techSubmissionDate,
          projectStatus: { en: 'Under Study', ar: 'تحت الدراسة' },
          awardStatus: { en: 'Pending', ar: 'معلق' },
          workflowStatus: 'Under Study',
          recordStatus: 'Active',
          daysRemaining: 30,
          health: 'Healthy',
          estimatedValue: row.estimatedValue || 'AED 0',
          bondAmount: row.bondAmount || 'AED 0',
          currency: row.currency || 'AED',
          tenderType: { en: row.tenderType || 'General Civil', ar: 'أعمال مدنية عامة' },
          clientName: { en: row.clientName || 'Municipal Authority', ar: 'الجهة الحكومية المختصة' },
          notes: [],
          documents: []
        };

        const domainAggregate = TenderMapper.toDomain(legacy);
        validatedTenders.push(domainAggregate);
      } catch (e) {
        console.error('Failed parsing individual spreadsheet row:', e);
      }
    }

    return validatedTenders;
  }
}
