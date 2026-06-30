# Sprint 3B — Variation Orders Engine Implementation Report

## 1. Executive Summary

Sprint 3B transforms the Variation Orders (VO) module into an enterprise-grade **Commercial Change Management Engine**. In this sprint, we replaced basic CRUD behavior with a dynamic calculation of the project commercial baseline, enforced strict state transitions, and ensured downstream payment claim certificates (IPCs) automatically consume the revised baseline. The engine runs purely inside the business rules/services layer, leaving UI components decoupled from database and math calculations.

---

## 2. Business Rules Implemented

The following business rules were implemented and verified:
1. **State-Safe Lifecycle Transitions:** The state machine enforces progression constraints:
   * `Draft` ➔ `Submitted` ➔ `Under Review` ➔ `Approved` ➔ `Implemented` (or `Rejected`).
   * VOs can transition from `Rejected` back to `Draft` for rework/resubmission.
   * Invalid transitions are blocked at the validator level.
2. **Approved EOT & Cost Impact Constraints:**
   * Time impact (`scheduleImpactDays` and `extensionOfTimeDays`) cannot be negative.
   * `Approved Value` cannot exceed the contractor's `Proposed Value` unless the user explicitly checks the override checkbox.
3. **Mandatory Approval Fields:**
   * Transitioning to `Approved` or `Implemented` status requires providing `Approval Date`, `Approved Amount`, and `Approval Reference`.
4. **Baseline Isolation:**
   * Only VOs in `Approved` or `Implemented` status are aggregated into the Project Commercial Baseline. `Draft`, `Submitted`, `Under Review`, or `Rejected` variation orders do not alter project values.
5. **Addition vs. Omission Sign Handling:**
   * Addition VOs increase the contract value baseline (`+approvedAmount`).
   * Omission VOs act as credits and decrease the contract value baseline (`-approvedAmount`).

---

## 3. Files Modified

| File Path | Change Type | Purpose |
| :--- | :--- | :--- |
| [`src/domain/projects/Project.ts`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/domain/projects/Project.ts) | **MODIFY** | Extended `Project` and `ProjectVariationOrder` interfaces with baseline and approved EOT properties. |
| [`src/validators/VOLifecycleValidator.ts`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/validators/VOLifecycleValidator.ts) | **NEW** | Added new validator to enforce VO state transitions, negative checks, and conditional mandatory fields. |
| [`src/services/CalculationService.ts`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/services/CalculationService.ts) | **MODIFY** | Implemented `calculateProjectChangeBaseline()` to aggregate approved values and EOT days. |
| [`src/services/ProjectLookupService.ts`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/services/ProjectLookupService.ts) | **MODIFY** | Orchestrated baseline recalculation and project persistence inside the service layer on VO save. |
| [`src/features/projects/components/workspace/IPCsPanel.tsx`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/IPCsPanel.tsx) | **MODIFY** | Updated IPC calculations to consume `revisedContractValue` from the Project Commercial Baseline. |
| [`src/features/projects/components/workspace/VOsPanel.tsx`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/VOsPanel.tsx) | **MODIFY** | Expanded VO form with sections for Technical Merits, Client Instruction, Commercial Offer, and Approval Baseline. |
| [`src/features/projects/components/ProjectWorkspace.tsx`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/ProjectWorkspace.tsx) | **MODIFY** | Updated commercial stats rail to show Original vs. Revised Contract Baseline and Approved EOT adjustments. |
| [`CHANGELOG.md`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/CHANGELOG.md) | **MODIFY** | Documented Sprint 3B additions in the release notes. |

---

## 4. Architecture Decisions & Business Invariants

### Business Invariant: Project Commercial Baseline
The platform enforces a strict commercial baseline model divided into three distinct parameters at the `Project` level:
1. **Original Contract Value (`originalContractValue`):** Represents the signed contract value at project award. It is initialized exactly *once* during the first VO baseline calculation (falling back to the project's base `contractValue`). Once set, it becomes **completely immutable** and cannot be modified by any variation orders, IPC claims, or manual recalculations. This guarantees that audit trails can always trace back to the project's initial pricing.
2. **Approved Variation Total (`approvedVoTotal`):** Dynamically aggregated cost variations of Approved/Implemented variation orders (+ for Addition, - for Omission).
3. **Revised Contract Value (`revisedContractValue`):** The calculated final baseline. It is computed as `Original Contract Value + Approved Variation Total` and cannot be entered manually.

All downstream commercial components (IPCs, Claims, Dashboards, and SPR reports) consume `revisedContractValue` as the active contract baseline for their operations (such as calculating retention limits or percent completions), keeping the data pipeline clean and synchronized.

* **Clean Architecture Preserved:** The UI (`VOsPanel.tsx`) contains no mathematical calculations or state machine progression definitions. It delegates validation to `VOLifecycleValidator` and persistence/aggregation to `ProjectLookupService`.
* **Dynamic Re-aggregation:** Instead of using separate caching variables, the Project Commercial Baseline is calculated dynamically on-the-fly inside the service layer whenever a VO is mutated. This avoids database drift and sync issues.
* **Backward Compatibility:** Extended fields in the `Project` interface are optional. If a legacy project has no approved VOs or is not initialized, the baseline defaults to the original `contractValue` with zero EOT days.

---

## 5. Integration with Project Commercial Baseline

```
Variation Order Mutation (Create, Status Edit, Archive, Restore)
                     ↓
      ProjectLookupService.saveVariationOrder(vo)
                     ↓
     CalculationService.calculateProjectChangeBaseline(project, vos)
     • Aggregates Approved / Implemented VOs
     • Signed value addition (+Addition, -Omission)
     • Approved EOT Days summation
                     ↓
          Project Repository Save
     (Updates: originalContractValue, revisedContractValue, approvedVoTotal, approvedEotDays)
                     ↓
        Downstream IPC Calculations
     (Uses: revisedContractValue for retention Cap calculations)
```

---

## 6. Verification Results

* **Type Safety:** `npm run lint` (`tsc --noEmit`) passes with zero errors.
* **Production Build:** `npm run build` succeeds and produces the production bundle in under 7 seconds.
* **Manual Verification:**
  - Verified state transitions (Draft ➔ Submitted ➔ Under Review ➔ Approved). Attempting to transition from Draft directly to Approved without Submitted/Under Review is blocked.
  - Verified that Approved status requires inputting approval date, reference, and amount.
  - Verified that approved values exceeding proposed values are blocked unless the override checkbox is checked.

---

## 7. Regression Results

* **Sprint 3A IPC Engine Intact:** Verified that creating and updating Interim Payment Certificates (IPCs) remains fully operational.
* **Dynamic IPC Baseline Consumption:** Verified that creating a new IPC automatically calculates retention cap limits using the project's revised contract baseline (contract value + approved VOs) instead of the original contract value.

---

## 8. Remaining Known Gaps

* **WBS Relationship Filtering:** VOs currently have an optional `wbsId` field, but WBS scope-value allocations are not yet cross-verified (slated for Sprint 3C under Subcontract/WBS checks).
* **Multi-Currency Aggregation:** VOs are assumed to be in the project's default currency. If the contractor submits an offer in a foreign currency, exchange rate conversion is not yet applied dynamically.

---

## 9. Recommendation for Sprint 3C

* **Sprint 3C Focus:** Implement the NOC permit expiry alert engine and Subcontract validation against project WBS packages.
* **Baseline Alignment:** Ensure subcontract values do not exceed their assigned WBS package baseline, taking into account any approved Variation Orders transferred to that package.
