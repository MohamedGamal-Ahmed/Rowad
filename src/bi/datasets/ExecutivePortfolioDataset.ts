import { ExecutivePortfolioRow } from '../dto/ExecutivePortfolioRow';

/**
 * ExecutivePortfolioDataset — the read model returned by ExecutivePortfolioService.
 * One row per Project. See dto/ExecutivePortfolioRow.ts for field semantics.
 *
 * Kept as a plain array alias rather than a generic wrapper (CTO correction #2,
 * Sprint 5.0 review round 2) — we only have one dataset today. Generic
 * infrastructure (shared meta envelope, etc.) is deferred until a second
 * dataset actually needs it.
 */
export type ExecutivePortfolioDataset = ExecutivePortfolioRow[];
