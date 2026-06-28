export interface TimelineRules {
  kickOffOffset: number;                  // Offset from submission date (must be negative or 0)
  riskAssessmentOffset: number;
  contractQualificationOffset: number;
  alignmentOffset: number;
  intermediateFollowUpOffset: number;
}
