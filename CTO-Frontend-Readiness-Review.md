# ROWAD Enterprise Platform — Independent CTO Frontend Readiness Review

**Reviewer role:** Independent CTO / Principal Architect / Enterprise Code Reviewer
**Scope:** Frontend-only (React 19 + TypeScript + Vite). Backend/DB/Auth/RBAC/AI intentionally out of scope and NOT penalized.
**Method:** Read-only static review of `src/` (119 source files, 24,381 lines). Every finding references real files. Planned/TODO/roadmap content was excluded from scoring.
**Date:** 2026-06-25

---

## EXECUTIVE SUMMARY

ROWAD is a genuinely substantial frontend. The pre-award (tenders) vertical and the Operations Center are the most mature, with a real layered stack underneath: domain types → repositories → services → business-rules → validators → mappers → feature components. Business rules (timeline offsets, financial bonds/VAT/retention, health status, conflict detection) are **centralized in dedicated pure classes and are unit-tested** — that is the strongest part of the codebase and rare at this stage.

But the architecture is **structurally Clean, not behaviorally Clean.** Three issues dominate:

1. **A dual data model.** Every entity exists twice — a rich domain aggregate (`domain/pre-award/Tender.ts`) and a flat "legacy" UI type (`features/.../types.ts`) — bridged by hand-written mappers. The UI runs entirely on the legacy model; the domain model is bypassed. This doubles maintenance and will collide with backend DTOs.
2. **State lives in `App.tsx` `useState` + `localStorage`.** There is no router, no context, no store. `App.tsx` is a prop-drilling switchboard, and `localStorage` is the de-facto database accessed directly from services *and* components.
3. **Severe file-size concentration.** 5 files exceed 1,000 lines; `ProjectWorkspace.tsx` alone is **2,415 lines** holding 15 modules inline.

None of these block backend work conceptually, but #1 and #2 will become **expensive to change once a real API and server state exist.** The foundation is mature enough to *start* backend, provided a short, focused hardening pass is done first.

**Verdict: READY WITH MINOR FIXES** (leaning toward "fix the data-contract layer before you wire the API").

---

## PART 1 — Module Completion Matrix

| Module | Status | Maturity / Evidence | Remaining work |
|---|---|---|---|
| **Project Portfolio** | Complete | `ProjectList.tsx` (533), `ProjectsPage.tsx`, filtering/cards | Pagination, server query model |
| **Project Master** | Partial→Complete | `domain/projects/Project.ts` is the aggregate; `ProjectRepository.ts` (749) does full CRUD + migration | Project is a data bag, no invariants/behavior |
| **Project Workspace** | Complete (monolith) | `ProjectWorkspace.tsx` (2,415) hosts all 15 tabs | Must be decomposed before scaling |
| **Meetings** | Complete | Workspace `meetings` tab + Operations calendar integration | Recurrence, attendee master link |
| **Calendar** | Complete | `OperationsCenterPage`, `useCalendarEvents`, `OperationalLoadGrid` | Server event source |
| **Operations Center** | Complete | Strongest feature; Kanban/Agenda/Timeline/Workload/Conflicts/Analytics panels | `OperationsCenterService` (809) needs splitting |
| **IPC** | Partial | Workspace `ipc` tab + `ProjectIPC` model w/ certified/retention fields | Payment lifecycle calc not fully wired |
| **Claims** | Partial | `ProjectClaim` model + workspace tab, EOT/amount fields | Approval workflow is status-only |
| **Variation Orders** | Partial | Rich `ProjectVariationOrder` (technical/commercial/approval blocks) | Linkage to IPC/Claims is ID-array only |
| **NOC** | Partial | `ProjectNOC` + own localStorage key | Thin; mostly status tracking |
| **SPR Reporting** | Partial | `SprReportingEngine.tsx` (468) auto-computes financials but **headline KPIs (progress, SV, CV) are manual inputs** with hardcoded defaults (65, -2.5, 1.8) | Generate SV/CV from schedule/cost data |
| **Document Control** | Complete (legacy) | `views/DocumentControl.tsx` (1,063) — self-contained type+mock+view | Migrate into feature/domain structure |
| **Attachments** | Partial | `ContextualAttachment` model + `ContextualAttachmentsList.tsx` | No real upload/storage (expected) |
| **Audit History** | Partial | `ProjectHistory` + `ProjectRepository.addHistory()`; `AuditService.ts` exists but **is never imported** | Centralize through the unused AuditService |
| **Subcontractors** | Partial | `ProjectSubcontract` model + `ContractorForm.tsx` + master register | Invoicing/progress calc thin |
| **Dashboard** | Complete | `Dashboard.tsx` (730) + `DashboardService` + `CalculationService` | Reads legacy mocks directly |
| **Master Registers** | Complete | `MasterRegisters.tsx` (587), `MasterData.ts` (304), `MasterDataRepository` | Wire ALL dropdowns to it (see Part 2) |
| **Settings** | Complete | `Settings.tsx` (1,019), `SettingsValidator`, drives timeline/financial/calendar/numbering/conflict | Single biggest config surface; well done |

