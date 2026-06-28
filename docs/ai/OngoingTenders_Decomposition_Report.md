# Feature Decomposition Report: Ongoing Tenders Module Refactoring
**Date**: June 24, 2026  
**Architect**: Lead Frontend Architect (ROWAD Enterprise Platform)  
**Release**: v1.4.0 (Enterprise Foundation Baseline Alignment)

---

## 1. Executive Summary

As the Lead Frontend Architect, a comprehensive **Feature Decomposition** has been completed on the **Ongoing Tenders** (Pre-Award Proposals) module.

Previously, `src/views/OngoingTenders.tsx` was identified as a **God Component** containing approximately **1,976 lines of code** merging state management, complex multi-dimensional filter logic, modal rendering, tabular grids, detail drawing screens, form submittals, and UI/theme styles. This violates the single-responsibility principle (SRP) and threatens the high-maintainability standards of the ROWAD Platform.

The refactoring has **eliminated the God Component** and converted the view into a **lightweight orchestrator page of only 137 lines**, delegating all state orchestration to the `useOngoingTenders` custom hook and UI presentation to 8 atomic, high-fidelity sub-components.

---

## 2. File Size Metrics Comparison

| Metric / File Path | Original State | Refactored State | Status / Change |
| :--- | :--- | :--- | :--- |
| **`src/views/OngoingTenders.tsx`** | 1,976 lines (110.7 KB) | **137 lines** (5.8 KB) | **-93% size reduction** (Stateless Orchestrator) |
| **`src/features/pre-award/ongoing-tenders/hooks/useOngoingTenders.ts`** | *Did not exist* | **333 lines** (11.0 KB) | **New** (State & Filter Hook) |
| **`src/features/pre-award/ongoing-tenders/components/*`** | Pre-existing | Enhanced & Integrated | **100% Decomposed & Fully Isolated** |

---

## 3. Decomposed Feature Sub-components & Responsibilities

The Ongoing Tenders workspace is now completely decomposed into the following single-responsibility modules under `src/features/pre-award/ongoing-tenders/`:

### 3.1. Orchestration Layer (`src/views/OngoingTenders.tsx`)
* **Responsibility**: Loads parent context values (language, lists, settings), bootstraps the state controller hook, and maps dependencies down to visual widgets.
* **Component Size**: **137 lines** (Strictly fits the `< 250 lines` limit).

### 3.2. State Hook Layer (`src/features/pre-award/ongoing-tenders/hooks/useOngoingTenders.ts`)
* **Responsibility**: Enforces separation of concerns by encapsulating:
  * Table row and batch selection state.
  * Search query parameters and multi-dimensional filter criteria (status, record state, geographic location, coordinators, engineers, contract types).
  * Modal visibility triggers for manual drafting wizards and Excel imports.
  * Internal comments and attachments registrations on individual selected tenders.
* **Component Size**: **333 lines** (Enforces separation of concern and UI-decoupling).

### 3.3. Presenter Components (`src/features/pre-award/ongoing-tenders/components/`)
All visual assets are contained within dedicated files keeping each under **200 lines**:

1. **`TenderToolbar.tsx`**: Page header metadata rendering with dual bilingual execution buttons for launching "Import Tender List" or "Create Manual Tender" wizards.
2. **`TenderKPICards.tsx`**: Dynamic executive scorecard widget calculating active studies, overdue boundaries, and upcoming critical actions from filtered datasets.
3. **`TenderFilters.tsx`**: Search field combined with 6 cascading selector dropdowns supporting Arabic and English values.
4. **`TenderActions.tsx`**: Overlay bulk actions drawer (Archive / Export) triggered when items are checkmarked.
5. **`TenderTable.tsx`**: Master tabular grid with column headers, checkboxes, and direct navigation links.
6. **`TenderDetailsDrawer.tsx`**: Detailed horizontal inspection tab panel showing tender overview, allocated staff assignments, progress milestone roadmaps, risk audits, financial indicators (calculating margins and bank guarantees), digital EDMS attachments, and revision logs.
7. **`TenderImportModal.tsx`**: Multi-step file upload simulator supporting drag-and-drop file detection and reconciliation review screens.
8. **`TenderWizardModal.tsx`**: 3-step manual creation form that validates names, calculates bank guarantees (2%), propagates schedule milestones, and saves draft records in browser local state.

---

## 4. Architectural & Maintainability Improvements

1. **Single Responsibility Enforced (SRP)**: View layer contains zero business math, date calculations, or direct state mutations.
2. **Type Safety & Re-export Preservation**: The orchestrator continues to export `Tender` interfaces and `initialTenders` constants, preserving imports inside core modules (e.g. `App.tsx` and `OperationsCenterService.ts`) with zero broken dependencies.
3. **Sub-second Build and Fast-Diagnostic Performance**: The linter compiles with **0.0% warnings or errors** and production compilations build successfully.
4. **Improved Code Density**: By moving rendering blocks out of a single file, different team developers can now safely work on the `TenderTable`, `TenderFilters`, or `TenderWizardModal` in parallel without encountering git merge conflicts.

---

## 5. Preserved Business Rules & Integrity

* **Bidding Bond Standard (BR-PRE-001)**: Retains the exact **2.0%** bank guarantee requirement calculated through the `FinancialsCalculator`.
* **Automatic Timeline Milestone Offset (BR-PRE-002 / BR-PRE-003)**: Preserves standard technical/commercial dates calculation buffers configured by the administration portal settings.
* **Bilingual Arabic/English Toggle Support**: Preserves all localized string dictionaries and directional RTL/LTR styling.
* **Dynamic Health Evaluation**: Consumes `HealthCalculator.calculate()` and `HealthSettings` for non-stale health statuses (Healthy, Due Soon, Overdue).

---

## 6. Future Extension Points

1. **PostgreSQL Relational Storage Transition**: The hooks layer is prepared to swap out synchronous state updates with asynchronous API fetches (`await api.post(...)`) once backend integration begins.
2. **Gemini OCR Document Analysis**: The `TenderImportModal`'s drag-and-drop handler can be connected directly to a server-side route running `@google/genai` to automatically extract RFP metadata fields using Gemini's structured schema output capabilities.
