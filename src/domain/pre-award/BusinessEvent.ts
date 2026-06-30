export interface BusinessEvent {
  eventId: string;
  tenderId: string;
  timestamp: string;
  userId: string;
  source: 'User' | 'System' | 'Automation' | 'Import' | 'API';
  moduleId: string;
  entityType: string;
  entityId: string;
  action: string;
  changedFields?: string[];
  oldValue?: string;
  newValue?: string;
  remarks?: string;
}