**Reading:** ~6 modules Complete, ~9 Partial, 0 fully Missing of the requested set. Partials are mostly "data model + UI present, deep workflow/calculation shallow."

---

## PART 2 — Enterprise UX Review (Contracts Department lens)

**Works well:**
- **Project-first workflow** is real: portfolio → project → workspace tabs mirrors how a contracts team thinks.
- **Bilingual (AR/RTL + EN)** is wired at the root (`App.tsx` sets `dir`/`lang`) and through a `BiText` component — genuinely enterprise-grade for the GCC market.
- **Settings-driven behavior** (offsets, bond %, VAT, calendar, numbering) means power users can reconfigure without code.
- `SearchableAutocomplete` exists and is used in `AddProject`, `MasterRegisters`, `ProjectWorkspace`, `ProjectSettingsPanel`.

**Still feels like a prototype:**
1. **Inconsistent master-data binding.** Only 4 files consume master data via autocomplete. The **Tender Wizard (`TenderWizardModal.tsx`, 1,156 lines) captures client/consultant/branch/department as free-text EN+AR pairs** (see `WizardFormState`), not master-data references. This is the #1 enterprise UX gap: the same client gets typed differently across tenders → duplicate, un-joinable data.
2. **Duplicate data entry.** Tender → Project award path re-enters client/consultant/value rather than promoting the tender record.
3. **Navigation has no URL/router** — back/forward, deep links, refresh-to-same-screen all fail (state is in memory). Contracts users live in deep links.
4. **SPR headline metrics are typed by hand**, undermining "single source of truth" reporting.
5. **Grid usability** is decent (filters/toolbar in tenders) but each grid re-implements its own formatting/sorting rather than a shared DataGrid.

**Top improvements:** (a) force all party/lookup fields through master registers; (b) add a router; (c) promote tender→project instead of re-entry; (d) one shared currency/number formatter and one DataGrid.

---

## PART 3 — Architecture Review

**Layering (intended):** `domain` → `repositories` → `services` → `business-rules`/`validators`/`mappers` → `features`/`views`. The folders exist and are mostly respected.

**Strengths:**
- **Business Rules ownership is correct.** `business-rules/` holds `TimelineCalculator`, `FinancialsCalculator`, `HealthCalculator` as pure, static, testable units. `HealthCalculator` even uses a Strategy pattern. This is the architectural high point.
- **Repository pattern** is real (`ProjectRepository`, `TenderRepository`, `MasterDataRepository`, `ProjectControlsRepository`) with a clean async CRUD surface — swappable for HTTP later.
- **Service layer** mediates repo + rules + validation (`TenderService.commitTender` validates then persists).
- **Settings Engine** is a true centralized config aggregate (`domain/administration/Settings.ts`) threaded through services.

**Violations:**
1. **Dependency-direction inversion.** `OperationsCenterService.ts` (a lower-layer service) imports mock data from **view files**: `initialTenders` from `views/OngoingTenders`, `mockExecutionData` from `views/ProjectExecution`, `mockDocuments` from `views/DocumentControl`. Lower layers must not depend on the UI layer.
2. **Anemic domain / DDD in name only.** `Project.ts` and `Tender.ts` are interface bags with zero behavior or invariants. "Aggregate Root" is asserted in docs but not enforced in code (sub-entities are edited via repository methods, not through the Project aggregate).
3. **Dual model + mapper tax.** `domain/pre-award/Tender` vs `features/.../types.Tender`, bridged by `TenderMapper` (268 lines). `TenderService.getTenders()` even computes `daysRemaining`/`derivedHealth` and then **discards them** (only `calculated` timeline is spread) — dead logic from the model split.
4. **No state-management layer.** 0 contexts, 0 stores. State is `App.tsx` `useState`; persistence is direct `localStorage` access scattered across 12 keys, read by both services and components.
5. **Persistence leaks into the UI.** Components read `localStorage` directly (e.g. conflict/scheduling metadata), bypassing repositories.

