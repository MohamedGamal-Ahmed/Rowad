# ROWAD Enterprise Platform — Roadmap Execution Status

> Live tracker of where the project actually is. Update at every Sprint Exit (and when a blocker / open decision / risk changes).
> Source of truth for Sprint scope: `Sprint.md`. Source of truth for architecture rules: `CLAUDE.md`.

---

## Snapshot

| Field | Value |
|-------|-------|
| **Current Product Version** | `v1.3.1` (pending tag) |
| **Current Development Sprint** | Sprint 4 — Enterprise System Settings & Policies (not started — blocked on Sprint 3.0.1 re-QA) |
| **Last Completed Product Version** | `v1.3.0` |
| **Last Completed Development Sprint** | Sprint 3.0.1 — Hotfix (Sprint 3 RC1 Release Blockers) |
| **Latest Git Tag** | `v1.3.0` (`v1.3.1` pending re-QA sign-off) |
| **Last Updated** | 2026-06-30 |

---

## Sprint Status

| Sprint | Name | Status | Progress | Tag |
|--------|------|--------|----------|-----|
| Sprint 0 | Project Governance & Architecture Foundation | ✅ Completed | 100% | — |
| Sprint 1 | Production Stabilization | ✅ Completed | 100% | `v1.1.0` |
| Sprint 2 | Tender & Award | ✅ Completed | 100% | `v1.2.0` |
| Sprint 3 | Commercial Modules (IPC + VO + NOC + Subcontracts + SPR completion) | ✅ Completed | 100% | `v1.3.0` |
| Sprint 3E | Commercial Domain Consolidation | ✅ Completed | 100% | `v1.3.0` |
| Sprint 3.0.1 | Hotfix (Sprint 3 RC1 Release Blockers) | 🟡 Implementation Complete, Re-QA Pending | 100% impl. | _pending v1.3.1_ |
| Sprint 4 | Enterprise System Settings & Policies | ⏳ Planned (blocked on Sprint 3.0.1 re-QA) | 0% | _pending v1.4.0_ |
| Sprint 5 | Security & RBAC Foundation | ⏳ Planned | 0% | _pending v1.5.0_ |
| Sprint 6 | Enterprise UX Polish | ⏳ Planned | 0% | _pending v1.6.0_ |
| Sprint 7 | Backend Preparation (triggers Architecture Freeze) | ⏳ Planned | 0% | _pending v1.7.0_ |
| Sprint 8 | Backend Core | ⏳ Planned | 0% | _pending v2.0.0_ |
| Sprint 9 | Production Infrastructure & File Integrations | ⏳ Planned | 0% | _pending v2.1.0_ |
| Sprint 10 | Data Migration (Pilot → Full) | ⏳ Planned | 0% | _pending v2.2.0_ |
| Sprint 11 | Go Live (with Rollback Plan) | ⏳ Planned | 0% | _pending v3.0.0_ |
| Sprint 12 | Hypercare (first 30 days post Go Live) | ⏳ Planned | 0% | _pending v3.0.1_ |
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
| 11 | Automated lint/build/regression verification | Exit | 🟡 Blocked — see Current Blockers | See blocker below. |

## Current Blockers

| ID | Blocker | Impact | Next Step |
|----|---------|--------|-----------|
| B-001 | The Cowork sandbox's mount of the project folder returned truncated/corrupted file reads when accessed via the shell in this session (confirmed: `cat` on `main.tsx` cut off mid-token; `tsc` errors traced back to files that are verified clean and complete via direct file inspection). `npm run lint` / `npm run build` could not be run reliably against the true latest source from inside this session. | Sprint Exit Criteria #2 (Type Check) and #3 (Build) for Sprint 3.0.1 are **not yet machine-verified**. | Run `npm run lint && npm run build` in a normal local/CI environment before tagging `v1.3.1`. Every changed file was manually re-read in full from the canonical source and traced for brace/JSX balance and type correctness during implementation, but this does not substitute for the compiler — treat as a hard gate before tagging. |

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
