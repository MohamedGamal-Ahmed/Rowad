import { BusinessEvent } from '../domain/pre-award/BusinessEvent';

export class BusinessEventRepository {
  private dbKey = 'preaward_business_events_db';

  public async getAll(): Promise<BusinessEvent[]> {
    try {
      const rawData = localStorage.getItem(this.dbKey);
      if (rawData) {
        return JSON.parse(rawData);
      }
    } catch (e) {
      console.error('Error fetching business events:', e);
    }
    return [];
  }

  public async getByTenderId(tenderId: string): Promise<BusinessEvent[]> {
    const list = await this.getAll();
    return list.filter(item => item.tenderId === tenderId);
  }

  public async logEvent(event: BusinessEvent): Promise<boolean> {
    try {
      const list = await this.getAll();
      list.push(event);
      localStorage.setItem(this.dbKey, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('Error logging business event:', e);
      return false;
    }
  }

  public async clear(): Promise<boolean> {
    try {
      localStorage.removeItem(this.dbKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}
