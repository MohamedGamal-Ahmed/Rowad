import { IDocumentRequirementsProvider } from '../domain/projects/IDocumentRequirementsProvider';

export class ConfigurationDocumentRequirementsProvider implements IDocumentRequirementsProvider {
  public getRequiredDocuments(): string[] {
    return [
      'Signed Contract',
      'Letter of Award',
      'Commencement Letter',
      'BOQ',
      'IFC Drawings',
      'Baseline Schedule'
    ];
  }
}
