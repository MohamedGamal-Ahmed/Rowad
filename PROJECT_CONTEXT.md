# ROWAD Enterprise Platform — Project Context

> The single Engineering Knowledge Base for the ROWAD Enterprise Platform.
> Audience: developers, AI assistants, architects, technical reviewers.
> Read this **first** before reading any other document or any source file.

| Field | Value |
|-------|-------|
| Document Type | Engineering Knowledge Base (single source of truth) |
| Audience | Developers, AI assistants, architects, technical reviewers |
| Owner | CTO |
| Last Updated | 2026-06-30 |
| Related Documents | `CLAUDE.md` (AI rules-of-engagement), `Sprint.md` (Sprint plan), `ROADMAP_STATUS.md` (live status), `docs/adr/` (Architecture Decision Records), `docs/ai/PROJECT_BOOK.md` (deeper narrative) |

---

## 1. Executive Summary

ROWAD is an **Enterprise Contract Administration Platform** built for a Contracts Administration Department of a mid-to-large general contractor. It replaces the operational fragmentation caused by 10+ disconnected Microsoft Excel workbooks (RME Monthly Report, Ongoing Projects & Deadlines, Subcontracts Tracker, Document Registers, Contract Follow-up Sheets, and others) with one unified operational system of record.

**The original problem was not Excel.** Each spreadsheet solved a single problem reasonably well in isolation. The problem was *fragmentation*: multiple versions of the same workbook in circulation; no single source of truth; duplicated data across files; manual weekly follow-up; manual report preparation; heavy dependence on specific employees who held the institutional knowledge in their heads; no consolidated cross-project view.

ROWAD exists to keep the department's existing business process intact while eliminating that fragmentation. The Department still does Tender Study, Contract Review, Risk Assessment, Award Support, Project Follow-up, Claims, Variation Orders, IPC, Meetings, NOC, Subcontracts, and Document Control the same way. ROWAD digitises, organises, connects, and surfaces this work in one place.

---

## 2. Vision

**ROWAD is an Operational Management Platform.**

It is **not**:

- An ERP — it does not own finance, procurement, HR, or asset management.
- A Workflow Automation Engine — it does not route approvals or trigger downstream actions.
- A BPM (Business Process Management) System — it does not model arbitrary workflows.
- A document storage system — files live in SharePoint or the corporate file server.
- A communications platform — it does not replace Outlook, Teams, or WhatsApp.

It **is**:

- One unified Single Source of Truth for Contract Administration data.
- A platform that mirrors the department's real-world responsibilities, in business terminology, with deterministic calculations.
- A foundation that the department can grow on — backend, RBAC, reporting, AI, and mobile arrive in defined later phases.

The long-term vision is a fully scalable bilingual (Arabic / English) operational system for mega-project contract administration: deterministic financial calculations, regulatory compliance tracking, executive visibility, and clean integration with SharePoint, M365, and downstream BI tools — added in that order, not all at once.

---

## 3. Business Philosophy

These are non-negotiable principles. Every architectural decision in ROWAD has been measured against them.

1. **Business First, Software Follows.** The business defines the entities, the lifecycle, the terminology. The software mirrors them. When a name clash arises between what the business calls something and what's natural in code, the business name wins.
2. **Single Source of Truth.** Every business entity exists in exactly one place. The Project Master is the SSoT root; everything else references `ProjectId`. No duplicated project records anywhere.
3. **Reports Never Own Data.** SPR, dashboards, executive summaries, and analytics widgets are Read Models. They aggregate transactional records at query time. They never persist their own copies. Formalised in `docs/adr/ADR-011.md`.
4. **No Duplicated Business Logic.** A rule is defined once — in Domain, Service, Calculator, or Validator — and consumed everywhere. UI, repositories, and mappers never reimplement business rules.
5. **Files Stay Where Files Belong.** Business data lives in PostgreSQL. Files (drawings, PDFs, contracts, photos) live in SharePoint or the corporate file server. ROWAD stores only metadata, links, version pointers, ownership, categories, and history.
6. **Operational Visibility Before Automation.** Phase 1 makes work visible. Phase 2 begins to automate. We never automate something we cannot first see clearly.
7. **The Mission Test.** Every feature must answer "Does this make Contract Administration easier, clearer, and more reliable?" If no, reconsider the feature.

---

## 4. Scope

### In Scope (the platform does this)

