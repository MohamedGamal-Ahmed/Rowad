# ROWAD Enterprise Platform — Sprint Roadmap

**Sprint 0 (Project Governance & Architecture Foundation): Completed.**
> Clean Architecture, DDD, Project Book, AI Context (CLAUDE.md), Domain Dictionary, Architecture Reviews, QA Reviews, and the Sprint Roadmap were established before the first execution sprint. ROWAD did not begin without an architectural and methodological baseline.

---

## Sprint Exit Criteria (apply to every Sprint)

A Sprint is **not considered complete** unless **all** the following are achieved:

- Scope Completed
- Type Check Passed (`npm run lint` → `tsc --noEmit` clean)
- Build Passed (`npm run build` succeeds)
- Regression Passed (no existing functionality broken)
- QA Passed (cross-checked against the relevant QA findings)
- Documentation Updated (CHANGELOG.md, ADRs if applicable, this Sprint plan, ROADMAP_STATUS.md)
- Git Tag / Product Version Created (e.g. `v1.1.0` for Sprint 1, following SemVer)
- Code Review Completed
- No Critical Bugs Outstanding (no open P0 or P1 against the Sprint scope)

If any criterion fails, the Sprint stays open until it passes.

---

## Definition of Done (per change / per task — distinct from Sprint Exit Criteria)

Every individual task or change is "Done" only when:

1. **Implemented** — code written, fix complete
2. **Reviewed** — code review approved
3. **Tested** — type-check + build + manual functional test pass
4. **Documented** — relevant comments / docs / CHANGELOG updated
5. **Merged** — PR merged into the working branch
6. **Verified** — re-tested in the merged state
7. **Accepted** — explicitly signed off (by reviewer or by QA cross-check against the originating QA finding)

Exit Criteria = Sprint-level gate. Definition of Done = task-level gate. Both must hold.

---

## Architecture Freeze Policy (effective after Sprint 7)

Once Sprint 7 (Backend Preparation) is completed and signed off, the following are **frozen** and require **explicit CTO approval** to change:

- No Entity Changes
- No DTO Changes
- No Repository Interface Changes
- No API Breaking Changes
- No Domain Model Changes

Purpose: protect the Backend implementation (Sprint 8) and downstream Migration (Sprint 10) from churn. Non-breaking additions (new optional fields, new endpoints) are allowed; renames, removals, and signature changes are not.

---

# Sprint 1 — Production Stabilization

You are the Lead Software Engineer responsible for executing Sprint 1 of the ROWAD Enterprise Platform roadmap.

This is a Production Stabilization Sprint.

The objective is to eliminate production-blocking defects discovered during the Enterprise QA Review while preserving the existing architecture.

This is NOT:

- a redesign sprint
- a refactoring sprint
- a feature sprint
- a backend sprint

The Clean Architecture, Domain Model, Repository Pattern, and current project structure are approved and must remain unchanged.

---

# PRIMARY OBJECTIVE

Stabilize the frontend so the platform is ready for Business Completion Sprint.

Focus only on production blockers and functional defects.

---

# SCOPE

## 1. Runtime Stability

Identify and fix every runtime exception.

Verify:

- No application crashes
- No white screens
- No broken navigation
- No React rendering errors
- No console runtime errors

---

## 2. Dashboard Synchronization

Verify every dashboard updates immediately after CRUD operations.

Including:

- KPI Cards
- Sidebar counters
- Statistics
- Portfolio counts
- Project counters

No page refresh should be required.

---

## 3. Tender Validation

Validate every mandatory field.

Prevent invalid records.

Display clear validation messages.

Block workflow progression when required information is missing.

---

## 4. Financial Calculations

Audit every calculation.

Verify:

- IPC totals
- Subcontract totals
- Contract values
- Currency formatting
- Percentages

Displayed values must always match stored values.

---

## 5. SPR Runtime Stability

Fix every runtime issue inside the SPR module.

Verify:

- Opening SPR
- Switching Projects
- Switching Tabs
- Generating Reports

The SPR must never crash.

---

## 6. CRUD Stability

Verify CRUD operations work correctly for:

- Projects
- Tenders
- Meetings
- Claims
- Variation Orders
- IPC
- NOC
- Subcontracts
- Documents
- Master Data

Ensure:

Create

Edit

Archive

Restore

Search

Filter

operate without breaking existing data.

