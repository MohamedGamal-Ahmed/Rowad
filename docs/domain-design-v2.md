# Domain Model and Composition Specification (v2)
**Project:** ROWAD Enterprise Platform  
**Author:** Lead Software Architect  
**Refactoring Phase:** Phase 2 (Domain Model & Mapping Core)  
**Status:** Complete & Fully Validated  

---

## 1. Tender Aggregate Diagram (ASCII Spec)

The Tender model has been decoupled from a monolithic type into an Aggregate Root composed of smaller, highly cohesive entities and value objects.

```text
               ┌──────────────────────────────────────────┐
               │         Tender (Aggregate Root)          │
               │   - id: string                           │
               │   - projectCode: string                  │
               │   - tenderNumber: string                 │
               │   - projectName: BilingualString         │
               └────────────────────┬─────────────────────┘
                                    │
    ┌──────────────┬────────────────┼──────────────┬────────────────┬──────────────┐
    ▼              ▼                ▼              ▼                ▼              ▼
┌──────────┐ ┌──────────┐     ┌───────────┐  ┌───────────┐    ┌───────────┐  ┌───────────┐
│ General  │ │Assignm.  │     │ Timeline  │  │Financials │    │  Status   │  │ Checklist │
│  Infor.  │ │  Infor.  │     │   Infor.  │  │   Infor.  │    │   Infor.  │  │   Infor.  │
└──────────┘ └──────────┘     └───────────┘  └───────────┘    └───────────┘  └───────────┘
                                                   │
                                                   ▼
                                              ┌──────────┐
                                              │  Money   │
                                              │ (ValueObj)
                                              └──────────┘
```

---

## 2. Entity Relationship Explanation

By following Domain-Driven Design (DDD) principles:
1.  **Aggregate Root (`Tender`)**: Acts as the gatekeeper. Views and outer controllers only query or fetch the `Tender` aggregate.
2.  **GeneralInformation**: Captures administrative data like branch, Priority, business unit, and contractor.
3.  **AssignmentInformation**: Captures critical engineering and estimation stakeholders (Coordinator, Contracts Engineer, and Tender Study Engineer).
4.  **TimelineInformation**: Manages static date attributes (Submission targets, site visits). Derived statuses (like Due Soon or Overdue status) are computed runtime.
5.  **FinancialInformation**: Uses the reusable `Money` domain value object to represent estimation costs, estimated value, and security bond pricing in the respective `Currency`.
6.  **StatusInformation**: Ensures strict separation of `RecordStatus` (visibility control: ACTIVE vs ARCHIVED) and `WorkflowStatus` (estimating workflow progress). No mixed terminology.
7.  **ChecklistInformation**: Governs pre-requisite compliance (drawings, boq, specifications status sheets).

---

## 3. List of Created Interfaces & Enums

The following files and assets have been designed and compiled:

| Type Classification | Exact Identifier & Path | Purpose / Covered Scope |
| :--- | :--- | :--- |
| **Enum** | `RecordStatus` (`src/enums/RecordStatus.ts`) | Strict Active/Archived administrative model status |
| **Enum** | `WorkflowStatus` (`src/enums/WorkflowStatus.ts`) | Bid estimation step milestones (Draft, Submitted etc.) |
| **Enum** | `Priority` (`src/enums/Priority.ts`) | Priority scales (Low, Medium, High, Critical) |
| **Enum** | `HealthStatus` (`src/enums/HealthStatus.ts`) | Timeline warning levels (Healthy, Urgent, Due Soon etc.) |
| **Enum** | `Currency` (`src/enums/Currency.ts`) | Standard financial currency symbols (AED, SAR etc.) |
| **Domain Common** | `BilingualString` (`src/domain/common/BilingualString.ts`) | Double language string format holder |
| **Domain Common** | `Money` (`src/domain/common/Money.ts`) | Strongly typed corporate value object representing financial values |
| **Domain Common** | `AuditInfo` (`src/domain/common/AuditInfo.ts`) | System audit tracks |
| **Domain Common** | `DateRange` (`src/domain/common/DateRange.ts`) | Work intervals |
| **Domain Profile** | `TimelineRules` (`src/domain/administration/TimelineRules.ts`) | Calculation rule parameters for estimating milestones |
| **Domain Profile** | `Settings` (`src/domain/administration/Settings.ts`) | User configuration preferences profile |
| **Domain Aggregate** | `Tender` (`src/domain/pre-award/Tender.ts`) | High-fidelity split pre-award aggregate model |
| **Mapper** | `TenderMapper` (`src/mappers/TenderMapper.ts`) | Conversion bridge guaranteeing zero side effects on Legacy UI |

---

## 4. Mapping & Compatibility Strategy

We designed a dual-directional `TenderMapper` to achieve absolute backward compatibility:
1.  **Incoming Data Flow (Storage/Network ➔ Reducer Domain)**:
    `TenderMapper.toDomain(legacyTender)` compiles loose schema properties, parses currency prefixes from formatted money strings into proper values, maps raw status values to `RecordStatus` and `WorkflowStatus` enums, and structures assignments.
2.  **Outgoing Data Flow (Domain ➔ Legacy Views Presentation)**:
    `TenderMapper.toLegacy(newDomainTender)` recalculates dynamic days remaining on-the-fly, reformats numeric amounts back into localized formatted currency strings (e.g., `'AED 430,200,000'`), maps structured nested objects into flat properties, and serves an exact clone of the legacy interface.

This ensures that the legacy React views (including the major 2,814 lines list views in `OngoingTenders.tsx`) continue to render and compile perfectly while underneath, we refactor calculations, tests, and database storage modules step-by-step.

---

## 5. Build & Validation Status
*   **TypeScript Compiler Status**: Standard `npm run build` completed with **zero errors**.
*   **Linter Status**: Standard `npm run lint` completed with **zero warnings / errors**.