- Organises operational Contract Administration information.
- Connects business entities (Tender ↔ Project, Project ↔ IPC ↔ VO ↔ Claims ↔ NOC ↔ Subcontract ↔ Meeting ↔ Document).
- Calculates business metrics (margins, IPC nets, contract values, project health, schedule offsets).
- Generates executive reports as Read Models (SPR, dashboards).
- Provides management visibility across the portfolio.
- Reduces duplicated work through one source of truth.
- Bilingual (EN/AR) for every entity, status badge, and form.

### Intentionally Out of Scope (the platform does not do these)

- Email engine / SMTP / mailbox.
- Workflow automation / approval routing.
- Calendar scheduling / invitations.
- Document storage (use SharePoint / corporate file server).
- Procurement / PO management / supplier evaluation.
- HR / payroll / employee performance.
- Finance ERP / GL / accounts payable / receivable.
- Teams / chat / messaging.
- Field data capture / mobile capture (Phase 2 candidate).
- Notifications / alerting (Phase 2).
- AI / OCR (Phase 2).
- Power BI / external analytics (Phase 2, post-backend).

If a stakeholder asks for an out-of-scope capability, route it to Phase 2 planning.

---

## 5. Project Lifecycle

### End-to-end business lifecycle

```
Tender ──► Award ──► Project ──► Execution ──► Close-Out ──► Archive
```

### Tender state machine

```
Draft ─► Under Study ─► Ready for Submission ─► Submitted ─► Under Negotiation ─► Awarded
                                                                                     │
                                                                                     ▼
                                                                                  (terminal)
```

A Tender can branch to **Lost** or **Cancelled** from any pre-award state. **Awarded**, **Lost**, and **Cancelled** are terminal — no further transitions allowed.

### Project state machine

```
Initiation ─► Execution ─► Close-Out ─► Archived
```

### Stage definitions

| Stage | What happens |
|-------|--------------|
| **Tender** | Bid opportunity being studied and priced. Pre-award only. |
| **Award** | A Tender is converted into a Project. The Award action creates the Project record, transfers metadata (client, consultant, value, scope, documents, history), and locks the Tender as read-only. |
| **Project (Initiation)** | The newly awarded contract is set up: codes assigned, team allocated, initial documents registered. |
| **Project (Execution)** | Day-to-day Contract Administration: IPCs raised, VOs processed, Claims filed, NOCs obtained, Subcontracts managed, Meetings minuted, Documents controlled. |
| **Close-Out** | Final account, defects liability, handover documentation, final IPC, retention release. |
| **Archive** | Read-only historical record. Never deleted. Never reopened. Remains queryable for reporting and audit. |

**Hard rules:**
- A Project is created **only** by awarding a Tender. There is no other path.
- Once a Tender is Awarded, it is read-only — its data seeds the Project but cannot be edited.
- Archived records cannot be re-opened.

---

## 6. System Architecture

ROWAD follows **Clean Architecture** and **Domain-Driven Design (DDD)** with a **Feature-Based** front-end folder layout. The architecture has been independently reviewed and certified (see `docs/ai/ARCHITECTURE_BASELINE_v1.0.md`). It is **stable and frozen** for changes — we are completing and stabilising, not redesigning.

### Layered model

```
┌──────────────────────────────────────────────────────────┐
│ UI (Views + Feature components)                          │
│   React 19, Tailwind v4 — pure presentation              │
└──────────────────────────────────────────────────────────┘
                       │ delegates to
                       ▼
┌──────────────────────────────────────────────────────────┐
│ Services (application orchestration)                      │
│   Coordinate Domain + Repositories                        │
└──────────────────────────────────────────────────────────┘
        │                     │                   │
        ▼                     ▼                   ▼
┌──────────────┐  ┌────────────────────┐  ┌─────────────┐
│ Domain       │  │ Business Rules     │  │ Validators  │
│ (Entities,   │  │ (Calculators)      │  │             │
│  Aggregates, │  │                    │  │             │
│  Value Obj.) │  │                    │  │             │
└──────────────┘  └────────────────────┘  └─────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│ Repositories (persistence boundary)                       │
│   CRUD only — no business logic                           │
└──────────────────────────────────────────────────────────┘
                       │ via
                       ▼
┌──────────────────────────────────────────────────────────┐
│ Mappers (persistence shape ↔ domain shape)                │
└──────────────────────────────────────────────────────────┘
```

### Layer responsibilities

