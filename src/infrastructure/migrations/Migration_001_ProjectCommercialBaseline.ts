import { BaseMigration } from './BaseMigration';

export class Migration_001_ProjectCommercialBaseline extends BaseMigration {
  public readonly version = 1;
  public readonly description = 'Consolidate Project Commercial baseline fields';

  public async up(): Promise<boolean> {
    try {
      const data = localStorage.getItem('pmo_projects_master');
      if (!data) return true; // No data, skip cleanly
      
      const projects = JSON.parse(data);
      if (!Array.isArray(projects)) return true;

      const migrated = projects.map((p: any) => {
        // Upgrade legacy contractValue / originalContractValue to signedContractValue
        if (p.signedContractValue === undefined) {
          p.signedContractValue = p.originalContractValue ?? p.contractValue ?? 0;
        }

        // Upgrade approvedVoTotal to approvedVariationTotal
        if (p.approvedVariationTotal === undefined && p.approvedVoTotal !== undefined) {
          p.approvedVariationTotal = p.approvedVoTotal;
        }

        // Clean up legacy fields to enforce single source of truth
        delete p.contractValue;
        delete p.originalContractValue;
        delete p.approvedVoTotal;

        return p;
      });

      localStorage.setItem('pmo_projects_master', JSON.stringify(migrated));
      return true;
    } catch (e) {
      console.error('Migration 001 failed:', e);
      return false;
    }
  }
}
