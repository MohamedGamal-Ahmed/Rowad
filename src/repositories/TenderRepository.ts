import { Tender } from '../domain/pre-award/Tender';
import { TenderMapper, LegacyTender } from '../mappers/TenderMapper';

export class TenderRepository {
  private apiEndpoint = '/api/pre-award/tenders'; // FastAPI target route

  /**
   * Translates PostgreSQL schema REST responses into clean domain model aggregates.
   */
  public async getAll(): Promise<Tender[]> {
    try {
      // In production development with FastAPI, this does:
      // const response = await fetch(this.apiEndpoint);
      // const data: LegacyTender[] = await response.json();
      
      // Transitional implementation: Load from local mock database array
      const rawData = localStorage.getItem('preaward_tenders_db');
      if (rawData) {
        const legacyList: LegacyTender[] = JSON.parse(rawData);
        return legacyList.map(item => TenderMapper.toDomain(item));
      }
    } catch (error) {
      console.error('Error fetching PostgreSQL tenders through FastAPI API:', error);
    }
    return [];
  }

  /**
   * Persists a domain Model aggregate into PostgreSQL.
   */
  public async save(tender: Tender): Promise<boolean> {
    try {
      const dto = TenderMapper.toLegacy(tender);
      
      // In production development with FastAPI, this transmits:
      // const response = await fetch(`${this.apiEndpoint}/${tender.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(dto)
      // });
      // return response.ok;

      // Transitional implementation: Save to localStorage pool
      const rawData = localStorage.getItem('preaward_tenders_db');
      let list: LegacyTender[] = [];
      if (rawData) {
        list = JSON.parse(rawData);
      }
      
      const index = list.findIndex(item => item.id === tender.id);
      if (index !== -1) {
        list[index] = dto;
      } else {
        list.push(dto);
      }
      
      localStorage.setItem('preaward_tenders_db', JSON.stringify(list));
      return true;
    } catch (error) {
      console.error('Error saving tender to PostgreSQL database:', error);
      return false;
    }
  }

  /**
   * Soft deletes or archives a tender inside PostgreSQL.
   */
  public async delete(id: string): Promise<boolean> {
    try {
      // In production development with FastAPI, this triggers:
      // const response = await fetch(`${this.apiEndpoint}/${id}`, { method: 'DELETE' });
      // return response.ok;

      const rawData = localStorage.getItem('preaward_tenders_db');
      if (rawData) {
        let list: LegacyTender[] = JSON.parse(rawData);
        list = list.filter(item => item.id !== id);
        localStorage.setItem('preaward_tenders_db', JSON.stringify(list));
        return true;
      }
    } catch (error) {
      console.error('Error deleting tender from PostgreSQL:', error);
    }
    return false;
  }
}