| Layer | Folder | Owns | Forbidden |
|-------|--------|------|-----------|
| **UI / Views** | `src/views/`, `src/features/*/components/` | Presentation, user interactions | Business rules, persistence calls, calculations |
| **Services** | `src/services/` | Application orchestration, cross-aggregate coordination | Inline business rules, direct persistence (must go via Repos) |
| **Domain** | `src/domain/` | Entities, Value Objects, Aggregates (Project, Tender, MasterData) | Persistence concerns, UI concerns |
| **Business Rules** | `src/business-rules/` | Pure calculators (Financial, Health, Timeline, Milestone) and lifecycle validators (Tender, Claim) | Side effects, persistence, UI |
| **Validators** | `src/validators/` | Input validation against business rules | Side effects |
| **Mappers** | `src/mappers/` | Persistence ↔ Domain shape translation | Business rules, side effects |
| **Repositories** | `src/repositories/` | CRUD against the store (LocalStorage today, FastAPI later) | Any business logic |
| **Features** | `src/features/` | Self-contained vertical slices (Pre-Award, Projects, Operations Center) | Cross-imports between sibling features |
| **Read Models** | Within Services / Calculators | Derived views (SPR, dashboards) | Their own persistent records |

### Settings (Enterprise System Settings & Policies)

A dedicated module — currently under construction (Sprint 4) — owns Master Data, Business Rules, Workflow Policies, System Policies, Security shells, and Integration shells. **System-admin only.** Operational users do not modify settings.

---

## 7. Technical Stack

### Current (Frontend-only era)

| Concern | Technology | Notes |
|---------|------------|-------|
| Framework | React 19 + TypeScript | Strict typing throughout |
| Build | Vite 6 | Fast HMR, ES modules |
| Styling | Tailwind CSS v4 | Utility-first; no custom CSS framework |
| Charts | Recharts | Used in dashboards and SPR |
| Icons | lucide-react | Consistent icon set |
| Animations | motion | Lightweight |
| Persistence (current) | LocalStorage repositories + seed data | Repository interfaces designed for clean swap to API |
| Type-check | `npm run lint` → `tsc --noEmit` | Must exit 0 to pass Sprint Exit |
| Build | `npm run build` | Vite production build |

### Future (post-Sprint 8)

| Concern | Technology | Sprint |
|---------|------------|--------|
| Backend | FastAPI (Python) | Sprint 8 |
| Database | PostgreSQL | Sprint 8 |
| ORM | SQLAlchemy | Sprint 8 |
| Migrations | Alembic | Sprint 8 |
| Authentication | JWT | Sprint 8 |
| Authorisation | RBAC | Defined Sprint 5, wired Sprint 8 |
| File Storage | SharePoint + OneDrive | Sprint 9 (integration), files never inside the DB |
| Observability | Health/Readiness/Liveness probes, error monitoring, alerting | Sprint 9 |
| Reporting | PostgreSQL aggregates + Power BI | Phase 2 (post-backend) |
| Containerisation | Docker / Kubernetes-ready (planned) | Sprint 9 onward |

### Technology Freeze

Until **Backend Completion (Sprint 8)**, the frontend stack is **frozen**. No framework upgrades, no library swaps, no migrations without explicit CTO approval. After Sprint 7 (Backend Preparation), an **Architecture Freeze Policy** also applies: no Entity / DTO / Repository interface / API breaking / Domain Model changes without CTO approval.

---

## 8. Repository Structure

