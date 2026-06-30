# ROWAD Enterprise Platform — Codex Memory

This file is Codex's persistent knowledge base for the ROWAD project. Read it on every session before doing any work.

---

## 0. Sprint 0 + Exit Criteria

**Sprint 0 (Project Governance & Architecture Foundation): Completed.**
Clean Architecture, DDD, Project Book, AI Context (this file), Domain Dictionary, Architecture Reviews, QA Reviews, and the Sprint Roadmap were all established before the first execution sprint. ROWAD did not begin without a foundation.

**Sprint Exit Criteria — apply to every Sprint.** A Sprint is not complete unless ALL pass:

1. Scope Completed
2. Type Check Passed (`npm run lint` → `tsc --noEmit` clean)
3. Build Passed (`npm run build` succeeds)
4. Regression Passed (no existing functionality broken)
5. QA Passed (cross-checked against the relevant QA findings)
6. Documentation Updated (CHANGELOG.md, ADRs if applicable, `Sprint.md`, `ROADMAP_STATUS.md`)
7. Git Tag / Product Version Created (e.g. `v1.1.0` for Sprint 1, following SemVer)
8. Code Review Completed
9. No Critical Bugs Outstanding (no open P0 or P1 against the Sprint scope)

If any criterion fails, the Sprint stays open until it passes.

**Definition of Done — applies at the task/change level** (distinct from Sprint Exit Criteria):
Implemented → Reviewed → Tested → Documented → Merged → Verified → Accepted.

**Architecture Freeze Policy — effective after Sprint 7 (Backend Preparation) sign-off.** No Entity / DTO / Repository interface / API breaking / Domain Model changes without explicit CTO approval. Non-breaking additions (new optional fields, new endpoints) remain allowed.

---

## 1. What ROWAD Is (and Is Not)

ROWAD is an **Enterprise Contract Administration Platform** for a Contracts Administration Department. It exists to replace the operational fragmentation caused by 10+ disconnected Excel files with one unified Single Source of Truth — **not** to replace Excel itself, and **not** to be an ERP.

**ROWAD IS:** operational management platform, organizes information, connects entities, calculates metrics, generates reports, provides management visibility.

**ROWAD IS NOT:** ERP, workflow automation engine, email system, Teams, Outlook, SharePoint, document storage, approval engine, meeting scheduler, notification system. Those may come in later phases.

**Mission statement:** "Does this make Contract Administration easier, clearer, and more reliable?" If no — reconsider the feature.

---

## 2. Business Context

ROWAD models the work of a **Contract Administration Department**. The department is responsible for:

- Tender Study
- Contract Review
- Risk Assessment
- Contract Qualifications
- Award Support
- Project Follow-up
- Claims
- Variation Orders
- IPC (Interim Payment Certificates)
- Meetings
- NOC (No Objection Certificates)
- Subcontracts
- Document Control

The software mirrors these real-world responsibilities. **Business terminology always takes precedence over software terminology.** When a name clash happens between what the business calls something and what's natural in code, the business name wins.

---

## 3. Business Terminology (Glossary)

| Term | Meaning |
|------|---------|
| **Tender** | A pre-award bid opportunity being studied/priced before contract award. |
| **Project** | An awarded contract under execution. Created when a Tender is awarded. |
| **Award** | The act of converting a Tender into a Project; Tender becomes read-only afterwards. |
| **IPC** | Interim Payment Certificate — periodic payment claim against work executed. |
| **VO** | Variation Order — approved change to scope/value/duration. |
| **Claim** | Contractual claim by contractor (e.g., EOT, additional cost). |
| **SPR** | Single Paper Report — executive monthly report aggregating commercial + technical KPIs. Read Model only. |
| **NOC** | No Objection Certificate — regulatory/authority permit (Civil Defense, Municipality, etc.). |
| **Subcontract** | Contract assigning scope to a subcontractor; tracked for value, invoicing, status. |
| **Meeting** | Recorded engagement (progress, coordination, technical). Owns minutes, attendees, action items. |
| **Close-Out** | Final stage of a Project: handover, final account, defect liability completion. |
| **Archive** | Project/Tender removed from active operations; read-only historical record. |

