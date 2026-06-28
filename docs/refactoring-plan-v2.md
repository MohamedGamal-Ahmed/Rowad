# Architecture Refactoring Plan (v2) - Finalized
**Project:** ROWAD Enterprise Platform  
**Official Description:** A modular Construction Operations Platform for Engineering, Pre-Award, Project Controls, Document Control and Executive Reporting.  
**Author:** Lead Software Architect  
**Status:** Approved - Executing Phase 1  

---

## 1. Executive Summary & Change Matrix (v1 vs v2)

This document represents the finalized refactoring blueprint of the **ROWAD Enterprise Platform** to align with the ultimate enterprise target architecture. Based on the Lead Architect's review, we have transitionally updated our long-term plan from a Firebase/Firestore-inspired client-side cache model to a **Domain-Driven Design (DDD)** frontend ready to connect with a robust **FastAPI / SQLAlchemy / PostgreSQL / JWT** service pipeline.

### Changes Matrix (v1 vs v2)

| Dimension | Refactoring Plan v1 (Initial Draft) | Refactoring Plan v2 (Final Blueprint) | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Product Purpose** | Broad SaaS ERP prototype | **Modular Construction Operations Platform** covering Engineering, Pre-Award, Project Controls, Document Control, and Executive Reporting | Focuses development strictly on core specialized construction operations rather than generic ERP scopes. |
| **Backend Technology** | Firebase Auth / Firestore | **FastAPI (Python) + SQLAlchemy ORM + PostgreSQL + JWT Auth** | High-performance backend matching industry-standard engineering data relationships and transaction safety. |
| **Domain Isolation** | Split general `Tender` schemas in single files | **Domain-Driven Design (DDD) Boundaries** (Pre-Award, Project Controls, Document Control, Administration) | Prevents cross-module data pollution. Dashboard is strictly an aggregator owning zero data. |
| **Repository Pattern** | Direct Services-to-State flow | **Views ➔ Services ➔ Repositories ➔ Mappers ➔ API DTOs** | Decouples UI and business logic from the network interface. Isolates REST endpoints and API model changes from React views. Designed as if PostgreSQL already exists. |
| **Validation Layer** | Internal state validations inside components | **Dedicated Validators Layer** (`src/validators/`) | Separation of concerns. Validation checks are isolated from functional business calculations. |
| **Shared Helpers vs Domain** | All types in standard shared folders | **Shared Technical Helpers vs Common Domain Objects (`src/domain/common/`)** | Separates domain value objects (like `Money` or `BilingualString`) from technical utilities (like general code string helpers). |
| **Administrative Workspace** | Settings inside constants folders | **Dedicated Administrative Domain (`src/domain/administration/`)** | Recognizes administrative settings, rules, and configurations as a genuine business domain. |

---

## 2. Product Vision & Technology Stack Alignment

The **ROWAD Enterprise Platform** is a modular **Construction Operations Platform**.
*   **Engineering & Document Control (EDMS)**: Responsible for blueprints, CAD drawings ledger, originators/recipients matrices, and revisions tracking.
*   **Pre-Award**: Responsible for RFPs, bid estimates, site visit schedules, and timeline calculations based on offset constraints.
*   **Project Controls**: Responsible for payment certificates (IPCs), variation orders (VOs), legal claims boundaries, NOC municipal status, and schedule milestones. (Renamed from Project Execution).
*   **Executive Reporting (Dashboard)**: A pure presentation layer aggregating active KPIs, metrics, counts, and financial data. The Dashboard owns no transactional domain records.

### Target Technology Stack
All future refactorings, mappers, and repository structures are designed to be 100% compatible with:
*   **Frontend**: React + TypeScript + Vite (Tailwind CSS, Recharts)
*   **Backend**: FastAPI (Python)
*   **Database**: PostgreSQL (Excel spreadsheets are strictly an import schema source, never the database)
*   **Database ORM**: SQLAlchemy (with Pydantic schemas mapping directly to frontend domain models)
*   **Authentication**: JSON Web Tokens (JWT) inside API header attributes

---

## 3. Domain-Driven Design (DDD) & Layered Architecture

We establish core subdomains with absolute boundaries. No component in one domain may import or mutate active data from another directly; instead, communications flow through services or repositories:

```text
 +-----------------------------------------------------------------------------------+
 |                             EXECUTIVE REPORTING LAYER                             |
 |                               (Dashboard Module)                                  |
 |       - Aggregates metrics from Pre-Award & Project Controls dynamically          |
 |       - Owns no business data records directly                                    |
 +-----------------------------------------------------------------------------------+
                                           │
       ┌────────────────────────┬──────────┴──────────┬────────────────────────┐
       ▼                        ▼                     ▼                        ▼
 +───────────+            +───────────+         +───────────+            +───────────+
 | PRE-AWARD |            |  PROJECT  |         | DOCUMENT  |            |  ADMIN /  |
 |  DOMAIN   |            | CONTROLS  |         |  CONTROL  |            | ADMINIST. |
 |           |            |           |         |  DOMAIN   |            |  DOMAIN   |
 +───────────+            +───────────+         +───────────+            +───────────+
```