```
Rowad-v1-main/
├── CLAUDE.md                   # AI rules-of-engagement (read on every AI session)
├── PROJECT_CONTEXT.md          # This file — engineering knowledge base
├── Sprint.md                   # Sprint Roadmap (scope/out-of-scope per Sprint, Exit Criteria, Definition of Done, Architecture Freeze Policy)
├── ROADMAP_STATUS.md           # Live execution tracker (Sprint progress, blockers, risks)
├── README.md                   # Product overview (public-facing)
├── CHANGELOG.md                # Semantic-versioned change log
├── package.json                # npm scripts; tech stack pinned
├── tsconfig.json               # TypeScript config (ES2022, JSX, strict-friendly)
├── vite.config.ts              # Vite config
│
├── src/
│   ├── App.tsx, main.tsx, index.css
│   │
│   ├── domain/                 # DDD aggregates
│   │   ├── projects/           # Project.ts (the SSoT root) + ClaimStatus, IPC, VO, NOC, Subcontract, Meeting, Document
│   │   ├── pre-award/          # Tender + all *Information value objects + BusinessEvent + TenderAssignment
│   │   ├── project-controls/   # ProjectControlsRecord
│   │   ├── master/             # MasterData
│   │   ├── administration/     # Settings, TimelineRules, FinancialFormulas, etc.
│   │   └── common/             # BaseEntity, BilingualString, NoteRecord, TenderDocument, Milestone
│   │
│   ├── services/               # Application orchestration (16 services)
│   │   AuditService, CacheService, CalculationService, Clock, DashboardService,
│   │   ImportService, LoggingService, MilestoneService, NotificationService,
│   │   NumberingService, PermissionService, ProjectControlsService,
│   │   ProjectLookupService, SearchService, TenderAwardService, TenderService,
│   │   TimelineService
│   │
│   ├── business-rules/         # Pure calculators + lifecycle validators
│   │   FinancialsCalculator, HealthCalculator, TimelineCalculator,
│   │   MilestoneBusinessRules, ClaimLifecycleValidator, TenderLifecycleValidator
│   │
│   ├── validators/             # Input validators
│   │   SettingsValidator, TenderValidator
│   │
│   ├── mappers/                # Persistence ↔ Domain translation
│   │   ProjectControlsMapper, TenderMapper
│   │
│   ├── repositories/           # CRUD only (LocalStorage today, API later)
│   │   ProjectRepository, TenderRepository, MasterDataRepository,
│   │   ProjectControlsRepository, AssignmentRepository, BusinessEventRepository
│   │
│   ├── features/               # Vertical feature slices
│   │   ├── pre-award/ongoing-tenders/    # Tender wizard, drawer, table, tabs, hooks, constants
│   │   ├── projects/                     # Project list, workspace, registers, 13 workspace panels
│   │   │   └── components/workspace/     # IPCs, VOs, Claims, NOCs, Subcontractors, Meetings, Documents, WBS, Attachments, Search, Settings, Dashboard, ActivityFeed
│   │   └── operations-center/            # Calendar, Kanban, Timeline, Agenda, MyWork, Workload, Conflicts, Analytics
│   │
│   ├── views/                  # Route-level pages
│   │   Dashboard, ProjectsPage, OngoingTenders, DocumentControl, Settings
│   │
│   ├── components/             # Shared UI primitives
│   │   Header, Sidebar, BiText, SearchableAutocomplete
│   │
│   ├── hooks/                  # Shared React hooks (useProjects)
│   ├── enums/                  # RecordStatus, WorkflowStatus, etc.
│   ├── constants/              # AppConstants, MilestoneTemplates
│   ├── seed/                   # Development seed data
│   ├── tests/                  # Validation test scripts
│   └── assets/                 # Images, logos
│
├── docs/
│   ├── adr/                    # Architecture Decision Records (currently: ADR-011)
│   ├── ai/                     # AI-onboarding deep documents
│   │   PROJECT_BOOK.md, ARCHITECTURE_BASELINE_v1.0.md, ARCHITECTURE_MAP.md,
│   │   BUSINESS_RULES_INDEX.md, GLOSSARY.md, AI_HANDOFF.md, QUICK_START.md,
│   │   FRONTEND_STABILIZATION_REPORT.md, OngoingTenders_Decomposition_Report.md
│   ├── business-rules/         # Per-rule deep docs
│   ├── domain/                 # Per-aggregate deep docs
│   ├── state-machines/         # Lifecycle state machine specs
│   ├── ui-blueprint/           # UI blueprints
│   └── sprints/                # Per-Sprint folders (implementation_plan, walkthrough, sprint_acceptance_report, business_completion_report, workflow_matrix)
│
├── CTO-Implementation-Roadmap.md
├── CTO-Final-Certification-Review.md
├── CTO-Frontend-Readiness-Review.md
├── ROWAD-Enterprise-QA-Report-2026-06-29.md   # 73-finding QA punch list driving Sprint 1 onward
├── BACKEND-READINESS-FIX-PROMPT.md
├── assets/, dist/, node_modules/
```

The src/ tree contains ~142 .ts/.tsx files at last count.

---

## 9. Major Architectural Decisions (ADR Index)

ADRs live in `docs/adr/`. Each ADR captures the **why** behind a decision so future contributors don't reverse it by accident.

### Currently formalised

| ADR | Title | Why it exists |
|-----|-------|---------------|
| **ADR-011** | Generated Reports Strategy | Reports persisting their own data caused stale indicators, schema bloat, and audit drift. All reports are now Read Models computed at query time via `CalculationService`. Snapshots are allowed only when the user explicitly requests a frozen artefact (e.g., signed PDF). |

### Decisions in practice (to be backfilled as formal ADRs)

