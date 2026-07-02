import { Project } from '../../domain/projects/Project';
import { RecordStatus } from '../../enums/RecordStatus';
import { ProjectLookupService } from '../../services/ProjectLookupService';
import { ProjectSetupService } from '../../services/ProjectSetupService';
import { ExecutivePortfolioRow } from '../dto/ExecutivePortfolioRow';
import { ProjectRelatedEntitiesBundle } from './ProjectRelatedEntitiesBundle';
import { PortfolioValueCalculator, PortfolioValueCalculatorOutput } from '../calculators/PortfolioValueCalculator';
import { PortfolioProgressCalculator, PortfolioProgressCalculatorOutput } from '../calculators/PortfolioProgressCalculator';
import { PortfolioHealthCalculator, PortfolioHealthCalculatorOutput } from '../calculators/PortfolioHealthCalculator';
import { PortfolioRiskCalculator, PortfolioRiskCalculatorOutput } from '../calculators/PortfolioRiskCalculator';

/**
 * ExecutivePortfolioBuilder — Sprint 5.0 Phase 6 Step 1.
 *
 * Builder responsibility (CTO correction #3), implemented exactly as scoped:
 *
 *   Repositories (via ProjectLookupService / ProjectSetupService — existing
 *   services only, never a raw Repository import)
 *     → Collect entities (per project: meetings, IPCs, claims, VOs, NOCs,
 *       subcontracts, documents, attachments, WBS, setup policy result)
 *     → Call calculators (PortfolioValueCalculator, PortfolioProgressCalculator,
 *       PortfolioHealthCalculator, PortfolioRiskCalculator)
 *     → Return ExecutivePortfolioRow
 *
 * No KPI math happens in this file — every numeric field on the row is either
 * copied straight from `Project` (RAW) or came back from a calculator
 * (CALCULATED). `assembleRow` only merges, it never computes.
 */
export class ExecutivePortfolioBuilder {
  constructor(
    private readonly projectLookup: ProjectLookupService = ProjectLookupService.getInstance(),
    private readonly projectSetupService: ProjectSetupService = new ProjectSetupService()
  ) {}

  public async build(project: Project): Promise<ExecutivePortfolioRow> {
    const bundle = await this.collectRelatedEntities(project);

    // Existing service — ProjectSetupService.evaluatePolicy already wraps
    // ProjectActivationPolicy.evaluate() + attachments + required-docs lookup.
    // Never recomputed here.
    const setupPolicyResult = await this.projectSetupService.evaluatePolicy(project.id);

    const valueOutput = PortfolioValueCalculator.calculate({
      project,
      ipcs: bundle.ipcs,
      claims: bundle.claims,
      variationOrders: bundle.variationOrders,
      subcontracts: bundle.subcontracts
    });

    const progressOutput = PortfolioProgressCalculator.calculate({ project, setupPolicyResult });

    const healthOutput = PortfolioHealthCalculator.calculate({
      project,
      nocs: bundle.nocs,
      claims: bundle.claims,
      variationOrders: bundle.variationOrders
    });

    const riskOutput = PortfolioRiskCalculator.calculate({
      project,
      claims: bundle.claims,
      variationOrders: bundle.variationOrders,
      nocs: bundle.nocs
    });

    return this.assembleRow(bundle, valueOutput, progressOutput, healthOutput, riskOutput);
  }

  /** "Collect entities" step — repository/service reads only, no calculation. */
  private async collectRelatedEntities(project: Project): Promise<ProjectRelatedEntitiesBundle> {
    const [meetings, ipcs, claims, variationOrders, nocs, subcontracts, documents, attachments, wbsPackages] =
      await Promise.all([
        this.projectLookup.getMeetings(project.id),
        this.projectLookup.getIPCs(project.id),
        this.projectLookup.getClaims(project.id),
        this.projectLookup.getVariationOrders(project.id),
        this.projectLookup.getNOCs(project.id),
        this.projectLookup.getSubcontracts(project.id),
        this.projectLookup.getDocuments(project.id),
        this.projectLookup.getAttachments(project.id),
        this.projectLookup.getWBSPackages(project.id)
      ]);

    return {
      project,
      meetings,
      ipcs,
      claims,
      variationOrders,
      nocs,
      subcontracts,
      documents,
      attachments,
      wbsPackages
    };
  }

