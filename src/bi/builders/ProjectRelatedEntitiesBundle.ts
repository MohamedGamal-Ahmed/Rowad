import {
  Project,
  ProjectMeeting,
  ProjectIPC,
  ProjectClaim,
  ProjectVariationOrder,
  ProjectNOC,
  ProjectSubcontract,
  ProjectDocument,
  ProjectAttachment,
  WBSPackage
} from '../../domain/projects/Project';

/**
 * ProjectRelatedEntitiesBundle — internal collection contract used only
 * between ExecutivePortfolioBuilder and the repositories/services it reads
 * from (via ProjectLookupService). This is NOT part of the enterprise
 * semantic layer's public output — it never leaves builders/. Consumers
 * only ever see ExecutivePortfolioRow (CTO correction #9).
 *
 * No `sourceTender` field here (dropped during Phase 6 review) — nothing on
 * ExecutivePortfolioRow currently reads original Tender data, so collecting
 * it would be exactly the kind of unused abstraction CTO correction #2 flags.
 * Add it back only when a DTO field actually needs it.
 */
export interface ProjectRelatedEntitiesBundle {
  project: Project;
  meetings: ProjectMeeting[];
  ipcs: ProjectIPC[];
  claims: ProjectClaim[];
  variationOrders: ProjectVariationOrder[];
  nocs: ProjectNOC[];
  subcontracts: ProjectSubcontract[];
  documents: ProjectDocument[];
  attachments: ProjectAttachment[];
  wbsPackages: WBSPackage[];
}
