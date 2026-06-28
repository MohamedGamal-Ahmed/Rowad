# Architecture Refactoring Plan (v1)
**Project:** ROWAD Enterprise Platform  
**Author:** Lead Software Architect  
**Status:** Under Review (Pending Authorization)  

---

## 1. Overview & Objective

The objective of this refactoring is to elevate the **ROWAD Enterprise Platform** from a high-fidelity client-side prototype to an enterprise-grade, clean-architecture SPA. This will pave the way for seamless backend compilation and database integration while strictly preserving:
1.  **Zero visual regression**: The UI appearance, themes, alignment, and bilingual toggles remain 100% identical.
2.  **No functionality loss**: Existing user flows, modal dialogues, spreadsheet imports, search, custom sliders, and offsets tracking logic will behave exactly as they do today.

The key target of this architecture refactoring is to resolve **primitive obsession**, **monolithic view calculations**, and **magic string pollution** by introducing a typed **Domain Model Layer**, **Business Rules Layer**, and **Service Layer**.

---

## 2. Target Files & Folder Structure

We will create a structured, modular layer under `src/` to separate responsibilities. No changes will be made to visual components until these core domains are safe and validated.

```text
src/
├── domain/                                    # Phase 1: Pure Entity Definitions & Value Objects
│   └── pre-award/
│       ├── Common.ts                          # Shared Value Objects (e.g., BilingualString, Money)
│       ├── Enums.ts                           # All system-wide TypeScript enums
│       ├── Tender.ts                          # Well-composed, split Tender domain interfaces
│       ├── Documents.ts                        # Document and EDMS details
│       ├── Notes.ts                           # Notes schema
│       └── Settings.ts                        # PMO Offset rules model
├── business-rules/                            # Phase 2: pure functional validation & calculation rules
│   ├── TimelineCalculator.ts                  # Logic for mapping milestone offsets (risk, kick-off etc.)
│   ├── HealthCalculator.ts                    # Algorithmic indicators for priority and urgency
│   └── FinancialsCalculator.ts                # Cross-currency summation safely ignoring formatting
├── services/                                  # Phase 3: Coordination layer managing state, storage, and logic
│   ├── TenderService.ts                       # Fetching, persisting, and processing Tenders
│   ├── SettingsService.ts                     # Timeline presets validation and storage
│   └── ProjectService.ts                      # Mapping project statuses safely
└── db/ (To hold initial client mockups safely)
```

---

## 3. Detailed Refactoring Breakdown

### A. Domain Model & Composition (Objective 1, 2)
The monolithic `Tender` interface inside `src/data.ts` and `src/views/OngoingTenders.tsx` will be replaced with clean composition:

```typescript
// Proposed src/domain/pre-award/Tender.ts
export interface Tender {
  id: string;
  projectCode: string;
  tenderNumber: string;
  projectName: BilingualString;
  general: GeneralInformation;
  assignments: AssignmentInformation;
  timeline: TimelineInformation;
  financials: FinancialInformation;
  status: StatusInformation;
  checklist: StudyChecklist;
  documents: DocumentRecord[];
  notes: NoteRecord[];
}
```

### B. Decoupled Record & Workflow Statuses (Objective 3)
We separate record lifecycle from study status to prevent state corruption:
*   **RecordStatus**: `ACTIVE`, `ARCHIVED` (for soft deletion or compliance grouping).
*   **WorkflowStatus**: `DRAFT`, `UNDER_STUDY`, `READY_FOR_SUBMISSION`, `SUBMITTED`, `UNDER_NEGOTIATION`, `AWARDED`, `LOST`, `CANCELLED`.

### C. Dynamic Derived Values (Objective 4)
*   **Days Remaining** and **Health Status** are calculated dynamically on-the-fly inside the service layer and selectors. This guarantees that updating offsets or tech dates shifts dates in real-time, eliminating stale saved states.

### D. Avoid Primitive Obsession (Objective 5)
*   Currencies and money are properly structured as Value Objects `Money { amount: number; currency: Currency }` inside `src/domain/pre-award/Common.ts` instead of raw, unvalidated strings containing currency tags like `"AED 50,000"`.
*   Unification of clean string extraction (`parseValue`) to prevent math representation vulnerabilities.

### E. Isolated Business Rules Layer (Objective 6)
*   Moving complex mathematics and date-add loops out of `OngoingTenders.tsx` and into `src/business-rules/`. This reduces the size of view components and isolates functional errors.

---

## 4. Execution Sequence & Order of Impact

The refactoring will be executed in **4 modular phases** to safeguard compilation integrity and enable rapid rollbacks:

```text
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Domain Mapping & value Objects                     │
│ ├─ Define Enums, Composed Interfaces, and Common Value Objects
│ └─ Verify compilation compatibility                         │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Business Rules & Core Calculators                  │
│ ├─ Build date offset functions and value formatters          │
│ └─ Create tests / isolated validator cases                  │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Service Layers & State Aggregators                 │
│ ├─ Build TenderService coordinating memory / localStorage   │
│ └─ Hook SettingsService dynamically into calculators        │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Views Wiring & Validation                         │
│ ├─ Bridge App views to point to the newly refactored models │
│ └─ Build validation suite and compile final SPA target      │
```

---

## 5. Risk Assessment & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Breaking Changes** | High | Maintain structural adapter wrappers in the transitional phase. The newly composed entities will supply immediate mapping getters (e.g., `.daysRemaining`) to maintain backward compatibility with old component files. |
| **Bilingual Label Desynchronization** | Medium | Bilingual keys (`projectName.ar` / `projectName.en`) and `<BiText>` targets remain unmodified. Type definitions strictly require both properties across all inputs. |
| **Vite Compiler Pipeline Failure** | Low | Frequent compilation dry-runs using `compile_applet` after small isolated modules changes. |
| **Loss of LocalDraft Wizard state** | Medium | The schema draft adapter will convert legacy draft states safely to the new composed structure upon initialization. |

---

## 6. Rollback & Disaster Management Strategy

1.  **Strict Semantic Git Commits**: Every phase corresponds to an isolated, compiling commit. If compilation errors arise during wiring, we can revert to the previous step in seconds.
2.  **No Direct File Replacements**: Major views (`OngoingTenders.tsx` and `Dashboard.tsx`) will be modified with small changes rather than being immediately split to avoid breaking reactive states. 
3.  **Parallel Adapter Design Pattern**: Create helper structures that transform old schemas to the new layout dynamically during rendering, preventing page crashes if old attributes are encountered.

---

## 7. Approval of Action

**Are you ready to begin?**  
To kick off the first engineering step, please review this plan and reply with:  
**`Execute Phase 1`**
