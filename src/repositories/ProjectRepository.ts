import { 
  Project, ProjectMeeting, ProjectIPC, ProjectClaim, ProjectVariationOrder, ProjectNOC, 
  ProjectSPR, ProjectSubcontract, ProjectDocument, ProjectAttachment, ProjectHistory,
  WBSPackage, ContextualAttachment, ProjectSettings
} from '../domain/projects/Project';
import { baselineProjects } from '../seed/projectSeed';
import {
  baselineMeetings,
  baselineIPCs,
  baselineClaims,
  baselineVOs,
  baselineNOCs,
  baselineSPRs,
  baselineSubcontracts
} from '../seed/projectRecordsSeed';
import {
  baselineDocuments,
  baselineAttachments,
  baselineHistories,
  baselineWBS,
  baselineContextualAttachments
} from '../seed/projectDocsSeed';

export class ProjectRepository {
  private apiEndpoint = '/api/projects';

  /**
   * Retrieves all projects from local storage or seeds them.
   */
  public async getAll(): Promise<Project[]> {
    const list = this.getOrSeed('pmo_projects_master', baselineProjects);
    // Auto-migrate if any project is missing lifecycleStage or settings
    let modified = false;
    const migrated = list.map(p => {
      let changed = false;
      if (!p.lifecycleStage) {
        p.lifecycleStage = p.status === 'Pre-Award' ? 'Pre-Award' : 'Execution';
        changed = true;
      }
      if (!p.settings) {
        p.settings = this.getDefaultProjectSettings(p);
        changed = true;
      }
      if (changed) {
        modified = true;
      }
      return p;
    });
    if (modified) {
      localStorage.setItem('pmo_projects_master', JSON.stringify(migrated));
    }
    return migrated;
  }

  /**
   * Saves or updates a project.
   */
  public async save(project: Project): Promise<boolean> {
    try {
      const list = await this.getAll();
      const index = list.findIndex(p => p.id === project.id);
      if (index !== -1) {
        list[index] = project;
      } else {
        list.push(project);
      }
      localStorage.setItem('pmo_projects_master', JSON.stringify(list));
      this.addHistory(
        project.id, 
        index !== -1 ? 'Project Settings Updated' : 'Project Registered', 
        (project.auditInfo && project.auditInfo.createdBy) || 'System',
        `Project code: ${project.code}`,
        'Project',
        project.id,
        project.code
      );
      return true;
    } catch (e) {
      console.error('Error saving project', e);
      return false;
    }
  }