---

## OUT OF SCOPE

Do NOT implement:

- RBAC
- Authentication
- Backend
- PostgreSQL
- FastAPI
- Notifications
- Email Integration
- Teams Integration
- AI Features
- Workflow Automation
- New Reports
- New Dashboards
- UI Redesign
- Architecture Refactoring

No new business features.

Only stabilize the existing implementation.

---

# IMPLEMENTATION RULES

Do not modify the architecture.

Do not redesign components.

Do not rename business entities.

Do not introduce duplicate models.

Do not introduce temporary workarounds.

Fix the root cause.

Preserve backward compatibility.

Keep all modified files under the project's file-size policy.

---

# VERIFICATION

Run:

- Type Check
- Lint
- Production Build

Then manually verify every fixed issue.

Finally execute a regression pass covering:

- Dashboard
- Ongoing Tenders
- Award Process
- Projects
- Meetings
- Claims
- Variation Orders
- IPC
- NOC
- Subcontracts
- Document Control
- SPR
- Master Data

---

# DELIVERABLES

Provide:

1. Executive Summary

2. Files Modified

3. Root Cause Analysis for each issue

4. Fix Description

5. Verification Results

6. Regression Results

7. Remaining Known Issues

8. Recommendation for Sprint 2

Do not proceed to Sprint 2.

Stop after Sprint 1 is completed and verified.

# Sprint 2 — Tender & Award

Complete the Tender business lifecycle and the Tender → Project Award workflow.

## Scope

### Tender Lifecycle
Validate the full state machine: Draft → Active → Submitted → Under Review → Negotiation → Awarded → Archived. Block invalid transitions. Branches to Lost / Cancelled allowed from pre-award states only.

### Award Process (Tender → Project conversion)
Complete the conversion wizard end-to-end. Verify:
- Wizard flow
- Data transfer (client, consultant, value, scope, attachments, history)
- Tender becomes read-only after Award
- No duplicate Projects created
- Bidirectional relationship record

### Claims (lifecycle completion)
Complete Claims lifecycle: Prepared → Submitted → Under Review → Negotiation → Approved / Rejected / Partially Approved. Add Time Claims vs Cost Claims, History, Attachments, Remarks.

### Tender Financial step
Fill the currently empty "Financial" step with the actual financial fields (estimated cost, margin, bid bond value, etc.).

## Out of Scope

IPC engine, VO, NOC, Subcontracts (these are Sprint 3). Backend, RBAC, Reporting, Analytics.

## Deliverables

- Workflow Matrix
- Business Completion Report (Tender + Award + Claims)
- Remaining Gaps

# Sprint 3 — Commercial Modules (IPC, VO, NOC, Subcontracts) (Status: Completed)

Complete the Project Commercial Management modules. These four modules are tightly coupled and form one commercial package.

## Scope

### IPC (Interim Payment Certificate) Engine
Implement the full IPC business engine: Previous IPC, Current IPC, Retention, Recovery, Certified Amount, Paid Amount, Outstanding, Net Amount. Wire Settings Financial Formulas into IPC auto-calculation. Auto-suggest IPC status after payment recording.

### Variation Orders
Complete Financial Impact, Time Impact, Risk Impact, Approval Workflow.

### NOC (No Objection Certificates)
Complete lifecycle + attachments + expiry tracking integrity.

### Subcontracts
Complete commercial fields, scope assignment, invoiced tracking integrity, status workflow.

### SPR Business Completion
Transform SPR from a static read view into a true Executive Monthly Report aggregating live data from all commercial modules (IPC, VO, Claims, NOC, Subcontracts). Use live module data only. Remains a Read Model (ADR-011).

## Out of Scope

Enterprise Settings (Sprint 4), RBAC (Sprint 5), UX polish (Sprint 6), Backend (Sprint 8).

## Deliverables

- Commercial Package Completion Report
- IPC Calculation Verification Matrix
- SPR Live-Data Verification Report

# Sprint 3E — Commercial Domain Consolidation (Status: Completed)

Sprint 3E is a strategic database/domain refactoring sprint. Its sole purpose is to finalize the Project Commercial Domain Model and clean up redundant baseline fields before introducing the Enterprise Settings and PostgreSQL backend.

* **This is NOT a feature sprint.**
* **This is NOT a UI sprint.**
* **This is NOT a business functionality sprint.**

