import { BaseMigration } from './BaseMigration';
import { Migration_001_ProjectCommercialBaseline } from './Migration_001_ProjectCommercialBaseline';

export class MigrationRunner {
  private migrations: BaseMigration[] = [
    new Migration_001_ProjectCommercialBaseline()
  ];

  public async run(): Promise<void> {
    try {
      const currentVersion = Number(localStorage.getItem('pmo_schema_version') || '0');
      let latestVersion = currentVersion;

      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          console.log(`[Migration] Running version ${migration.version}: ${migration.description}`);
          const success = await migration.up();
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