These decisions are operative today and documented in `CLAUDE.md` chapter 15 + `docs/ai/PROJECT_BOOK.md`. A future documentation sprint should promote each to a formal ADR.

| Proposed ADR | Topic | One-line rationale |
|--------------|-------|---------------------|
| ADR-001 | Project Master as Single Source of Truth | Eliminates duplicated project records that plague the Excel-era process. |
| ADR-002 | SPR as Read Model | Predecessor to ADR-011; superseded but historically important. |
| ADR-003 | Enterprise System Settings & Policies module | Replaces the legacy "Centralized Master Registers" concept; system-admin only. |
| ADR-004 | ProjectId as universal identity reference | Every business entity references the Project by ID, never by name. |
| ADR-005 | Attachment Strategy | Metadata in the DB; binary files external. |
| ADR-006 | Storage Strategy | PostgreSQL for business data; SharePoint / file server for files. |
| ADR-007 | Technology Freeze until Backend Completion | Prevents framework churn before the backend lands. |
| ADR-008 | Sprint Strategy (strict scope, no scope creep) | Out-of-scope items become "Future Sprint Recommendations", not in-flight work. |
| ADR-009 (proposed) | Architecture Freeze after Sprint 7 | Protects the Backend implementation from Domain churn. |

---

## 10. Business Modules

Each module mirrors a real responsibility of the Contracts Administration Department.

| Module | Responsibility |
|--------|----------------|
| **Tender** | Pre-award bid opportunities: study, pricing, team assignment, document checklist, timeline milestones, status workflow. Lives in `features/pre-award/ongoing-tenders/`. |
| **Projects** | Awarded contracts under execution. The Project record is the SSoT; everything else references `ProjectId`. Lives in `features/projects/`. |
| **Meetings** | Recorded engagements (progress, coordination, technical). Owns minutes, attendees, action items, decisions. |
| **Claims** | Contractor contractual claims (EOT, additional cost). 8-state lifecycle: Prepared → Submitted → Under Review → Negotiation → Counter Proposal → Approved / Rejected / Disputed. Lifecycle enforced by `ClaimLifecycleValidator`. |
| **Variation Orders (VOs)** | Approved changes to scope, value, or duration. Tracks Financial Impact, Time Impact, Risk Impact, and Approval Workflow. |
| **IPCs (Interim Payment Certificates)** | Periodic payment claims against work executed. Tracks Previous IPC, Current IPC, Retention, Recovery, Certified Amount, Paid Amount, Outstanding, Net Amount. Driven by Enterprise Settings Financial Formulas. |
| **NOCs (No Objection Certificates)** | Regulatory / authority permits (Civil Defense, Municipality, etc.). Lifecycle + attachments + expiry tracking. |
| **Subcontracts** | Contracts assigning scope to subcontractors. Tracks value, invoiced amount, status, WBS work package assignment. |
| **Documents (EDMS)** | Engineering Document Management: register, transmittals, revision history, makers approval. Document Control sub-modules (Transmittals Hub, Incoming/Outgoing Letters, Revision History, Makers Approval) are currently Phase 2 candidates. |
| **SPR (Single Paper Report)** | Executive monthly report. **Read Model only.** Aggregates live data from IPC, VO, Claims, NOC, Subcontract, Meetings. Never owns records. |
| **Enterprise Settings & Policies** | System-admin module: Master Data (Clients, Employers, Consultants, Contractors, Employees, Business Units, Disciplines, Countries, Currencies, Cities, Document Types), Business Rules (Timeline Offsets, Financial Formulas, Numbering Rules, Business Calendar), Workflow Policies, System Policies, Security shells, Integration shells. |
| **Operations Center** | Cross-project visual scheduling and tracking: Calendar, Kanban, Timeline, Agenda, MyWork, Workload, Conflicts, Analytics. |

---

## 11. User Roles

RBAC is not just a permissions matrix — it is a **visibility philosophy**.

> Users never access all data. Visibility is determined by responsibility.

| Role | Default visibility | Typical write capability |
|------|---------------------|--------------------------|
| **System Administrator** | Entire platform | Full, including Enterprise Settings |
| **Department Manager** | All projects in the department | Read across, write where assigned |
| **Contracts Manager** | All contracts under their portfolio | Award authorisation; approve IPCs / VOs / Claims |
| **Contracts Engineer** | Assigned tenders and projects | Create/edit Tenders, IPCs, VOs, Claims for assigned scope |
| **Tender Engineer** | Assigned Tenders only | Tender study, pricing, document checklist |
| **Project Engineer** | Assigned Projects only | Execution-side modules for assigned projects |
| **Document Controller** | Document Control scope, all projects | EDMS register, transmittals, revisions |
| **Read-Only / Executive** | As scoped (department / portfolio / single project) | None — view + export only |

