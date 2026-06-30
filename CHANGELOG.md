# Changelog

All notable changes to the **ROWAD Enterprise Platform** will be documented in this file.

## [1.3.1] - 2026-06-30

Development Sprint: Sprint 3.0.1 — Hotfix (completes remaining Sprint 3 scope + fixes Release Blockers found by the v1.3.0 RC1 Live QA Audit, `ROWAD-Enterprise-QA-Report-2026-06-29.md`). Architecture, business rules, and ADRs remained frozen; no new entities, repositories, or modules.

### Fixed (Critical — Release Blockers)
- **BUG-IPC-001 — PAID IPC with zero financials**: `IpcValidator` now requires `certifiedGrossValue` to be strictly greater than zero (not just non-negative) once an IPC reaches `Certified`/`Partially Paid`/`Paid` status, preventing a certificate from being saved as fully paid with no certified value, retention, recovery, or payment recorded. Traced the existing corrupted record (`IPC-EASTOWN-14`) to incomplete seed data predating the Sprint 3A commercial fields — backfilled `certifiedGrossValue`, `retentionDeduction`, `advanceRecovery`, `withholdingTax`, `netCertifiedAmount`, and a matching `Payment` record consistent with the existing seed remarks ("net of standard retention and advance recovery").
- **BUG-IPC-002 — Net > Gross accepted**: `IpcValidator` now rejects `invoiceNetValue > invoiceGrossValue`, and (defensively) `netCertifiedAmount > certifiedGrossValue` once certified.
- **BUG-IPC-003 — Payment > Net Certified accepted**: Removed the `&& netCertified > 0` exception in `IpcValidator`'s payment-cap check — an IPC with no certified value can no longer accept any payment. Added an inline check in `IPCsPanel.handleAddPayment` so this is caught immediately when the payment is recorded, not only at final IPC save.
- **BUG-IPC-005 — IPC form missing Retention/Advance Recovery/WHT fields**: These fields were already implemented in `CalculationService`/`IpcValidator` since Sprint 3A but were rendered conditionally (only once status was Certified/Partially Paid/Paid). A brand-new IPC defaults to `Draft`, so the fields were invisible exactly as the audit observed. The "Consultant Certification & Deductions" block is now always visible in the IPC form; required-ness is still enforced by `IpcValidator` only once the record reaches a certified-stage status.

### Fixed (Major)
- **BUG-NOC-001 — Expiry Date before Application Date accepted**: `NOCsPanel` now validates Expiry Date > Application Date at save time, with an inline field-level error shown directly under the Expiry Date input (red border + message), blocking save until corrected.
- **BUG-SUB-002 — Outstanding Commitment not displayed**: Added an "Outstanding Commitment" line (`Total Subcontract Amount − Till Date Invoiced`) to the subcontract card in `SubcontractorsPanel`, computed as a derived display value (not a new stored field).
- **BUG-IPC-004 / BUG-SUB-004 — "Missing" delete confirmation dialogs**: These were not missing — `window.confirm()` / `window.prompt()` calls already existed, but native browser dialogs block the JS thread and are invisible to the Live QA browser-automation tooling, which is why they read as absent. Resolved by Phase 5 below (in-system dialogs are fully visible to automation and assistive tech).

### Added (Infrastructure — Shared UI Dialog System)
- New `src/components/ui/` module:
  - `DialogProvider.tsx` — Context provider + `useDialog()` hook exposing Promise-based `alert()`, `confirm()`, `promptText()`, and `toast()`.
  - `AlertDialog.tsx`, `ConfirmDialog.tsx` (doubles as the prompt-replacement input mode), `Toast.tsx`, `FieldValidation.tsx`.
- Mounted `<DialogProvider>` at the application root (`main.tsx`), wrapping `<App />`.
- Replaced **every** `window.alert()`, `window.confirm()`, and `window.prompt()` call across the codebase — 14 files, ~58 call sites: `IPCsPanel`, `NOCsPanel`, `VOsPanel`, `ClaimsPanel`, `MeetingsPanel`, `SubcontractorsPanel`, `DocumentsPanel`, `WBSManager`, `ContextualAttachmentsList`, `AttachmentsPanel`, `ProjectWorkspace`, `ProjectList`, `Settings`, `DocumentControl` — with the in-system equivalents. Archive-reason prompts now validate "required" inline inside the dialog itself instead of via a follow-up alert.

