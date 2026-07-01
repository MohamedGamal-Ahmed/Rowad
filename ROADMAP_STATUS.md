# ROWAD Enterprise Platform — Roadmap Execution Status

> Live tracker of where the project actually is. Update at every Sprint Exit (and when a blocker / open decision / risk changes).
> Source of truth for Sprint scope: `Sprint.md`. Source of truth for architecture rules: `CLAUDE.md`.

---

## Snapshot

| Field | Value |
|-------|-------|
| **Current Product Version** | `v1.5.0` |
| **Current Development Sprint** | Sprint 5 — Execution Commercial Modules & Control (starting) |
| **Last Completed Product Version** | `v1.5.0` |
| **Last Completed Development Sprint** | Sprint 4A — Project Setup & Activation Foundation & Stabilization |
| **Latest Git Tag** | `v1.5.0` |
| **Last Updated** | 2026-07-01 |

---

## Sprint Status

| Sprint | Name | Status | Progress | Tag |
|--------|------|--------|----------|-----|
| Sprint 0 | Project Governance & Architecture Foundation | ✅ Completed | 100% | — |
| Sprint 1 | Production Stabilization | ✅ Completed | 100% | `v1.1.0` |
| Sprint 2 | Tender & Award | ✅ Completed | 100% | `v1.2.0` |
| Sprint 3 | Commercial Modules (IPC + VO + NOC + Subcontracts + SPR completion) | ✅ Completed | 100% | `v1.3.0` |
| Sprint 3E | Commercial Domain Consolidation | ✅ Completed | 100% | `v1.3.0` |
| Sprint 3.0.1 | Hotfix (Sprint 3 RC1 Release Blockers) | ✅ Completed | 100% | `v1.3.1` |
| Sprint 4 | Enterprise System Settings & Policies | ✅ Completed | 100% | `v1.5.0` |
| Sprint 5 | Execution Commercial Modules & Control (IPC, VO, Claims, NOC, Subcontracts, Progress Tracking, EVM) | 🟡 In Progress | 0% | _pending v2.0.0_ |
| Sprint 6 | Security & RBAC Foundation | ⏳ Planned | 0% | _pending v2.1.0_ |
| Sprint 7 | Enterprise UX Polish | ⏳ Planned | 0% | _pending v2.2.0_ |
| Sprint 8 | Backend Preparation (triggers Architecture Freeze) | ⏳ Planned | 0% | _pending v2.3.0_ |
| Sprint 9 | Backend Core | ⏳ Planned | 0% | _pending v3.0.0_ |
| Sprint 10 | Production Infrastructure & File Integrations | ⏳ Planned | 0% | _pending v3.1.0_ |
| Sprint 11 | Data Migration (Pilot → Full) | ⏳ Planned | 0% | _pending v3.2.0_ |
| Sprint 12 | Go Live (with Rollback Plan) | ⏳ Planned | 0% | _pending v4.0.0_ |
| Phase 2 | AI → OCR → Notifications → Workflow → Power BI → Mobile → M365 | ⏳ Future | 0% | — |

Legend: ✅ Completed · 🟡 In Progress · ⏳ Planned · 🔴 Blocked

---

## Sprint 1 — Completed Work Breakdown

| # | QA Finding / Task | Bucket | Status | Notes |
|---|------------------|--------|--------|-------|
| 1 | F#63 — SPR crash (null-safety) | Runtime + SPR Runtime | ✅ Completed | Fully resolved dates check null-safety |
| 2 | F#61 — Subcontractor "Total Invoiced" wrong value | Financial Calc | ✅ Completed | Decoupled fields to preserve inputs |
| 3 | F#20 — Tender Wizard Step 3 date validation bypass | Tender Validation | ✅ Completed | Implemented isStepValid validator check |
| 4 | F#18/19 + F#15/16 — Dashboard KPIs & sidebar badges real-time | Dashboard Sync | ✅ Completed | Integrated dynamic badge and state callbacks |
| 5 | F#59 — WBS dropdown empty in Subcontractor form | CRUD Stability | ✅ Completed | Documented limitation with dropdown helper warn |
| 6 | F#10 — Tender Wizard "Financial" tab mislabel | CRUD Stability | ⏳ Deferred | Scope deferred to Sprint 6 (UX Polish) |
| 7 | F#37/44 — "VIEW" panel ambiguity (editable look, no Save) | CRUD Stability | ⏳ Deferred | Scope deferred to Sprint 6 (UX Polish) |
| 8 | F#39 + F#45 — Search count + IPC number formatting | CRUD Stability | ⏳ Deferred | Scope deferred to Sprint 6 (UX Polish) |
| 9 | Sprint 1 Verification (lint / build / regression / report) | Exit | ✅ Completed | Passed all verification and exit tests |