Full deeper glossary lives in `docs/ai/GLOSSARY.md`.

---

## 4. Tech Stack (Current)

- **React 19** + **TypeScript** + **Vite** + **Tailwind CSS v4**
- **Recharts** for charts, **lucide-react** for icons, **motion** for animations
- **Feature-Based Architecture** + **Clean Architecture** + **DDD**
- **No backend yet.** Repositories run against local seed data / LocalStorage.
- PostgreSQL + FastAPI planned for Sprint 7–8.

`package.json` scripts: `dev` (vite port 3000), `build`, `preview`, `lint` (tsc --noEmit).

### Technology Freeze

React 19, TypeScript, Vite, Tailwind v4, Recharts, Lucide.

**No framework upgrades are allowed before Backend Completion (Sprint 8).** Technology migrations require explicit approval. Do not introduce new libraries casually — every dependency added must be justified against the existing toolchain.

---

## 5. Architecture (Stable Baseline — DO NOT Redesign)

The architecture has passed Architecture Review, Refactoring Review, Domain Review, and Enterprise QA Review. Treat it as the **approved baseline**. We are **completing and stabilizing**, not redesigning.

### Layers

```
UI (Views + Features components)
    ↓
Services (application orchestration)
    ↓
Domain (entities, value objects, aggregates)
Business Rules (Calculators)
Validators
    ↓
Repositories (persistence abstraction)
    ↓
Mappers (data shape translation)
```

### Source tree

```
src/
├── App.tsx, main.tsx, index.css
├── domain/              # DDD aggregates
│   ├── projects/        # Project.ts (the SSoT root)
│   ├── pre-award/       # Tender + all *Information value objects + BusinessEvent
│   ├── project-controls/# ProjectControlsRecord
│   ├── master/          # MasterData
│   ├── administration/
│   └── common/
├── services/            # 16 services (Calculation, Dashboard, Milestone,
│                        # Numbering, Permission, Tender, Timeline, Search,
│                        # Notification, Audit, Cache, Clock, Import,
│                        # Logging, ProjectControls, ProjectLookup)
├── business-rules/      # FinancialsCalculator, HealthCalculator,
│                        # TimelineCalculator, MilestoneBusinessRules
├── validators/          # SettingsValidator, TenderValidator
├── mappers/             # ProjectControlsMapper, TenderMapper
├── repositories/        # 6 repos: Project, Tender, MasterData,
│                        # ProjectControls, Assignment, BusinessEvent
├── features/
│   ├── pre-award/ongoing-tenders/   # components, constants, hooks
│   ├── projects/                    # components, registers, workspace
│   │   └── components/workspace/    # 13 panels: IPCs, VOs, Claims, NOCs,
│   │                                # Subcontractors, Meetings, Documents,
│   │                                # WBS, Attachments, Search, Settings,
│   │                                # Dashboard, ActivityFeed
│   └── operations-center/           # Calendar, Kanban, Timeline, Agenda,
│                                    # MyWork, Workload, Conflicts, Analytics
├── views/               # Dashboard, ProjectsPage, OngoingTenders,
│                        # DocumentControl, Settings (route-level)
├── components/          # Shared: Header, Sidebar, BiText, SearchableAutocomplete
├── hooks/               # useProjects
├── enums/, constants/, seed/, tests/, assets/
```

~142 .ts/.tsx files in `src/`.

### Storage strategy (target)

- Business data → PostgreSQL
- Files → SharePoint / company file server (never inside the DB)
- ROWAD stores metadata, links, versions, ownership, categories, history only

---

## 6. Naming Conventions (What Each Layer Means)

