# Sprint 3A Commercial IPC Engine Implementation Report
**Category:** Product Core Commercial Modules  
**Release Version:** `v1.3.0` (In Progress)  
**Status:** Implemented, Tested, & Verified  

---

## 1. Executive Summary

In Sprint 3A, the Interim Payment Certificates (IPC) module was transformed from a simple CRUD registration screen into a robust, deterministic **Commercial IPC Engine**. 

Previously, the IPC tab relied on hardcoded client-side estimates (such as setting the Net claimed amount to a flat $90\%$ of the Gross amount) and had no support for consultant certified values, performance retention caps, mobilization advance recovery, or withholding tax calculations. 

The new Commercial IPC Engine integrates these key metrics directly into the core domains, calculates deductions dynamically through `CalculationService` (using settings parameters and the project baseline), verifies constraints using a new `IpcValidator`, and automatically updates payment statuses based on cash collections.

---

## 2. Business Rules Implemented

* **BR-IPC-001 (Dynamic Previous Cumulative Sums):** The engine dynamically sums the certified gross and net values of all prior active, certified IPCs for the project to ensure chronological reconciliation.
* **BR-IPC-002 (Retention Deduction & 5% Cap):** 
  - Standard retention is calculated as: `Certified Gross Value * (Retention Rate / 100)`.
  - Retention withholding is capped at $5\%$ of the total project contract value. Once cumulative previous retention plus the current retention exceeds this cap, the current deduction is automatically reduced to the remaining margin.
* **BR-IPC-003 (Advance Payment Recovery Offset):** Mobilization advance recovery is calculated as: `Certified Gross Value * (Advance Rate / 100)`.
* **BR-IPC-004 (Withholding Tax Deduction):** A standard $1\%$ withholding tax deduction is applied to the gross certified amount.
* **BR-IPC-005 (Net Certified Amount Formula):** The net certified amount is computed as: `Max(0, Certified Gross - Retention Deduction - Advance Recovery - Withholding Tax)`.
* **BR-IPC-006 (Outstanding Balance Formula):** The outstanding amount is calculated as: `Max(0, Net Certified Amount - Total Paid)`.
* **BR-IPC-007 (Auto-Suggest Status):** Status is suggested automatically based on cash collection totals:
  - If `Total Paid == 0`, status suggests `Certified`.
  - If `0 < Total Paid < Net Certified`, status suggests `Partially Paid`.
  - If `Total Paid >= Net Certified` (and `Net Certified > 0`), status suggests `Paid`.
* **BR-IPC-008 (Constraint Validations):** 
  - `Net Certified Amount` can never be negative.
  - `Total Paid` cannot exceed `Net Certified Amount` (validated upon saving).

---

## 3. Files Modified

| File Path | Change Type | Purpose |
| :--- | :--- | :--- |
| [`src/domain/projects/Project.ts`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/domain/projects/Project.ts) | **MODIFY** | Extended `ProjectIPC` interface with certifiedGrossValue, deductions, cumulative values, and net certified fields. |
| [`src/validators/IpcValidator.ts`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/validators/IpcValidator.ts) | **NEW** | Validates IPC input constraints, paid-to-certified limits, and non-negative net certified values. |
| [`src/services/CalculationService.ts`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/services/CalculationService.ts) | **MODIFY** | Added the Commercial Calculations section, including `calculateIpcCommercials` and status suggestion rules. |
| [`src/features/projects/components/workspace/IPCsPanel.tsx`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/IPCsPanel.tsx) | **MODIFY** | Updated input forms, payment log, validation alert banner, and calculation preview cards. |
| [`src/features/projects/components/workspace/ProjectDashboard.tsx`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/ProjectDashboard.tsx) | **MODIFY** | Refined open IPC value calculation to fallback on certified gross value where available. |
| [`CHANGELOG.md`](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/CHANGELOG.md) | **MODIFY** | Documented Sprint 3A features under the `[1.3.0] - Unreleased` tag. |

---

## 4. Architecture Decisions

1. **Calculations Centralization (ADR-011 & Clean Architecture):** 
   All math functions remain strictly outside the UI and repository layers. React components only dispatch state updates and receive values computed by the `CalculationService` class.
2. **Dynamic Cumulative Sums:**
   To guarantee history reconciliation, previous cumulative gross and net totals are computed dynamically by `CalculationService` using the sorted list of existing project IPCs. This prevents database sync drift and avoids storing duplicate/stale summaries.
3. **Validation Separation:**
   Input validations and business constraints are isolated in a pure `IpcValidator` class, ensuring clean testing and keeping the controller service lightweight.

---

## 5. Root Cause Analysis (Previous Gaps Resolved)

* **Gap #40 (Missing retention/recovery fields):** The IPC panel previously lacked UI and data models for storing and displaying retention, advance recovery, and withholding tax deductions. Resolved by extending `ProjectIPC` and displaying these fields dynamically on certification.
* **Gap #48 (Auto-suggest status):** Status changes previously required manual intervention, leading to discrepancies. Resolved by implementing status suggestion logic based on actual received payments.
* **Gap #74 (Financial Formulas not applied):** Flat rates were hardcoded in the frontend. Resolved by pulling rates dynamically from local PMO Enterprise Settings.

---

## 6. Verification Results

1. **TypeScript compilation check (`npm run lint` -> `tsc --noEmit`):**
   * *Status:* **PASS**
   * *Result:* Zero errors or warning logs.
2. **Production Build (`npm run build`):**
   * *Status:* **PASS**
   * *Result:* Bundle generated successfully in 8.39 seconds.
3. **Manual Validation Case:**
   * Input: Gross Claimed = `100,000`, Certified Gross = `80,000`, Project Value = `2,000,000`, Retention rate = `10%`, Advance Recovery rate = `10%`.
   * Computed Values:
     - Previous Gross Cumulative = `0`
     - Previous Net Cumulative = `0`
     - Retention Withheld = `8,000` (within 5% contract cap of 100,000)
     - Advance Recovery = `8,000`
     - Withholding Tax (1%) = `800`
     - Net Certified Amount = `63,200`
     - Outstanding Balance = `63,200` (Status: `Certified`)
   * Received payment of `30,000` -> Outstanding = `33,200` (Status suggested: `Partially Paid`).
   * Received payment of `33,200` -> Outstanding = `0` (Status suggested: `Paid`).
   * *Result:* **PASS**

---

## 7. Regression Results

* **Tender Bidding Drawer:** Unaffected.
* **Project Dashboard KPIs:** Verified that "Open IPC Value" calculates gross values correctly.
* **History Log & Audit Trail:** Verified that saving or editing an IPC logs the correct transaction value and net certificate totals in `ProjectHistory`.
* **State Machine Integrity:** Terminal locked status (`Paid`) operates correctly; paid IPCs cannot be archived.

---

## 8. Remaining Known Gaps

* **Variation Orders Sync:** While VOs are modeled to revise the project contract value, the current local repository does not automatically propagate approved VO totals to the parent project's `contractValue`. This will be addressed in Sprint 3B.

---

## 9. Recommendation for Sprint 3B

* **Objective:** Implement **Sprint 3B — Variation Orders**.
* **Key Tasks:**
  - Build `VoLifecycleValidator` to manage VO approvals.
  - Implement `ProjectLookupService.saveVariationOrder()` extensions that dynamically revise `project.contractValue` and project target timelines upon VO approval.
  - Re-verify that subsequent IPC calculations automatically absorb the newly revised contract value.