## Scope

### 1. Commercial Baseline Consolidation
Consolidate properties in the Project domain aggregate to implement a clean three-parameter baseline model:
* `signedContractValue` (representing the award-time signed contract value, immutable after award).
* `approvedVariationTotal` (derived cumulative sum of approved addition and omission variation orders).
* `revisedContractValue` (calculated dynamically as `signedContractValue + approvedVariationTotal`).

### 2. Elimination of Redundant Properties
* Remove the deprecated legacy `contractValue` and intermediate `originalContractValue` properties, establishing a single source of truth for baseline contract value.
* Rename `approvedVoTotal` to `approvedVariationTotal` codebase-wide.

### 3. LocalStorage Versioned Migration
* Implement a decoupled, versioned local storage database migration script (`Migration_001_ProjectCommercialBaseline.ts`) that runs sequentially on application startup via a `MigrationRunner` to upgrade legacy user records without data loss. Repositories remain purely CRUD.

### 4. Downstream Integration & Regression
* Realign IPC, Variation Orders, Claims, dashboards, lookup services, mapper objects, and stats rails to consume the consolidated fields, ensuring full regression integrity.

## Deliverables
- **ADR-013 — Project Commercial Baseline Model**
- **Clean Compile & Build Verification**
- **Commercial Regression Audit**

# Sprint 3.0.1 — Hotfix (Status: Completed)

A Live QA Audit against v1.3.0 RC1 (`ROWAD-Enterprise-QA-Report-2026-06-29.md`) found 4 Critical and 9 Major defects, blocking release. Per CTO authorization, this is **not** Sprint 4 and **not** a new feature sprint — it completes the remaining Sprint 3 scope (IPC commercial fields were implemented in the data layer in Sprint 3A but not fully exposed/enforced in the UI) and fixes release-blocking defects found in the RC1 audit. Architecture, business rules, and ADRs remained frozen for the duration of this hotfix; no new entities, repositories, or modules were introduced.

## Scope

### Phase 1 — Remaining Sprint 3 Scope
- IPC Financial Entry Form: Certified Gross / Retention / Advance Recovery / WHT / Net Certified fields (already present in `CalculationService` and the domain model since Sprint 3A) are now always visible in the IPC form regardless of status, instead of being gated behind `Certified/Partially Paid/Paid` — the gating was the root cause of BUG-IPC-005 and BUG-IPC-001 in the RC1 audit.

### Phase 2 — Critical Business Rule Fixes
- `IpcValidator`: Certified Gross must be strictly > 0 (not just ≥ 0) once status is Certified/Partially Paid/Paid — blocks PAID IPCs with zero financials at save time.
- `IpcValidator`: Invoice Net Value can never exceed Invoice Gross Value.
- `IpcValidator`: Net Certified Amount can never exceed Certified Gross Value (defensive, certified-stage guard).
- `IpcValidator`: Total Paid can never exceed Net Certified Amount, including when Net Certified is 0/undefined (previously a `&& netCertified > 0` guard silently allowed unlimited payments on uncertified IPCs).
- `IPCsPanel`: Payment amount is now validated against the remaining certified balance at the moment "Record Payment" is submitted (inline field error), not only at final IPC save.
- Backfilled seed record `IPC-EASTOWN-14` (`ipc-2`) with consistent Certified Gross / Retention / Advance Recovery / WHT / Net Certified / Payment data — the PAID-with-zero-financials condition found in RC1 traced to incomplete seed data predating the Sprint 3A commercial fields, not a code defect.

### Phase 3 — Commercial Calculations
- `SubcontractorsPanel`: Added "Outstanding Commitment" (`Contract Value − Till Date Invoiced`) to the subcontract card, computed client-side as a derived display value (no new stored field, consistent with Reports-Never-Own-Data principle for derived figures).

### Phase 4 — Validation Improvements
- `NOCsPanel`: Expiry Date must be after Application Date, enforced at save time with an inline field-level error (red border + message under the field), replacing the previous unvalidated state.

