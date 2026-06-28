import { TenderService } from './TenderService';
import { ProjectControlsService } from './ProjectControlsService';
import { CalculationService } from './CalculationService';
import { Tender } from '../domain/pre-award/Tender';
import { ProjectControlsRecord } from '../domain/project-controls/ProjectControlsRecord';
import { CacheService } from './CacheService';

export interface DashboardMetricsSummary {
  // Pre-Award metrics
  totalTendersCount: number;
  activeTendersCount: number;
  totalPreAwardAED: number;
  totalBondsAED: number;

  // Execution contracts metrics
  totalCertifiedAED: number;
  totalClaimsAED: number;
  totalVariationAED: number;
  totalActiveExecutionValue: number;

  // Combined operational metrics
  combinedPipelineVal: number;
  totalItemsCount: number;
  healthyItemsCount: number;
  healthyRatio: number;
}

export class DashboardService {
  private tenderService: TenderService;
  private projectControlsService: ProjectControlsService;
  private calculationService: CalculationService;
  private cacheService: CacheService;

  constructor(
    tenderService: TenderService = new TenderService(),
    projectControlsService: ProjectControlsService = new ProjectControlsService(),
    calculationService: CalculationService = new CalculationService(),
    cacheService: CacheService = CacheService.getInstance()
  ) {
    this.tenderService = tenderService;
    this.projectControlsService = projectControlsService;
    this.calculationService = calculationService;
    this.cacheService = cacheService;
  }

  /**
   * Orchestrates high-level business queries across Pre-Award tenders and actively executing
   * project controls vouchers to compile consolidated executive dashboard values. Includes
   * lightning-fast caching parameters out-of-the-box.
   */
  public async getDashboardMetrics(): Promise<DashboardMetricsSummary> {
    const cacheKey = 'executive_dashboard_kpis_cache_key';
    const cached = this.cacheService.get<DashboardMetricsSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    // Retrieve records securely from respective service handlers
    const tenders: Tender[] = await this.tenderService.getTenders();
    const records: ProjectControlsRecord[] = await this.projectControlsService.getRecords();

    // 1. Pre-Award Metrics (delegated to standard DDD structures via service layers)
    let totalTendersCount = tenders.length;
    let activeTendersCount = 0;
    let totalPreAwardAED = 0;
    let totalBondsAED = 0;

    for (const tender of tenders) {
      if (tender.recordStatus === 'Active') {
        activeTendersCount++;
      }
      totalPreAwardAED += tender.financials.estimatedValue.amount;
      totalBondsAED += tender.financials.bondAmount.amount;
    }

    // 2. Project Execution & Certified site cash flows
    let totalCertifiedAED = 0;
    let totalClaimsAED = 0;
    let totalVariationAED = 0;
    let totalActiveExecutionValue = 0;

    for (const record of records) {
      const amount = record.valueAED.amount;
      totalActiveExecutionValue += amount;
      
      if (record.type === 'IPC') {
        totalCertifiedAED += amount;
      } else if (record.type === 'Claim') {
        totalClaimsAED += amount;
      } else if (record.type === 'Variation Order') {
        totalVariationAED += amount;
      }
    }

    // 3. Consolidated Multi-Domain pipeline calculations
    const combinedPipelineVal = totalPreAwardAED + totalActiveExecutionValue;
    const totalItemsCount = totalTendersCount + records.length;

    // Use priority and status safety ratings to determine health
    const healthyTendersCount = tenders.filter(t => t.general.priority !== 'Critical').length;
    const healthyRecordsCount = records.filter(r => r.health === 'Healthy').length;
    const healthyItemsCount = healthyTendersCount + healthyRecordsCount;

    const rawRatio = totalItemsCount > 0 ? (healthyItemsCount / totalItemsCount) * 100 : 100;
    const healthyRatio = Math.min(100, Math.max(0, rawRatio));

    const result: DashboardMetricsSummary = {
      totalTendersCount,
      activeTendersCount,
      totalPreAwardAED,
      totalBondsAED,
      totalCertifiedAED,
      totalClaimsAED,
      totalVariationAED,
      totalActiveExecutionValue,
      combinedPipelineVal,
      totalItemsCount,
      healthyItemsCount,
      healthyRatio
    };

    // Cache metrics for 60 seconds of zero-latency read-performance boosting
    this.cacheService.set(cacheKey, result, 60);

    return result;
  }

  /**
   * Translates incoming legacy view lists and executes business equations
   * without exposing business calculation formulas inside visual presentation views.
   */
  public computeFromLegacyData(list: any[], executionRecords: any[]): DashboardMetricsSummary {
    const parseAED = (valStr: string): number => {
      if (!valStr || valStr === 'N/A' || valStr.includes('Regulatory')) return 0;
      const clean = valStr.replace(/[^0-9.]/g, '');
      return parseFloat(clean) || 0;
    };

    const totalTendersCount = list.length;
    const activeTendersCount = list.filter(t => t.recordStatus === 'Active').length;
    
    const totalPreAwardAED = list.reduce((acc, curr) => acc + parseAED(curr.estimatedValue), 0);
    const totalBondsAED = list.reduce((acc, curr) => acc + parseAED(curr.bondAmount), 0);
    
    const totalCertifiedAED = executionRecords
      .filter(r => r.type === 'IPC')
      .reduce((acc, curr) => acc + parseAED(curr.valueAED), 0);

    const totalClaimsAED = executionRecords
      .filter(r => r.type === 'Claim')
      .reduce((acc, curr) => acc + parseAED(curr.valueAED), 0);

    const totalVariationAED = executionRecords
      .filter(r => r.type === 'Variation Order')
      .reduce((acc, curr) => acc + parseAED(curr.valueAED), 0);

    const totalActiveExecutionValue = executionRecords.reduce((acc, curr) => acc + parseAED(curr.valueAED), 0);
    const combinedPipelineVal = totalPreAwardAED + totalActiveExecutionValue;

    const totalItemsCount = list.length + executionRecords.length;
    const healthyItemsCount = 
      list.filter(t => t.health === 'Healthy').length + 
      executionRecords.filter(r => r.health === 'Healthy').length;

    const healthyRatio = totalItemsCount > 0 ? (healthyItemsCount / totalItemsCount) * 100 : 100;

    return {
      totalTendersCount,
      activeTendersCount,
      totalPreAwardAED,
      totalBondsAED,
      totalCertifiedAED,
      totalClaimsAED,
      totalVariationAED,
      totalActiveExecutionValue,
      combinedPipelineVal,
      totalItemsCount,
      healthyItemsCount,
      healthyRatio
    };
  }
}
