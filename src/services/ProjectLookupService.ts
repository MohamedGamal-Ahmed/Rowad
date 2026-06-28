import { ProjectRepository } from '../repositories/ProjectRepository';
import { MasterDataRepository } from '../repositories/MasterDataRepository';
import { Project } from '../domain/projects/Project';
import { 
  Client, Employer, Consultant, Contractor, ScopeOfWork, Currency, Country, Department, DocumentType, ContractType 
} from '../domain/master/MasterData';

export class ProjectLookupService {
  private static instance: ProjectLookupService;
  private projectRepo: ProjectRepository;
  private masterRepo: MasterDataRepository;
  private cache: Map<string, any>;

  private constructor() {
    this.projectRepo = new ProjectRepository();
    this.masterRepo = new MasterDataRepository();
    this.cache = new Map();
  }

  public static getInstance(): ProjectLookupService {
    if (!ProjectLookupService.instance) {
      ProjectLookupService.instance = new ProjectLookupService();
    }
    return ProjectLookupService.instance;
  }

  public async getProjects(force = false): Promise<Project[]> {
    const cacheKey = 'projects_list';
    if (!force && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const projects = await this.projectRepo.getAll();
    this.cache.set(cacheKey, projects);
    return projects;
  }

  public async saveProject(project: Project): Promise<boolean> {
    const success = await this.projectRepo.save(project);
    if (success) {
      this.cache.delete('projects_list');
    }
    return success;
  }

  public async getClients(force = false): Promise<Client[]> {
    const cacheKey = 'clients_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getClients();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getEmployers(force = false): Promise<Employer[]> {
    const cacheKey = 'employers_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getEmployers();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getConsultants(force = false): Promise<Consultant[]> {
    const cacheKey = 'consultants_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getConsultants();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getContractors(force = false): Promise<Contractor[]> {
    const cacheKey = 'contractors_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getContractors();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getScopes(force = false): Promise<ScopeOfWork[]> {
    const cacheKey = 'scopes_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getScopes();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getCurrencies(force = false): Promise<Currency[]> {
    const cacheKey = 'currencies_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getCurrencies();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getCountries(force = false): Promise<Country[]> {
    const cacheKey = 'countries_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getCountries();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getDepartments(force = false): Promise<Department[]> {
    const cacheKey = 'departments_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getDepartments();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getDocTypes(force = false): Promise<DocumentType[]> {
    const cacheKey = 'doctypes_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getDocTypes();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getContractTypes(force = false): Promise<ContractType[]> {
    const cacheKey = 'contracttypes_list';
    if (!force && this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const data = await this.masterRepo.getContractTypes();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async refresh(): Promise<void> {
    this.cache.clear();
  }

  // Project workspace sub-entity delegation
  public async getMeetings(projectId: string) { return this.projectRepo.getMeetings(projectId); }
  public async saveMeeting(meeting: any) { return this.projectRepo.saveMeeting(meeting); }
  
  public async getIPCs(projectId: string) { return this.projectRepo.getIPCs(projectId); }
  public async saveIPC(ipc: any) { return this.projectRepo.saveIPC(ipc); }

  public async getClaims(projectId: string) { return this.projectRepo.getClaims(projectId); }
  public async saveClaim(claim: any) { return this.projectRepo.saveClaim(claim); }

  public async getVariationOrders(projectId: string) { return this.projectRepo.getVariationOrders(projectId); }
  public async saveVariationOrder(vo: any) { return this.projectRepo.saveVariationOrder(vo); }

  public async getNOCs(projectId: string) { return this.projectRepo.getNOCs(projectId); }
  public async saveNOC(noc: any) { return this.projectRepo.saveNOC(noc); }
  public async deleteNOC(id: string) { return this.projectRepo.deleteNOC(id); }

  public async getSPRs(projectId: string) { return this.projectRepo.getSPRs(projectId); }
  public async saveSPR(spr: any) { return this.projectRepo.saveSPR(spr); }

  public async getSubcontracts(projectId: string) { return this.projectRepo.getSubcontracts(projectId); }
  public async saveSubcontract(sub: any) { return this.projectRepo.saveSubcontract(sub); }

  public async getDocuments(projectId: string) { return this.projectRepo.getDocuments(projectId); }
  public async saveDocument(doc: any) { return this.projectRepo.saveDocument(doc); }

  public async getAttachments(projectId: string) { return this.projectRepo.getAttachments(projectId); }
  public async saveAttachment(att: any) { return this.projectRepo.saveAttachment(att); }

  public async getHistory(projectId: string) { return this.projectRepo.getHistory(projectId); }
  public async addHistory(projectId: string, action: string, performedBy: string, details?: string, module?: string, entityId?: string, entityCode?: string) {
    return this.projectRepo.addHistory(projectId, action, performedBy, details, module, entityId, entityCode);
  }

  public async getWBSPackages(projectId: string) { return this.projectRepo.getWBSPackages(projectId); }
  public async saveWBSPackage(wbs: any) { return this.projectRepo.saveWBSPackage(wbs); }
  public async deleteWBSPackage(id: string) { return this.projectRepo.deleteWBSPackage(id); }
}
