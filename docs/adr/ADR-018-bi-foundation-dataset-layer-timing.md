# ADR-018: BI Foundation / Executive Semantic Layer — Built Pre-Backend, Scoped to Dataset Proof Only

## Status
Accepted

## Context

`Sprint.md`'s original Phase 2 plan placed "Power BI / Reporting & Analytics" after Go Live + Hypercare, explicitly because "real reporting needs PostgreSQL aggregation, query optimization, indexes, and materialized views — not LocalStorage."

During Sprint 5.0/5.1 (executed ahead of Sprint 5 — Security & RBAC Foundation), a BI/semantic layer (`src/bi/`) was built and proven against the live LocalStorage-backed Operational Layer: `ExecutivePortfolioDataset` — a builder, four calculators (Value/Progress/Health/Risk), a service, a filter engine, and (Sprint 5.1) an independent dataset validator, all producing a correct, real, non-fabricated dataset from `Project` + its sub-entities. See `docs/bi/EXECUTIVE_PORTFOLIO_DATASET_SPECIFICATION.md` and `docs/bi/EXECUTIVE_PORTFOLIO_VALIDATION_REPORT.md`.

This is, on its face, a contradiction of the Phase 2 placement decision. It is not — the two decisions address different layers.

## Decision

Split "Reporting/BI" into two layers with different timing:

1. **Dataset / Semantic Layer** (`src/bi/{core,dto,datasets,calculators,builders,filters,validation}`) — the read-model shape and its business-rule-correct population. This layer only re-reads the existing Operational Layer through existing Services (`ProjectLookupService`, `ProjectSetupService`) and reuses existing Calculators (`FinancialsCalculator`) — it introduces no new persistence, no new entities, and (per Sprint 5.0's freeze) no new architecture beyond what was already approved. Building and proving this now, pre-backend, carries none of the risk the original Phase 2 placement was protecting against — there is no PostgreSQL aggregation to get wrong yet, because this layer computes on demand from in-memory data exactly like every existing Read Model (SPR, Dashboards) already does under ADR-011.
2. **Consumer / Export Layer** (`src/bi/exporters/*`, `DatasetRegistry` wiring, any future REST endpoint or Power BI connector) — remains deferred to Phase 2, exactly as originally planned. `Sprint.md`'s reasoning fully applies here: exporting at scale, querying across a real production data volume, and integrating with Power BI genuinely do need the backend. Sprint 5.1 explicitly stopped before this layer ("Do not start Excel export. Do not start Power BI.").

Sprint 5.0 ("BI Foundation freeze" — contracts) and Sprint 5.1 ("BI Foundation Proof" — real `ExecutivePortfolioDataset` end-to-end) are intercalary sprints inserted between Sprint 4A and Sprint 5 (Security & RBAC Foundation) in `Sprint.md`, using the same decimal/lettered convention already established by Sprint 3E and Sprint 3.0.1. Sprint 5 (RBAC) and every sprint after it keep their original `Sprint.md` numbers unchanged.

## Consequences

- `ExecutivePortfolioDataset` is available as a proven, reusable read model the moment a production consumer (Executive Dashboard, Excel Export, REST API, Power BI) is approved — no re-derivation of its business rules will be needed, only a consumer-layer wrapper.
- Every dataset added under this pattern (PreAward, Commercial, per Sprint 5.2) must observe the same split: dataset/semantic layer now, export/consumer layer in Phase 2.
- If a future dataset's correctness genuinely cannot be proven without backend-scale aggregation (e.g., cross-project rollups too large for LocalStorage), that dataset does **not** qualify for this pattern and stays in Phase 2 in full — this ADR does not blanket-exempt all future BI work from the original Phase 2 placement, only the kind already proven safe by Sprint 5.1 (single-project-scoped, on-demand, LocalStorage-scale).