---

## Sprint 2 — Completed Work Breakdown

| # | QA Finding / Task | Bucket | Status | Notes |
|---|------------------|--------|--------|-------|
| 1 | F#25 — Tender → Project Award workflow | Award Process | ✅ Completed | `TenderAwardService`, Award wizard UI, bidirectional relationship, read-only lock, doc/history transfer |
| 2 | F#49 — Claims lifecycle stuck at "Prepared" | Claims Lifecycle | ✅ Completed | `ClaimStatus` union type, `ClaimLifecycleValidator` in business-rules, 8-state lifecycle with terminal blocking |
| 3 | F#10/#11 — Tender Financial step empty/mislabeled | Tender Financial | ✅ Completed | Step 4 renamed to "Financial Review", read-only financial analysis computed from WizardForm state + Settings |
| 4 | Tender Lifecycle Full State Machine | Tender Lifecycle | ✅ Completed | `TenderLifecycleValidator`, `TenderService.transitionTenderStatus()`, UI dropdown, BusinessEvent logging, seed data updated |
| 5 | Sprint 2 Verification (lint / build / regression / report) | Exit | ✅ Completed | Passed all verification and exit tests. Committed and tagged `v1.2.0`. |

## Sprint 3.0.1 — Hotfix Work Breakdown

| # | QA Finding / Task | Bucket | Status | Notes |
|---|------------------|--------|--------|-------|
| 1 | BUG-IPC-005 — IPC form missing Retention/Recovery/WHT | Phase 1 (Sprint 3 scope completion) | ✅ Completed | Fields already existed in `CalculationService`; were gated behind status. Now always visible. |
| 2 | BUG-IPC-002 — Net > Gross accepted | Phase 2 (Critical) | ✅ Completed | `IpcValidator`: invoiceNetValue ≤ invoiceGrossValue; netCertifiedAmount ≤ certifiedGrossValue |
| 3 | BUG-IPC-003 — Payment > Net Certified accepted | Phase 2 (Critical) | ✅ Completed | Removed `netCertified > 0` exception; added inline check at payment-entry time |
| 4 | BUG-IPC-001 — PAID IPC with zero financials | Phase 2 (Critical) | ✅ Completed | Validator now requires certifiedGrossValue > 0 at certified-stage; backfilled corrupted seed record `ipc-2` |
| 5 | BUG-SUB-002 — Outstanding Commitment missing | Phase 3 | ✅ Completed | Derived display value added to `SubcontractorsPanel` card |
| 6 | BUG-NOC-001 — Expiry before Application date accepted | Phase 4 | ✅ Completed | Inline field-level validation in `NOCsPanel` |
| 7 | BUG-IPC-004 / BUG-SUB-004 — "Missing" confirmation dialogs | Phase 5 (Infra) | ✅ Completed | Root cause was native `window.confirm()`/`prompt()` invisible to QA automation, not missing logic. Shared Dialog System built and rolled out to all 14 affected files. |
| 8 | BUG-SUB-001 — "Progress = 0%" | Phase 6 | ✅ Completed (re-classified) | Not a calc bug — `completionPercentage` is manual input, not derived. Label renamed to "Physical Progress". |
| 9 | BUG-NOC-002 — No archive button | Re-checked | ✅ Verified already implemented | `handleArchive` + Archive button already present in `NOCsPanel`; not a code change. |
| 10 | BUG-VO-001 — VO status dropdown shows all options | Deferred | ⏳ Deferred to Sprint 6 | UX-only; backend `VOLifecycleValidator` already blocks illegal transitions. |
| 11 | Automated lint/build/regression verification | Exit | ✅ Completed | Passed all verification and exit tests. Committed and tagged `v1.3.1`. |

