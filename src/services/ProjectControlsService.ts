import { ProjectControlsRecord } from '../domain/project-controls/ProjectControlsRecord';
import { ProjectControlsRepository } from '../repositories/ProjectControlsRepository';

export class ProjectControlsService {
  private repository: ProjectControlsRepository;

  constructor(repository: ProjectControlsRepository = new ProjectControlsRepository()) {
    this.repository = repository;
  }

  /**
   * Loads all Project Controls records and delegates business evaluations.
   */
  public async getRecords(): Promise<ProjectControlsRecord[]> {
    return await this.repository.getAll();
  }

  /**
   * Persists a validated Project Controls record to database storage.
   */
  public async commitRecord(record: ProjectControlsRecord): Promise<{ success: boolean; errors: string[] }> {
    // Simple verification check as part of standard validation logic
    if (!record.code) {
      return { success: false, errors: ['Record document code is required'] };
    }
    if (!record.projectName.en || !record.projectName.ar) {
      return { success: false, errors: ['Bilingual project name values are required'] };
    }

    const saved = await this.repository.save(record);
    return { success: saved, errors: saved ? [] : ['PostgreSQL Storage Transaction Failure'] };
  }
}