**Enforcement.** All role enforcement happens in `PermissionService`. The UI hides what the user cannot access — it does not merely disable it. Full RBAC is implemented in **Sprint 5** (frontend models) and wired into authorisation in **Sprint 8** (backend).

---

## 12. Reporting Philosophy

This is captured formally in **ADR-011** and is non-negotiable.

- **All reports are Read Models.**
- Reports **never** create records.
- Reports **never** update records.
- Reports **never** own business entities.
- Reports aggregate transactional data on demand.

Applies to: SPR, Executive Dashboards, KPI cards, exports, and any future analytics widget. If a report needs a value, it computes it from source transactions through `CalculationService` — it does not persist its own copy.

### Live vs Snapshot

- **Live (default):** The report queries the latest data on every render. KPIs are always in sync with source records.
- **Snapshot (explicit):** The user can request a frozen artefact (e.g., a signed monthly SPR PDF) for audit purposes. The snapshot lives outside the operational tables — typically as a generated file in SharePoint with metadata in the DB.

Violating the Read-Model rule causes stale indicators, schema bloat, and audit drift — the exact issues that motivated ADR-011 in the first place.

---

## 13. Data Storage Strategy

| Class of data | Where it lives | Why |
|---------------|----------------|-----|
| Business data (entities, transactions, status, metadata) | **PostgreSQL** (Sprint 8 onward) | Relational integrity, deterministic queries, indexes |
| Files (drawings, PDFs, contracts, photos, signed reports) | **SharePoint / corporate file server** | Files belong where the company already stores them. SharePoint provides versioning, permissions, and viewer experiences ROWAD will not reinvent. |
| File metadata (filename, size, version, owner, category, upload date, link, history) | **PostgreSQL** | This is business data; ROWAD owns it |
| Authentication / session | JWT + DB | Sprint 8 |
| Audit log | **PostgreSQL** (append-only) | Sprint 5 model, Sprint 8 implementation |

**Hard rule:** **Large documents must never be stored inside the database.** PostgreSQL stores metadata + a SharePoint URL or file-server path; the file itself is never bytes-in-DB.

In the current frontend-only era, business data is held in **LocalStorage** via repository implementations that already match the interface the FastAPI client will satisfy. The Sprint 8 swap is intended to be mechanical.

---

## 14. Current Roadmap

The full Sprint Roadmap lives in `Sprint.md`. Live execution status (per-Sprint progress, blockers, risks) lives in `ROADMAP_STATUS.md`.

### High-level sequence

| # | Sprint | Status |
|---|--------|--------|
| 0 | Project Governance & Architecture Foundation | ✅ Completed |
| 1 | Production Stabilization | ✅ Completed (`v1.1.0`) |
| 2 | Tender & Award | 🟡 In progress / pending Exit |
| 3 | Commercial Modules (IPC + VO + NOC + Subcontracts + SPR completion) | ⏳ Planned |
| 4 | Enterprise System Settings & Policies | ⏳ Planned |
| 5 | Security & RBAC Foundation | ⏳ Planned |
| 6 | Enterprise UX Polish | ⏳ Planned |
| 7 | Backend Preparation (triggers Architecture Freeze; includes Security Review + OWASP + Threat Model) | ⏳ Planned |
| 8 | Backend Core (PostgreSQL + FastAPI + Auth + RBAC + REST + Audit Log + Performance Baseline) | ⏳ Planned |
| 9 | Production Infrastructure & File Integrations (Deploy + Backup + Logging + Monitoring + Caching + Health/Readiness/Liveness + SharePoint + OneDrive) | ⏳ Planned |
| 10 | Data Migration (Pilot → Validation → Department Approval → Full) | ⏳ Planned |
| 11 | Go Live (with mandatory Rollback Plan + rehearsal) | ⏳ Planned |
| 12 | Hypercare (first 30 days post Go Live → Production Stable) | ⏳ Planned |

### Phase 2 (post-Go-Live)

Sequenced for value: **AI Assistant → OCR → Notifications → Workflow Automation → Power BI / Reporting & Analytics → Mobile → Microsoft 365 deep integration**.