| Concept | Purpose |
|---------|---------|
| **Entity** | A domain object with identity. Lives in `domain/`. Owns business invariants. |
| **Value Object** | A domain concept without identity (e.g., `FinancialInformation`). Immutable. |
| **Aggregate** | A cluster of entities/value objects with one root (e.g., `Project` is the SSoT root). |
| **Repository** | Persistence boundary. CRUD only. Lives in `repositories/`. No business logic. |
| **Service** | Application orchestration; coordinates domain + repos. Lives in `services/`. |
| **Calculator** | Pure business-rule computation (financials, health, timeline). Lives in `business-rules/`. |
| **Validator** | Input validation against business rules. Lives in `validators/`. |
| **Mapper** | Translates between persistence shape and domain shape. Lives in `mappers/`. |
| **Read Model** | Derived view over transactional data; never owns records (e.g., SPR, Dashboards). |
| **ViewModel** | UI-facing shape assembled for a specific screen. |
| **DTO** | Data transfer shape across boundaries (e.g., API ↔ client when backend lands). |

Putting logic in the wrong layer is the most common AI failure mode. Verify the layer before adding code.

---

## 7. Non-Negotiable Design Rules

Before any change, preserve these:

1. **Project Master is the Single Source of Truth.** Every business entity references `ProjectId`. No duplicated project info anywhere.
2. **Business logic lives only in:** Domain, Services, Calculators, Validators. **Never** in UI, **never** in Repositories.
3. **Repositories only persist and retrieve.** No business rules.
4. **Reports are Read Models only** (see chapter 9). SPR, Dashboards, Executive Reports — they read, they never own data.
5. **No duplicates:** no duplicate entities, no duplicate business logic, no duplicate repositories, no duplicate DTOs.
6. **No compatibility layers. No temporary solutions. Always fix the root cause.**
7. **Lifecycle:** Tender → Award → Project → Execution → Close-Out → Archive. Award creates the Project; Tender becomes read-only.

---

## 8. Project Lifecycle (Full State Machines)

### Tender lifecycle

```
Draft → Active → Submitted → Under Review → Negotiation → Awarded → Archived
```

A tender can branch to `Lost` / `Cancelled` from most pre-award states; only `Awarded` triggers Project creation.

### Project lifecycle

```
Initiation → Execution → Close-Out → Archived
```

**Hard rules:**
- A Project is **created only** by awarding a Tender.
- Once a Tender is `Awarded`, it becomes read-only — its data is the seed for the new Project but cannot be edited afterwards.
- `Archived` records are never deleted and never re-opened; they remain queryable for reporting and audit.

State machine details live in `docs/state-machines/`.

---

## 9. Reports Never Own Data

This is one of the most important architectural decisions in the project. Captured formally in `docs/adr/ADR-011.md`.

- **All reports are Read Models.**
- Reports **never** create records.
- Reports **never** update records.
- Reports **never** own business entities.
- Reports aggregate transactional data only.

Applies to: SPR, Executive Dashboards, KPI cards, exports, any future analytics widget. If a report needs a value, it computes it from source transactions through `CalculationService` — it does not persist its own copy. The only persistence allowed is a frozen snapshot (e.g., a signed PDF) explicitly requested by the user as an audit artifact.

Violating this rule causes stale indicators, schema bloat, and audit drift.

---

## 10. User Roles Philosophy

RBAC is not just a permissions matrix — it's a **visibility philosophy**.

> Users never access all data. Visibility is determined by responsibility.

```
Tender Engineers      → Assigned Tenders only
Project Engineers     → Assigned Projects only
Contracts Engineers   → Assigned scope (cross-project where assigned)
Document Controllers  → Document Control scope
Managers              → Department scope
System Administrators → Entire platform
Read-Only users       → As scoped, no writes
```

Permission enforcement happens in `PermissionService`. UI should hide what the user cannot access — not just disable it. Full RBAC implementation is **Sprint 4**.

---

## 11. Current Sprint — STRICT SCOPE

**Sprint 1 — Production Stabilization.** Work only inside this scope. Anything outside = "Future Sprint Recommendation," not for implementation now.