**Dependency direction:** mostly inward-correct *except* the Operations service → views import, and the ubiquitous `localStorage` coupling.

---

## PART 4 — Codebase Statistics

- **Total source files:** 119 (`.ts`/`.tsx`) · **Total lines:** 24,381 · **Avg lines/file:** 205

| Category | Files | Lines | Avg | Largest |
|---|---|---|---|---|
| Components (.tsx, non-view) | 45 | 12,698 | 282 | `ProjectWorkspace.tsx` (2,415) |
| Pages / Views | 8 | 5,285 | **661** | `ProjectExecution.tsx` (1,361) |
| Services (incl. engines) | 16 | 2,135 | 133 | `OperationsCenterService.ts` (809) |
| Repositories | 4 | 1,053 | 263 | `ProjectRepository.ts` (749) |
| Hooks | 6 | 871 | 145 | `useOngoingTenders.ts` (366) |
| Types / Domain | 25 | 828 | 33 | `MasterData.ts` (304) |
| Utils / Data / Tests | 5 | 533 | 107 | `initialTenders.ts` (252) |
| Mappers | 2 | 339 | 170 | `TenderMapper.ts` (268) |
| Business Rules | 3 | 215 | 72 | `FinancialsCalculator.ts` (87) |
| Validators | 2 | 169 | 84 | `SettingsValidator.ts` (107) |
| Standalone types | 3 | 255 | 85 | `operations-center/types/index.ts` (131) |
| **Contexts** | **0** | — | — | (none — finding) |
| **Stores** | **0** | — | — | (none — finding) |

**Largest by role:** Component `ProjectWorkspace.tsx` (2,415) · View `ProjectExecution.tsx` (1,361) · Service `OperationsCenterService.ts` (809) · Repository `ProjectRepository.ts` (749) · Hook `useOngoingTenders.ts` (366) · Mapper `TenderMapper.ts` (268) · Types `MasterData.ts` (304) · Business rule `FinancialsCalculator.ts` (87).

**Headline ratio:** Views average 661 lines/file — 3× the repo average. The size problem is concentrated in views and a handful of mega-components, not spread evenly.

---

## PART 5 — Oversized Files Report

Thresholds breached: **>200:** 35 files · **>300:** 23 · **>500:** 11 · **>1000:** 5.

### Critical (>1,000 lines)

| File | Lines | Why oversized | Risk | Target | Decomposition |
|---|---|---|---|---|---|
| `ProjectWorkspace.tsx` | 2,415 | 15 module tabs rendered inline in one component, one giant `activeTab` switch | Merge hell, untestable, every module change touches one file | ~150 shell + panels | Per the brief: `OverviewPanel, DashboardPanel, MeetingsPanel, DocumentsPanel, ClaimsPanel, VariationOrdersPanel, IPCPanel, NOCPanel, SPRPanel, AttachmentsPanel, WBSPanel, SubcontractorsPanel, HistoryPanel, SettingsPanel, SearchPanel` + shared `WorkspaceTabBar`, `RecordTable`, `RelationshipLinker`. Est. 120–250 lines each. |
| `ProjectExecution.tsx` | 1,361 | Legacy view: type + mock data + full UI in one file | Duplicates feature-folder concerns | ~200 | Extract `ExecutionRecord` to domain, mock to data, split table/detail/form |
| `TenderWizardModal.tsx` | 1,156 | Multi-step wizard, all steps + `WizardFormState` + validation inline | Hard to test step logic; free-text master fields | ~250 | One component per step + `useTenderWizard` hook + step validators |
| `DocumentControl.tsx` | 1,063 | Same legacy pattern (type+mock+view) | Parallel to feature architecture | ~200 | Move to `features/document-control`, split list/filters/detail |
| `Settings.tsx` | 1,019 | One form for 7 settings groups | Risky single surface for all config | ~200 | Tab/section components per settings group + shared `SettingsField` |