  /** Merges RAW project fields + calculator outputs into one row. No computation here. */
  private assembleRow(
    bundle: ProjectRelatedEntitiesBundle,
    valueOutput: PortfolioValueCalculatorOutput,
    progressOutput: PortfolioProgressCalculatorOutput,
    healthOutput: PortfolioHealthCalculatorOutput,
    riskOutput: PortfolioRiskCalculatorOutput
  ): ExecutivePortfolioRow {
    const { project } = bundle;
    const activeCount = (list: { recordStatus: RecordStatus }[]) =>
      list.filter(item => item.recordStatus !== RecordStatus.ARCHIVED).length;

    return {
      // Identity [RAW]
      projectId: project.id,
      projectCode: project.code,
      nameEn: project.nameEn,
      nameAr: project.nameAr,
      sourceTenderId: project.sourceTenderId,
      sourceTenderNumber: project.sourceTenderNumber,
      country: project.country,
      city: project.city,
      client: project.client,
      employer: project.employer,
      consultant: project.consultant,
      mainContractor: project.mainContractor,
      department: project.department,
      businessUnit: project.businessUnit,
      coordinator: project.coordinator,
      projectManager: project.projectManager,

      // Lifecycle [RAW]
      recordStatus: project.recordStatus,
      status: project.status,
      lifecycleStage: project.lifecycleStage,
      workflowState: project.workflowState,
      isSetupComplete: Boolean(project.isSetupComplete),

      // Commercial [RAW + CALCULATED]
      contractType: project.contractType,
      deliveryMethod: project.deliveryMethod,
      currency: project.currency,
      exchangeRate: project.commercialSettings?.exchangeRate,
      signedContractValue: project.signedContractValue,
      revisedContractValue: project.revisedContractValue,
      approvedVariationValue: project.approvedVariationTotal,
      retentionPercentage: project.commercialSettings?.retentionPercentage,
      advancePaymentPercentage: project.commercialSettings?.advancePaymentPercentage,
      vatPercentage: project.commercialSettings?.vatPercentage,
      normalizedContractValue: valueOutput.normalizedContractValue,

      // Important Dates [RAW]
      awardedAt: project.awardedAt,
      startDate: project.startDate,
      mobilizationDate: project.mobilizationDate,
      contractDurationDays: project.contractDurationDays,
      mobilizationPeriodDays: project.mobilizationPeriodDays,
      approvedEotDays: project.approvedEotDays,
      contractualCompletionDate: project.contractualCompletionDate,
      revisedCompletionDate: project.revisedCompletionDate,
      forecastCompletionDate: project.forecastCompletionDate,
      completionDate: project.completionDate,

      // Setup Progress [CALCULATED]
      setupReadinessScore: progressOutput.setupReadinessScore,
      setupStepsPassed: progressOutput.setupStepsPassed,

      // Execution Summary — counts are RAW (exclude archived sub-records)
      meetingsCount: activeCount(bundle.meetings),
      ipcsCount: activeCount(bundle.ipcs),
      claimsCount: activeCount(bundle.claims),
      variationOrdersCount: activeCount(bundle.variationOrders),
      nocsCount: activeCount(bundle.nocs),
      subcontractsCount: activeCount(bundle.subcontracts),
      documentsCount: activeCount(bundle.documents),
      attachmentsCount: bundle.attachments.length, // ContextualAttachment carries no recordStatus
      wbsPackageCount: bundle.wbsPackages.length,   // WBSPackage carries no recordStatus
      // Monetary rollups are CALCULATED
      totalCertifiedIpcValue: valueOutput.totalCertifiedIpcValue,
      totalOutstandingIpcValue: valueOutput.totalOutstandingIpcValue,
      totalApprovedClaimValue: valueOutput.totalApprovedClaimValue,
      totalApprovedVoValue: valueOutput.totalApprovedVoValue,
      totalSubcontractInvoicedValue: valueOutput.totalSubcontractInvoicedValue,

      // Management KPIs [CALCULATED]
      executionProgressPercentage: progressOutput.executionProgressPercentage,
      healthScore: healthOutput.healthScore,
      riskScore: riskOutput.riskScore
    };
  }
}
