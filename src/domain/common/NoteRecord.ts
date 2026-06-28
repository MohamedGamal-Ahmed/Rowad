export interface NoteRecord {
  id: string;
  author: string;
  date: string; // ISO date format YYYY-MM-DD or full timestamp
  text: string;
}
