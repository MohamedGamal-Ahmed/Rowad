export interface ISearchableEntity {
  id: string;
  type: 'Project' | 'Tender' | 'Claim' | 'VO' | 'NOC' | 'Document';
  title: { en: string; ar: string };
  code: string;
  searchTags: string[];
}

export interface SearchQuery {
  term: string;
  entityTypes?: ISearchableEntity['type'][];
}

/**
 * Enterprise Abstract Global Searching Coordinator for multi-domain queries
 */
export class SearchService {
  private static instance: SearchService;
  private indexes: ISearchableEntity[] = [];

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public registerEntity(entity: ISearchableEntity): void {
    // Keep internal memory indexes hot
    if (!this.indexes.some(item => item.id === entity.id && item.type === entity.type)) {
      this.indexes.push(entity);
    }
  }

  public query(q: SearchQuery): ISearchableEntity[] {
    const cleanTerm = q.term.trim().toLowerCase();
    if (!cleanTerm) return [];

    return this.indexes.filter(item => {
      // Validate types if specific domain query requested
      if (q.entityTypes && q.entityTypes.length > 0) {
        if (!q.entityTypes.includes(item.type)) return false;
      }

      // Check text matches
      const codeMatch = item.code.toLowerCase().includes(cleanTerm);
      const titleEnMatch = item.title.en.toLowerCase().includes(cleanTerm);
      const titleArMatch = item.title.ar.toLowerCase().includes(cleanTerm);
      const tagMatch = item.searchTags.some(tag => tag.toLowerCase().includes(cleanTerm));

      return codeMatch || titleEnMatch || titleArMatch || tagMatch;
    });
  }

  public clearIndexes(): void {
    this.indexes = [];
  }
}
