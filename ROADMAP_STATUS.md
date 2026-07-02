# ROWAD Enterprise Platform — Roadmap Execution Status

> Live tracker of where the project actually is. Update at every Sprint Exit (and when a blocker / open decision / risk changes).
> Source of truth for Sprint scope: `Sprint.md`. Source of truth for architecture rules: `CLAUDE.md`.

---

## Snapshot

| Field | Value |
|-------|-------|
| **Current Product Version** | `v1.5.0` (real, in git — commit `2d0d9b2`) |
| **Current Development Sprint** | Sprint 5.2 — Dataset Expansion (Pre-Award Dataset, Commercial Dataset, Executive Portfolio Report). Item 4 (Executive Portfolio Report) is now unblocked — targets `v1.6.0`. |
| **Last Completed Product Version** | `v1.5.0` — Sprint 5.1, BI Foundation Proof |
| **Last Completed Development Sprint** | Sprint 5.1 — BI Foundation Proof (ExecutivePortfolioDataset) — ✅ Closed, all 9 Exit Criteria passed |
| **Latest Git Tag (real, in git)** | `v1.5.0` (commit `2d0d9b2`) |
| **Last Updated** | 2026-07-02 — Sprint 5.1 formally closed: scoped commit `2d0d9b2` (52 files, BI-only), `npm run lint` confirmed zero new errors (TD-001..004 pre-existing only), `npm run build` clean, tagged and pushed as `v1.5.0`. See "Version Reconciliation Note" below for how a stale `v1.5.0` tag (mistakenly pointing at the old `7ea5cdd` commit, from an earlier abandoned retroactive-tag attempt) was caught and corrected before push. |

---

## Version Reconciliation Note (Sprint 5.1 close-out — RESOLVED 2026-07-02)

