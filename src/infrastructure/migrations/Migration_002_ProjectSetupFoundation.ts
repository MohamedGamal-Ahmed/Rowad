import { BaseMigration } from './BaseMigration';
import { ProjectLifecycleStage, ProjectStatus, ProjectWorkflowState } from '../../domain/projects/Project';
import { ProjectLifecycleMapper } from '../../mappers/ProjectLifecycleMapper';

export class Migration_002_ProjectSetupFoundation extends BaseMigration {
  public readonly version = 2;
  public readonly description = 'Initializes Project Setup parameters, Project Office, Calendars, and default roles';

  public async up(): Promise<boolean> {
    try {
      const data = localStorage.getItem('pmo_projects_master');
      if (!data) return true;

      const projects = JSON.parse(data);
      if (!Array.isArray(projects)) return true;

      let migratedCount = 0;
      let skippedCount = 0;
      const warnings: string[] = [];
      const errors: string[] = [];

      const migrated = projects.map((p: any) => {
        try {
          let changed = false;

          // 1. Map legacy lifecycle stage names using ProjectLifecycleMapper
          const targetStage = ProjectLifecycleMapper.toEnum(p.lifecycleStage || p.status);
          if (p.lifecycleStage !== targetStage) {
            p.lifecycleStage = targetStage;
            changed = true;
          }

          // Ensure project status uses the ProjectStatus enum strongly
          if (p.status) {
            let targetStatus = ProjectStatus.INACTIVE;
            const statusStr = String(p.status).toLowerCase();
            if (statusStr === 'active') targetStatus = ProjectStatus.ACTIVE;
            else if (statusStr === 'completed') targetStatus = ProjectStatus.COMPLETED;
            else if (statusStr === 'closed') targetStatus = ProjectStatus.CLOSED;
            else if (statusStr === 'archived') targetStatus = ProjectStatus.ARCHIVED;
            else if (statusStr === 'mobilizing') targetStatus = ProjectStatus.MOBILIZING;
            else if (statusStr === 'suspended') targetStatus = ProjectStatus.SUSPENDED;

            if (p.status !== targetStatus) {
              p.status = targetStatus;
              changed = true;
            }
          } else {
            p.status = ProjectStatus.INACTIVE;
            changed = true;
          }

          // Backfill Workflow State if missing
          if (!p.workflowState) {
            if (p.status === ProjectStatus.ACTIVE) {
              p.workflowState = ProjectWorkflowState.ACTIVE;
            } else if (p.isSetupComplete) {
              p.workflowState = ProjectWorkflowState.PENDING_ACTIVATION;
            } else {
              p.workflowState = ProjectWorkflowState.DRAFT;
            }
            changed = true;
          }

          // 2. Decouple Employer from Client (initialize default)
          if (!p.employer) {
            p.employer = p.client || 'Employer Default';
            changed = true;
          }

          // 3. Initialize Calendar Foundation
          if (!p.calendarFoundation) {
            p.calendarFoundation = {
              workingCalendar: '5-Day Week',
              holidayCalendar: 'Egypt Holidays',
              timeZone: 'Africa/Cairo',
              workingHours: '08:00-17:00',
              weekendPattern: 'Friday-Saturday'
            };
            changed = true;
          }

          // 4. Initialize Commercial Settings
          if (!p.commercialSettings) {
            p.commercialSettings = {
              contractCurrency: p.currency || 'EGP',
              baseCurrency: p.currency || 'EGP',
              exchangeRate: 1,
              exchangeRateDate: undefined,
              exchangeRateSource: 'Manual',
              retentionPercentage: 10,
              advancePaymentPercentage: 10,
              vatPercentage: 15,
              costCenterCode: 'CC-' + (p.code || 'CODE')
            };
            changed = true;
          }

          // 5. Initialize Project Office & map legacy manager/coordinator strings to dynamic roles
          if (!p.projectOffice) {
            const teamMembers: any[] = [];
            if (p.projectManager) {
              const empId = 'EMP-' + String(p.projectManager).replace(/\s+/g, '-');
              teamMembers.push({
                roleId: 'PM',
                employeeId: empId,
                assignedAt: new Date().toISOString().split('T')[0]
              });
            } else {
              teamMembers.push({
                roleId: 'PM',
                employeeId: 'EMP-Ahmed-Ali',
                assignedAt: new Date().toISOString().split('T')[0]
              });
            }

            if (p.coordinator) {
              const empId = 'EMP-' + String(p.coordinator).replace(/\s+/g, '-');
              teamMembers.push({
                roleId: 'Coordinator',
                employeeId: empId,
                assignedAt: new Date().toISOString().split('T')[0]
              });
            }

            // Backfill Site Manager and Contract Administrator default roles for existing active projects
            if (p.status === ProjectStatus.ACTIVE) {
              teamMembers.push({
                roleId: 'SM',
                employeeId: 'EMP-Tarek-Hassan',
                assignedAt: new Date().toISOString().split('T')[0]
              });
              teamMembers.push({
                roleId: 'CA',
                employeeId: 'EMP-Khaled-Mansour',
                assignedAt: new Date().toISOString().split('T')[0]
              });
            }

            p.projectOffice = {
              id: `po-${p.id}`,
              projectId: p.id,
              teamMembers,
              delegations: [],
              distributionLists: [],
              approvalMatrix: []
            };
            changed = true;
          }

          // 6. Setup Completion Flag mapping
          if (p.isSetupComplete === undefined) {
            p.isSetupComplete = p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.CLOSED;
            changed = true;
          }

          // 7. Ensure contractType is initialized as Lump Sum if invalid
          if (!p.contractType) {
            p.contractType = 'Lump Sum';
            changed = true;
          }

          if (changed) {
            migratedCount++;
          } else {
            skippedCount++;
          }

          return p;
        } catch (err: any) {
          errors.push(`Error migrating project ${p.code || p.id}: ${err.message}`);
          return p;
        }
      });

      const report = {
        migrationVersion: this.version,
        description: this.description,
        timestamp: new Date().toISOString(),
        projectsMigrated: migratedCount,
        projectsSkipped: skippedCount,
        warnings,
        errors
      };

      // Append to Migration History (Refinement 8)
      const historyKey = 'pmo_migration_history';
      const rawHistory = localStorage.getItem(historyKey) || '[]';
      try {
        const history = JSON.parse(rawHistory);
        if (Array.isArray(history)) {
          history.push(report);
          localStorage.setItem(historyKey, JSON.stringify(history));
        } else {
          localStorage.setItem(historyKey, JSON.stringify([report]));
        }
      } catch (e) {
        localStorage.setItem(historyKey, JSON.stringify([report]));
      }

      localStorage.setItem('pmo_migration_report_v2', JSON.stringify(report));
      console.log('[Migration Validation Report V2]', report);

      localStorage.setItem('pmo_projects_master', JSON.stringify(migrated));
      return true;
    } catch (e: any) {
      console.error('Migration 002 failed:', e);
      return false;
    }
  }
}