### High (500–1,000)
`OperationsCenterService.ts` (809 — synthesizes events from 4 sources + scheduling + conflict glue; split into `EventSynthesizer` per source), `OperationsCommandPanel.tsx` (801), `ProjectRepository.ts` (749 — 11 entity CRUDs + seed data; split per-entity repos + seed file), `Dashboard.tsx` (730), `MasterRegisters.tsx` (587), `ProjectList.tsx` (533).

### Medium (300–500)
`SprReportingEngine.tsx` (468), `AddProject.tsx` (457), `OperationsCenterPage.tsx` (421), `TenderDetailsDrawer.tsx` (416), `OngoingTenders.tsx` (414), `ProjectDashboard.tsx` (371), `useOngoingTenders.ts` (366), `OperationalLoadGrid.tsx` (346), `ProjectSettingsPanel.tsx` (330), `WBSManager.tsx` (330), `ConflictEngine.ts` (324), `MasterData.ts` (304 — acceptable, it's seed data).

---

## PART 6 — Refactoring Roadmap

**CRITICAL**
1. **Collapse the dual data model before backend.** Pick ONE model (the flat UI model is what everything uses; promote it to domain or generate DTO adapters at the API boundary). *Benefit:* removes mapper tax + dead recompute logic, prevents a three-way collision (UI type / domain type / backend DTO). *Risk:* touches tenders + controls broadly. *Effort:* L (1–2 wks).
2. **Introduce an API/persistence abstraction now.** Wrap every `localStorage` access behind repositories with an interface; no component touches storage. *Benefit:* swapping to HTTP becomes a one-layer change. *Risk:* Medium. *Effort:* M.

**HIGH**
3. **Decompose `ProjectWorkspace.tsx` (2,415→panels).** *Benefit:* parallel module work, testability. *Risk:* Low (mechanical). *Effort:* M.
4. **Add a router** (`react-router`) + URL-driven view/project state. *Benefit:* deep links, refresh-safety, back/forward. *Risk:* Low-Med. *Effort:* S-M.
5. **Fix dependency inversion** in `OperationsCenterService` (depend on repositories, not view mock exports). *Effort:* S.

**MEDIUM**
6. Split the three other 1k+ legacy views; migrate `ProjectExecution`/`DocumentControl` into feature folders.
7. One shared currency/number formatter (currently duplicated in 9 files) + one shared DataGrid.
8. Lift `App.tsx` state into a context/store.

**LOW**
9. Remove orphan services or wire them (Part 7).
10. Replace `new Date(\`...\`)` parsing in `ConflictEngine` with the `Clock` service used elsewhere.

---

## PART 7 — Dead Code & Duplication

**Orphan services (exist, never imported anywhere):** `AuditService.ts`, `ImportService.ts`, `LoggingService.ts`, `NotificationService.ts`, `PermissionService.ts`, `SearchService.ts`, `TimelineService.ts`, `CacheService.ts`. Eight scaffolded infrastructure services with **zero call sites** — either wire them or delete (`NumberingService` IS used: 3 sites).

**Unused components/types:** `TenderDocumentsTab.tsx`, `TenderNotesTab.tsx` (unreferenced), `domain/common/DateRange.ts`, `domain/administration/BusinessConfiguration.ts`, `mockData.ts` (superseded by `data.ts` + feature mocks).

**Dead logic:** `TenderService.getTenders()` computes `daysRemaining` and `derivedHealth` then returns without using them.

**Duplication:**
- **Currency/number formatting** re-implemented in 9 files (`ProjectList`, `ProjectWorkspace`, `ProjectDashboard`, `GlobalSearchPanel`, `DashboardService`, `TenderFinancialTab`, `ProjectExecution`, `TenderMapper`, plus the canonical `FinancialsCalculator`). Should all route through `FinancialsCalculator`.
- **Timeline offset defaults defined 3×:** inline in `App.tsx`, in `AppConstants`/`TimelineService`, and in the Settings default factory.
- **Date parsing** duplicated: `Clock` service vs raw `new Date()` in `ConflictEngine`.
- **Two timeline paths:** `TimelineService.generateTimeline` (no calendar) vs `TenderService` calling `TimelineCalculator` (with calendar).

---

## PART 8 — Business Logic Review

| Area | State | Note |
|---|---|---|
| Timeline calc | Solid | `TimelineCalculator` honors weekends/holidays/special closures; settings-driven; tested |
| Financial calc | Solid but rigid | Bonds/VAT/retention/advance all settings-driven (BR-001…BR-017). **FX rates hardcoded** in `FinancialsCalculator.sumAmounts` (AED/SAR/EGP/USD) — should be settings/data |
| Health calc | Solid | Strategy pattern, threshold-driven, tested |
| Meeting scheduling | Good | Metadata in `operations_preaward_scheduling_metadata`, synthesized in Operations service |
| Calendar engine | Good | `useCalendarEvents`, `OperationalLoadGrid` |
| Conflict engine | Strong | Rule-based (`ResourceOverlapRule` etc.), same-employee/same-project exceptions, buffer logic, settings-driven |
| Project relationships | Present but weak | Cross-module links are loose `relatedXIds: string[]` arrays, no referential integrity |
| Project Master integration | Partial | Master registers exist but not enforced at all entry points |
| SPR generation | Hybrid | Financials auto-scanned; **progress/SV/CV manually entered** |
| Settings usage | Excellent | Single Settings aggregate drives most rules |

**Duplicated business rules:** timeline-offset defaults (3 places), currency formatting (9 places), two timeline calculation entry points. Centralize.

---

## PART 9 — Documentation Audit

`docs/` is unusually rich for this stage: ADRs, `business-rules-inventory.md`, `domain-design-v2.md`, `enterprise-readiness-audit.md`, **`refactoring-plan-v1.md` AND `refactoring-plan-v2.md`** (the team already knows about the debt), state machines, UI blueprints.

**Mismatches between docs and code:**
1. README/architecture docs claim **"strict DDD + Clean Architecture"** — code is structurally layered but domain is anemic and the Operations service imports from views. The claim overstates enforcement.
2. **"Aggregate Root"** (Project) is asserted but not enforced — sub-entities are mutated directly via repository, not through the aggregate.
3. **Aspirational backend strings already in code:** `TenderService` returns `"PostgreSQL Storage Transaction Failure"` though there is no PostgreSQL. Harmless now, misleading later.
4. README correctly labels PostgreSQL/FastAPI as **"Planned"** — that part is honest.
5. Existence of two refactoring plans implies docs describe an intended end-state, not the current one. Reviewers should treat `docs/` as design intent, not as-built.

---

## PART 10 — Frontend Readiness

**Answer: YES WITH MINOR ISSUES.**

Why: The hard parts that are easy to get wrong are *right* — centralized, tested business rules; a real repository/service seam; a settings engine; bilingual RTL; a coherent project-first IA. A backend can be attached behind the existing repository interfaces.

What holds it back from an unqualified YES: the **dual data model** and **direct-`localStorage` coupling** mean the data contract isn't settled, and settling it *after* the API exists means re-doing it on both sides. Fix the contract layer first (Part 6, items 1–2) and this becomes a clean YES.

---

## PART 11 — Future Extensibility

The feature-folder + repository + settings pattern means new registers/modules (Risk Register, RFI, RFQ, Procurement, POs, Material Tracking, Vendor Evaluation, Invoices, Correspondence, Contract Admin, Site Instructions, Technical Submittals, Daily Reports, Change Requests, Lessons Learned, Closeout) can be added **without redesign** — each is "another entity + repo + service + feature folder," which the codebase already does well (Operations Center proves the pattern scales).

**Limitations that will bite:**
- New modules will inherit the **dual-model + mapper tax** unless the model is unified first.
- Cross-module relationships are loose ID arrays — RFI→VO→Claim→IPC chains (core to construction admin) need a real relationship layer, not `relatedXIds`.
- No router means every new module deepens the `App.tsx`/`ProjectWorkspace` switch monoliths.
- Without a store, shared cross-module state (e.g. a global Risk feeding Dashboard + SPR) gets prop-drilled.

**Net:** extensible in breadth (more modules) today; not yet extensible in depth (rich inter-module workflows) without the Part 6 fixes.

---

## PART 12 — CTO Recommendations

**Fix before backend:** (1) unify the data model / define the canonical DTO at the boundary; (2) route ALL persistence through repository interfaces (kill direct `localStorage`); (3) add a router; (4) bind master data to all party/lookup fields.

**Postpone:** decomposing every 1k-line view, the orphan-service cleanup, a shared DataGrid — valuable but not blocking; do during backend integration.

**Debt that worries me most:** the dual model. It's a *contract* problem, and contract problems compound the moment a second system (the API) depends on them.

**Excellent decisions:** centralized + tested business rules; the settings engine; repository seam; bilingual-first; feature-folder structure; Strategy/rule-based conflict & health engines.

**Reconsider:** "DDD" framing on anemic models (either add behavior/invariants or stop claiming DDD); `App.tsx` as state container; aspirational backend strings in code.

**Expensive after backend starts:** changing entity shapes (now 1 place, soon 3: UI/domain/DB); retrofitting a router; moving off `localStorage` once server state and caching exist.

**Fix today:** the `OperationsCenterService → views` import (5-min dependency-direction fix) and the dead recompute in `TenderService.getTenders`.

---

## PART 13 — Questions Before Backend

1. Which is the **canonical entity model** — flat UI type, domain aggregate, or a new DTO? (Pick one; the mappers can't survive an API.)
2. Is **Project truly the Aggregate Root**, and will sub-entities be edited *through* it or independently? This decides your API resource design.
3. Are **all master entities final** (Client, Employer, Consultant, Contractor, Scope, Currency, Country, Department, DocType, ContractType)? Adding one post-migration touches every form.
4. Will every dropdown be **forced to reference master data**, or is free-text (current Tender Wizard) acceptable? This determines data quality forever.
5. Are **cross-module relationships** first-class (join tables) or staying as `relatedXIds` string arrays?
6. Are **all financial rules** (esp. FX rates, currently hardcoded) going to live in settings/DB?
7. Is **SPR fully generated** from schedule/cost, or will SV/CV stay manual?
8. What is the **numbering authority** — client `NumberingService` or server-issued sequences? (Concurrency matters.)
9. What is the **audit strategy** — wire the existing unused `AuditService`, or server-side event log?
10. What is the **auth/RBAC boundary** the frontend must assume (the unused `PermissionService` hints at intent)?
11. Are workflow **state machines** (Claim/VO/IPC statuses) finalized and enforced, or free string transitions?
12. **Offline/optimistic** expectations — does the `localStorage` habit imply offline-first, or pure server CRUD?
13. What's the **migration/versioning** plan for the auto-migration logic now living in repositories?
14. Are module **boundaries** (Operations Center vs Project Workspace owning meetings/calendar) intentional or overlapping?
15. Concurrency/conflict resolution when two users edit the same project?

---

## PART 14 — Final Scores

| Dimension | Score (/100) | Basis |
|---|---|---|
| Business Completeness | 72 | 6 complete, 9 partial modules; deep workflows shallow |
| Architecture | 68 | Real layering + great business-rules seam; anemic domain, dual model, dep inversion |
| Maintainability | 58 | 5 files >1k lines; 2,415-line god component; duplication |
| Code Quality | 74 | Strong typing (very low `any`), tested rules, consistent style |
| Technical Debt | 60 (debt is moderate-high) | Dual model, 8 orphan services, localStorage coupling |
| Enterprise Readiness | 66 | Bilingual + settings engine excellent; no router/RBAC seam/master-data enforcement |
| Frontend Completion | 75 | Breadth is there; depth and decomposition pending |
| Backend Readiness | 70 | Repository seam ready; data contract not settled |
| **Overall** | **69 / 100** | Strong bones, unsettled data contract, concentrated size debt |

---

## FINAL VERDICT

### READY WITH MINOR FIXES

**Evidence for "ready":** centralized, unit-tested business rules (`business-rules/*`, `tests/run-validation-tests.ts`); a genuine repository/service seam (`TenderService` → `TenderRepository` → validator → rules); a real settings engine driving behavior; bilingual RTL foundation; a feature-folder pattern that already scaled to the Operations Center.

**Evidence for "minor fixes, not ready-as-is":** the dual data model with mapper tax and dead recompute logic (`TenderService.getTenders`, `TenderMapper`); state and persistence in `App.tsx` + direct `localStorage` across 12 keys; a dependency-direction violation (`OperationsCenterService` importing view mocks); and a 2,415-line `ProjectWorkspace.tsx`.

**Gate:** complete Part 6 items #1 and #2 (unify the model, abstract persistence) — roughly 1.5–2.5 weeks — then begin backend with confidence. Everything else can proceed in parallel with backend work.

*Read-only review. No code was modified.*
