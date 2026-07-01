import { BaseMigration } from './BaseMigration';
import { Migration_001_ProjectCommercialBaseline } from './Migration_001_ProjectCommercialBaseline';
import { Migration_002_ProjectSetupFoundation } from './Migration_002_ProjectSetupFoundation';

export class MigrationRunner {
  private migrations: BaseMigration[] = [
    new Migration_001_ProjectCommercialBaseline(),
    new Migration_002_ProjectSetupFoundation()
  ];

  public async run(): Promise<void> {
    try {
      const currentVersion = Number(localStorage.getItem('pmo_schema_version') || '0');
      let latestVersion = currentVersion;

      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          console.log(`[Migration] Running version ${migration.version}: ${migration.description}`);
          const success = await migration.up();
          
          const logEntry = {
            version: migration.version,
            description: migration.description,
            status: success ? 'PASS' : 'FAIL',
            timestamp: new Date().toISOString()
          };

          // Append to pmo_migration_history
          const historyKey = 'pmo_migration_history';
          let history: any[] = [];
          try {
            const rawHistory = localStorage.getItem(historyKey);
            if (rawHistory) {
              history = JSON.parse(rawHistory);
              if (!Array.isArray(history)) history = [];
            }
          } catch (_) {
            history = [];
          }
          history.push(logEntry);
          localStorage.setItem(historyKey, JSON.stringify(history));

          if (success) {
            latestVersion = migration.version;
          } else {
            console.error(`[Migration] Version ${migration.version} failed. Aborting.`);
            throw new Error(`Migration Failed at Version ${migration.version}`);
          }
        }
      }

      if (latestVersion > currentVersion) {
        localStorage.setItem('pmo_schema_version', String(latestVersion));
        console.log(`[Migration] Database schema successfully updated to version ${latestVersion}`);
      }
    } catch (e) {
      console.error('Migration execution failed:', e);
      throw e; // Bubble up during startup
    }
  }
}
