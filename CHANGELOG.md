# Changelog

All notable changes to the **ROWAD Enterprise Platform** will be documented in this file.

## [1.7.0] - 2026-06-28

### Added
- **Project Workspace Tab Deconstruction**: Extracted complex tab elements from the massive `ProjectWorkspace.tsx` component into their own standalone, single-responsibility views inside `/src/features/projects/components/workspace/`:
  - `SubcontractorsPanel.tsx`: Houses the relational subcontract assignment form, certified subcontractors register selection, and associated contractual attachments.
  - `DocumentsPanel.tsx`: Powers the technical and commercial document registry (Doc Control) with localized status and priority tracking.
  - `AttachmentsPanel.tsx`: Handles the interactive drag-and-drop contract PDF and DWG vault upload system.
- **Relational Repository Binding**: Re-bound all components to use clean, standard database/repository API methods (`getContractors()`, `getScopes()`, `getDocTypes()`) rather than deprecated helpers.

### Fixed
- **Nested Relative Import Paths**: Corrected nested relative folder mapping issues (`../../../../`) in newly extracted sub-components, achieving 100% linter and TypeScript compiler compliance.

## [1.6.0] - 2026-06-25

### Added
- **Milestone-Meeting Separation**: Introduced high-fidelity separation between milestones (deadlines, qualifications, submissions, reviews) and scheduled interactive meetings. Milestones are modeled as date-only events with lighter visual focus, while meetings are scheduled with specific times, durations, formats, and participants, gaining strong visual emphasis.
- **Milestone-to-Meeting Conversion**: Added interactive scheduling and conversion capabilities in the direct command panel. Users can seamlessly schedule, edit, or revert meeting details on any pre-award milestone.
- **Conflict Detection Hardening**: Redesigned the Conflict Detection Engine to exclusively process meetings, workshops, site visits, client visits, and negotiation sessions. Date-only milestones, reminders, and deadlines are automatically ignored by conflict rules.

## [1.5.0] - 2026-06-25

### Added
- **Dynamic Field Simplification (Adaptive Inputs)**: Implemented adaptive layout logic for forms across `TenderWizardModal.tsx`, `OperationsCenterPage.tsx`, `DocumentControl.tsx`, and `ProjectExecution.tsx` to conditionally render form fields matching the active UI language. State synchronizations are handled automatically to programmatically update dual language entries, completely avoiding forced duplicate typing.
- **Dynamic Calendar Polish (Operational Matrix)**: Refactored the calendar monthly heatmap grid to directly consume dynamic event styling themes. The cards display up to two high-fidelity milestone event labels, complete with a clean `+ X more` counter, eliminating bulky placeholders and reducing cognitive load.

### Removed
- **Duplicate Page-Level Language Switchers**: Removed local language switcher toggle buttons (e.g., from `OperationsCenterPage.tsx`) to unify state management around the central top-bar Header switcher.
- **Operations Center Clutter Reduction**: Consolidated tabs by moving advanced PMO analytics, resource workload, and conflict diagnostics behind an extensible configuration feature flag (`SHOW_FUTURE_CAPABILITIES = false` by default for Phase 1).

### Improved
- **AI Command CTA Clarity**: Renamed the generic 'Run' / 'تشغيل' button in the Sparkles AI Command Bar to a more descriptive 'Analyze' / 'تحليل', clarifying its actual analytical capability.

## [1.3.0] - 2026-06-24

### Added
- **Unified Clock Provider**: Developed a centralized `Clock` service in `src/services/Clock.ts` providing standard methods (`now`, `today`, `todayISO`, `parse`, `diffInDays`) as a single source of truth for all application date/time management, supporting deterministic mocking and eliminating raw browser `new Date()` calls.
- **Dynamic Health Evaluation**: Leveraged `HealthCalculator.calculate` in `TenderMapper`, `TenderService`, `Dashboard`, and `OngoingTenders` to make `HealthSettings` the sole source of truth for computing project and tender health.

### Fixed
- **Overdue Threshold Bug**: Resolved the calculation issue where negative remaining days were incorrectly clamped to zero in `TenderService`, which previously made the overdue state unresolvable.
- **Hardcoded Thresholds Removal**: Replaced hardcoded comparisons like `t.daysRemaining <= 7` and status-color styles in `Dashboard.tsx` and `OngoingTenders.tsx` with dynamic checks based on `t.health`.

### Removed (Dead Code Clearance)
- **Dead Hook Deletion**: Cleared five unused/obsolete React hooks (`useTenderActions.ts`, `useTenderFilters.ts`, `useTenderSearch.ts`, `useTenderSelection.ts`, `useTenderSorting.ts`) and deleted their empty parent directory.
- **Redundant Helper Deletion**: Removed the unused duplicate `addDays` helper function inside `OngoingTenders.tsx`.

### Improved
- **Optimized Persistence Pipeline**: Refactored list updater methods in `App.tsx` to execute exactly one operation per change, filtering and committing ONLY the modified or new entities, rather than re-committing the entire unchanged dataset.

## [1.2.0] - 2026-06-24

### Added
- **Architecture Baseline Report v1.0**: Formulated the central `/docs/ai/ARCHITECTURE_BASELINE_v1.0.md` certifying the entire platform framework, including a Service Dependency Matrix, Repository Readiness Report, Business Rules Coverage Report, and Backend Readiness Assessment.
- **Technical Debt Report v2**: Updated structural and security trade-offs, categorizing remaining debts by impact, risk, and recommended solutions.
- **Backend Readiness Specifications**: Prepared structural models, expected database tables, REST API routing, and Pydantic DTO contracts to ensure seamless FastAPI/PostgreSQL pivot integration.

### Verified
- **0.0% Circular Dependencies**: Audited service communications, ensuring complete orchestration segregation.
- **Settings Dynamic Parameterization**: Confirmed that all business rules, timeline offsets, financial parameters, and working calendars are governed dynamically by the Admin Settings panel.

## [1.1.0] - 2026-06-24

### Fixed
- **Priority Mapping Bug**: Resolved an issue in `TenderMapper` where priority was incorrectly mapped to `Priority.LOW` instead of `Priority.MEDIUM` when it was undefined, fixing the assertion error in the lightweight validation test suite.
- **Positive Offset Vulnerability**: Resolved the administrative settings vulnerability by integrating `SettingsValidator.validate` inside `SettingsView` (in `src/views/Settings.tsx`). Now, any configuration with a positive offset is correctly flagged and prevented from updating state.

### Added
- **UI Validation Panel**: Added a modern error alerting container to the Administration tab in `SettingsView` to display validation failures in both English and Arabic dynamically based on the active language.