### Phase 5 — Shared UI Dialog System (Infrastructure)
- New `src/components/ui/` module: `DialogProvider.tsx` (Context + `useDialog()` hook), `AlertDialog.tsx`, `ConfirmDialog.tsx` (also serves as the prompt-replacement input mode), `Toast.tsx`, `FieldValidation.tsx`.
- Mounted `<DialogProvider>` at the app root (`main.tsx`).
- Replaced every `window.alert()`, `window.confirm()`, and `window.prompt()` call across the codebase (14 files, ~58 call sites: IPCsPanel, NOCsPanel, VOsPanel, ClaimsPanel, MeetingsPanel, SubcontractorsPanel, DocumentsPanel, WBSManager, ContextualAttachmentsList, AttachmentsPanel, ProjectWorkspace, ProjectList, Settings, DocumentControl) with the in-system, Promise-based equivalents.
- Root cause of BUG-IPC-004 / BUG-SUB-004 ("missing confirmation dialog"): the confirmation logic already existed via `window.confirm()`/`window.prompt()`, but native browser dialogs block the JS thread and are invisible to the Live QA browser-automation tooling — they were never actually missing, just unobservable to the audit tool. This was treated as a Release Blocker regardless, since native dialogs are also an accessibility and design-system inconsistency.

### Phase 6 — UI Clarification
- `SubcontractorsPanel`: Renamed the card badge from "Progress" to "Physical Progress" (bilingual). No calculation change — `completionPercentage` remains a manually-entered field, not derived from invoiced amount. Financial Progress (a derived metric) was explicitly out of scope for this hotfix.

## Out of Scope (explicitly deferred)
- Financial Progress (derived completion %) — Future Sprint candidate.
- Subcontract Administration module expansion (Registry / Reviews / Timeline / Budget / Correspondence) — Sprint 4 candidate, pending resolution of overlap with the existing Correspondence forward-compatibility module (CLAUDE.md ch. 12).
- VO status dropdown restriction to valid next-states only (BUG-VO-001) — UX-only, not a release blocker, deferred to Sprint 6 (Enterprise UX Polish).
- NOC archive button (BUG-NOC-002) — re-checked during this hotfix; the Archive action/button already exists in `NOCsPanel` and is wired to `handleArchive`. Flagged for re-verification in the next Live QA pass rather than re-implemented blind.
- NOC auto-expiry status transition (BUG-NOC-003) — Minor, not in the CTO-approved task list for this hotfix.
- Sprint 4, Backend, Authentication, Settings redesign, any new module.

## Deliverables
- IPC/NOC/Subcontract business rule and validation fixes (Phases 1–4, 6)
- Shared UI Dialog System infrastructure (Phase 5)
- `CHANGELOG.md` and `ROADMAP_STATUS.md` updates
- This Sprint.md entry

# Sprint 4 — Enterprise System Settings & Policies

Build the Enterprise Administration module. **Replace** "Centralized Master Registers" naming with "Enterprise System Settings & Policies". This module is **SYSTEM ADMIN ONLY**.

## Dependencies
* **Blocked:** This sprint is strictly blocked and cannot begin until the successful completion of **Sprint 3E (Commercial Domain Consolidation)**.

## Scope

### 1. Master Data
Clients, Employers, Consultants, Contractors, Employees, Business Units, Disciplines, Countries, Currencies, Cities, Document Types.

### 2. Business Rules
Timeline Offsets, Financial Formulas, Numbering Rules, Business Calendar, Working Days, Holiday Calendar.

### 3. Workflow Policies
Per-entity (Tender, Project, Claim, VO, IPC, NOC) policy definitions — used as configuration for the lifecycles built in Sprints 2–3.

### 4. System Policies
Language, Date Format, Currency Format, Auto Numbering.

### 5. Security (Placeholder only)
Users, Roles, Permissions, Audit — UI shells only; actual implementation is Sprint 5.

### 6. Integrations (Placeholder only)
SharePoint, OneDrive, SMTP, Teams — UI shells only; actual implementation is Sprint 8/9.

## Requirements

SYSTEM_ADMIN permission only. No operational users can access this module. No business workflow changes. Only administration.

## Why Sprint 4 (not earlier)

Operational users only need Business Rules **after** the Modules are complete. Building Enterprise Settings before the Commercial Modules would force premature decisions about what to configure.

# Sprint 4A — Project Setup & Activation Foundation & Stabilization (Status: Completed)

Inserted after Sprint 4, before Sprint 5, using the same intercalary convention as Sprint 3E / Sprint 3.0.1. Real, tagged, completed work that predates this document reflecting it — added here as part of the Sprint 5.1 roadmap-alignment pass (see `ROADMAP_STATUS.md` OD-004).