  /**
   * Deletes a project.
   */
  public async delete(id: string): Promise<boolean> {
    try {
      const list = await this.getAll();
      const filtered = list.filter(p => p.id !== id);
      localStorage.setItem('pmo_projects_master', JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Error deleting project', e);
      return false;
    }
  }

  // --- WBS Packages CRUD ---

  public async getWBSPackages(projectId: string): Promise<WBSPackage[]> {
    const list: WBSPackage[] = this.getOrSeed('pmo_project_wbs', baselineWBS);
    return list.filter(w => w.projectId === projectId);
  }

  public async saveWBSPackage(wbs: WBSPackage): Promise<boolean> {
    return this.saveSubEntity('pmo_project_wbs', wbs, baselineWBS);
  }

  public async deleteWBSPackage(id: string): Promise<boolean> {
    try {
      const list = this.getOrSeed<WBSPackage>('pmo_project_wbs', baselineWBS);
      const filtered = list.filter(item => item.id !== id);
      localStorage.setItem('pmo_project_wbs', JSON.stringify(filtered));
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- Contextual Attachments CRUD ---

  public async getContextualAttachments(projectId: string, entityType?: string, entityId?: string): Promise<ContextualAttachment[]> {
    const list: ContextualAttachment[] = this.getOrSeed('pmo_contextual_attachments', baselineContextualAttachments);
    let filtered = list.filter(a => a.projectId === projectId);
    if (entityType) {
      filtered = filtered.filter(a => a.entityType === entityType);
    }
    if (entityId) {
      filtered = filtered.filter(a => a.entityId === entityId);
    }
    return filtered;
  }

  public async saveContextualAttachment(att: ContextualAttachment): Promise<boolean> {
    return this.saveSubEntity('pmo_contextual_attachments', att, baselineContextualAttachments);
  }

  public async deleteContextualAttachment(id: string): Promise<boolean> {
    try {
      const list = this.getOrSeed<ContextualAttachment>('pmo_contextual_attachments', baselineContextualAttachments);
      const filtered = list.filter(item => item.id !== id);
      localStorage.setItem('pmo_contextual_attachments', JSON.stringify(filtered));
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- Sub-entity CRUD Operations ---

  public async getMeetings(projectId: string): Promise<ProjectMeeting[]> {
    const list: ProjectMeeting[] = this.getOrSeed('pmo_project_meetings', baselineMeetings);
    return list.filter(m => m.projectId === projectId);
  }

  public async saveMeeting(meeting: ProjectMeeting): Promise<boolean> {
    return this.saveSubEntity('pmo_project_meetings', meeting, baselineMeetings);
  }

  public async getIPCs(projectId: string): Promise<ProjectIPC[]> {
    const list: ProjectIPC[] = this.getOrSeed('pmo_project_ipcs', baselineIPCs);
    return list.filter(i => i.projectId === projectId);
  }

  public async saveIPC(ipc: ProjectIPC): Promise<boolean> {
    return this.saveSubEntity('pmo_project_ipcs', ipc, baselineIPCs);
  }

  public async getClaims(projectId: string): Promise<ProjectClaim[]> {
    const list: ProjectClaim[] = this.getOrSeed('pmo_project_claims', baselineClaims);
    return list.filter(c => c.projectId === projectId);
  }

  public async saveClaim(claim: ProjectClaim): Promise<boolean> {
    return this.saveSubEntity('pmo_project_claims', claim, baselineClaims);
  }

  public async getVariationOrders(projectId: string): Promise<ProjectVariationOrder[]> {
    const list: ProjectVariationOrder[] = this.getOrSeed('pmo_project_vos', baselineVOs);
    return list.filter(v => v.projectId === projectId);
  }

  public async saveVariationOrder(vo: ProjectVariationOrder): Promise<boolean> {
    return this.saveSubEntity('pmo_project_vos', vo, baselineVOs);
  }

  public async getNOCs(projectId: string): Promise<ProjectNOC[]> {
    const list: ProjectNOC[] = this.getOrSeed('pmo_project_nocs', baselineNOCs);
    return list.filter(n => n.projectId === projectId);
  }

  public async saveNOC(noc: ProjectNOC): Promise<boolean> {
    return this.saveSubEntity('pmo_project_nocs', noc, baselineNOCs);
  }

  public async deleteNOC(id: string): Promise<boolean> {
    try {
      const list = this.getOrSeed<ProjectNOC>('pmo_project_nocs', baselineNOCs);
      const filtered = list.filter(item => item.id !== id);
      localStorage.setItem('pmo_project_nocs', JSON.stringify(filtered));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async getSPRs(projectId: string): Promise<ProjectSPR[]> {
    const list: ProjectSPR[] = this.getOrSeed('pmo_project_sprs', baselineSPRs);
    return list.filter(s => s.projectId === projectId);
  }

  public async saveSPR(spr: ProjectSPR): Promise<boolean> {
    return this.saveSubEntity('pmo_project_sprs', spr, baselineSPRs);
  }

  public async getSubcontracts(projectId: string): Promise<ProjectSubcontract[]> {
    const list: ProjectSubcontract[] = this.getOrSeed('pmo_project_subcontracts', baselineSubcontracts);
    return list.filter(s => s.projectId === projectId);
  }

  public async saveSubcontract(subcontract: ProjectSubcontract): Promise<boolean> {
    return this.saveSubEntity('pmo_project_subcontracts', subcontract, baselineSubcontracts);
  }

  public async getDocuments(projectId: string): Promise<ProjectDocument[]> {
    const list: ProjectDocument[] = this.getOrSeed('pmo_project_documents', baselineDocuments);
    return list.filter(d => d.projectId === projectId);
  }

  public async saveDocument(doc: ProjectDocument): Promise<boolean> {
    return this.saveSubEntity('pmo_project_documents', doc, baselineDocuments);
  }

  public async getAttachments(projectId: string): Promise<ProjectAttachment[]> {
    const list: ProjectAttachment[] = this.getOrSeed('pmo_project_attachments', baselineAttachments);
    return list.filter(a => a.projectId === projectId);
  }

  public async saveAttachment(attachment: ProjectAttachment): Promise<boolean> {
    return this.saveSubEntity('pmo_project_attachments', attachment, baselineAttachments);
  }

  public async getHistory(projectId: string): Promise<ProjectHistory[]> {
    const list: ProjectHistory[] = this.getOrSeed('pmo_project_histories', baselineHistories);
    return list.filter(h => h.projectId === projectId);
  }

  public async addHistory(
    projectId: string, 
    action: string, 
    performedBy: string, 
    details?: string,
    module?: string,
    entityId?: string,
    entityCode?: string
  ) {
    try {
      const history: ProjectHistory = {
        id: `HST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        projectId,
        action,
        performedBy,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        details,
        module,
        entityId,
        entityCode
      };
      await this.saveSubEntity('pmo_project_histories', history, baselineHistories);
    } catch (e) {
      console.error('Failed to append history', e);
    }
  }

  // --- Helpers for generic localStorage operations ---

  private getOrSeed<T>(key: string, baseline: T[]): T[] {
    try {
      const data = localStorage.getItem(key);
      if (data && data !== "undefined") {
        return JSON.parse(data);
      } else {
        localStorage.setItem(key, JSON.stringify(baseline));
        return baseline;
      }
    } catch (e) {
      console.error(`Failed to load ${key}`, e);
      try {
        localStorage.setItem(key, JSON.stringify(baseline));
      } catch (_) {}
      return baseline;
    }
  }

  private async saveSubEntity<T extends { id: string }>(key: string, entity: T, baseline: T[]): Promise<boolean> {
    try {
      const list = this.getOrSeed(key, baseline);
      const index = list.findIndex(item => item.id === entity.id);
      if (index !== -1) {
        list[index] = entity;
      } else {
        list.push(entity);
      }
      localStorage.setItem(key, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error(`Failed to save sub entity into ${key}`, e);
      return false;
    }
  }

  public getDefaultProjectSettings(p: Project): ProjectSettings {
    return {
      workingCalendar: 'Standard 5-Day',
      workingDays: [0, 1, 2, 3, 4], // Sun to Thu
      currency: p.currency || 'SAR',
      timeZone: p.country === 'Egypt' ? 'GMT+2 (Cairo)' : 'GMT+3 (Riyadh)',
      departments: ['Infrastructure', 'Technical Office', 'Cost Control', 'Planning'],
      approvers: ['Executive PMO', 'Senior Commercial Manager', 'Technical Director'],
      projectRoles: ['Project Manager', 'Coordinator', 'Lead Engineer', 'Estimator'],
      riskMatrix: '5x5 Grid Standard',
      notificationRules: ['Email on delay > 5 days', 'System alert on claims exceeding 100k'],
      meetingRules: ['Mandatory weekly updates', 'Online as default for subcontractors'],
      conflictRules: {
        minGapBetweenMeetings: 30,
        travelBuffer: 15,
        conflictThreshold: 2
      },
      documentNumberingRules: `ROWAD-${p.code}-DOC-[SEQ]`,
      approvalWorkflow: 'Serial Approvals (PM -> Consultant -> Employer)',
      escalationRules: 'Auto-escalate to Director if pending approval exceeds 7 days'
    };
  }
}

