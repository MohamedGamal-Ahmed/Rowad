# ROWAD Enterprise Platform
# Sprint 4A.1 — Stabilization & UX Refinement — Completion Report
**Date:** 2026-07-01
**Scope:** Stabilize and polish Sprint 4A (Project Setup Foundation) before Phase 4B. No new business modules, no new entities, no architecture redesign.

---

## 1. Executive Summary

Sprint 4A.1 fixed the one Critical release blocker from the Sprint 4A Live QA Audit (`ROWAD_Sprint4A_QA_Report_2026-07-01.md`) — the `ProjectSetupWizard` white screen that blocked Gates 4 through 9 of the setup-to-activation pipeline — and used the same pass to close every other issue and refinement requested for this stabilization sprint: the Award Dialog's positioning bug, the "disappearing" Award attachments, the linear/mandatory wizard UX, and the single-percentage activation gate.

Every fix traces to a genuine, verifiable root cause in the existing code — none were band-aids:
- The wizard crash was a real contract gap: `ProjectSetupDraft` never declared the `completedSteps` field the component depended on.
- The Award Dialog's layout problems were a real CSS bug: `position: fixed` nested inside a `transform`-bearing animated ancestor.
- The "disappearing" attachments were a real dead field: `project.awardAttachments` was populated but never read by any UI.

Architecture, business rules, and ADRs remain frozen for this sprint. One new ADR was added (ADR-014) purely to document an already-correct design; no domain model was redesigned.

**One caveat, disclosed transparently:** the sandbox's shell environment used for this session did not reliably reflect edits made to several large, repeatedly-edited files, which prevented running `npm run lint` / `npm run build` in-session as the final Sprint Exit Criterion requires. Every change was instead re-read in full through the canonical file-editing tool after being made and manually traced for brace/tag balance, import correctness, and type consistency. **Recommend running `npm run lint && npm run build` locally before tagging `v1.4.1`** — see section 6.

---

## 2. Files Modified

| File | Change |
|---|---|
| `src/domain/projects/Project.ts` | Added `completedSteps: number[]` to `ProjectSetupDraft`. Added optional `sourceModule?: string` to `ContextualAttachment`/`ProjectAttachment` for traceability. |
| `src/services/ProjectSetupService.ts` | `resumeDraft()`: initializes `completedSteps: []` for new drafts; normalizes any already-persisted draft missing the field. Default `currentStep` for new drafts changed `1 → 0` (Setup Center overview). |
| `src/features/projects/components/workspace/ProjectSetupWizard.tsx` | Root-cause crash fix + full Setup Center / Activation Dashboard redesign (see §4). |
| `src/features/projects/components/ProjectWorkspace.tsx` | Wraps `<ProjectSetupWizard>` in the new `<ErrorBoundary>`; passes `attachments` into `<DocumentsPanel>`. |
| `src/components/ErrorBoundary.tsx` | **New.** Generic, reusable React Error Boundary. |
| `src/components/ui/Modal.tsx` | **New.** Generic, portal-based modal shell (body scroll lock, sticky header/footer, Escape-to-close). |
| `src/features/pre-award/ongoing-tenders/components/TenderDetailsDrawer.tsx` | Award Wizard refactored onto the new `Modal`; added per-file category selection for Award Attachments. |
| `src/services/TenderAwardService.ts` | New `transferAwardAttachments()` — migrates Award Wizard attachments into the canonical `ProjectAttachment` store and clears the transient carrier field. |
| `src/features/projects/components/workspace/DocumentsPanel.tsx` | New "Award Documents" section sourced from `attachments` (filtered by `sourceModule`). |
| `docs/adr/ADR-014-lifecycle-workflow-status-separation.md` | **New.** Formalizes Lifecycle vs Workflow vs Status separation. |
| `CHANGELOG.md`, `ROADMAP_STATUS.md` | Updated with the Sprint 4A.1 entry and work breakdown. |

---

## 3. Bug Fix Report

### BUG-001 (Critical / P0) — ProjectSetupWizard white screen
**Root cause:** `ProjectSetupDraft` (domain interface, `Project.ts`) never declared a `completedSteps` field. `ProjectSetupWizard.tsx` unconditionally called `draft.completedSteps.includes(step.id)` while rendering the step ribbon, throwing `TypeError: Cannot read properties of undefined (reading 'includes')` on every single render — 100% reproducible, exactly as QA reported.
**Fix:** Added `completedSteps: number[]` to the domain contract; `ProjectSetupService.resumeDraft()` now initializes it for new drafts *and* normalizes it for drafts already persisted before this field existed (this matters — `PRJ-2026-007`, the project QA used for the repro, already has a saved draft at 25% completion, which would otherwise still crash after this fix). The component also defensively guards with `(draft.completedSteps || [])` as a second line of defense, and `getPayload()` now correctly computes and persists the field going forward instead of silently dropping it on every save.