> **Important — Sprint partitioning:** The QA report flags 4 issues as P0, but per the agreed Sprint plan (`Sprint.md`), Sprint 1 = **stabilize what exists**, Sprints 2–3 = **complete missing business workflows**. That moves QA Finding **#25 (Tender → Project Award workflow) to Sprint 2** even though it is P0, because it's not a stability bug — it's a missing workflow. Sprint 1 closes the bugs blocking production use; Sprint 2 builds the Tender/Award/Claims workflow; Sprint 3 completes the Commercial modules (IPC/VO/NOC/Subcontracts + SPR business completion).

### Sprint 1 Scope Buckets (from `Sprint.md`)

1. **Runtime Stability** — no crashes, white screens, broken navigation, React rendering errors, console runtime errors.
2. **Dashboard Synchronization** — KPI cards / sidebar counters / portfolio counts update immediately after CRUD. No refresh required.
3. **Tender Validation** — every mandatory field validated, clear messages, workflow blocked when info missing.
4. **Financial Calculations** — IPC totals, subcontract totals, contract values, currency formatting, percentages. Displayed values must match stored values.
5. **SPR Runtime Stability** — opening / switching projects / switching tabs / generating reports must never crash. (Business completion of SPR = Sprint 2.)
6. **CRUD Stability** — Create / Edit / Archive / Restore / Search / Filter work across Projects, Tenders, Meetings, Claims, VOs, IPC, NOC, Subcontracts, Documents, Master Data.

### QA Findings → Sprint Mapping

**Sprint 1 (Stabilization):**

| Bucket | Findings |
|--------|----------|
| Runtime Stability | #63 (SPR crash) |
| Dashboard Sync | #18/19 (Dashboard KPIs not real-time), #15/16 (Sidebar badge not updating) |
| Tender Validation | #20 (Step 3 date validation bypass) |
| Financial Calc | #61 (Subcontractor wrong invoiced amount) |
| SPR Runtime | #63 (covered above) |
| CRUD Stability | #59 (WBS dropdown empty), #10 (Wizard tab mislabeled), #37/44 (VIEW panel ambiguity), #39 (Search count missing), #45 (IPC raw integers) |

**Sprint 2 (Tender & Award):**
- #25 (Tender → Project Award workflow)
- #49 (Claims lifecycle stuck at "Prepared")
- #11 (Tender Financial step has no financial fields)
- Tender lifecycle completion

**Sprint 3 (Commercial Modules — IPC, VO, NOC, Subcontracts + SPR business completion):**
- #40 (IPC missing retention/advance/recovery fields)
- #48 (IPC status auto-suggest after payment)
- #74 (Financial Formulas not applied to IPC)
- #53 (SPR not aggregating IPC data — business completion, not crash)

**Sprint 4 (Enterprise System Settings & Policies):**
- #8 (Coordinator/Engineer dropdown not linked to Employees master)
- #28 (PM/Coordinator free-text in Projects)
- #29 (Client free-text in Tenders vs master in Projects)
- #2 (Client/Consultant free-text in Tenders)

**Sprint 5 (Security & RBAC Foundation):**
- #73 (RBAC not implemented)

**Sprint 6 (Enterprise UX Polish):**
- #5 (Number thousand separators), #32 (Required field error timing), #30 (Currency auto-update on Country change), #52/55 (Attachments — Claims/NOC), #57 (Subcontractor search/filter, delete), #62 (Delete button), #56 (NOC expiry alerts)

**Phase 2 (Post-Production):**
- #71 (Document Control sub-modules — Transmittals Hub, Incoming/Outgoing Letters, Revision History, Makers Approval) — new features, not bug fixes
- #64 (Doc Control per-project filtering)
- Full Reporting & Analytics (requires backend aggregation / materialized views / Power BI)

### Roadmap (for context only)

