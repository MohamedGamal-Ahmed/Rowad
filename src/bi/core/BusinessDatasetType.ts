/**
 * BusinessDatasetType — the closed vocabulary of every BI dataset the
 * Dataset Registry can know about. Only EXECUTIVE_PORTFOLIO is implemented
 * today; the rest are declared now (Sprint 5.0 BI Foundation freeze, round 3
 * — "design assuming many datasets will follow") so the registry/catalog
 * shape does not need to change shape when each one is actually built.
 */
export enum BusinessDatasetType {
  EXECUTIVE_PORTFOLIO = 'ExecutivePortfolio',
  PRE_AWARD = 'PreAward',
  COMMERCIAL = 'Commercial',
  FINANCIAL = 'Financial',
  PLANNING = 'Planning',
  CLAIMS = 'Claims',
  VARIATION_ORDERS = 'VariationOrders',
  IPC = 'IPC',
  MEETINGS = 'Meetings',
  PROCUREMENT = 'Procurement'
}
