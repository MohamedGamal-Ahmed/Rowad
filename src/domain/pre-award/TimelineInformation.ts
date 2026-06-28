export interface SubmissionTimeline {
  techSubmissionDate: string;      // ISO String (YYYY-MM-DD) - Stored
  commSubmissionDate: string;      // ISO String (YYYY-MM-DD) - Stored
  overallSubmissionDate: string;   // ISO String (YYYY-MM-DD) - Stored
  closingDate?: string;            // ISO String (YYYY-MM-DD) - Stored
}

export interface InternalTimeline {
  siteVisitRequired?: boolean;     // Stored
  siteVisitDate?: string;          // ISO String (YYYY-MM-DD) - Stored
}

export interface CalculatedTimeline {
  kickOffDate?: string;            // Dynamically calculated via PMO offsets
  alignmentDate?: string;          // Dynamically calculated via PMO offsets
  followUpDate?: string;           // Dynamically calculated via PMO offsets
  riskDueDate?: string;            // Dynamically calculated via PMO offsets
  contractQualsDueDate?: string;   // Dynamically calculated via PMO offsets
}

export interface TimelineInformation {
  submission: SubmissionTimeline;
  internal: InternalTimeline;
  calculated: CalculatedTimeline;
}