Sprint 1: Production Stabilization (current)
Sprint 2: Tender & Award
Sprint 3: Commercial Modules (IPC + VO + NOC + Subcontracts + SPR business completion)
Sprint 4: Enterprise System Settings & Policies
Sprint 5: Security & RBAC Foundation
Sprint 6: Enterprise UX Polish
Sprint 7: Backend Preparation (entity freeze, ERD, OpenAPI, sequence diagrams, indexes, migration strategy, Security Review, OWASP, threat model) — triggers Architecture Freeze
Sprint 8: Backend Core (PostgreSQL + FastAPI + Auth + RBAC + REST + Audit Log + Performance Baseline)
Sprint 9: Production Infrastructure & File Integrations (deployment, backup, logging, monitoring, caching, health/readiness/liveness, alerting, SharePoint, OneDrive)
Sprint 10: Data Migration (Pilot → Validation → Department Approval → Full; Excel → ROWAD, the most critical sprint for the business)
Sprint 11: Go Live (pilot, training, rollout, support, cutover + Rollback Plan + rehearsal)
Sprint 12: Hypercare (first 30 days post Go Live; bug fixes, monitoring, perf tuning, user feedback → Production Stable)
Phase 2 (in this order): AI Assistant → OCR → Notifications → Workflow Automation → Power BI / Reporting & Analytics → Mobile → M365 deep integration

Full Sprint plan with scope/out-of-scope per sprint lives in `Sprint.md` (root of repo). Live execution status lives in `ROADMAP_STATUS.md`.

---

## 12. Future Architecture (Forward-Compatibility Modules)

These modules are **expected** in future phases. Never implement today's solution in a way that blocks them.

- Risk Register
- RFI (Requests for Information)
- Planning (schedule integration, Primavera link)
- Quality (ITPs, NCRs)
- HSE (incidents, observations)
- Correspondence (formal letters, transmittals as first-class entities)
- Procurement (POs, material submittals)
- Cost Control (budgets, commitments, EAC/ETC)
- Change Management (impact assessment workflow)

When adding to existing modules, ask: "Will this make it harder to slot in Risk / RFI / Cost Control later?" If yes, reconsider.

---

## 13. Anti-Patterns (Things to Never Do)

These prevent the most common AI implementation mistakes.

**Never:**
- Create duplicate repositories
- Create duplicate services
- Create duplicate DTOs
- Create duplicate business rules / calculators / validators
- Store files inside PostgreSQL (use SharePoint / file server; store metadata only)
- Store project names instead of `ProjectId` (always reference by ID)
- Implement business rules inside React components
- Implement business rules inside repositories
- Add compatibility layers / adapter shims
- Implement temporary fixes ("we'll fix it later" = never)
- Swallow errors in try/catch without explicit recovery logic
- Introduce a new library when an existing one solves the problem
- Bypass the layered flow (UI → Service → Domain → Repo)

If a fix seems to require any of the above, **stop and ask** — it's almost certainly a sign that the root cause is elsewhere.

---

## 14. Development Rules (Per-Change Workflow)

Every change follows this sequence:

```
Scan → Understand → Implement → Type Check → Build → Regression → Commit → QA
```

- **Scan:** Read the relevant files. Never edit blind.
- **Understand:** Confirm which layer owns the logic; confirm scope is in-Sprint.
- **Implement:** Smallest change that fixes the root cause.
- **Type Check:** `npm run lint` (tsc --noEmit) must pass.
- **Build:** `npm run build` must succeed.
- **Regression:** Manually verify the surrounding flows are unbroken.
- **Commit:** One logical change per commit, descriptive message.
- **QA:** Cross-check against the relevant QA finding(s).

Skipping steps is how regressions happen.

---

## 15. Decision Log (ADRs)

Architecture Decision Records live in `docs/adr/`. Each ADR captures the **why** behind a decision so future contributors don't reverse it by accident.

**Currently formalized:**
- `ADR-011` — Generated Reports Strategy (Reports Never Own Data; SPR/Dashboards/KPIs computed dynamically via `CalculationService`).
- `ADR-012` — Canonical Award Workflow (TenderAwardService acts as application orchestration boundary for Tender to Project award, separate from generic status transitions).

**Decisions that exist in practice but should be backfilled as formal ADRs** (Future Sprint task — currently captured in this file and in `docs/ai/PROJECT_BOOK.md`):

