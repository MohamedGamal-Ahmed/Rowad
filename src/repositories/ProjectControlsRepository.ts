import { ProjectControlsRecord, ExecutionRecord } from '../domain/project-controls/ProjectControlsRecord';
import { ProjectControlsMapper } from '../mappers/ProjectControlsMapper';
import { mockExecutionData } from '../seed/mockData';

export class ProjectControlsRepository {
  private apiEndpoint = '/api/project-controls/records';

  /**
   * Retrieves all project controls records from the database storage.
   */
  public async getAll(): Promise<ProjectControlsRecord[]> {
    try {
      // Direct REST API fetch implementation for FastAPI / PostgreSQL
      // const response = await fetch(this.apiEndpoint);
      // const data = await response.json();

      const rawData = localStorage.getItem('project_controls_records_db');
      if (rawData) {
        const legacyList: ExecutionRecord[] = JSON.parse(rawData);
        return legacyList.map(item => ProjectControlsMapper.toDomain(item));
      } else {
        // Seed with baseline mock execution data for high-fidelity initial experience
        localStorage.setItem('project_controls_records_db', JSON.stringify(mockExecutionData));
        return mockExecutionData.map(item => ProjectControlsMapper.toDomain(item));
      }
    } catch (error) {
      console.error('Error fetching Project Controls records from PostgreSQL:', error);
      return [];
    }
  }

  /**
   * Persists active site submittal logs directly into the storage.
   */
  public async save(record: ProjectControlsRecord): Promise<boolean> {
    try {
      const dto = ProjectControlsMapper.toLegacy(record);

      // In production development with FastAPI, this transmits:
      // const response = await fetch(`${this.apiEndpoint}/${record.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(dto)
      // });
      // return response.ok;

      const rawData = localStorage.getItem('project_controls_records_db');
      let list: ExecutionRecord[] = [];
      if (rawData) {
        list = JSON.parse(rawData);
      } else {
        list = [...mockExecutionData];
      }

      const index = list.findIndex(item => item.id === record.id);
      if (index !== -1) {
        list[index] = dto;
      } else {
        list.push(dto);
      }

      localStorage.setItem('project_controls_records_db', JSON.stringify(list));
      return true;
    } catch (error) {
      console.error('Error preserving Project Controls record:', error);
      return false;
    }
  }
}
