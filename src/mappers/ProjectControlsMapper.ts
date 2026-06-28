import { ProjectControlsRecord, ProjectControlsRecordType, ExecutionRecord } from '../domain/project-controls/ProjectControlsRecord';
import { Currency } from '../enums/Currency';
import { RecordStatus } from '../enums/RecordStatus';
import { FinancialsCalculator } from '../business-rules/FinancialsCalculator';

export class ProjectControlsMapper {
  public static toDomain(legacy: ExecutionRecord): ProjectControlsRecord {
    const parsedAmount = FinancialsCalculator.parseToNumber(legacy.valueAED);
    
    const type = legacy.type as ProjectControlsRecordType;

    return {
      id: legacy.id,
      projectId: legacy.projectId || 'p-1',
      recordStatus: legacy.health === 'Urgent' ? RecordStatus.ACTIVE : RecordStatus.ACTIVE,
      type,
      code: legacy.code,
      projectName: {
        en: legacy.projectName.en,
        ar: legacy.projectName.ar || legacy.projectName.en
      },
      submittedDate: legacy.submittedDate,
      valueAED: {
        amount: parsedAmount,
        currency: Currency.AED
      },
      status: {
        en: legacy.status.en,
        ar: legacy.status.ar || legacy.status.en
      },
      health: legacy.health,
      department: {
        en: legacy.department.en,
        ar: legacy.department.ar || legacy.department.en
      },
      contractor: legacy.contractor,
      progress: legacy.progress,
      auditInfo: {
        createdBy: 'ROWAD_ENTERPRISE_SYSTEM',
        createdAt: legacy.submittedDate
      }
    };
  }

  public static toLegacy(domain: ProjectControlsRecord): ExecutionRecord {
    const formattedAmount = `${domain.valueAED.currency} ${FinancialsCalculator.formatAmount(domain.valueAED.amount)}`;
    
    return {
      id: domain.id,
      projectId: domain.projectId,
      type: domain.type,
      code: domain.code,
      projectName: {
        en: domain.projectName.en,
        ar: domain.projectName.ar
      },
      submittedDate: domain.submittedDate,
      valueAED: domain.valueAED.amount > 0 ? formattedAmount : 'N/A (Regulatory)',
      status: {
        en: domain.status.en,
        ar: domain.status.ar
      },
      health: domain.health,
      department: {
        en: domain.department.en,
        ar: domain.department.ar
      },
      contractor: domain.contractor,
      progress: domain.progress
    };
  }
}