Reporting was moved to Phase 2 because real reporting needs PostgreSQL aggregation, query optimisation, indexes, and materialised views — not LocalStorage.

### Sprint Exit Criteria (every Sprint)

A Sprint is not complete unless **all** of: Scope Completed · Type Check Passed · Build Passed · Regression Passed · QA Passed · Documentation Updated · Git Tag Created · Code Review Completed · No Critical Bugs (P0/P1) Outstanding.

### Definition of Done (per task)

Implemented → Reviewed → Tested → Documented → Merged → Verified → Accepted. Sprint Exit is a Sprint-level gate; Definition of Done is the per-task gate. **Both must hold.**

---

## 15. Coding Standards

These are the rules a developer or AI must respect at every change.

### Layer rules

1. **Business logic lives only in:** Domain, Services, Calculators, Validators. **Never** in UI. **Never** in Repositories. **Never** in Mappers.
2. **Repositories only persist and retrieve.** No business rules. No calculations. No transformations beyond persistence-shape adaptation (which belongs to the Mapper).
3. **Mappers translate between persistence shape and domain shape only.** They never validate, calculate, or branch on business state.
4. **UI delegates.** A React component never owns a state machine, a financial formula, or a workflow rule. It calls a Service or Validator and renders the result.

### Naming

| Concept | Lives in | Purpose |
|---------|----------|---------|
| **Entity** | `domain/` | A domain object with identity |
| **Value Object** | `domain/` | A domain concept without identity (immutable) |
| **Aggregate** | `domain/` | A cluster of entities/value objects with one root |
| **Repository** | `repositories/` | Persistence boundary; CRUD only |
| **Service** | `services/` | Application orchestration |
| **Calculator** | `business-rules/` | Pure business-rule computation |
| **Validator** | `validators/` | Input validation against business rules |
| **Mapper** | `mappers/` | Persistence ↔ domain translation |
| **Read Model** | within Services / Calculators | Derived view (no own records) |
| **ViewModel** | UI-facing shape | Assembled for a specific screen |
| **DTO** | API boundary | Cross-process data transfer (post-backend) |

Putting logic in the wrong layer is the most common AI failure mode. Verify the layer **before** adding code.

### Anti-patterns (never do these)

- Create duplicate repositories, services, DTOs, business rules, or calculators.
- Store files inside PostgreSQL.
- Store project names instead of `ProjectId` (always reference by ID).
- Implement business rules inside React components or repositories.
- Add compatibility layers / adapter shims.
- Implement temporary fixes ("we'll fix it later" = never).
- Swallow errors in try/catch without explicit recovery.
- Introduce a new library when an existing one solves the problem.
- Bypass the layered flow (UI → Service → Domain → Repository).

### Bilingual UI

Every entity, status, badge, dropdown, and form supports EN / AR through the shared `BiText` component and the `BilingualString` value object. New UI must follow the same pattern.

### Per-change workflow

```
Scan → Understand → Implement → Type Check → Build → Regression → Commit → QA
```

- **Scan.** Read the relevant files. Never edit blind.
- **Understand.** Confirm the right layer; confirm scope is in the current Sprint.
- **Implement.** The smallest change that fixes the root cause.
- **Type Check.** `npm run lint` (tsc --noEmit) must pass.
- **Build.** `npm run build` must succeed.
- **Regression.** Manually verify surrounding flows.
- **Commit.** One logical change per commit, descriptive message.
- **QA.** Cross-check against the relevant QA finding(s).

Skipping steps is how regressions happen.

---

## 16. Release Strategy

### Versioning