## Scope (executed across 4A.1–4A.4)

- **4A.1** — `ProjectOffice` & Setup Draft domain model (`Project.ts`, `Migration_002`).
- **4A.2** — `ProjectSetupService` implementation (lazy draft instantiation, step validations, state consolidation; `TenderAwardService` refactor).
- **4A.3** — Project Setup Wizard UI (5-step, auto-save, resumable drafts, Activation Gate checks) → later redesigned into a modular Setup Center (independent Commercial/Schedule/Office/Documents cards + 3 non-blocking Advisory placeholder cards).
- **4A.4** — Post-Activation Consistency & Portfolio Synchronization: `ProjectRepository.onSaveCallback` cache-invalidation architecture (`ADR-015`), centralized presentation mappers + reusable status/workflow/lifecycle badges (`ADR-016`), dynamic KPI/contract-value calculations, removal of hardcoded progress placeholders.
- Release-blocker fixes from the Sprint 4A Live QA Audit (`ROWAD_Sprint4A_QA_Report_2026-07-01.md`): `ProjectSetupWizard` white screen, missing ErrorBoundary, Award Dialog overlay/z-index, Award Attachments not surfaced, Setup Draft hydration after activation (`ADR-017`).
- `ADR-014` — formalized the (pre-existing, non-overlapping) separation of `lifecycleStage` / `workflowState` / `status` on `Project`.

## Deliverables

`ADR-014`, `ADR-015`, `ADR-016`, `ADR-017`. Full detail in `CHANGELOG.md` (`[1.4.1]`, `[1.4.2]`, `[1.5.0]` entries) and `ROADMAP_STATUS.md`.

## Note on original Sprint 4 scope

Sprint 4's originally-planned scope (Master Data CRUD, Business Rules configuration, Workflow/System Policies) and Sprint 4A's scope (Project Setup & Activation) are different bodies of work that both landed under the "Sprint 4" umbrella without this document being updated at the time. Whether every original Sprint 4 QA finding (`#8`, `#28`, `#29`, `#2` — Master Data FK linking) is actually closed has **not** been re-verified as part of this Sprint 5.1 roadmap-alignment pass — flagged as a Future Sprint Recommendation to confirm before Sprint 5 (RBAC) begins, since RBAC's Ownership Model assumes real Employee/Department master records.

---

# Sprint 5.0 — BI Foundation (Architecture & Contracts Freeze) (Status: Completed)

Inserted before Sprint 5 (Security & RBAC Foundation), using the same intercalary convention as Sprint 3E / Sprint 3.0.1. See `docs/adr/ADR-018-bi-foundation-dataset-layer-timing.md` for why this exists ahead of Sprint 5 and ahead of the Phase 2 "Power BI / Reporting & Analytics" item this document originally deferred BI work to — short version: this sprint and 5.1 prove the **dataset/semantic layer only** (on-demand, LocalStorage-scale, reuses existing Services/Calculators); the **export/consumer layer** (Excel, REST, Power BI, `DatasetRegistry` wiring) remains in Phase 2 exactly as originally planned.

## Scope

Established `src/bi/` — folder structure, Dataset contracts (`IBusinessDataset`, `DatasetMetadata`, `BusinessDatasetType`), Builder contracts, Service contracts, Calculator contracts, Export contracts (`IExporter` + 4 throwing-stub exporters), Dataset Registry contract (throwing-stub), Metadata contracts. `ExecutivePortfolioDataset`'s DTO, builder, 4 calculators, service, and filter engine were implemented with real logic during this sprint (not left as contracts) — see `docs/bi/EXECUTIVE_PORTFOLIO_FIELD_DICTIONARY.md`.

## Out of Scope

`DatasetRegistry` registration logic, any exporter implementation, any second dataset, any UI consumer.

## Deliverables

`src/bi/` (frozen contracts + real `ExecutivePortfolioDataset` implementation).

---

# Sprint 5.1 — BI Foundation Proof (ExecutivePortfolioDataset) (Status: Completed)

Proved the Sprint 5.0 architecture end-to-end against real Operational Layer data. No new infrastructure — explicit instruction was "Do not add more infrastructure or framework code," "No placeholders. No TODOs. No mock values."

## Scope

