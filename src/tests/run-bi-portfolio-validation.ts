/**
 * run-bi-portfolio-validation.ts — Sprint 5.1 proof script.
 *
 * Runs the real ExecutivePortfolioService (builder + calculators + filter
 * engine, unmodified) against the real seed data, then runs
 * PortfolioDatasetValidator against the real output. No mock values, no
 * fabricated numbers — every figure in the printed report and in
 * docs/bi/EXECUTIVE_PORTFOLIO_VALIDATION_REPORT.md was captured from this
 * script's actual stdout.
 *
 * Only reason this needs a shim: the LocalStorage repositories (built for
 * the browser) call `localStorage`/`sessionStorage`, which do not exist
 * under plain Node/tsx. This installs a minimal in-memory Storage
 * polyfill BEFORE importing anything that touches them — it does not
 * change, mock, or bypass any repository/service/business logic. Run via:
 *   npx tsx src/tests/run-bi-portfolio-validation.ts
 */

class InMemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.has(key) ? this.store.get(key)! : null; }
  key(index: number): string | null { return [...this.store.keys()][index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
}

(globalThis as any).localStorage = new InMemoryStorage();
(globalThis as any).sessionStorage = new InMemoryStorage();

async function main() {
  // Deferred imports — must happen after the Storage polyfill is installed.
  const { ExecutivePortfolioService } = await import('../bi/services/ExecutivePortfolioService');
  const { ProjectLookupService } = await import('../services/ProjectLookupService');
  const { ProjectSetupService } = await import('../services/ProjectSetupService');
  const { PortfolioDatasetValidator } = await import('../bi/validation/PortfolioDatasetValidator');
  const { EXECUTIVE_PORTFOLIO_DATASET_METADATA } = await import('../bi/datasets/ExecutivePortfolioDataset.metadata');

  const projectLookup = ProjectLookupService.getInstance();
  const setupService = new ProjectSetupService();
  const service = new ExecutivePortfolioService();

  console.log('=== ROWAD BI — ExecutivePortfolioDataset Sprint 5.1 Proof Run ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log();

  const projects = await projectLookup.getProjects(true);
  console.log(`Operational Layer: ${projects.length} project(s) loaded from seed data.`);

  const genStart = Date.now();
  const rows = await service.getPortfolio();
  const genMs = Date.now() - genStart;
  console.log(`Dataset generated: ${rows.length} row(s) in ${genMs}ms.`);
  console.log();

  console.log('--- Full Dataset (JSON) ---');
  console.log(JSON.stringify(rows, null, 2));
  console.log();

  // Independently re-evaluate setup policy per project via the authoritative
  // ProjectSetupService — this is the cross-check input, computed fresh here,
  // not read back from the builder's own internal call.
  const setupPolicyResults = new Map<string, any>();
  for (const project of projects) {
    const policy = await setupService.evaluatePolicy(project.id);
    setupPolicyResults.set(project.id, policy);
  }

  const report = PortfolioDatasetValidator.validate({ rows, projects, setupPolicyResults });

  console.log('--- Validation Report ---');
  console.log(JSON.stringify(report, null, 2));
  console.log();

  console.log('--- Dataset Metadata ---');
  console.log(JSON.stringify(EXECUTIVE_PORTFOLIO_DATASET_METADATA, null, 2));
  console.log();

  console.log(`=== RESULT: ${report.passed ? 'ALL CHECKS PASSED' : 'CHECKS FAILED'} (${report.checks.filter(c => c.passed).length}/${report.checks.length}) ===`);

  if (!report.passed) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Sprint 5.1 proof run failed:', e);
  process.exit(1);
});