### High-Fidelity Domain Flow Pipeline
To prepare for the future python server, the flow of data conforms to the following strict pipeline:

```text
  [Backend API] (JSON DTOs)
       │
       ▼ (Fetch DTO)
  [Mappers Layer] (Deserializes JSON DTOs to strong TypeScript Domain Models)
       │
       ▼ (Domain Entities)
  [Repositories Layer] (Data Storage Strategy: localStorage / mock files -> API / Network)
       │
       ▼ (Decoupled Entities)
  [Services Layer] (Orchestrates queries, triggers business-rules, handles cache states)
       │
       ▼ (React bindings & Selectors)
  [React UI Views] (Presentation & user trigger interaction, strictly declarative styling)
```

---

## 4. Frontend Layer Specifications

We will establish these structures as clean folders inside `/src/`:

### 1. Domain Layer (`src/domain/`)
Divided strictly by subdomain workspaces:
*   `src/domain/common/`: Shared domain Value Objects (e.g., `BilingualString`, `Money`, `AuditInfo`, `DateRange`). Since these model genuine business concepts, they reside inside the domain layer rather than a basic utility package.
*   `src/domain/pre-award/`: Hold tender aggregates split into value objects.
*   `src/domain/project-controls/`: Hold IPCs, claim submittals, progress values, and site coordinates schemas.
*   `src/domain/document-control/`: Hold Transmittals, incoming records, CAD status files, and correspondence schemas.
*   `src/domain/administration/`: Host timeline rules, configuration offsets, and administrative configurations (e.g., settings profile structures).

### 2. Business Rules Layer (`src/business-rules/`)
Contains pure synchronous functions. No dependency on UI, framework, state managers, or side effects.
*   `TimelineCalculator.ts`: Contains logic to apply negative offsets to technical submission milestones.
*   `HealthCalculator.ts`: Resolves urgency based on remaining days and priority status.
*   `FinancialsCalculator.ts`: Multi-currency parser summing raw amounts safely.

### 3. Validators Layer (`src/validators/`)
Dedicated exclusively to syntactic and semantic validation constraints before records are persisted.
*   `TenderValidator.ts`: Assures estimated parameters exist, bonds are positive, dates are chronologically logical.
*   `SettingsValidator.ts`: Prevents positive offsets from saving inside PMO administrative configurations.

### 4. Repositories Layer (`src/repositories/`)
Interfaceless abstracts preparing mock data to API conversions:
*   `TenderRepository.ts`: Declares `getTenders()`, `saveTender(tender)`, `deleteTender(id)` behaviors.
*   Designed under the assumption of an existing FastAPI / PostgreSQL backend database interface.

### 5. Mappers Layer (`src/mappers/`)
Separates future backend REST API schemas (Python camelCase / snake_case DTO types) from local React Domain Models.
*   `TenderMapper.ts`: Converts Raw JSON responses into structured `Tender` aggregates.

### 6. Enums Folder (`src/enums/`)
One file per enum class. No magic strings or type unions:
*   `enums/RecordStatus.ts`: `ACTIVE`, `ARCHIVED`
*   `enums/WorkflowStatus.ts`: `DRAFT`, `UNDER_STUDY`, `READY_FOR_SUBMISSION`, `SUBMITTED`, `UNDER_NEGOTIATION`, `AWARDED`, `LOST`, `CANCELLED`
*   `enums/Priority.ts`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
*   `enums/HealthStatus.ts`: `HEALTHY`, `URGENT`, `UNDER_REVIEW`, `DUE_SOON`, `OVERDUE`
*   `enums/Currency.ts`: `AED`, `SAR`, `EGP`, `USD`

### 7. Constants Folder (`src/constants/`)
Exclusively for application-level defaults, offsets constraints, route indexes, and default date representation parameters.
*   `constants/AppConstants.ts`
*   `constants/Permissions.ts`

### 8. Shared Helpers Layer (`src/shared/`)
Core technical reusable utility files (e.g. general string utilities). Owns no business values or structural domain models.

---

## 5. Composed Tender Domain Model & Status Division

### Split Composed Object Spec
The monolithic `Tender` domain model is divided into distinct structural objects:

```typescript
export interface Tender {
  id: string;
  projectCode: string;
  tenderNumber: string;
  projectName: BilingualString;
  general: GeneralInformation;         // Priority, branch, business unit, client details
  assignments: AssignmentInformation; // Coordinator, contracts engineer, study engineer
  timeline: TimelineInformation;       // Technical / commercial date markers
  financials: FinancialInformation;   // Bond, currency, estimated values
  status: StatusInformation;           // RecordStatus vs WorkflowStatus composition
  checklist: StudyChecklist;           // Drawing codes, boq ticks, checklist reviews
  documents: DocumentRecord[];         // Supporting transmittals
  notes: NoteRecord[];                 // Communications thread log
}
```