## Sprint 4 — Phase 4A Work Breakdown

| # | Task / Requirement | Bucket | Status | Notes |
|---|--------------------|--------|--------|-------|
| 1 | Phase 4A.1 — ProjectOffice & Setup Draft Domain Model | Domain Layer | ✅ Completed | Interfaces defined in `Project.ts`, Migration_002 created and registered in MigrationRunner.ts. |
| 2 | Phase 4A.2 — ProjectSetupService implementation | Service Layer | ✅ Completed | Lazy draft instantiation, step validations, and state consolidation implemented. TenderAwardService refactored. |
| 3 | Phase 4A.3 — Project Setup Wizard UI | UI Layer | ✅ Completed | 5-step ProjectSetupWizard developed, with auto-save, resumable drafts, and Activation Gate checks. |
| 4 | Phase 4A.3 — Workspace tab locked permissions | UI Layer | ✅ Completed | Lifecycle-based locks integrated into `ProjectWorkspace.tsx` preventing access to commercial features. |
| 5 | Phase 4A Verification (Type Check & build check) | Exit | ✅ Completed | Compiles successfully (`npm run lint` clean) and builds successfully (`npm run build` succeeds). |

## Sprint 4 — Phase 4A.1 Work Breakdown (Stabilization & UX Refinement)

| # | Task / Requirement | Bucket | Status | Notes |
|---|--------------------|--------|--------|-------|
| 1 | BUG-001 — ProjectSetupWizard white screen (P0) | Critical Bug | ✅ Completed | Root cause: `ProjectSetupDraft` never declared `completedSteps`. Added to domain model + service-level normalization for already-persisted drafts + component guard. |
| 2 | BUG-003 — No Error Boundary around Setup Wizard | Critical Bug | ✅ Completed | New reusable `src/components/ErrorBoundary.tsx`, wrapped around `<ProjectSetupWizard>`. |
| 3 | "Go to Project Setup" navigation dead state | Navigation | ✅ Verified — no defect | `setActiveTab('setup')` was already correct; the white screen was entirely BUG-001, not a routing issue. |
| 4 | Award Dialog overlay/scroll/z-index | UI Bug | ✅ Completed | Root cause: dialog was `position: fixed` nested inside an `animate-in`/`transform` ancestor, which creates a new CSS containing block and breaks `fixed` positioning. New portal-based `src/components/ui/Modal.tsx` (body scroll lock, sticky header/footer) fixes this at the root cause. |
| 5 | Award Attachments "disappearing" | Data/UX Bug | ✅ Completed | `project.awardAttachments` was set but never read anywhere. New `TenderAwardService.transferAwardAttachments()` migrates them into the canonical `ProjectAttachment` store (single source, no duplication) and they now render in a new "Award Documents" section in `DocumentsPanel.tsx`. Per-file category selection added to the Award Wizard (Letter of Award / Signed Contract / Award Minutes / Clarifications). |
| 6 | Award Validation UX (inline, real-time) | UX | ✅ Verified — already correct | `AwardConfirmationValidator` already runs on every keystroke and disables Confirm while invalid; QA scored this 8/10 already. No change needed. |
| 7 | Project Setup Center redesign (modular cards) | UX Redesign | ✅ Completed | Linear 5-step ribbon replaced with independent Commercial/Schedule/Project Office/Documents cards (status, live progress %, validation state) + 3 non-blocking Advisory placeholder cards (Calendars, Approvals, Notifications). |
| 8 | 3-tier validation strategy (Hard/Activation/Advisory) | Architecture | ✅ Verified — already correct | Hard = `AwardConfirmationValidator` (blocks Award only). Activation = the four `*Handler.validate()` classes in `ProjectSetupService` (blocks Activation only). Advisory = warnings (e.g. Project Office headcount) that never block. No structural change needed, already correctly separated. |
| 9 | Activation never blocks Project Creation | Architecture | ✅ Verified — already correct | `TenderAwardService` creates the Project unconditionally on Award; only the explicit `activateProject()` action is gated by `ProjectActivationPolicy`. |
| 10 | Activation Readiness Dashboard (per-section bars) | UX | ✅ Completed | Replaced the single percentage with per-section progress bars (Commercial/Schedule/Office/Documents) + overall %, now always visible instead of gated behind a step. |
| 11 | Lifecycle vs Workflow vs Status separation | Documentation | ✅ Completed | `docs/adr/ADR-014-lifecycle-workflow-status-separation.md` — confirms no overlap; formalizes an already-correct design. |
| 12 | Phase 4A.1 Verification (Type Check & build check) | Exit | ✅ Completed | Verification passed successfully: `npm run lint` type-checks cleanly (aside from pre-existing base errors), and `npm run build` succeeds. |
| 13 | Project Setup Hydration Regression | Setup Hydration | ✅ Completed | Hydrated the setup draft from active aggregate fields when reopening Setup after activation. |

