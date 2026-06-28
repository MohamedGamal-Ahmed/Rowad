# ROWAD — CTO Implementation Roadmap (Pre-Backend) · v2

**Author role:** Independent CTO / Enterprise Software Architect (planning only — no code, no refactor, no file changes)
**Baseline:** `CTO-Frontend-Readiness-Review.md` (Overall 69/100, *READY WITH MINOR FIXES*)
**Executor:** Google AI Studio — this plan is written to be executed sprint-by-sprint **without further clarification**.
**Revision note (v2):** Rebuilt after senior review. Changes: (1) consolidated, named sprints instead of S0–S8; (2) project reframed as a **Contract Administration Platform**, not a generic ERP; (3) added **Master Data / Modules / Reports** taxonomy; (4) added **Project Lifecycle Validation**; (5) added **Module Dependency Map**; (6) added **Entity Ownership** table; (7) added **Data Flow per module**; (8) added **Entity Validation** step; (9) hard **300-line file rule**; (10) **Architecture Health Report after every sprint**; (11) explicit **Single Source of Truth** declaration; (12) **backend gate moved to after the Consistency sprint**, not after model unification.
**Date:** 2026-06-25

> **CTO note on the backend gate.** A component split (decomposing `ProjectWorkspace`) does **not** change the API contract — the contract is defined by the *entity/data model*, not by UI structure. The reason the gate still moves later is the reviewer's stronger point: the **Enterprise Consistency** pass (CRUD + dropdowns + reports + relationships) is what actually freezes the contract surface. So: backend starts **after Sprint 12 (Consistency)**, confirmed by **Sprint 13 (Audit)**, with the entity contract finalized in **Sprint 14 (Domain Blueprint)** before any FastAPI work.

> **Execution rules for the executing model.** Run sprints in order. Do not start a sprint until its predecessor's Exit Criteria pass. After every sprint: run `npm run lint` (`tsc --noEmit`) — must be zero errors — and produce the **Architecture Health Report** (template in §K). Never change runtime behavior unless a task says so; most work is structural.

---

## §A — Platform Identity: Contract Administration, not Generic ERP

ROWAD is a **Construction Contract Administration Platform**. This reframing changes how we classify everything. The previous roadmap listed "Meetings / Calendar / Dashboard / Projects" as if they were peer ERP modules. They are not peers — they sit in three different layers:

| Layer | Definition | Examples in ROWAD |
|---|---|---|
| **Master Data** | Authoritative reference entities. Created once, referenced everywhere. Never re-typed. | Client, Employer, Consultant, Contractor, Scope, Currency, Country, Department, Document Type, Contract Type, Business Unit |
| **Modules (transactional)** | Business records created *against a Project*. Have lifecycle/workflow. | Meetings, IPC, Claims, Variation Orders, NOC, Documents, Subcontracts, Attachments, WBS |
| **Reports (derived)** | **Generated** from Master Data + Modules. Must NOT be hand-authored data. | **SPR** (a report, not a module — confirmed in baseline review), Dashboard, Analytics, Operations Center views |