### Absolute Separation of Status Concepts
We enforce structural independence between administrative record visibility and operational proposal workflows:

1.  **RecordStatus** (`enum RecordStatus`)
    *   `ACTIVE`: Visible on working dashboards.
    *   `ARCHIVED`: Hidden from active workspace listings, retained for historical bid analytics and audits.
2.  **WorkflowStatus** (`enum WorkflowStatus`)
    *   `DRAFT` (Initial design phase state)
    *   `UNDER_STUDY` (Site visits is running, pricing is ongoing)
    *   `READY_FOR_SUBMISSION` (Review committee approvals compiled)
    *   `SUBMITTED` (Proposal logged physically with Client)
    *   `UNDER_NEGOTIATION` (Technical clarification responses)
    *   `AWARDED` (Transitioning to Project Controls active module status)
    *   `LOST` (Closed bidding bid failure)
    *   `CANCELLED` (RFP cancelled by Client or Management)

### Calculated Value Policy
No computed or derived attributes are allowed within stored datasets.
*   **Stored fields**: `general.techSubmissionDate`, `general.commSubmissionDate`
*   **Dynamic calculated fields**:
    *   `daysRemaining = DateArithmetic.calculateRemainingDays(techSubmissionDate)`
    *   `healthStatus = HealthCalculator.evaluate(daysRemaining, priority)`
    *   `submissionStatus = WorkflowStatusHelper.resolve(currentDate, techSubmissionDate)`

---

## 6. Implementation Blueprint & Directory Layout

To execute Phase 1, the following files will be added to the repository:

```text
src/
├── enums/
│   ├── RecordStatus.ts
│   ├── WorkflowStatus.ts
│   ├── Priority.ts
│   ├── HealthStatus.ts
│   └── Currency.ts
├── constants/
│   └── AppConstants.ts
├── domain/
│   ├── common/
│   │   ├── Money.ts
│   │   ├── BilingualString.ts
│   │   ├── AuditInfo.ts
│   │   └── DateRange.ts
│   ├── administration/
│   │   ├── Settings.ts
│   │   └── TimelineRules.ts
│   └── pre-award/
│       ├── Tender.ts
│       └── Common.ts
```

---

## 7. Execution Phasing Plan & Work Sequence

We split the construction refactoring into five incremental, compilable modules. Each is validated with `compile_applet` & `lint_applet` before progress is committed:

### Phase 1: Shared Core, Enums, and Constants
*   **Action**: Create enums, shared formattings, common date engines, and global settings constants. Setup `src/domain/common/` domain value objects and `src/domain/administration/` domain objects.
*   **Validation**: Assure no name overlaps. Fully verify that the applet builds with `compile_applet`.

### Phase 2: Domain Modeling & Composition
*   **Action**: Create domain entities for Pre-Award, Project Controls, and Document Control. Incorporate split mappings inside `src/domain/`.
*   **Validation**: Full compilation test without updating UI files.

### Phase 3: Pure Calculators, Mappers & Validators
*   **Action**: Deploy pure logic files inside `src/business-rules/` and `src/validators/`. Deploy initial repositories reading mock static data pools.
*   **Validation**: Add tests for timeline operations, negative offset boundaries, and financial parsers.

### Phase 4: Main Refactoring / Mapping adapter Integration
*   **Action**: Target `/src/data.ts` and `/src/mockData.ts` and convert standard lists into Domain Model aggregates using mappers. Update `Dashboard.tsx` and settings.
*   **Validation**: Assure executive counts, graphs aggregates, and local timeline changes behave identically in the preview.

### Phase 5: View Layer Integration & Cleanup
*   **Action**: Refactor view components (e.g., `OngoingTenders.tsx` drawing components) to consume values through `TenderService` and repositories. Clean up legacy types and inline models from panels.
*   **Validation**: Full system build, visual regression suite test, and deployment of Architecture Decision Records (ADR).

---

## 8. Risks, Mitigations & Rolling Back

*   **Risk**: Complex view crashes during wiring phase.
*   **Mitigation**: Transitional dual-adapter scheme. The domain entities will export an old format mapping getter to permit incremental wiring of view panels line-by-line rather than an all-at-once replacement.
*   **Rollback Strategy**: Maintain local check-ins for each phase. If a phase breaks, git checkout returns the folder layout to the clean compiling previous version within seconds.

---

## 9. Architectural Decision Records (ADR) Creation Plan

As part of the Refactoring Phase, we will establish these documented decisions inside `docs/adr/`:
*   `docs/adr/0001-clean-ddd-frontend-architecture.md`
*   `docs/adr/0002-decoupling-record-and-workflow-status.md`
*   `docs/adr/0003-dynamic-derived-fields-policy.md`
*   `docs/adr/0004-values-formatting-standardization.md`

---
**Report Formulated by:**  
*Lead Software Architect*  
*ROWAD Corporate Platform Group*  
*(Verified and Structured for zero visual regressions)*
