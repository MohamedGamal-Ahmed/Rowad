import { 
  Client, Employer, Consultant, Contractor, ScopeOfWork, Currency, Country, Department, DocumentType, ContractType,
  MeetingType, ProjectStatus, ClaimType, VoType, NocType, IpcType, BusinessUnit, Discipline,
  baselineClients, baselineEmployers, baselineConsultants, baselineContractors, baselineScopes, baselineCurrencies, baselineCountries, baselineDepartments, baselineDocTypes, baselineContractTypes,
  baselineMeetingTypes, baselineStatuses, baselineClaimTypes, baselineVoTypes, baselineNocTypes, baselineIpcTypes,
  baselineBusinessUnits, baselineDisciplines
} from '../domain/master/MasterData';

export class MasterDataRepository {
  private apiEndpoint = '/api/master';

  public async getClients(): Promise<Client[]> {
    return this.getOrSeed('master_clients', baselineClients);
  }

  public async getEmployers(): Promise<Employer[]> {
    return this.getOrSeed('master_employers', baselineEmployers);
  }

  public async getConsultants(): Promise<Consultant[]> {
    return this.getOrSeed('master_consultants', baselineConsultants);
  }

  public async getContractors(): Promise<Contractor[]> {
    return this.getOrSeed('master_contractors', baselineContractors);
  }

  public async getScopes(): Promise<ScopeOfWork[]> {
    return this.getOrSeed('master_scopes', baselineScopes);
  }

  public async getCurrencies(): Promise<Currency[]> {
    return this.getOrSeed('master_currencies', baselineCurrencies);
  }

  public async getCountries(): Promise<Country[]> {
    return this.getOrSeed('master_countries', baselineCountries);
  }

  public async getDepartments(): Promise<Department[]> {
    return this.getOrSeed('master_departments', baselineDepartments);
  }

  public async getDocTypes(): Promise<DocumentType[]> {
    return this.getOrSeed('master_doctypes', baselineDocTypes);
  }

  public async getContractTypes(): Promise<ContractType[]> {
    return this.getOrSeed('master_contracttypes', baselineContractTypes);
  }

  // New enterprise registers methods
  public async getMeetingTypes(): Promise<MeetingType[]> {
    return this.getOrSeed('master_meetingtypes', baselineMeetingTypes);
  }

  public async getStatuses(): Promise<ProjectStatus[]> {
    return this.getOrSeed('master_statuses', baselineStatuses);
  }

  public async getClaimTypes(): Promise<ClaimType[]> {
    return this.getOrSeed('master_claimtypes', baselineClaimTypes);
  }

  public async getVoTypes(): Promise<VoType[]> {
    return this.getOrSeed('master_votypes', baselineVoTypes);
  }

  public async getNocTypes(): Promise<NocType[]> {
    return this.getOrSeed('master_noctypes', baselineNocTypes);
  }

  public async getIpcTypes(): Promise<IpcType[]> {
    return this.getOrSeed('master_ipctypes', baselineIpcTypes);
  }

  public async getSubcontractors(): Promise<Contractor[]> {
    return this.getOrSeed('master_subcontractors', baselineContractors); // Seeded with baseline contractors too
  }

  // Highly scalable generic loaders
  public async getRegister<T>(key: string, baseline?: T[]): Promise<T[]> {
    const resolvedBaseline = baseline || this.getBaselineForKey(key) as unknown as T[] || [];
    return this.getOrSeed(key, resolvedBaseline);
  }

  private getBaselineForKey(key: string): any[] {
    switch (key) {
      case 'master_clients': return baselineClients;
      case 'master_employers': return baselineEmployers;
      case 'master_consultants': return baselineConsultants;
      case 'master_contractors': return baselineContractors;
      case 'master_scopes': return baselineScopes;
      case 'master_currencies': return baselineCurrencies;
      case 'master_countries': return baselineCountries;
      case 'master_departments': return baselineDepartments;
      case 'master_doctypes': return baselineDocTypes;
      case 'master_contracttypes': return baselineContractTypes;
      case 'master_meetingtypes': return baselineMeetingTypes;
      case 'master_statuses': return baselineStatuses;
      case 'master_claimtypes': return baselineClaimTypes;
      case 'master_votypes': return baselineVoTypes;
      case 'master_noctypes': return baselineNocTypes;
      case 'master_ipctypes': return baselineIpcTypes;
      case 'master_subcontractors': return baselineContractors;
      case 'master_businessunits': return baselineBusinessUnits;
      case 'master_disciplines': return baselineDisciplines;
      default: return [];
    }
  }

  public async saveRegister<T extends { id: string }>(key: string, item: T): Promise<boolean> {
    try {
      const list = await this.getRegister<T>(key, []);
      const index = list.findIndex(x => x.id === item.id);
      if (index !== -1) {
        list[index] = item;
      } else {
        list.push(item);
      }
      localStorage.setItem(key, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error(`Failed to save register item for key ${key}`, e);
      return false;
    }
  }

  // Generic helper for local persistence seeding (highly scalable & backend-ready)
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
      console.error(`Failed to load master data for ${key}`, e);
      try {
        localStorage.setItem(key, JSON.stringify(baseline));
      } catch (_) {}
      return baseline;
    }
  }

  // Saves a Contractor specifically
  public async saveContractor(contractor: Contractor): Promise<boolean> {
    return this.saveRegister<Contractor>('master_contractors', contractor);
  }
}