**Action:** every screen, sprint task, and CRUD operation below is tagged `[MASTER]`, `[MODULE]`, or `[REPORT]`. A `[REPORT]` that lets users *type* primary data (today: SPR's progress/SV/CV) is a defect, not a feature.

---

## §B — Single Source of Truth (must be written by the letter)

> **Project Master is the ONLY source of truth for:**
> **Project Name, Client, Employer, Consultant, Country, Currency, Contract Type, Business Unit** (and Project Code, City, Department, Main Contractor).
>
> **No Module and no Report may store, duplicate, or re-capture these values.** They are referenced by `id` from Master Data / Project Master only. Any module needing them reads them through the Project aggregate, never by re-typing.

This rule is the acceptance test for Sprint 12 (Consistency). Master Data is the same rule one level up: **a Client/Consultant/etc. is authored once in Master Registers and referenced by `id` everywhere** — never typed as free text (today's Tender Wizard violates this).

---

## §C — Project Lifecycle (the heart of the platform — was missing)

The platform's spine is the lifecycle, not the workspace. Every module hangs off a lifecycle stage. The current code has `Project.lifecycleStage: 'Pre-Award' | 'Awarded' | 'Execution' | 'Closing' | 'Archived'` but **nothing validates the transitions**.

```
TENDER ──(win)──► AWARD ──(mobilize)──► PROJECT ──(deliver)──► EXECUTION ──(handover)──► CLOSE-OUT ──► ARCHIVE
  │ pre-award        │ award decision      │ project master     │ IPC/Claims/VO/NOC        │ final account     │ read-only
  │ TenderWizard     │ promote tender      │ created from tender│ Meetings/Docs/SPR        │ closeout checklist│
```

**Lifecycle invariants to validate (Sprint 12):**
- A Project cannot exist without an awarded Tender (or an explicit "direct award" flag).
- Tender → Project **promotion carries data forward** (no re-entry of Client/Value/Dates).
- Execution modules (IPC, Claims, VO, NOC) are only creatable when `lifecycleStage ∈ {Execution, Closing}`.
- Close-Out requires: final IPC certified, all Claims resolved/closed, all VOs approved/rejected, NOCs cleared.
- Archived ⇒ all child modules read-only.

**Dedicated work:** *Sprint 12* contains an explicit **Project Lifecycle Validation** task set; it must pass before backend.

---

## §D — Module Dependency Map (was missing)

Confirms no module is isolated and that everything roots in Project Master.

```
                         ┌─────────────────────┐
                         │   MASTER DATA        │  Client, Employer, Consultant,
                         │  (reference layer)   │  Contractor, Scope, Currency,
                         └──────────┬───────────┘  Country, Dept, DocType, ContractType, BU
                                    │ referenced by id
                                    ▼
                         ┌─────────────────────┐
                         │   PROJECT MASTER     │  (Aggregate Root candidate)
                         │   Project + WBS      │
                         └──────────┬───────────┘
        ┌─────────┬─────────┬───────┼────────┬─────────┬──────────┬──────────┐
        ▼         ▼         ▼       ▼        ▼         ▼          ▼          ▼
     Meetings    IPC      Claims    VO       NOC    Documents  Subcontracts  Attachments
        │         │         │       │        │         │          │          │
        └─────────┴─────────┴───────┴────────┴─────────┴──────────┘          │
                                    │ feed                                    │ attach to any entity
                                    ▼                                         │
                         ┌─────────────────────┐                             │
                         │   AUDIT HISTORY      │◄────────────────────────────┘
                         │  (cross-cutting)     │
                         └──────────┬───────────┘
                                    │ aggregated by
                                    ▼
                    ┌──────────────────────────────────┐
                    │  REPORTS: SPR · Dashboard ·       │  (read-only, generated)
                    │  Operations Center · Analytics    │
                    └──────────────────────────────────┘
```

**Validation rule:** every `[MODULE]` must (a) hold a `projectId`, (b) resolve party/lookup fields from Master Data by `id`, (c) write to Audit, (d) never be a data source for another module except via documented relationships. **Cross-module links** (`relatedClaimIds`, `relatedVOIds`, …) are today loose string arrays — Sprint 12 decides integrity strategy.

---

## §E — Entity Ownership (was missing)

Who is authoritative for each entity's persistence and rules. Target state:

| Entity | Owning Repository | Owning Service (rules) | UI surface | Notes |
|---|---|---|---|---|
| Project | `ProjectRepository` | `ProjectService` *(to introduce)* | Project Master / Workspace Overview | Aggregate Root candidate (Q-D2) |
| WBS Package | `WBSRepository` *(split from ProjectRepository)* | `ProjectService` | WBSManager | child of Project |
| Tender | `TenderRepository` | `TenderService` | TenderWizard / OngoingTenders | pre-award; promotes to Project |
| Meeting | `MeetingRepository` *(split)* | `OperationsCenterService` / `MeetingService` | Workspace Meetings + Calendar | shared between Workspace & Operations — resolve boundary (Q-D3) |
| IPC | `IPCRepository` *(split)* | `IPCService` *(to introduce)* | Workspace IPC | payment lifecycle calc |
| Claim | `ClaimRepository` *(split)* | `ClaimService` *(to introduce)* | Workspace Claims | approval state machine |
| Variation Order | `VORepository` *(split)* | `VOService` *(to introduce)* | Workspace VO | technical/commercial/approval blocks |
| NOC | `NOCRepository` *(split)* | `NOCService` *(to introduce)* | Workspace NOC | own storage key today |
| Document | `DocumentRepository` | `DocumentService` | Document Control + Workspace Docs | legacy view to migrate |
| Attachment | `AttachmentRepository` *(split)* | `AttachmentService` | ContextualAttachmentsList | polymorphic (attaches to any entity) |
| Subcontract | `SubcontractRepository` *(split)* | `SubcontractService` | Workspace Subcontractors | links Contractor + Scope masters |
| Audit record | `AuditRepository` *(formalize)* | `AuditService` *(currently orphan — wire it)* | History panel | single audit path |
| Settings | `SettingsRepository` *(formalize)* | Settings engine | Settings view | already centralized config |
| Master entities | `MasterDataRepository` | — | Master Registers | authoritative reference |

**Rule:** exactly one repository owns each entity's storage; exactly one service owns its business rules; **the Workspace owns no persistence** — it only renders panels that call services. (Today `ProjectRepository` owns 11 entities in one 749-line class — split per Sprint 11.)

---

## §F — Data Flow (per module, target state)

Every module must follow the same one-directional flow. This is the contract that makes the FastAPI swap a single-layer change.

```
UI (Panel/Form)
   │  user intent, no storage knowledge
   ▼
Hook (use<Module>)          ← React state, derive, handlers
   │  calls service methods
   ▼
Service (<Module>Service)   ← business rules, validation, orchestration
   │  calls repository
   ▼
Repository (<Module>Repository)
   │  through StorageProvider interface only
   ▼
Storage (LocalStorageProvider  →  HttpProvider when backend lands)
```

**Per-module checklist (Sprint 14 Domain Blueprint produces this for each):**
- `UI → Hook`: panel imports a hook, never a repository or `localStorage`.
- `Hook → Service`: hook never contains business rules.
- `Service → Repository`: service never touches `localStorage`.
- `Repository → StorageProvider`: only place storage keys appear.
- Today's violations to clear: components reading `localStorage` directly (Operations scheduling metadata), `OperationsCenterService` importing view mocks, currency formatting living in UI.

---

## REPORT 1 — Priority Matrix

(Carried from v1, unchanged classification; full table retained.)

| # | Issue | Severity |
|---|---|---|
| I-01 | Dual data model (domain vs flat legacy + mappers) | **Critical** |
| I-02 | Direct `localStorage` from services + components (12 keys) | **Critical** |
| I-03 | No router; nav state in `App.tsx` | **High** |
| I-04 | `OperationsCenterService` imports `views/*` mocks (dep inversion) | **High** |
| I-05 | `ProjectWorkspace.tsx` 2,415 lines, 15 modules inline | **High** |
| I-06 | Master data not enforced (free-text parties in Tender Wizard) | **High** |
| I-07 | 4 more files > 1,000 lines | **High** |
| I-08 | No state container (0 ctx / 0 store) | **Medium** |
| I-09 | Currency formatting duplicated ×9 | **Medium** |
| I-10 | Timeline-offset defaults defined ×3 | **Medium** |
| I-11 | 8 orphan services | **Medium** |
| I-12 | Anemic domain; Aggregate Root unenforced | **Medium** |
| I-13 | Loose `relatedXIds` relationships | **Medium** |
| I-14 | Hardcoded FX rates in `FinancialsCalculator` | **Medium** |
| I-15 | SPR headline KPIs manual (report authoring data) | **Medium** |
| I-16 | Dead recompute in `TenderService.getTenders` | **Low** |
| I-17 | "PostgreSQL…" strings, no PostgreSQL | **Low** |
| I-18 | `ConflictEngine` raw `new Date(\`…\`)` vs `Clock` | **Low** |
| I-19 | No shared DataGrid | **Low** |
| I-20 | Unused components/types | **Low** |
| **I-21** | **Lifecycle transitions unvalidated** (Tender→…→Close-Out) | **High** *(new, from review)* |
| **I-22** | **No SSOT enforcement** — modules can re-capture Project Master fields | **High** *(new)* |
| **I-23** | **SPR treated as module, not report** | **Medium** *(new)* |

---

## REPORT 2 — Consolidated Sprint Roadmap

Eleven sprints, numbered to match the agreed enterprise sequence. **Frontend CTO scope = Sprints 10–14.** Sprints 15–20 are the downstream backend track (listed for sequencing; out of this document's build scope). **Backend (Sprint 16) starts only after Sprint 12 passes and Sprint 13 confirms.**

---

### 🟦 Sprint 10 — Enterprise Stabilization *(Complete Missing Features + Hygiene)*
- **Goal:** Close functional gaps in the transactional modules and remove dead weight, with zero architectural risk.
- **Tasks:**
  - `[MODULE]` IPC: implement payment-lifecycle calculations (certified → retention → VAT → net → due/overdue) using `FinancialsCalculator`.
  - `[MODULE]` Claims: add a real approval state machine (Prepared→Submitted→Under Review→Approved/Rejected/Escalated) instead of free status strings.
  - `[MODULE]` VO / NOC / Subcontracts: complete status workflows + Subcontract invoiced/progress calc.
  - `[REPORT]` SPR: convert progress/SV/CV from manual inputs to **generated** values (or, if a business decision keeps them manual, label them explicitly as manual narrative, not data — Q-R7).
  - **Hygiene (old S0):** fix I-04 (move seeds out of `views/`), remove dead recompute (I-16), neutralize "PostgreSQL" strings (I-17), resolve 8 orphan services + unused types (wire or delete — I-11, I-20).
- **Dependencies:** none.
- **Complexity:** Medium.
- **Expected benefits:** Modules behave like real contract-admin records; cleaner dependency graph.
- **Architecture improvement:** Restores inward dependency direction; reports stop being data-entry screens.
- **Exit criteria:** `tsc` clean; no `src/services|features` import from `src/views`; SPR no longer accepts hand-typed primary metrics (or they're formally flagged); orphan list resolved; **Architecture Health Report (§K) produced.**

---

### 🟦 Sprint 11 — Massive Refactoring *(Files + Components + Hooks + Services + Seams)*
- **Goal:** Decompose every oversized file, unify the data model, and install the persistence + navigation seams. This is the structural heavy-lift.
- **Tasks:**
  - **Persistence seam (old S1):** `StorageProvider` interface + `LocalStorageProvider` under `src/repositories/storage/`; route all 12 `localStorage` keys through repositories; centralize keys in `StorageKeys`.
  - **Data model unification (old S2 — Critical):** pick ONE canonical model (Q-D1); collapse domain↔legacy duplication for Tender + ProjectControls; keep mappers ONLY as `*ApiAdapter` for the future backend boundary.
  - **Split per Entity Ownership (§E):** break `ProjectRepository` (749) into per-entity repositories + `projectSeed.ts`.
  - **Decompose oversized components/views (Report 3):** `ProjectWorkspace` (2,415) → panel-per-module; `ProjectExecution`, `TenderWizardModal`, `DocumentControl`, `Settings`, `OperationsCenterService`, `Dashboard`, `MasterRegisters`, `ProjectList`.
  - **Router (old S3):** react-router + thin `AppShell`; URL-driven view/project/tab; `App.tsx` < 120 lines.
  - **DRY (old S7):** single currency formatter, single offset-defaults source, `Clock` everywhere, FX rates → settings.
- **Dependencies:** Sprint 10; Q-D1 answered.
- **Complexity:** High.
- **Expected benefits:** Maintainability jumps; backend swap becomes a provider change; deep links work.
- **Architecture improvement:** Clean seams (storage, navigation), one model per entity, uniform feature-folder shape, no file > 300 lines (§J rule).
- **Exit criteria:** No file > 300 lines except flagged seed-data files; `localStorage` appears only in `repositories/storage/`; exactly one `Tender` shape across UI/service/repo; every screen URL-reachable; **Architecture Health Report produced and improved vs Sprint 10.**

---

### 🟦 Sprint 12 — Enterprise Consistency *(CRUD + Dropdowns + Reports + Relationships + Lifecycle)* — **★ BACKEND GATE**
- **Goal:** Make the whole frontend internally consistent so the contract surface is frozen. No new features — only review/align every screen.
- **Tasks:**
  - **SSOT enforcement (§B):** audit every screen; ensure Project Master fields (Name/Client/Employer/Consultant/Country/Currency/Contract Type/Business Unit) are referenced by `id`, never re-captured. Fail the sprint if any module re-types them.
  - **Dropdowns (old S5):** every party/lookup field → `SearchableAutocomplete` bound to `MasterDataRepository`, storing `id`; inline "add master entry" where missing. Primary offender: `TenderWizardModal` free-text EN+AR.
  - **CRUD review:** every entity has consistent Create/Read/Update/Delete through its service (§E), same validation pattern, same audit write.
  - **Relationships (I-13):** decide and apply integrity strategy for `relatedXIds` (validated ID arrays vs join records — Q-D5).
  - **Project Lifecycle Validation (§C):** implement and test all lifecycle invariants (Tender→Award→Project→Execution→Close-Out→Archive), including tender→project promotion with carry-forward.
  - **Reports review:** confirm SPR/Dashboard/Operations are purely derived; no report writes primary data.
- **Dependencies:** Sprint 11; Q-D1/D5, Q-M3/M4 answered.
- **Complexity:** Medium-High.
- **Expected benefits:** Eliminates a large class of data-integrity and workflow bugs *before* they get baked into an API.
- **Architecture improvement:** SSOT and lifecycle become enforced invariants, not conventions.
- **Exit criteria:** zero free-text capture of any master/Project-Master field; lifecycle invariants pass automated checks; relationship strategy implemented; every CRUD routes through a service; **Architecture Health Report produced** showing Ready-for-Backend = YES.

---

### 🟦 Sprint 13 — Architecture Audit *(Final Independent Audit)*
- **Goal:** Independent verification that Sprints 10–12 achieved the targets; produce the go/no-go for backend.
- **Tasks:** Re-run the full readiness review methodology; verify §K metrics; confirm SSOT, lifecycle, dependency map, entity ownership, and data flow all hold in code; produce a signed Backend Readiness Checklist (Report 9).
- **Dependencies:** Sprint 12.
- **Complexity:** Low (review-only, no code).
- **Expected benefits:** Objective gate; prevents "we think we're ready."
- **Architecture improvement:** none directly — it certifies the prior three.
- **Exit criteria:** Backend Readiness Checklist 100% checked; Overall score ≥ 85; written go decision.

---

### 🟦 Sprint 14 — Domain Blueprint *(Entity contract for backend)*
- **Goal:** Produce the authoritative entity contract the backend will mirror — the bridge artifact.
- **Tasks:** For every entity: finalize fields/types, ownership (§E), relationships, lifecycle states, and the **per-module Data Flow (§F)**. Produce an **Entity Validation** pass (§G) confirming Project→IPC→VO→Claim chains are structurally complete. Output: a single `domain-blueprint.md` (frozen interfaces) — this is the input to the ERD.
- **Dependencies:** Sprint 13.
- **Complexity:** Medium (documentation + interface freeze, minimal code).
- **Exit criteria:** Frozen entity blueprint reviewed and accepted; Entity Validation shows no incomplete core entity.

---

### ⬜ Sprints 15–20 — Downstream Backend Track (out of frontend scope, listed for sequencing)
`15 — ERD` (from Domain Blueprint) → `16 — FastAPI` (implement repos as HTTP behind existing interfaces) → `17 — PostgreSQL` → `18 — Authentication / RBAC` (the unused `PermissionService` hints at intent) → `19 — Testing` (expand beyond the current lightweight rule tests) → `20 — Deployment`.

---

## REPORT 3 — Oversized Files Analysis (+ §J File-Size Rule)

Current `src/`: **>200:** 35 files · **>300:** 23 · **>500:** 11 · **>1000:** 5. (Recommendations only — executed in Sprint 11.)

### >1000 (Critical)

| File | Lines | Why large | Risk | Target | Decomposition → suggested files (responsibility) |
|---|---|---|---|---|---|
| `features/projects/components/ProjectWorkspace.tsx` | 2,415 | 15 module tabs inline + one `activeTab` switch | Very High | ~150 shell | `OverviewPanel, DashboardPanel, MeetingsPanel, IPCPanel, ClaimsPanel, VariationOrdersPanel, NOCPanel, SPRPanel, SubcontractorsPanel, DocumentsPanel, AttachmentsPanel, WBSPanel, HistoryPanel, SettingsPanel, SearchPanel` + shared `WorkspaceTabBar, RecordTable, RelationshipLinker` |
| `views/ProjectExecution.tsx` | 1,361 | Legacy type+mock+UI in one file | High | ~200 | `domain ExecutionRecord`, `data/executionSeed`, `ExecutionList`, `ExecutionDetailDrawer`, `ExecutionForm` |
| `features/.../TenderWizardModal.tsx` | 1,156 | Wizard + `WizardFormState` + inline validation | High | ~250 | `StepGeneral/Financial/Timeline/Checklist/Review`, `useTenderWizard`, `tenderWizardValidators` |
| `views/DocumentControl.tsx` | 1,063 | Legacy type+mock+UI | High | ~200 | `domain ProjectDocument`, `data/documentSeed`, `DocumentList/Filters/DetailDrawer` |
| `views/Settings.tsx` | 1,019 | One form for 7 settings groups | High | ~200 shell | one `*SettingsSection` per group + shared `SettingsField` |

### 500–1000 (High)
`OperationsCenterService.ts` (809 → per-source `*EventSynthesizer` + orchestrator), `OperationsCommandPanel.tsx` (801), `ProjectRepository.ts` (749 → per-entity repos + seed), `Dashboard.tsx` (730 → `KpiCards/PortfolioCharts/RecentActivity`), `MasterRegisters.tsx` (587 → `RegisterTab` per entity), `ProjectList.tsx` (533 → `ProjectFilters/ProjectCard`).

### 300–500 (Medium)
`SprReportingEngine.tsx` (468), `AddProject.tsx` (457), `OperationsCenterPage.tsx` (421), `TenderDetailsDrawer.tsx` (416), `OngoingTenders.tsx` (414), `ProjectDashboard.tsx` (371), `useOngoingTenders.ts` (366), `OperationalLoadGrid.tsx` (346), `ProjectSettingsPanel.tsx` (330), `WBSManager.tsx` (330), `ConflictEngine.ts` (324), `MasterData.ts` (304 — **seed data, leave, flag only**).

### §J — File-Size Rule (agreed, enforced from Sprint 11 onward)
> **No new file may exceed 300 lines without a written Exception Justification** (a one-line comment at top: `// SIZE-EXCEPTION: <reason>`). Seed-data and generated files are the only standing exceptions and must carry the tag. The Architecture Health Report (§K) lists any file > 300 and whether it carries a justification.

---

## REPORT 4 — Module Completion Plan

Tagged by layer. (% = current completion.)

| Item | Layer | % | Missing | Tasks | Priority | Deps |
|---|---|---|---|---|---|---|
| Project Master | MASTER/MODULE | 80 | Aggregate invariants, tender promotion | behavior + promote action | High | S11,S12 |
| Master Registers | MASTER | 90 | SSOT enforcement everywhere | bind all dropdowns | High | S12 |
| Meetings | MODULE | 80 | recurrence, attendee→master | recurrence model, bind attendees | Med | S12 |
| IPC | MODULE | 65 | payment lifecycle calc | implement in `IPCService` | High | S10 |
| Claims | MODULE | 65 | approval state machine | state machine | High | S10 |
| Variation Orders | MODULE | 70 | IPC/Claims integrity links | relationship strategy | Med | S12 |
| NOC | MODULE | 60 | workflow depth | fields + workflow | Med | S10 |
| Subcontracts | MODULE | 65 | invoicing/progress calc | calc + master links | Med | S10,S12 |
| Documents | MODULE | 80 | migrate legacy view | feature migration | Med | S11 |
| Attachments | MODULE | 60 | real upload (backend) | keep UI; wire later | Low | backend |
| Audit History | CROSS-CUT | 55 | single audit path | wire `AuditService` | Med | S10 |
| SPR | **REPORT** | 70 | generate SV/CV | derive, stop manual entry | High | S10 |
| Dashboard | REPORT | 85 | source via services | route through repos | Med | S11 |
| Operations Center | REPORT/MODULE | 90 | service split | synthesizer split | Med | S11 |
| Settings | CONFIG | 90 | decomposition | section split | Low | S11 |
| Project Workspace | SHELL | 85 | decomposition | panel split | High | S11 |

---

## REPORT 5 — Master Data Plan (with SSOT)

**SSOT declaration:** see §B (binding, by the letter).

**Screens that MUST consume Master Data / Project Master via searchable dropdown (`id`-referenced):**

| Screen / File | Must reference | Today |
|---|---|---|
| `TenderWizardModal.tsx` | client, consultant, branch, business unit, department, coordinator, contracts engineer, scope, currency, country | **Free-text EN+AR — primary offender** |
| `AddProject.tsx` | client, employer, consultant, main contractor, contract type, currency, country, city, department, PM, coordinator | Partial — verify ALL party fields bound |
| Workspace › Subcontractors | contractor→`ContractorId`, scope→`ScopeId` | verify UI binds to master |
| Workspace › Documents | docType→`DocumentType` | verify binding |
| `views/DocumentControl.tsx` | sender, recipient, docType | likely free-text → bind |
| `ProjectSettingsPanel.tsx` | departments, approvers, roles | verify reads master, not local arrays |
| `MasterRegisters.tsx` | authoring source | OK |

**Duplicate data entry still present:** (1) Tender→Project re-entry of client/value/dates → add promotion; (2) free-text party names typed differently per tender; (3) EN+AR pairs typed twice for entities that already store bilingual fields in masters; (4) timeline-offset defaults conceptually duplicated across App/Settings/Service.

---

## REPORT 6 — Architecture Improvement Plan (frontend, pre-backend)

Priority order, all frontend: (1) **SSOT + lifecycle as enforced invariants** (§B, §C — Sprint 12); (2) settle data contract / one canonical model (Sprint 11); (3) persistence seam `StorageProvider` (Sprint 11); (4) restore dependency direction (Sprint 10); (5) router (Sprint 11); (6) Entity Ownership split — one repo/service per entity (§E, Sprint 11); (7) feature-folder uniformity, migrate legacy views (Sprint 11); (8) DRY utilities (Sprint 11); (9) relationship integrity (Sprint 12); (10) honest docs / module-dependency + data-flow documented (Sprint 14).

---

## REPORT 7 — Technical Debt Register

(All v1 items retained: TD-01…TD-19 — Dual model, localStorage coupling, no router, dep inversion, oversized files, master-data not enforced, no store, currency dup, offset dup, orphan services, anemic domain, loose relationships, FX hardcoded, SPR manual, dead recompute, PostgreSQL strings, ConflictEngine dates, no DataGrid, unused code.) **New from review:**

| ID | Description | Impact | Risk | Priority | Resolution |
|---|---|---|---|---|---|
| TD-20 | Lifecycle transitions unvalidated | Invalid states reach backend | High | High | Sprint 12 lifecycle validation |
| TD-21 | No SSOT enforcement — modules can re-capture Project Master fields | Data divergence baked into API | High | High | Sprint 12 SSOT audit (§B) |
| TD-22 | SPR (a report) accepts hand-typed primary data | Reporting not single-source | Med | Medium | Sprint 10 — generate SV/CV |
| TD-23 | No formal Entity Ownership — `ProjectRepository` owns 11 entities | Tangled persistence; hard to map to API | Med | Medium | Sprint 11 split per §E |
| TD-24 | Module dependency & data flow undocumented | Risk of isolated/incorrectly-coupled modules | Med | Medium | Sprint 14 blueprint (§D, §F) |

---

## REPORT 8 — Questions for the Development Team

**Data & domain (D)**
- Q-D1: Canonical entity model — flat UI type, domain aggregate, or new DTO? *(blocks Sprint 11)*
- Q-D2: Is **Project the Aggregate Root**, edited through the aggregate or sub-entities independently?
- Q-D3: Who owns **Meetings** — Workspace or Operations Center? (overlapping today)
- Q-D5: Cross-module relationships — join records or validated `relatedXIds` arrays?

**Master data (M)**
- Q-M3: Are all master entities final? *(blocks Sprint 12 dropdowns)*
- Q-M4: Is free-text capture ever acceptable, or must every lookup reference an `id`?

**Lifecycle (L)**
- Q-L1: Can a Project exist without an awarded Tender (direct-award flag)?
- Q-L2: Exact Close-Out preconditions (final IPC? all claims closed? all VOs resolved?).
- Q-L3: Are Claim/VO/IPC/NOC status transitions enforced state machines or free strings?

**Reports (R)**
- Q-R7: Is SPR fully generated, or are progress/SV/CV intentionally manual narrative?

**Infrastructure intent (I)**
- Q-I9: Audit strategy — wire `AuditService` (currently orphan) or server log?
- Q-I10: Auth/RBAC boundary the frontend must assume (`PermissionService` intent)?
- Q-I8: Numbering authority — client `NumberingService` or server sequences?
- Q-I13: Offline-first (implied by `localStorage`) or pure server CRUD?
- Q-I14: Concurrency — two users editing the same project?
- Q-I17: FX rates — settings, master data, or live-rate service?

> Sprints 11/12/14 must not start until their listed questions are answered; otherwise implement the recommended default and record an ADR.

---

## REPORT 9 — Backend Readiness Checklist (signed off in Sprint 13)

**Identity & SSOT**
- [ ] §B SSOT holds in code: no module re-captures Project Master fields.
- [ ] Every lookup references a master `id`; zero free-text party capture.
- [ ] SPR and all reports are derived-only.

**Lifecycle**
- [ ] All lifecycle invariants (§C) implemented and tested; tender→project promotion carries data forward.

**Data contract**
- [ ] One canonical model per entity; mappers exist only as API adapters.
- [ ] Entity fields frozen in `domain-blueprint.md` (Sprint 14).
- [ ] Relationship strategy decided (§D / Q-D5).

**Architecture**
- [ ] §E Entity Ownership: one repo + one service per entity; Workspace owns no persistence.
- [ ] §F Data Flow holds for every module (UI→Hook→Service→Repo→Storage).
- [ ] `localStorage` only inside `repositories/storage/`; keys centralized.
- [ ] No lower layer imports from `views/`.
- [ ] Router in place; no critical nav state trapped in memory.
- [ ] No file > 300 lines without §J justification; `ProjectWorkspace` decomposed.

**Quality**
- [ ] `tsc --noEmit` clean; `any` not increased; no circular dependencies.
- [ ] Business-rule tests green and expanded for the unified model.
- [ ] Dead code removed or consciously retained.

**Decisions recorded**
- [ ] ADRs for Q-D1, Q-D2, Q-D5, Q-I9, Q-I10.
- [ ] Docs match as-built code (no aspirational strings).
- [ ] Final Architecture Health Report (§K): Ready-for-Backend = YES, Overall ≥ 85.

---

## REPORT 10 — Score Improvement Roadmap

Directional /100 by consolidated sprint.

| Dimension | Baseline | S10 | S11 | S12 | S13 (audit) | S14 | Target |
|---|---|---|---|---|---|---|---|
| Architecture | 68 | 71 | 82 | 87 | 88 | 90 | **90** |
| Maintainability | 58 | 62 | 82 | 85 | 86 | 87 | **87** |
| Code Quality | 74 | 77 | 85 | 87 | 88 | 89 | **89** |
| Business Completeness | 72 | 80 | 81 | 86 | 86 | 87 | **87** |
| Enterprise Readiness | 66 | 70 | 80 | 87 | 88 | 89 | **89** |
| **Overall** | **69** | 73 | 82 | 86 | 87 | 88 | **≈88** |

**Highest leverage:** Sprint 11 (refactoring + seams, biggest maintainability/architecture jump) and Sprint 12 (consistency + SSOT + lifecycle, biggest enterprise-readiness jump). **Gate to backend:** end of Sprint 12 (~86 overall, all Critical/High debts closed), certified by Sprint 13.

---

## §K — Architecture Health Report (produced after EVERY sprint)

The executing model must regenerate this table at each sprint's end and append it to `docs/architecture-health/<sprint>.md`. It is the project's running KPI.

| Metric | How to measure | Target |
|---|---|---|
| Total Files | `find src -name '*.ts*' \| wc -l` | trend only |
| Total Lines / Average Lines per File | wc -l sum ÷ files | avg ≤ 180 |
| Largest Component | max .tsx (non-view) | ≤ 300 |
| Largest Hook | max `use*` | ≤ 200 |
| Largest Repository | max in `repositories/` | ≤ 250 |
| Largest Service | max in `services/`/`*Service.ts` | ≤ 300 |
| Largest Utility | max util/business-rule | ≤ 150 |
| Files > 300 lines (w/o §J tag) | count | **0** |
| Dead Code | unimported files/exports | 0 |
| Circular Dependencies | madge/import scan | 0 |
| Duplicate Logic | currency/date/offset copies | 0 |
| Architecture Score | rubric (layers, SSOT, data-flow) | ≥ 85 |
| Maintainability | rubric (size, duplication) | ≥ 85 |
| Technical Debt | open TD items weighted | trending down |
| Ready for Backend | all gate criteria | YES by S12 |

---

## §G — Entity Validation (Sprint 14, before ERD — not the ERD itself)

A structural completeness check that the core contract chain is whole **before** drawing the ERD:

```
Project ─ has many ─► IPC ─ references ─► VO ─ relates ─► Claim
   │                    │                  │                │
   └─ all carry projectId, resolve masters by id, write Audit, follow §F data flow
```

For each: confirm required fields present, foreign keys resolvable to Master Data, status machine defined, lifecycle stage gating applied. Output: pass/fail per entity. Any "fail" blocks the ERD (Sprint 15).

---

### Sequencing summary
**Frontend (this document):** Sprint 10 → 11 → 12 **(★ backend gate)** → 13 (audit) → 14 (domain blueprint).
**Then backend:** 15 ERD → 16 FastAPI → 17 PostgreSQL → 18 Auth → 19 Testing → 20 Deployment.
**Answer before starting:** Q-D1 (→S11); Q-M3/M4, Q-D5, Q-L1/L2/L3 (→S12); Q-D2, Q-I9/I10 (→S14).

*Planning document only. No code written, no files modified, no refactoring performed.*
