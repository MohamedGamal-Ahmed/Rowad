import { ProjectLookupService } from '../../services/ProjectLookupService';
import { ExecutivePortfolioBuilder } from '../builders/ExecutivePortfolioBuilder';
import { ExecutivePortfolioDataset } from '../datasets/ExecutivePortfolioDataset';
import { ExecutivePortfolioRow } from '../dto/ExecutivePortfolioRow';
import { PortfolioFilterCriteria } from '../filters/PortfolioFilterCriteria';
import { PortfolioFilterEngine } from '../filters/PortfolioFilterEngine';

/**
 * ExecutivePortfolioService — Sprint 5.0 Phase 6 Step 2.
 *
 * Entry point for the ExecutivePortfolioDataset. Responsibility:
 *   Load projects (via ProjectLookupService)
 *     → Build ExecutivePortfolioRow[] (via ExecutivePortfolioBuilder, one row per project)
 *     → Apply filters (via PortfolioFilterEngine)
 *     → Return ExecutivePortfolioDataset (= ExecutivePortfolioRow[])
 *
 * Never calculates KPIs, never touches a repository directly — both are
 * delegated (builder + lookup service respectively).
 */
export class ExecutivePortfolioService {
  constructor(
    private readonly builder: ExecutivePortfolioBuilder = new ExecutivePortfolioBuilder(),
    private readonly projectLookup: ProjectLookupService = ProjectLookupService.getInstance()
  ) {}

  public async getPortfolio(filter?: PortfolioFilterCriteria): Promise<ExecutivePortfolioDataset> {
    const projects = await this.projectLookup.getProjects();
    const rows = await Promise.all(projects.map(project => this.builder.build(project)));
    return PortfolioFilterEngine.apply(rows, filter);
  }

  public async getPortfolioRow(projectId: string): Promise<ExecutivePortfolioRow | undefined> {
    const projects = await this.projectLookup.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return undefined;
    }
    return this.builder.build(project);
  }
}