### Changed (UI Clarification)
- **BUG-SUB-001 re-classified**: The reported "Progress = 0%" defect is not a calculation bug — the "Progress" badge on the subcontract card reads `completionPercentage`, a manually-entered field, not a value derived from `tillDateInvoicedAmount / totalSubcontractAmount`. Renamed the badge label to "Physical Progress" (bilingual) to remove the ambiguity. No calculation changed; a derived "Financial Progress" metric was explicitly scoped out of this hotfix.

### Verified / Re-checked, Not Changed
- **BUG-NOC-002 — "No archive button"**: Re-inspected `NOCsPanel`; the Archive button and `handleArchive` handler already exist and are wired correctly. Flagged for re-verification in the next Live QA pass rather than re-implemented blind.
- **BUG-VO-001 — VO status dropdown shows all options**: Confirmed and left as-is — UX-only, backend state-machine enforcement (`VOLifecycleValidator`) already blocks illegal transitions server-side. Deferred to Sprint 6 (Enterprise UX Polish).

### Deferred (Future Sprint Recommendations)
- Subcontract Administration module expansion (Registry / Contract Reviews / Timeline / Budget / Correspondence) — candidate for Sprint 4, pending a scoping decision against the existing Correspondence forward-compatibility module (`CLAUDE.md` ch. 12) to avoid duplicate entities/modules.
- Derived "Financial Progress" metric for subcontracts.
- BUG-NOC-003 (auto-expire NOC status) — Minor, not in this hotfix's approved task list.

## [1.3.0] - 2026-06-30

Development Sprints:
- Sprint 3 - Commercial Modules (IPC + VO + NOC + Subcontracts)
- Sprint 3E - Commercial Domain Consolidation
- QA Gate (v1.3.0 RC1)

### Fixed (QA Gate v1.3.0 RC1)
- **FIX-QA-001 — `revisedContractValue` stale on Project edit** (`AddProject.tsx`): When editing an existing project and changing the `signedContractValue`, the `revisedContractValue` was preserved from the entity's old stored value instead of being recalculated. This has been corrected to always compute `signedContractValue + (approvedVariationTotal ?? 0)`, ensuring the commercial baseline remains consistent with the business rule across all downstream consumers (IPCsPanel, SubcontractorsPanel, SPR engine).

### Added (Sprint 3E - Commercial Domain Consolidation)
- **Domain Baseline Consolidation**: Renamed legacy `contractValue` to `signedContractValue`, deleted redundant `originalContractValue`, and renamed `approvedVoTotal` to `approvedVariationTotal` to clean up the Project Aggregate commercial model.
- **Decoupled Versioned Migration Runner**: Created a schema-upgrade bootstrapper (`MigrationRunner` and `Migration_001_ProjectCommercialBaseline`) to safely map legacy local storage records during startup, keeping repositories purely CRUD.
- **Acyclic Baseline Calculation Flow**: Refactored `CalculationService.calculateProjectChangeBaseline` to establish `signedContractValue` immutability, calculate `approvedVariationTotal`, and update `revisedContractValue`. All downstream modules (IPCs, Subcontracts, Claims, NOCs, SPR) read this baseline but never modify it.

### Added (Sprint 3D - Single Paper Report Completion)
- **Dynamic SPR Live Aggregation**: Connected the Monthly Executive SPR read model directly to active operational transactions, calculating cumulative IPC certified/paid totals, outstanding balances, subcontractor commitments/invoicing, claims costs/EOT, and regulatory NOC counts.
- **SPR UI Sections**: Added "Cumulative Project Commitments" and "Government Permitting" sections to the generated report template.

### Added (Sprint 3C - NOC & Subcontracts Module)
- **NOC Permit Expiry Banners**: Integrated real-time expiry checking into `NOCsPanel` to warn of expired and expiring approved permits in both English and Arabic.
- **NOC Contextual Attachments**: Embedded file metadata upload lists directly inside the NOC form view.
- **Subcontracts Filter & Search**: Added search bar, WBS package filter dropdowns, and delete capabilities in `SubcontractorsPanel`.
- **Subcontract Budget Overrun Enforcement**: Validated subcontractor total commitment values against the project's revised contract baseline to prevent portfolio overspending.