### BUG-003 (P1, tied to BUG-001) — No Error Boundary
**Fix:** New `src/components/ErrorBoundary.tsx`, a generic reusable boundary, wraps `<ProjectSetupWizard>` in `ProjectWorkspace.tsx`. Any future render-time exception in this component now degrades to a scoped, bilingual, retryable fallback instead of a full white screen — the rest of the workspace (Dashboard, Overview, Meetings, WBS, Documents) stays usable.

### Award Dialog — overlay / scroll / z-index (Part 1.3)
**Root cause:** the Award Wizard was a `position: fixed` div rendered *inside* `TenderDetailsDrawer`, which itself renders inside `OngoingTenders.tsx`'s `animate-in slide-in-from-right` wrapper. Any ancestor with a CSS `transform` — including the identity transform Tailwind's animation utilities apply — creates a new **containing block**, which silently breaks `position: fixed` descendants: they clip to that ancestor instead of the viewport. This is a real, well-known CSS pitfall, not a z-index problem (raising z-index wouldn't have fixed it).
**Fix:** new reusable `src/components/ui/Modal.tsx`, rendered via `createPortal` into `document.body` — removing the dialog from the transformed DOM subtree entirely. Includes body-scroll lock, sticky header/footer, and Escape-to-close. `TenderDetailsDrawer.tsx`'s Award Wizard now renders through it.

### Award Attachments "disappearing" (Part 1.4 / Part 7)
**Root cause:** `TenderAwardService.buildProjectFromTender()` stored uploaded Award attachments on `project.awardAttachments` — a field that, per a full codebase search, was **never read by any component**. The files were captured but had no path to ever become visible again — a genuine dead end, not a rendering bug.
**Fix:** new `TenderAwardService.transferAwardAttachments()` migrates them into the same canonical `ProjectAttachment` store already used for tender-document transfer (`saveAttachment`), tagged `sourceModule: 'Award Confirmation'` and `category` (now user-selectable per file: Letter of Award / Signed Contract / Award Minutes / Clarifications). The transient `project.awardAttachments` carrier is cleared immediately after transfer — one canonical home for the data, no duplicate storage. `DocumentsPanel.tsx` now renders a dedicated "Award Documents" section at the top of the Documents tab.

### Award Validation UX (Part 1.5)
**Finding:** already correct. `AwardConfirmationValidator` runs on every keystroke; the Confirm button is already disabled while invalid; QA scored this 8/10 in the audit. No change made — flagged as verified rather than "fixed" to avoid touching working code.

---

## 4. UX Improvements

**Project Setup Center (Part 2).** The 5-step linear/mandatory ribbon is replaced with an independent-card layout: Commercial, Schedule, Project Office, and Documents each render as their own card showing a live status badge (Complete/Incomplete), a progress bar, and an "open" affordance — no forced order, and users can leave and resume at any card. Three additional cards (Calendars, Approvals, Notifications) are shown as clearly-marked, non-blocking Advisory placeholders so those future modules (Phase 2 backlog) won't require rework of this surface. New drafts land on this overview by default (`currentStep: 0`) instead of being forced into Step 1.

**Activation Readiness Dashboard (Part 5).** The old "Step 5" page is now an always-visible dashboard at the bottom of the panel — per-section progress bars (Commercial/Schedule/Office/Documents) plus the overall readiness %, so a user never has to navigate into a specific step just to see whether the project is close to activation-ready, and can see exactly which section is blocking it.

**3-tier validation strategy confirmed (Part 3).** Verified as already correctly separated, not rebuilt: Hard (blocks Award only — Contract Value/Award Date/Currency/LOA Reference, `AwardConfirmationValidator`), Activation (blocks Activation only — PM/SM/CA, dates, commercial settings, required docs, the four `*Handler` classes in `ProjectSetupService`), Advisory (never blocks — e.g. Project Office headcount warning).

**Project creation is never blocked (Part 4/8).** Verified as already correct: `TenderAwardService` creates the Project unconditionally the moment Award is confirmed; the *only* gated action anywhere in this flow is the explicit "Activate Project" button, gated by `ProjectActivationPolicy`.

---

## 5. Architecture Impact

- **No entity, repository, or business-module changes.** Two additive, non-breaking domain fields (`ProjectSetupDraft.completedSteps`, `ContextualAttachment.sourceModule`) — both optional/required-with-default, no existing consumer broken.
- **Two new shared UI primitives** (`ErrorBoundary`, `Modal`) in `src/components/` / `src/components/ui/` — cross-cutting UI infrastructure, not business logic, consistent with the existing `DialogProvider` pattern from the Sprint 3.0.1 hotfix.
- **One new ADR** (`ADR-014`) documents, but does not change, the existing Lifecycle/Workflow/Status separation — see file for the full write-up. Backfills part of CLAUDE.md §15's outstanding ADR list.
- Repository purity, layering (UI → Service → Domain → Repo), and the "Reports never own data" rule are all unaffected — no report/read-model code was touched this sprint.

---

## 6. Regression Report

Manually re-traced (full-file re-reads after every edit) for:
- Award workflow: `TenderAwardService.awardLegacyTender()` control flow unchanged except for the new `transferAwardAttachments()` call, which only runs in the same `if (!existingProject)` branch as the existing `transferTenderDocuments()`/`transferTenderHistory()` calls — cannot fire twice for the same tender.
- Project creation: unchanged (`buildProjectFromTender` logic untouched aside from no longer being the permanent home for `awardAttachments`).
- Existing/legacy projects: `resumeDraft()`'s normalization path specifically covers projects with a setup draft saved before this sprint (e.g. `PRJ-2026-007`) — they are patched to include `completedSteps: []` on first read rather than crashing or losing data.
- Document Control / Tender module: no changes to `ProjectDocument` (transmittal/drawing register) schema or `TenderService`/`TenderLifecycleValidator`.
- Repositories / DDD boundaries: no new repositories; `saveAttachment` (existing method) is reused, not duplicated.

**Not run this session (environment limitation):** `npm run lint` (tsc --noEmit) and `npm run build`. The sandbox's shell mount for this repo did not reliably reflect several large, repeatedly-edited files within the session — confirmed directly (line/byte counts of `Project.ts`, `ProjectSetupWizard.tsx`, `ProjectWorkspace.tsx`, and `ProjectSetupService.ts` stayed stuck at pre-edit lengths in the shell even after a full file overwrite, while the canonical file-editing tool — and therefore the actual files on disk — showed the correct, complete content throughout). This is disclosed rather than papered over. **Action required: run `npm run lint && npm run build` locally before tagging `v1.4.1`**, per Sprint Exit Criterion #2/#3 in `CLAUDE.md`.

---

## 7. Production Readiness Assessment

- The Critical release blocker (BUG-001) is fixed at its root cause, with a defensive normalization path covering already-existing in-progress projects, plus an Error Boundary as a second line of defense.
- The Award Dialog fix addresses a structural CSS bug that would recur in any future modal nested inside an animated container — the new `Modal` component is intended to be the standard going forward.
- No stored data is lost or duplicated by any of these changes; award attachments move from a dead field to a live, visible one without double-storing.
- **Blocking item before tag:** run `npm run lint && npm run build` locally and confirm both pass clean (expected, given the manual trace, but not yet machine-verified this session).

## 8. Known Remaining Improvements (Future Sprint Recommendations — not implemented now)

- Calendars / Approvals / Notifications cards are intentionally placeholder-only; wiring real data into them is Phase 2 scope per `CLAUDE.md` §12/§16.
- The Award Wizard's file "upload" is still the pre-existing mock-file simulation (adds a fake filename/size) — real file upload is out of scope for this platform's current phase (no file storage backend yet; see `CLAUDE.md` §5 storage strategy).
- `docs/state-machines/` should eventually cross-reference `ADR-014` with an actual state diagram for each of the three fields — flagged as a documentation task, not urgent.
- Per-card "Last updated" timestamps in the Setup Center currently all read from the single draft-level `lastSaved` field rather than a true per-section timestamp; tracking per-section save times would require a small additive schema change and is a reasonable Sprint 6 (UX Polish) candidate.

## 9. Recommendation

**Sprint 4A.1 can be frozen conditionally** — pending a local `npm run lint && npm run build` pass (not yet machine-verified this session, see §6). All requested fixes and refinements are implemented and manually verified for correctness and non-regression. Once the two commands are confirmed clean locally, this is ready to tag `v1.4.1` and proceed to Sprint 4 Phase 4B.
