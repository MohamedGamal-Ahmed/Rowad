# Platform Version Matrix

This document tracks major releases, functional changes, structural adjustments, and database migrations from the initial baseline to the current release.

> **Accuracy note (added during the Sprint 5.1 roadmap-alignment pass, 2026-07-01):** the Release History Index below has been corrected to match `CHANGELOG.md` and the real git tag history (`git tag -l`: `v1.1.0`, `v1.2.0`, `v1.3.0`, `v1.3.1`, `v1.4.0`). The previous version of this table used a different, self-contained release narrative ("Pre-Award Estimator," "Operations Planner," "Document EDMS," "SPR Analytics") that did not match `CHANGELOG.md`'s Sprint-based descriptions at any version number, and included a `v1.4.0` "SPR Analytics" release that has no corresponding git tag and no corresponding `CHANGELOG.md` entry. The per-version prose in "§2. Version Specifications" below is **the old, unverified narrative** — it has not been independently re-derived from `CHANGELOG.md` or actual commit contents in this pass and should be treated as unreliable until someone does that reconciliation. Only the Index table (§1) has been corrected here.
>
> **Versioning correction (2026-07-02):** the earlier plan to retroactively tag `v1.4.0`'s commit as `v1.5.0` (to match Sprint 4A.1/4A.4 content) is superseded — no retroactive tag is created. That work stays folded into the real `v1.4.0` tag. `v1.5.0` is reassigned to Sprint 5.1 (BI Foundation Proof); the row and prose below have been updated accordingly.

---

## 1. Release History Index

| Version | Release Name | Date | Status | Major Milestone | Git Tag |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **v1.0.0** | Initial Baseline | 2026-06-28 | Released | Core layout and localStorage seeds (`first commit`) | _no tag_ |
| **v1.1.0** | Sprint 1 — Production Stabilization | 2026-06-30 | Released | Runtime stability, dashboard sync, tender validation, CRUD stability | `v1.1.0` |
| **v1.2.0** | Sprint 2 — Tender & Award | 2026-06-30 | Released | Tender lifecycle, Award wizard, Claims lifecycle, Tender Financial step | `v1.2.0` |
| **v1.3.0** | Sprint 3 — Commercial Modules | 2026-06-30 | Released | IPC engine, VO, NOC, Subcontracts, SPR business completion | `v1.3.0` |
| **v1.3.1** | Sprint 3.0.1 — Hotfix | 2026-07-01 | Released | RC1 release-blocker fixes (IPC/NOC validation), shared UI Dialog System | `v1.3.1` |
| **v1.4.0** | Sprint 4A + 4A.1 + 4A.4 — Project Setup & Activation Foundation, Stabilization, Portfolio Sync | 2026-07-01 | Released | Setup Wizard → Setup Center, Activation Policy, cache invalidation (`ADR-015`), presentation mappers (`ADR-016`), Setup Wizard white-screen fix, Award Dialog portal fix, Setup Draft hydration (`ADR-017`), dynamic KPI/contract-value calc | `v1.4.0` (single tag — no separate 4A.1/4A.4 tag was ever created; folded in per 2026-07-02 versioning correction) |
| **v1.5.0** | Sprint 5.0/5.1 — BI Foundation & Proof (ExecutivePortfolioDataset) | 2026-07-02 | **Current (target)** — tag pending | Executive Semantic Layer (`src/bi/`), `ExecutivePortfolioDataset` proven end-to-end (7/7 validation checks), Developer Dataset Viewer, `ADR-018`, TD-001..004 technical debt logged | _pending_ |

---

## 2. Version Specifications

### 2.1 Version v1.0.0
- **Major Features**: Dashboard analytics widgets, navigation layouts, mock database aggregates.
- **Architectural Changes**: Introduction of features-based clean architecture pattern.
- **Breaking Changes**: None.
- **Database / Schema Changes**: Created `pmo_projects_master` localStorage key.
- **Migration Required**: None.