### Added (Sprint 3B - Variation Orders Engine)
- **Dynamic Baseline Calculator**: Added `calculateProjectChangeBaseline` to `CalculationService` to compute contract variations (additions and omissions), EOT adjustments, and revised contract totals dynamically based on approved VOs.
- **Automated Baseline Sync**: Extended `ProjectLookupService.saveVariationOrder()` to automatically recalculate and persist the updated Project Commercial Baseline (`originalContractValue`, `revisedContractValue`, `approvedVoTotal`, and `approvedEotDays`) on every VO mutation (create, status change, archive, restore).
- **State-Safe VO Validator**: Created `VOLifecycleValidator` to validate state transitions (`Draft` -> `Submitted` -> `Under Review` -> `Approved` -> `Implemented` or `Rejected`), block negative time impacts, and mandate approval references, dates, and amounts before transitioning to Approved/Implemented status.
- **Downstream IPC Integration**: Integrated revised contract values directly into the IPC calculation pipeline so subsequent certified progress claims automatically consume the latest project commercial baseline.
- **Expanded VO Workspace Form**: Updated `VOsPanel` to support full data entry for technical description (addition/omission/transfer type, detail description, merits), employer instruction (EI/AI/VO type, instruction date, reference), contractor commercial offer (proposed cost/EOT impact, RFV ref, offer date, submission status), and approved baseline details (approval reference, date, amount, approved EOT, and override checkbox).
- **Dynamic Card Listing**: Replaced hardcoded currency in the VO card registry with the dynamic project currency from the master project record.

### Added (Sprint 3A - Commercial IPC Engine)
- **Advanced Commercial IPC Engine Fields**: Extended the `ProjectIPC` domain interface with certified gross value, retention deduction, advance recovery, withholding tax, net certified amount, previous gross cumulative, and previous net cumulative.
- **Dynamic Commercial Calculator**: Added `calculateIpcCommercials` to `CalculationService` to compute certificate-level deductions, advance recovery, and tax withholding dynamically using project contract baselines and settings.
- **Auto-Suggest Payment Status**: Integrated status suggestion logic that automatically updates the certificate status to `Certified`, `Partially Paid`, or `Paid` based on actual cash receipts.
- **Unified IPC Validator**: Created `IpcValidator` to validate input constraints, ensuring net amounts are non-negative, payment logs do not exceed net certified values, and required fields are populated.
- **Interactive UI Fields**: Exposed consultant certification and dynamic deduction tables in `IPCsPanel` to provide full real-time calculation previews during creation and editing.

## [1.2.0] - 2026-06-30

Development Sprint:
Sprint 2 - Tender & Award

### Added (Sprint 2 - Tender Award Workflow)
- **Tender Award Wizard**: Replaced the previous architecture-extension placeholder with a confirmation workflow that awards eligible tenders and converts them into linked Project records.
- **Tender-to-Project Conversion Service**: Added `TenderAwardService` to orchestrate Tender validation, Project creation, tender status update, document transfer, business-event logging, and Project history transfer through existing repositories.
- **Bidirectional Award Relationship**: Added optional relationship metadata (`awardedProjectId`, `awardedAt`, `sourceTenderId`, `sourceTenderNumber`) so awarded Tenders and generated Projects can reference each other without breaking existing records.
- **Award Read-Only Lock**: Awarded tenders now disable document, note, assignment, milestone, and repeat-award edits in the inspection drawer.

### Added (Sprint 2 - Claims Lifecycle Completion)
- **`ClaimStatus` Domain Type**: Introduced a strongly-typed union (`Prepared | Submitted | Under Review | Negotiation | Counter Proposal | Approved | Rejected | Disputed`) for `ProjectClaim.status`, replacing `string` with compile-time safety.
- **`ClaimLifecycleValidator`** extracted into `src/business-rules/ClaimLifecycleValidator.ts` as a pure business-rules class, removing the state machine from the UI layer and preserving DDD boundaries.
- **Full Claim Lifecycle Enforced**: Claims now support the complete lifecycle progression: Prepared → Submitted → Under Review → Negotiation → Counter Proposal → terminal states (Approved / Rejected / Disputed). Transitions are validated by the business rules layer.

### Added (Sprint 2 - Tender Financial Review Step)
- **Wizard Step 4 Transformed**: Renamed from "Financial" to "Financial Review" and converted from an empty data-entry screen to a read-only financial analysis dashboard showing estimated value, estimated cost, calculated margin, margin %, bid bond preview, and future-ready bonds (performance bond, advance payment, retention).
- **Financial Notes Field**: Added a free-text notes field in Step 4 for financial analysis remarks.
- **QA Finding #10 Resolved**: Step 4 is no longer mislabeled — its content now matches its name.
- **QA Finding #11 Resolved**: The Financial step now displays actual financial calculations derived from existing WizardForm state and Enterprise Settings, without relocating any Step 1 fields.