1. Confirmed `ExecutivePortfolioBuilder`, `ExecutivePortfolioService`, `PortfolioValueCalculator` (+ Progress/Health/Risk), and `PortfolioFilterEngine` were already correctly implemented (Sprint 5.0) — no code changes needed.
2. Built `src/bi/validation/PortfolioDatasetValidator.ts` — 7 independent checks (row-count parity, no duplicate rows/codes, no missing/untraceable IDs, monetary normalization cross-checked against `FinancialsCalculator`, setup-readiness parity against `ProjectSetupService.evaluatePolicy()`, lifecycle/workflow/status parity against `Project`).
3. Ran a real proof script (`src/tests/run-bi-portfolio-validation.ts`) against real seed data — result: 3 projects → 3 rows, 7/7 checks passed.
4. Built a temporary Developer Dataset Viewer (`src/views/dev/BIPortfolioDatasetViewer.tsx`) behind a "DEV (TEMPORARY)" Sidebar group — never a business feature. Close-out: gated behind `import.meta.env.DEV` so it compiles out of production builds entirely (added `src/vite-env.d.ts`, previously missing from the project).
5. Documentation: `docs/bi/EXECUTIVE_PORTFOLIO_DATASET_SPECIFICATION.md`, `_FIELD_DICTIONARY.md`, `_DATA_LINEAGE.md`, `_DATA_MAPPING_MATRIX.md`, `_VALIDATION_REPORT.md`.

## Out of Scope (explicitly stopped at)

Excel export, Power BI integration, REST API, any Executive Dashboard consumer, `DatasetRegistry` wiring, any second dataset.

## Deliverables

`docs/bi/*`, `ADR-018`. Verification: `tsc --noEmit` clean (0 new errors — see `CHANGELOG.md` for the sandbox caveat on how this was confirmed). `npm run build` and the Git Tag/Commit exit criteria were **not** completable from the verification sandbox — see `ROADMAP_STATUS.md` "Current Blockers."

---

# Sprint 5.2 — Dataset Expansion (Status: Planned)

Continues the BI/semantic layer. **Infrastructure is frozen** — no new folder structure, no new contracts, no new generic abstractions. This sprint populates the pattern Sprint 5.0/5.1 already proved, for two more datasets.

**Dependency:** Item 4 below (Executive Portfolio Report) may not begin implementation until Sprint 5.1 is formally Exit-closed (Build Passed + Git Tag Created per its own Exit Criteria — see `ROADMAP_STATUS.md` Version Reconciliation Note). Items 1–3 are not blocked by this.

**Amendment (2026-07-02):** Item 4 was added to this scope on request. Sprint 5.1's own "Out of Scope" list (§ above) explicitly deferred "any Executive Dashboard consumer" — this amendment consciously pulls the first such consumer forward into 5.2, scoped narrowly to a read-only presentation layer over the already-frozen `ExecutivePortfolioService`. It does not reopen `src/bi/` infrastructure and does not implement the exporters still deferred below.

## Priority