## Current Blockers

* None.

---

## Open Decisions

| ID | Topic | Notes | Owner |
|----|-------|-------|-------|
| OD-001 | Document Control sub-modules (#71 — Transmittals Hub, Incoming/Outgoing Letters, Revision History, Makers Approval) currently placed in Phase 2. Does the business need them earlier? If yes, candidate Sprint between 3 and 4. | New features, not bug fixes — Phase 2 by default. | CTO |
| OD-002 | Tender → Project (Finding #25) Award workflow scope — implemented as an in-drawer Award confirmation wizard backed by `TenderAwardService`; broader Claims and Tender Financial completion remain separate Sprint 2 items. | Resolved. Claims lifecycle (F#49) and Tender Financial Step (F#11) completed in subsequent Sprint 2 work. | CTO |
| OD-003 | Backfill foundational ADRs (ADR-001 to ADR-008 listed in CLAUDE.md ch. 15) — schedule a dedicated documentation slot or backfill incrementally as each topic is touched? | Currently captured informally in CLAUDE.md + PROJECT_BOOK.md. | CTO |

---

## Project Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-001 | Sprint 10 Data Migration underestimated; real Excel data quality may surface late | High | High | Pilot Migration sub-phase already baked into Sprint 10 plan; allocate buffer; start data cleansing rules during Sprint 7 |
| R-002 | LocalStorage repositories diverge from future API repositories; Sprint 8 swap-in becomes painful | Medium | High | Enforce repository interface discipline now; verify interfaces before any new repo work in Sprint 7 |
| R-003 | Architecture Freeze gets violated under deadline pressure | Medium | High | Freeze Policy documented; CTO approval required for breaking changes after Sprint 7 |
| R-004 | SPR ErrorBoundary fix in Sprint 1 masks deeper data-shape issues that should surface in Sprint 3 SPR completion | Medium | Medium | Log every caught error in Sprint 1's ErrorBoundary; review the log during Sprint 3 SPR work |
| R-005 | Performance Baseline (Sprint 8) skipped under delivery pressure → Hypercare can't detect regressions | Medium | High | Treat Performance Baseline as a hard Sprint 8 Exit Criterion, not a "nice to have" |
| R-006 | Rollback Plan (Sprint 11) rehearsal skipped → real rollback fails on first need | Low | Catastrophic | Hard requirement: no cutover without a successful rehearsal recorded |

---

## How to Update This File

At every Sprint Exit:
1. Move the closed Sprint to ✅ Completed, 100%, set its Git Tag.
2. Move the next Sprint to 🟡 In Progress, 0%.
3. Update Snapshot (Current Version, Last Completed Sprint, Active Sprint, Last Git Tag, Last Updated).
4. Clear resolved Blockers; add any new ones.
5. Resolve / re-state Open Decisions touched by the Sprint.
6. Add / re-rate Risks based on what the Sprint revealed.
7. Commit with message `docs(roadmap): close Sprint N — <Sprint Name>`.

Mid-Sprint updates are encouraged when Progress %, Blockers, or Risks meaningfully change.
