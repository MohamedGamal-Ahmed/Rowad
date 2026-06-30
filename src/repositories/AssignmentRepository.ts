import { TenderAssignment } from '../domain/pre-award/TenderAssignment';

export class AssignmentRepository {
  private dbKey = 'preaward_assignments_db';

  public async getAll(): Promise<TenderAssignment[]> {
    try {
      const rawData = localStorage.getItem(this.dbKey);
      if (rawData) {
        return JSON.parse(rawData);
      }
    } catch (e) {
      console.error('Error fetching assignments:', e);
    }
    return [];
  }

  public async getByTenderId(tenderId: string): Promise<TenderAssignment[]> {
    const list = await this.getAll();
    return list.filter(item => item.tenderId === tenderId);
  }

  public async save(assignment: TenderAssignment): Promise<boolean> {
    try {
      const list = await this.getAll();
      const index = list.findIndex(item => item.assignmentId === assignment.assignmentId);
      if (index !== -1) {
        list[index] = assignment;
      } else {
        list.push(assignment);
      }
      localStorage.setItem(this.dbKey, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('Error saving assignment:', e);
      return false;
    }
  }

  public async delete(assignmentId: string): Promise<boolean> {
    try {
      const list = await this.getAll();
      const filtered = list.filter(item => item.assignmentId !== assignmentId);
      localStorage.setItem(this.dbKey, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Error deleting assignment:', e);
      return false;
    }
  }
}