| Proposed ADR | Topic |
|--------------|-------|
| ADR-001 | Project Master as Single Source of Truth |
| ADR-002 | SPR as Read Model (predecessor to ADR-011) |
| ADR-003 | Enterprise System Settings & Policies module (replaces "Centralized Master Registers") |
| ADR-004 | ProjectId as universal identity reference |
| ADR-005 | Attachment Strategy (metadata in DB, files external) |
| ADR-006 | Storage Strategy (PostgreSQL + SharePoint split) |
| ADR-007 | Technology Freeze until Backend Completion |
| ADR-008 | Sprint Strategy (strict scope, no scope creep) |

Backfilling these is a documentation task, not a Sprint 1 task. Flag it as Future Sprint Recommendation.

---

## 16. Key Reference Docs (read these for deeper context)

Living docs that are the source of truth for architecture/business rules:

- `README.md` — product overview, module list, public-facing architecture summary
- `docs/ai/PROJECT_BOOK.md` — full project knowledge
- `docs/ai/ARCHITECTURE_BASELINE_v1.0.md` — the certified baseline
- `docs/ai/ARCHITECTURE_MAP.md` — where each layer lives
- `docs/ai/BUSINESS_RULES_INDEX.md` — index of every business rule
- `docs/ai/GLOSSARY.md` — domain vocabulary
- `docs/ai/AI_HANDOFF.md`, `QUICK_START.md` — onboarding for AI assistants
- `docs/ai/FRONTEND_STABILIZATION_REPORT.md` — Sprint 1 context
- `docs/adr/` — Architecture Decision Records (currently ADR-011)
- `docs/business-rules/`, `docs/domain/`, `docs/state-machines/`, `docs/ui-blueprint/`
- `ROWAD-Enterprise-QA-Report-2026-06-29.md` — 73 findings, the Sprint 1 punch list
- `CTO-Implementation-Roadmap.md`, `CTO-Final-Certification-Review.md`, `CTO-Frontend-Readiness-Review.md`
- `BACKEND-READINESS-FIX-PROMPT.md` — backend prep notes
- `CHANGELOG.md`
- `Sprint.md` — full Sprint Roadmap (scope/out-of-scope per Sprint, Exit Criteria, Definition of Done, Architecture Freeze Policy)
- `ROADMAP_STATUS.md` — **live** execution status (per-Sprint progress, current version, last tag, blockers, open decisions, risks). Update at every Sprint Exit.

---

## 17. Rules of Engagement for Codex

When working on ROWAD:

1. **Scan first, change second.** Always read the relevant files before editing.
2. **Stay inside Sprint 1 scope.** If a fix surfaces something outside scope, flag it as "Future Sprint Recommendation" — don't implement it.
3. **Respect the layers.** New business logic → Domain/Service/Calculator/Validator. Never inside a component or repository.
4. **Find the root cause.** No band-aids, no try/catch swallowing, no parallel implementations.
5. **No new entities, no new repos, no new compatibility layers** unless explicitly approved.
6. **Bilingual UI matters.** EN/AR — use `BiText` and existing patterns.
7. **Match existing style.** This codebase has strong conventions; follow them rather than introducing new ones.
8. **User communication:** concise, informal, Arabic + English mix, strong-programmer assumption, no code blocks unless explicitly asked.

---

## 18. Open Questions / Watchlist

- SPR component lacks an ErrorBoundary — should one wrap all heavy read-model components project-wide? (Future Sprint candidate.)
- Tender → Project conversion (Finding #25) belongs to Sprint 2 (Tender & Award). Completed as a secure, bidirectional Award confirmation wizard backed by `TenderAwardService`.
- LocalStorage repositories will need a clean swap-in path for the FastAPI client in Sprint 8 — interfaces should already support this, verify before any new repo work in Sprint 7.
- Backfill foundational ADRs (001–008 listed in chapter 15) — Future Sprint task.
- Document Control sub-modules (#71) — currently placed in Phase 2 as new features. If the business wants them earlier, they could form their own Sprint between 3 and 4. Open question.