ROWAD follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`) aligned to Sprints:

- `MAJOR` increments at major lifecycle thresholds (e.g., `v2.0.0` at Backend Core, `v3.0.0` at Go Live).
- `MINOR` increments at every Sprint Exit (`v1.1.0` = Sprint 1, `v1.2.0` = Sprint 2, etc.).
- `PATCH` increments for Hypercare fixes and hotfixes (`v3.0.1` = Hypercare first patch).

### Git tags

Each completed Sprint produces a tag of the form `v1.<sprint>.0`. Tags must be pushed to the remote (`git push origin v<x.y.z>`). Tags on orphan commits (created before a rebase) must be re-pointed to the actual merged commit before push.

### Branching

Single `main` branch for now. Feature branches per Sprint task once the team scales beyond a single contributor. PR-based code review before merging into `main`.

### GitHub Releases

Each tag corresponds to a GitHub Release containing:
- Release title (e.g., `Sprint 2 — Tender & Award`)
- CHANGELOG section for that version
- Link to the Sprint's `business_completion_report.md` and `sprint_acceptance_report.md`

### Sprint Exit gates the release

A Sprint cannot produce a tag until **all** Sprint Exit Criteria pass (see §14). Tagging a Sprint that has failing type-checks or no acceptance report is an explicit policy violation.

---

## 17. Future Vision

After the 12 Sprints + Hypercare are complete, ROWAD is:

- A **production Contract Administration platform** in daily use by the department.
- Backed by **PostgreSQL + FastAPI**, with **JWT auth + RBAC** enforced at every API boundary.
- **Integrated with SharePoint / OneDrive** for file storage — files never inside the DB.
- **Migrated** from the original 10+ Excel workbooks via the Pilot → Full migration path, with reconciliation evidence on file.
- Running with **health probes, monitoring, alerting, and backups** — Kubernetes-ready even if first deployed single-host.
- Supported by a **tested Rollback Plan** rehearsed before cutover.

Phase 2 then layers on, in this order:

1. **AI Assistant** — domain-aware, grounded in production data.
2. **OCR** — automated document intake from scanned drawings, invoices, certificates.
3. **Notifications** — in-app + email + Teams. Reactive, not push-spam.
4. **Workflow Automation** — only after the workflows are stable and understood in practice.
5. **Power BI / Reporting & Analytics** — proper aggregation, materialised views, indexes against the production DB.
6. **Mobile Application** — field access for engineers and document controllers.
7. **Microsoft 365 deep integration** — calendars, meetings, document co-authoring.

At every phase, the platform stays true to its mission: **make Contract Administration easier, clearer, and more reliable.**

---

## 18. If You Are an AI Assistant

You are picking up an in-flight enterprise project with strong conventions. Follow these rules. They prevent the failure modes we've already encountered.

### Read first, write second

1. Read **this file** (`PROJECT_CONTEXT.md`) end-to-end. Then read **`CLAUDE.md`** for AI-specific rules-of-engagement.
2. Check **`ROADMAP_STATUS.md`** to know which Sprint is active.
3. Check **`Sprint.md`** for the active Sprint's exact scope and out-of-scope.
4. Read the relevant **`docs/sprints/sprint<N>/`** folder before doing any work on Sprint `<N>`.
5. Read the source files you intend to touch before editing them. Never edit blind.

### Respect the architecture

The architecture is **frozen as a stable baseline**. You are **completing and stabilising**, not redesigning. New business logic goes into Domain / Service / Calculator / Validator — **never** into a React component or a Repository. If you find yourself wanting to bypass the layers, stop and ask.

### Stay inside the active Sprint scope

If a fix surfaces an issue outside the current Sprint, flag it as a **Future Sprint Recommendation** in your response. Do **not** implement it.

### Fix root causes, never patch symptoms

No try/catch swallowing. No band-aids. No parallel implementations. No "we'll fix it later." If a fix appears to require a new entity, a new repository, a compatibility shim, or a temporary workaround, **stop and ask** — it's almost certainly a sign that the root cause is elsewhere.

### Verify before claiming completion

The Sprint Exit Criteria include Type Check Pass, Build Pass, and No P0/P1 Bugs. You must actually run `npm run lint` and read the exit code — not assume it passes. If it fails, the Sprint is not done. **Never write a "PASS" verification matrix you have not actually executed.**

### Commit discipline

Sprint work that lives only in a working tree is not Sprint work. The Definition of Done requires Implemented → Reviewed → Tested → Documented → Merged → Verified → Accepted. If you implemented something, commit it in a logical unit with a descriptive message. Untagged orphan commits and uncommitted "delivered" work both fail the Sprint Exit.

### Communicate concisely

User preference: concise, informal, mixed Arabic + English, strong-programmer assumption, no code blocks unless explicitly asked.

### When in doubt

The ranking when you need to make a judgment call:

1. **Business mission** — does this make Contract Administration easier, clearer, more reliable?
2. **Architectural rules** — does this respect layers, SSoT, Read-Model rule, no duplication?
3. **Sprint scope** — is this in the active Sprint?
4. **Past decisions (ADRs)** — does this contradict a recorded decision?

If you cannot answer all four with yes, stop and ask the CTO.

---

**End of PROJECT_CONTEXT.md.** For deeper material see `CLAUDE.md`, `Sprint.md`, `ROADMAP_STATUS.md`, `docs/adr/`, `docs/ai/PROJECT_BOOK.md`, and `docs/sprints/`.