1. Executive Portfolio enrichment (fill remaining gaps identified in Sprint 5.1's validation/lineage docs — e.g. seed-data setup-readiness gap, once the seed data owner regenerates it).
2. Pre-Award Dataset (`BusinessDatasetType.PRE_AWARD`) — one row per Tender, following the exact `ExecutivePortfolioDataset` pattern (DTO → builder → calculators only where real formulas exist → service → filter engine → validator → docs).
3. Commercial Dataset (`BusinessDatasetType.COMMERCIAL`) — IPC/VO/Claims/NOC/Subcontracts rollups, following the same pattern.
4. **Executive Portfolio Report (`ExecutivePortfolioReport.tsx`)** — first production UI consumer of `ExecutivePortfolioDataset`/`ExecutivePortfolioService`. Replaces the Sprint 5.1 developer viewer (`src/views/dev/BIPortfolioDatasetViewer.tsx`) as the CEO/PMO/BU-Manager/Portfolio-Manager-facing screen. Presentation layer only — no new calculators, no repository access, no business logic in components. Export buttons (Excel/CSV/JSON/Power BI/REST) are UI-only placeholders; exporters themselves remain Phase 2 per ADR-018 (see Out of Scope below).

## Out of Scope (still deferred to Phase 2 per ADR-018)

Excel Export, REST API, Power BI integration, `DatasetRegistry` wiring. (Item 4 above may render disabled/placeholder buttons for these but must not implement them.)

---

# Sprint 5 — Security & RBAC Foundation

Prepare the platform for enterprise security. **No authentication implementation yet.**

## Scope

### Models
- Role Model
- Permission Model
- Ownership Model

### Roles
System Administrator, Department Manager, Contracts Manager, Contracts Engineer, Tender Engineer, Project Engineer, Document Controller, Read Only.

### Project Ownership
Assigned Projects, Department Visibility, Portfolio Visibility.

### Audit Log
Track Create, Update, Archive, Restore on every entity.

### Authentication Preparation
Define interfaces and contracts. Do not implement login UI yet.

# Sprint 6 — Enterprise UX Polish

Improve usability without changing business logic.

## Scope

Search, Filtering, Sorting, Pagination, Responsive, Breadcrumbs, Loading States, Empty States, Error Messages, Success Messages, Tooltips, Number Formatting, Date Formatting, Table Consistency, Forms Consistency, Dialogs, Keyboard Shortcuts, Accessibility.

## Out of Scope

No business logic changes. No backend. No new modules.

# Sprint 7 — Backend Preparation

This is the **most important non-implementation Sprint**. If done correctly, the Backend Sprint becomes mechanical.

## Scope

### Freeze
- Domain Model
- Entities
- Repositories (interfaces)
- DTOs
- Business Rules
- Validation Rules
- API Contracts
- Naming Convention (cross-stack: TS ↔ Python)

### Generate
- ERD (Entity Relationship Diagram)
- Database Dictionary (per-table column documentation)
- API Endpoints list
- OpenAPI Specification
- Sequence Diagrams (write flows)
- Pydantic Models
- Repository Contracts
- Database Constraints (PK, FK, UNIQUE, CHECK)
- Indexes Strategy
- Migration Strategy (Alembic baseline + future migrations policy)

### Security Review (security is a design concern, not a post-implementation patch)
- Security Review of the frozen model
- Sensitive Data Review (PII, financials, contracts, attachments)
- Authorization Matrix Review (per role × per entity × per action)
- OWASP Top 10 Checklist applied to planned API
- API Threat Model (auth bypass, IDOR, injection, rate-limiting, file-upload risks)

### Validate
No duplicate entities, no duplicate DTOs, no missing relationships, no orphan references.

### Architecture Freeze
Trigger the Architecture Freeze Policy (see top of this file). After Sprint 7 sign-off, breaking changes to Entities / DTOs / Repository interfaces / API contracts / Domain Model require explicit CTO approval.

## Deliverables

A complete backend specification package such that Sprint 8 is execution-only. Security review document signed off.

# Sprint 8 — Backend Core

Build the production backend core.

## Scope

### Implement
- PostgreSQL Database
- FastAPI
- SQLAlchemy
- Alembic
- JWT Authentication
- Authorization (wire RBAC defined in Sprint 5)
- Repositories
- Services
- REST APIs
- File Metadata layer
- Audit Log
- Background Tasks
- Swagger / OpenAPI live docs

### Validate
- API contracts match the Sprint 7 freeze
- Database schema matches the ERD
- Security (apply Sprint 7 OWASP checklist; verify auth + authorization in practice)

### Performance Baseline (capture numbers, do not skip)
Establish a measured baseline **before** entering production. Required metrics:
- Response Time (per endpoint, p50/p95/p99)
- Memory footprint (idle + under representative load)
- Database connection usage (pool saturation under load)
- Latency (frontend ↔ API round-trip)
- Throughput (requests/sec sustainable)

Document the baseline so Sprint 12 (Hypercare) can detect regressions.

## Deliverables

Production-ready backend core. OpenAPI Documentation. Migration Guide (LocalStorage → API). Frontend repositories swapped from LocalStorage to API client. Performance Baseline Report.

---

# Sprint 9 — Production Infrastructure & File Integrations

Production-grade operational concerns and external file integrations.

## Scope

### Infrastructure
- Deployment pipeline
- Backup strategy
- Logging
- Monitoring
- Caching layer

### Observability (must exist before Go Live)
- Health Checks endpoint
- Readiness Probe (is the service ready to receive traffic)
- Liveness Probe (is the service alive)
- Error Monitoring (Sentry or equivalent)
- Alerting rules (latency, error rate, queue depth, DB connections, disk)

Designed to be Kubernetes/Docker-ready even if first deployment is single-host.

### File Integrations
- SharePoint integration
- OneDrive integration
- File link/metadata sync
- Permissions propagation where possible

## Deliverables

Production-ready deployment, operational runbook, alerting playbook, integration verification report.

---

# Sprint 10 — Data Migration

The most critical Sprint **for the business**. Excel-to-ROWAD migration. Not part of Backend — large enough to be its own Sprint.

## Scope

- Excel Source Inventory (10+ workbooks)
- Data Cleansing rules per source
- Import Wizard (per entity: Tenders, Projects, IPC, VOs, Claims, NOC, Subcontracts, Documents)
- Validation against domain rules
- Duplicate Detection
- Reconciliation Reports (source vs. imported)
- Migration Report (counts, exceptions, manual interventions)

## Migration Strategy — Pilot First, Then Full

Never do a single big-bang migration. Sequence:

1. **Pilot Migration** — one department / one project family / a representative subset
2. **Validation** — reconcile counts, totals, key field spot-checks against the source Excel
3. **Department Approval** — sign-off from the data owner before scaling
4. **Full Migration** — only after Pilot is approved

This dramatically reduces risk and surfaces cleansing issues against a small dataset before they multiply.

## Deliverables

Imported production dataset. Pilot reconciliation evidence. Department sign-off. Full Migration Report.

---

# Sprint 11 — Go Live

## Scope

- Pilot (one department / one project line)
- Training (per role)
- Department Rollout
- Support model (tier 1 / tier 2 / engineering escalation)
- Bug Fixes (post-go-live triage)
- Production Cutover

## Rollback Plan (mandatory before cutover)

Document and rehearse:
- Trigger conditions (what error rate / what failure scope triggers rollback)
- Decision authority (who calls it)
- Data rollback procedure (DB restore + file-link reconciliation)
- Communication plan (users, stakeholders, support)
- Time-to-rollback target (SLA)
- Return-to-old-system procedure (Excel workbooks frozen at cutover date)

No cutover without a tested rollback rehearsal.

## Deliverables

Live production system. Training materials. Support playbook. Signed-off Rollback Plan + rehearsal report.

---

# Sprint 12 — Hypercare

The first 30 days after Go Live. Production exists but is not yet "stable" — Hypercare is a dedicated period of elevated attention.

## Scope

- Bug Fixes (triage and patch issues surfaced by real users)
- Monitoring (close watch on alerts; tune thresholds)
- User Feedback (collect, categorize, route)
- Performance Tuning (compare live metrics against Sprint 8 Performance Baseline)
- Minor Improvements (paper cuts the users surface)

After Hypercare passes (target: 30 days, no open P0/P1, stable metrics, user acceptance), the platform is declared **Production Stable** and BAU operations begin.

## Deliverables

Hypercare Report. Production Stable declaration. Handoff to BAU support.

---

# Phase 2 — Post-Production Capabilities

These are intentionally **after** Go Live + Hypercare. They depend on real production data and stable operations.

Recommended sequence (AI/OCR/Notifications first because they deliver immediate user value; Reporting/Power BI requires production data volume to be useful):

1. **AI Assistant** (needs production data)
2. **OCR** (document intake automation)
3. **Notifications** (in-app + email + Teams)
4. **Workflow Automation**
5. **Power BI / Reporting & Analytics** (proper aggregation, materialized views, indexes — requires backend + production data; can use Power BI directly on the DB)
6. **Mobile Application**
7. **Microsoft 365 deep integration**

Reporting was originally planned as a pre-backend Sprint but moved here because real reporting needs PostgreSQL aggregation, query optimization, indexes, and materialized views — not LocalStorage.

**Amended by ADR-018 (Sprint 5.0/5.1):** this item now refers specifically to the **export/consumer layer** — Excel Export, REST API, Power BI integration itself, and `DatasetRegistry` wiring. The underlying **dataset/semantic layer** (`src/bi/`, `ExecutivePortfolioDataset` and its Sprint 5.2 successors) is explicitly out of this Phase-2 deferral — it was proven safe to build pre-backend because it only re-reads the existing on-demand Operational Layer (same pattern as SPR/Dashboards under ADR-011), not a PostgreSQL aggregation. See `docs/adr/ADR-018-bi-foundation-dataset-layer-timing.md`.

