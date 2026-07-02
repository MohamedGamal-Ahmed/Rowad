# ExecutivePortfolio Dataset Specification

**Sprint:** 5.1 (BI Foundation v1 — proof sprint, following the Sprint 5.0 architecture freeze)
**Status:** Proven end-to-end against the Operational Layer. Read-only. Never persisted (ADR-011).
**Owner:** PMO / Contracts Administration — BI Foundation
**Dataset ID:** `BusinessDatasetType.EXECUTIVE_PORTFOLIO` = `"ExecutivePortfolio"`
**Version:** `1.0.0`

---

## 1. Purpose

One row per Project — the first dataset of the ROWAD Enterprise Semantic Layer (`src/bi/`). It combines Tender-to-Award lineage, Project Setup progress, Commercial values, and Execution Summary counts/totals into a single executive-level read model.

It is not a report. It is the single source every future consumer (Power BI, Executive Dashboard, Excel Export, REST APIs, AI Insights) is expected to read from once those integrations are approved (explicitly **not** in Sprint 5.1 scope).

## 2. Scope of Sprint 5.1

| Phase | Deliverable | Status |
|---|---|---|
| 1 | `ExecutivePortfolioBuilder` — populate every available field from the Operational Layer | Already implemented pre-Sprint-5.1 (Sprint 5.0 Phase 6); confirmed correct, no changes needed |
| 2 | `ExecutivePortfolioService` — return a fully populated dataset | Already implemented pre-Sprint-5.1; confirmed correct |
| 3 | `PortfolioValueCalculator` (reusing `FinancialsCalculator`) | Already implemented pre-Sprint-5.1; confirmed correct, no duplicated formulas |
| 4 | `PortfolioFilterEngine` — all 10 supported filters | Already implemented pre-Sprint-5.1; confirmed correct |
| 5 | Developer Dataset Viewer | **Built in Sprint 5.1** — `src/views/dev/BIPortfolioDatasetViewer.tsx`, temporary, reachable via Sidebar "DEV (TEMPORARY)" group |
| 6 | Dataset Validation | **Built in Sprint 5.1** — `src/bi/validation/PortfolioDatasetValidator.ts` |
| 7 | Documentation | **Built in Sprint 5.1** — this document set |

See `EXECUTIVE_PORTFOLIO_VALIDATION_REPORT.md` for the captured proof run (3 projects → 3 rows, 7/7 checks passed, real seed data, zero mocked values).

## 3. Architecture Position

```
UI (BIPortfolioDatasetViewer — Sprint 5.1 Phase 5, temporary)
    ↓
ExecutivePortfolioService (src/bi/services)
    ↓ loads Projects via
ProjectLookupService (existing operational service, never a raw Repository import)
    ↓ for each Project, delegates to
ExecutivePortfolioBuilder (src/bi/builders)
    ↓ collects related entities via ProjectLookupService, then calls
PortfolioValueCalculator · PortfolioProgressCalculator · PortfolioHealthCalculator · PortfolioRiskCalculator
    ↓ assembles
ExecutivePortfolioRow (src/bi/dto) — one per Project
    ↓ filtered by
PortfolioFilterEngine (src/bi/filters)
    ↓ independently cross-checked by
PortfolioDatasetValidator (src/bi/validation — Sprint 5.1 Phase 6)
```

No calculator depends on another. No calculator or builder imports a Repository directly — only `ProjectLookupService` / `ProjectSetupService`. Nothing in `src/bi` imports a UI component.

## 4. Out of Scope (explicitly stopped at, per Sprint 5.1 directive)

- `DatasetRegistry` registration/wiring — contract remains unimplemented (throws by design).
- Excel export, Power BI export, API export — all four `exporters/` classes remain throwing stubs.
- Any Executive Dashboard / production consumer of this dataset.
- Any second dataset (PreAward, Commercial, Financial, Planning, Claims, VariationOrders, IPC, Meetings, Procurement) — `BusinessDatasetType` still only implements `EXECUTIVE_PORTFOLIO`.

## 5. Refresh Strategy

`on-demand` (per `DatasetMetadata.refreshStrategy`) — matches ADR-011. The dataset is recomputed on every `ExecutivePortfolioService.getPortfolio()` call from live Project + sub-entity data; nothing is cached or persisted by the BI layer itself.

## 6. Related Documents

- `EXECUTIVE_PORTFOLIO_FIELD_DICTIONARY.md` — every field, its RAW/CALCULATED classification, and source.
- `EXECUTIVE_PORTFOLIO_DATA_LINEAGE.md` — where each field physically comes from in the Operational Layer.
- `EXECUTIVE_PORTFOLIO_DATA_MAPPING_MATRIX.md` — Operational entity → BI field mapping table.
- `EXECUTIVE_PORTFOLIO_VALIDATION_REPORT.md` — the captured Sprint 5.1 proof run.
- `docs/adr/ADR-011.md` — Reports Never Own Data (governs this entire dataset's read-only nature).