### 2.2 Version v1.1.0
- **Major Features**: Pre-award estimation wizard (Steps 1-5).
- **Architectural Changes**: Added validators layer (`TenderValidator`).
- **Breaking Changes**: Refactored `Tender` aggregate to enforce bilingual name maps.
- **Database / Schema Changes**: Added `preaward_tenders_db` localStorage key.
- **Migration Required**: Automated seed mappings in `App.tsx` on mount.

### 2.3 Version v1.2.0
- **Major Features**: Scheduling calendar, separate Milestones (deadlines) from Meetings (events). Travel buffer and meeting conflict checks.
- **Architectural Changes**: Added `OperationsCenterService` orchestration manager.
- **Breaking Changes**: Shifted calendar events shape to support separated participants arrays.
- **Database / Schema Changes**: Added `preaward_business_events_db`.
- **Migration Required**: Cleared legacy events in storage.

### 2.4 Version v1.3.0
- **Major Features**: Engineering document management, multi-discipline filters, approval/signature logs.
- **Architectural Changes**: Integrated `ProjectControlsService` and mappers layer.
- **Database / Schema Changes**: Added `pmo_project_attachments`.
- **Migration Required**: Promoted uploaded tender files to active database.

### 2.5 Version v1.4.0
- **Major Features**: Single Paper Report (SPR) dynamic engine.
- **Architectural Changes**: Enforced "Reports Never Own Data" architectural decision (ADR-011).
- **Breaking Changes**: Removed physical tables for reports.
- **Migration Required**: Excluded SPR from persistence tracking.

### 2.6 Sprint 4A.1/4A.4 work (folded into `v1.4.0` — no separate tag; formerly labeled "v1.5.0" in this document until the 2026-07-02 versioning correction reassigned that number to Sprint 5.1)
- **Major Features**: Centralized Project Setup wizard (Commercial, Schedule, Office, Documents), ProjectActivationPolicy checks, dynamic cache invalidation static callbacks, centralized status badging.
- **Architectural Changes**: Decoupled repository writes from cached lookups using callbacks. Centralized status mapping translation rules.
- **Breaking Changes**: Setup draft collections are evicted from database on project activation; configurations are promoted to project aggregate settings.
- **Database / Schema Changes**: Added `pmo_projects_setup_drafts` database key. Added `lifecycleStage` property on projects list.
- **Migration Required**: Project setups hydrated dynamically from aggregate fields if draft is missing.

### 2.7 Version v1.5.0 (Current, target — tag pending)
- **Major Features**: `src/bi/` — Executive Semantic Layer. `ExecutivePortfolioDataset`: one row per Project, combining Tender-to-Award lineage, Setup progress, Commercial values (normalized via `FinancialsCalculator`), and Execution Summary counts/rollups. `PortfolioDatasetValidator` independently proves the dataset (7 checks — row-count parity, no duplicates, monetary normalization, setup-readiness parity, lifecycle parity). Temporary Developer Dataset Viewer at Sidebar → "DEV (TEMPORARY)".
- **Architectural Changes**: New `src/bi/` module — `core` (dataset/registry/metadata contracts), `dto`, `datasets`, `calculators` (Value/Progress/Health/Risk), `builders`, `filters`, `services`, `exporters` (contracts only — throwing stubs), `validation`. No UI dependency inside `src/bi`; only `ProjectLookupService`/`ProjectSetupService` (existing services) are read, never a Repository directly. See `docs/bi/EXECUTIVE_PORTFOLIO_DATASET_SPECIFICATION.md` and `docs/adr/ADR-018-bi-foundation-dataset-layer-timing.md`.
- **Breaking Changes**: None. Fully additive — no existing Entity/DTO/Repository/API changed.
- **Database / Schema Changes**: None. `src/bi/` reads existing LocalStorage-backed data on demand; nothing new persisted (ADR-011 — Reports/datasets never own data).
- **Migration Required**: None.
- **Not included** (explicitly deferred, see `ADR-018`): `DatasetRegistry` wiring, Excel export, REST API, Power BI integration — all remain throwing/unimplemented stubs.