**Resolution:** No retroactive tag was created on `7ea5cdd` (Sprint 4/4A/4A.1/4A.4's commit — it keeps its original, sole real tag `v1.4.0`, unchanged). Sprint 5.1's own work was committed separately as `2d0d9b2` (`feat(bi): Sprint 5.1 - ExecutivePortfolioDataset proof...`), verified (`npm run lint`: TD-001..004 only, no new errors; `npm run build`: clean), and tagged `v1.5.0`.

**Caught during close-out:** a `v1.5.0` tag already existed locally *and on the remote*, pointing at `7ea5cdd` — a leftover from an earlier, since-superseded retroactive-tagging attempt (the very first close-out script drafted in this session, before the versioning correction). It was deleted (`git tag -d v1.5.0`, `git push origin :refs/tags/v1.5.0`) and recreated pinned explicitly to `2d0d9b2` (`git tag -a v1.5.0 2d0d9b2 -m ...`) before the final push. Confirmed via `git show v1.5.0` pointing to `2d0d9b2` post-fix. Lesson for future Sprint Exits: always verify an existing tag's target commit before assuming a `git tag` command will succeed as a fresh tag — check with `git show <tag> --no-patch --format="%H %s"` first if there's any prior history of tagging attempts on that version number.

The next release, Executive Portfolio Report (Sprint 5.2 Item 4), targets `v1.6.0`. Versioning for Sprint 5.2 Items 1–3 (Pre-Award/Commercial Datasets) and Sprint 5 (RBAC) onward is not yet decided — treat the placeholders elsewhere in this file as provisional until each Sprint starts.

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
| Sprint 4 | Enterprise System Settings & Policies | ✅ Completed* | 100% | `v1.4.0` |
| Sprint 4A | Project Setup & Activation Foundation & Stabilization | ✅ Completed | 100% | `v1.4.0` (real — no separate/retroactive tag; folds in 4A.1/4A.4 work per 2026-07-02 versioning correction) |
| Sprint 5.0 | BI Foundation (Architecture & Contracts Freeze) | ✅ Completed | 100% | bundled into `v1.5.0` (target — Sprint 5.1's tag) |
| Sprint 5.1 | BI Foundation Proof (ExecutivePortfolioDataset) | ✅ Completed | 100% / Exit Criteria 9/9 | `v1.5.0` (commit `2d0d9b2`). **2026-07-02 ruling:** Exit Criterion #2 (Type Check) closed with 9 pre-existing `tsc` errors formally logged as Technical Debt — TD-001..TD-004 (see § below and `docs/technical-debt/TD-2026-07-typescript-debt.md`) — confirmed unrelated to `src/bi/**`, no new errors introduced. Scoped commit (52 files, BI-only — no `scratch/`, no CRLF-only files, no unrelated Tender/Project/Claims module changes), lint clean-of-new-errors, build clean, tagged `v1.5.0`, pushed. |
| Sprint 5.2 | Dataset Expansion (Pre-Award Dataset, Commercial Dataset, Executive Portfolio Report) | 🟡 In Progress — Item 4 unblocked | 0% | Item 4 (Executive Portfolio Report) → `v1.6.0`. Items 1–3 (Pre-Award/Commercial Datasets) versioning not yet decided. |
| Sprint 5 | Security & RBAC Foundation | ⏳ Planned | 0% | _pending — not yet decided, see Version Reconciliation Note_ |
| Sprint 6 | Enterprise UX Polish | ⏳ Planned | 0% | _pending — not yet decided_ |
| Sprint 7 | Backend Preparation (triggers Architecture Freeze) | ⏳ Planned | 0% | _pending — not yet decided_ |
| Sprint 8 | Backend Core | ⏳ Planned | 0% | _pending — not yet decided_ |
| Sprint 9 | Production Infrastructure & File Integrations | ⏳ Planned | 0% | _pending — not yet decided_ |
| Sprint 10 | Data Migration (Pilot → Full) | ⏳ Planned | 0% | _pending — not yet decided_ |
| Sprint 11 | Go Live (with Rollback Plan) | ⏳ Planned | 0% | _pending — not yet decided_ |
| Sprint 12 | Hypercare (first 30 days post Go Live) | ⏳ Planned | 0% | _pending — not yet decided_ |
| Phase 2 | AI → OCR → Notifications → Workflow → Power BI/Reporting (export/consumer layer) → Mobile → M365 | ⏳ Future | 0% | — |

\* Sprint 4's original scope (Master Data CRUD FK-linking — QA #8/#28/#29/#2) has not been re-verified as closed during this alignment pass; flagged in `Sprint.md`'s Sprint 4A section and OD-005 below.

**Numbering note:** Sprint 5.0/5.1/5.2 sit *before* Sprint 5 (RBAC) in execution order — they're intercalary sprints (same pattern as Sprint 3E / Sprint 3.0.1), not a renumbering of Sprint 5 onward. This corrects a prior version of this table that had inserted an undocumented "Sprint 5 — Execution Commercial Modules & Control" and silently shifted Sprint 5–12 down by one (dropping the Hypercare row entirely in the process) without updating `Sprint.md` to match. See OD-004.

Legend: ✅ Completed · 🟡 In Progress · ⏳ Planned · 🔴 Blocked

---

## Technical Debt Backlog

Opened 2026-07-02 during Sprint 5.1 close-out. Full detail (root cause, impact, priority, proposed fix, estimated scope, module owner) lives in `docs/technical-debt/TD-2026-07-typescript-debt.md`. None of these are fixed as part of Sprint 5.1 or Sprint 5.2 — they are unrelated to BI development and are explicitly deferred to a dedicated **Maintenance Sprint** (repository-wide TypeScript debt elimination, independent of BI work).

| ID | Item | Priority | Module Owner | Status |
|----|------|----------|---------------|--------|
| TD-001 | `Tender` / `LegacyTender` type divergence (`workflowStatus: string` vs `WorkflowStatus` enum) | P2 | Pre-Award / Ongoing Tenders | 🔴 Open |
| TD-002 | `AddProject.tsx` still uses local 4-value status union + unconstrained `contractType` string instead of domain `ProjectStatus`/`ContractType` enums (7/8 values) | P1 | Projects / Project Setup | 🔴 Open |
| TD-003 | `ClaimsPanel.tsx` status `<select>` passes raw DOM `string` into `ClaimStatus`-typed state without a cast/guard | P3 | Projects / Claims | 🔴 Open |
| TD-004 | `scratch/` + `src/tests/` diagnostic scripts share the app's `tsconfig.json` with no `include`/`exclude` boundary, so Node-harness drift gates every future Sprint's Type Check Exit Criterion | P1 (structural) | Tooling / DX | 🔴 Open |

**Why these weren't fixed under Sprint 5.1:** all 9 underlying `tsc --noEmit` errors were verified (via `git diff --ignore-all-space` against `HEAD`) to predate Sprint 5.1 and be unrelated to `src/bi/**` — several trace to Sprint 2 (`v1.2.0`, 2026-06-30). Fixing them here would have violated both "Stay inside Sprint scope" and "One Business Module Per Iteration" (CLAUDE.md §17/§14) by touching Tenders, Projects, and Claims in a BI-scoped Sprint. Logged instead, per explicit CTO ruling this session.

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

## Sprint 5.1 — BI Foundation Proof (ExecutivePortfolio Dataset) Work Breakdown

> Reflected in the Snapshot/Sprint Status tables above as of the roadmap-alignment pass — see OD-004 (resolved).

| # | Task / Requirement | Bucket | Status | Notes |
|---|--------------------|--------|--------|-------|
| 1 | Phase 1-4 — Builder / Service / Calculators / Filter Engine | BI Layer | ✅ Verified — already implemented | Found fully implemented (not contract-only) prior to this sprint, from the Sprint 5.0 "BI Foundation" work. Confirmed correct against real seed data; no code changes made. |
| 2 | Phase 5 — Developer Dataset Viewer | BI Layer / UI | ✅ Completed | `src/views/dev/BIPortfolioDatasetViewer.tsx`, temporary, behind a "DEV (TEMPORARY)" Sidebar group — gated by `import.meta.env.DEV` (CTO ruling, close-out) so it's excluded from production builds entirely, not just hidden from nav. Required adding `src/vite-env.d.ts` (was missing from the project). |
| 3 | Phase 6 — Dataset Validation | BI Layer | ✅ Completed | `src/bi/validation/PortfolioDatasetValidator.ts` — 7 independent checks, all passing against real seed data (3 projects → 3 rows). |
| 4 | Phase 7 — Documentation | Documentation | ✅ Completed | `docs/bi/` — Specification, Field Dictionary, Data Lineage, Data Mapping Matrix, Validation Report. |
| 5 | Type Check | Exit | ✅ Completed | Known pre-existing TypeScript Technical Debt (TD-001..TD-004, see `docs/technical-debt/TD-2026-07-typescript-debt.md`). Sprint 5.1 introduces no new TypeScript errors. See CHANGELOG for the sandbox caveat on how this was verified. |
| 6 | Build Check | Exit | ✅ Completed | `npm run build` run locally: clean, `dist/` produced (2392 modules, one non-blocking chunk-size advisory only). |
| 7 | Git Commit / Tag | Exit | ✅ Completed | Scoped commit `2d0d9b2` (52 files, BI-only), pushed to `main`. Tagged `v1.5.0` (pinned to `2d0d9b2` — see "Version Reconciliation Note" for the stale-tag catch during this step) and pushed. |

**Sprint 5.1 status: ✅ Closed — all 9 Exit Criteria passed (2026-07-02).**

## Current Blockers

* **~24 unrelated files already modified-but-uncommitted** in the working tree before Sprint 5.1's session started (MasterData, Tender, ClaimsPanel, IPCsPanel, NOCsPanel, SubcontractorsPanel, VOsPanel, several repositories, etc.) — deliberately excluded from the Sprint 5.1 commit, still uncommitted. Worth a deliberate review before any of it gets swept into a future commit, since CLAUDE.md §14's "One Business Module Per Iteration" rule assumes each module is committed before the next begins, and this much uncommitted cross-module state means that rule has not been followed in practice recently. Related: TD-001/TD-002/TD-003 (see Technical Debt Backlog) live inside this same uncommitted/pre-existing state.

---

## Open Decisions

| ID | Topic | Notes | Owner |
|----|-------|-------|-------|
| OD-001 | Document Control sub-modules (#71 — Transmittals Hub, Incoming/Outgoing Letters, Revision History, Makers Approval) currently placed in Phase 2. Does the business need them earlier? If yes, candidate Sprint between 3 and 4. | New features, not bug fixes — Phase 2 by default. | CTO |
| OD-002 | Tender → Project (Finding #25) Award workflow scope — implemented as an in-drawer Award confirmation wizard backed by `TenderAwardService`; broader Claims and Tender Financial completion remain separate Sprint 2 items. | Resolved. Claims lifecycle (F#49) and Tender Financial Step (F#11) completed in subsequent Sprint 2 work. | CTO |
| OD-003 | Backfill foundational ADRs (ADR-001 to ADR-008 listed in CLAUDE.md ch. 15) — schedule a dedicated documentation slot or backfill incrementally as each topic is touched? | Currently captured informally in CLAUDE.md + PROJECT_BOOK.md. | CTO |
| OD-004 | **Sprint numbering conflict** (originally flagged after Sprint 5.1). This file's Snapshot named the active Sprint "Sprint 5 — Execution Commercial Modules & Control" while `CLAUDE.md`/`Sprint.md` named a different Sprint 5 ("Security & RBAC Foundation"), and neither mentioned the BI/Executive-Portfolio work already built in `src/bi/`. | **Resolved.** CTO ruling: (a) the "Sprint 5 — Execution Commercial Modules & Control" entry was a documentation error — removed, no such Sprint exists; (b) BI/Executive Portfolio is a real intercalary track — `Sprint.md` now has Sprint 5.0/5.1/5.2 inserted before Sprint 5 (RBAC), same convention as Sprint 3E/3.0.1, formalized in `ADR-018`; (c) `Sprint.md` is authoritative for scope, this file for live status, `CLAUDE.md` §11 now points to both instead of hardcoding "Sprint 1" as current. | CTO |
| OD-005 | Sprint 4's original scope (Master Data CRUD, FK-linking Coordinator/Client/Consultant to MasterData — QA #8/#28/#29/#2) was marked "✅ Completed" in this file's Sprint Status table, but that completion has not been re-verified in this alignment pass — the work that's demonstrably real and tagged is Sprint 4A (Project Setup & Activation), a *different* body of work that landed under the same "Sprint 4" label without either being distinguished at the time. Confirm before Sprint 5 (RBAC) begins — RBAC's Ownership Model assumes real Employee/Department master records, not free text. | Open. | CTO |

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