### Added (Sprint 2 - Tender Lifecycle Full State Machine)
- **`TenderLifecycleValidator`** in `src/business-rules/TenderLifecycleValidator.ts`: Pure business-rules class enforcing the complete Tender state machine: Draft → Under Study → Ready for Submission → Submitted → Under Negotiation → Awarded (→ terminal). Lost / Cancelled allowed from any pre-award state. Extracted from the UI layer per DDD boundaries.
- **Status Transition Service**: Added `TenderService.transitionTenderStatus()` and `TenderService.getStatusLabels()` to persist workflow status changes, update bilingual display labels, and log BusinessEvents.
- **Status Transition UI**: Replaced the read-only Pre-Award State display in `TenderOverviewTab` with a dropdown of allowed next states when transitions are available. Disabled for read-only (awarded) tenders and terminal states.
- **`workflowStatus` Field**: Added `WorkflowStatus` enum field to UI `Tender` type and `LegacyTender` interface for type-safe state machine tracking, populated correctly in seed data and mapper output.

### Fixed (Sprint 2)
- **`ProjectDashboard.tsx` type safety**: Changed `claims.some(c => c.status === 'Escalated')` to `'Disputed'` to match the new `ClaimStatus` union type, resolving a TS2367 comparison error.

### Fixed (Sprint 2 Finalization — Pre-Exit Cleanup)
- **D-002 — `ProjectDashboard.tsx` null crash**: Changed `v.commercialOffer.amount` to `v.commercialOffer?.amount ?? 0` in the pending VOs KPI calculation. `commercialOffer` is optional on `ProjectVariationOrder`; accessing `.amount` directly caused a runtime crash when any VO had no commercial offer set.
- **D-001 — Removed unused imports (`ProjectDashboard.tsx`)**: Removed 13 unused Lucide icon imports (`Building2`, `Users`, `Calendar`, `Pickaxe`, `Award`, `Receipt`, `AlertTriangle`, `PenTool`, `HelpCircle`, `Link`, `CheckCircle2`, `AlertCircle`, `FileSpreadsheet`) and the unused `BiText` import.
- **D-001 — Removed unused imports (`useOngoingTenders.ts`)**: Removed `HealthCalculator` and `HealthStatus` imports that were included but never called in the hook body. Also removed the unreferenced `eventRepo` variable declaration in `handleStatusTransition`.
- **D-003 — Documented Award path decision (`TenderAwardService.ts`)**: Added inline architectural comment explaining why `awardLegacyTender()` sets `workflowStatus` directly rather than routing through `transitionTenderStatus()` — prevents stale-repo-read during award and duplicate BusinessEvent logging. The canonical Award path and validator enforcement are documented at the call site.
- **D-005 — Corrected `ROADMAP_STATUS.md` verification row**: Sprint 2 Verification row updated to `✅ Completed` after git commit, tagging `v1.2.0`, and push were finalized.

## [1.1.0] - 2026-06-30
- **SPR Runtime Stability**: Resolved the root cause of monthly report rendering crashes in `SprReportingEngine.tsx` by implementing complete null-safety and type-safety checks inside monthly data compilation filters.
- **Tender Wizard Validation**: Added strict step-by-step validator logic inside `TenderWizardModal.tsx` to prevent bypassing General step required fields and Step 3 submission dates.
- **Subcontractor Calculation Decoupling**: Decoupled subcontractor total subcontract amount, till date invoiced amount, and completion percentage in `SubcontractorsPanel.tsx` to prevent silent overrides and preserve user inputs exactly.
- **WBS Dropdown Empty Warning**: Documented WBS limitation by rendering a warning message when a project has no WBS packages defined.
- **Real-Time State Synchronization**: Bound `onRefresh` prop callbacks from `ProjectWorkspace.tsx` to child panels (`IPCsPanel`, `MeetingsPanel`, `ClaimsPanel`, `VOsPanel`, `NOCsPanel`), ensuring immediate page-wide React state updates upon successful repository changes.
- **Dashboard active counts sync**: Propagated active tenders count dynamically from `App.tsx` state to update the `Sidebar` navigation badge and dashboard widgets instantly.

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
