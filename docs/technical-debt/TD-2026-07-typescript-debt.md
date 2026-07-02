# Technical Debt Register — TypeScript Type-Check Debt (2026-07)

**Opened:** 2026-07-02, during Sprint 5.1 (BI Foundation Proof) close-out.
**Status:** Open — deferred to a dedicated Maintenance Sprint (post Sprint 5.1, independent of BI development).
**Trigger:** `npm run lint` (`tsc --noEmit`) surfaced 9 pre-existing errors while verifying Sprint 5.1's Exit Criteria. Investigation (diff against `HEAD` / `7ea5cdd`, `--ignore-all-space`) confirmed all 9 predate Sprint 5.1 and are unrelated to `src/bi/**`. None are fixed here — see `Sprint.md` / `ROADMAP_STATUS.md` for the ruling that Sprint 5.1 closes with this debt documented, not silently patched.

**Systemic root cause (applies to all items below):** `npm run build` (`vite build` → esbuild) does not type-check — esbuild transpiles and strips types without validating them. `npm run lint` (`tsc --noEmit`) is the only gate that catches these, and it appears not to have been (re-)run to a clean state at every prior Sprint Exit. "Build Passed" was historically satisfied while `tsc --noEmit` was silently broken. Recommend the Maintenance Sprint also close this process gap (e.g., wire `lint` into whatever CI/pre-tag checklist is used, not just `build`).

---

## TD-001 — `Tender` / `LegacyTender` type divergence

- **Root cause:** Two independent type definitions exist for the same business entity: `src/features/pre-award/ongoing-tenders/types.ts::Tender` (`workflowStatus: WorkflowStatus`, a closed enum) and `src/mappers/TenderMapper.ts::LegacyTender` (`workflowStatus: string`, unconstrained). Tender/Award services return `LegacyTender[]`; UI state (`useState<Tender[]>`) expects the stricter type.
- **Impact:** 3 `tsc` errors (`src/App.tsx:180`, `src/features/pre-award/ongoing-tenders/hooks/useOngoingTenders.ts:373`, `:402`). Functional impact is currently latent (no observed runtime defect), but the open `string` type means nothing statically prevents an invalid workflow status from reaching the UI. Also a standing violation of CLAUDE.md §13 ("no duplicate entities / no duplicate DTOs").
- **Priority:** P2 — type-safety gap on a core Pre-Award concept, not a runtime crash. Should not block any Sprint outside a dedicated maintenance pass given its blast radius.
- **Proposed fix:** Retype `LegacyTender.workflowStatus` as `WorkflowStatus`; audit all literal-string construction sites (mapper, seed data, form handlers) for compatibility. Longer-term: retire `LegacyTender` entirely in favor of the single domain `src/domain/pre-award/Tender.ts` entity — larger migration, track as a follow-up if pursued.
- **Estimated scope:** Medium. Touches `TenderMapper.ts`, `types.ts`, `useOngoingTenders.ts`, `App.tsx`, likely `TenderService.ts`/`TenderAwardService.ts` and tender seed data. Single module (Pre-Award/Tenders), no cross-module fan-out.
- **Module owner:** Pre-Award / Ongoing Tenders.

---

## TD-002 — `AddProject.tsx` enum migration

- **Root cause:** Component predates the domain's `ProjectStatus` (7 values) and `ContractType` (8 values) enums on `Project` and still holds its own narrower local state: `useState<'Active'|'Pre-Award'|'Completed'|'Closed'>` (4 values) and `useState('')` for `contractType` (unconstrained).
- **Impact:** 3 `tsc` errors (`AddProject.tsx:112, 152, 166`). Functionally: this form cannot create or edit a project into 3 of the 7 domain statuses (Inactive, Mobilizing, Suspended, Archived), and `contractType` has no enum validation at entry — a blank or arbitrary string satisfies the local type while violating the domain contract.
- **Priority:** P1 — this is a live data-entry gap, not just a type nit; missing statuses are a functional limitation on the Projects module.
- **Proposed fix:** Replace local unions with `useState<ProjectStatus>` / `useState<ContractType>`; source `<select>` options from the enums instead of hardcoded strings; re-verify the `lifecycleStage` derivation (currently a 4-way ternary) against all 7 `ProjectStatus` values.
- **Estimated scope:** Medium-High. Single module (Projects), but user-facing — needs UI option updates plus a re-check of any downstream logic (dashboards, filters, badges) that assumed only the old 4-value set.
- **Module owner:** Projects / Project Setup.

---

## TD-003 — `ClaimsPanel.tsx` enum typing

- **Root cause:** `useState<ClaimStatus>('Prepared')` (8-value union) is fed directly by a native `<select onChange>` handler's `e.target.value`, which the DOM types as plain `string`.
- **Impact:** 1 `tsc` error (`ClaimsPanel.tsx:382`). Runtime risk is low in practice — `<option>` values are already populated from `dropdownStates` (state-machine controlled) — but nothing statically guarantees only valid `ClaimStatus` values reach `setStatus`.
- **Priority:** P3 — narrowest item in this set, low risk, low effort.
- **Proposed fix:** `setStatus(e.target.value as ClaimStatus)`, ideally guarded by `dropdownStates.includes(...)` before casting rather than a bare assertion, consistent with the existing `ClaimLifecycleValidator`.
- **Estimated scope:** Low. One line, one file, no fan-out.
- **Module owner:** Projects / Claims.

---

## TD-004 — `scratch/` and `src/tests/` scripts need their own tsconfig + lint pipeline

- **Root cause:** `tsconfig.json` has no `include`/`exclude`, so `tsc --noEmit` treats `scratch/**` and `src/tests/**` — Node-context, `tsx`-executed diagnostic/investigation scripts with no test runner (no jest/vitest, no `npm test` script) — as if they were shipped application code. Their literal test fixtures (e.g. `scratch/trace_persistence.ts`'s hand-built `ProjectSetupDraft`/`ProjectSettings` objects) have drifted from the current domain shape (missing `departments`/`notificationRules`/`meetingRules`/`conflictRules`; `contractType: 'Lump Sum'` as a bare string instead of `ContractType.LUMP_SUM`).
- **Impact:** 2 `tsc` errors (`scratch/trace_persistence.ts:140, 178`), and structurally: every future Sprint's "Type Check Passed" Exit Criterion is at the mercy of unrelated Node-harness drift.
- **Priority:** P1 (structural — blocks a clean baseline for all future Sprints) despite the individual errors being harmless.
- **Proposed fix:** Add `"include": ["src"]` to `tsconfig.json` (explicit app boundary, not a blind exclude of the debt). Give `scratch/`+`src/tests/` a separate `tsconfig.scripts.json` and a `lint:scripts` npm script, run on demand — not gating Sprint Exit. Backfill a short ADR documenting why diagnostic scripts sit outside the app's type-check gate (different runtime target: Node + mocked `localStorage`, not the browser bundle).
- **Estimated scope:** Low-Medium (config split is small; deciding whether to also repair the drifted fixtures, or archive them as point-in-time investigation artifacts under `docs/investigations/`, is a judgment call for the Maintenance Sprint).
- **Module owner:** Tooling / DX (no business module).

---

## Resolution Plan

None of TD-001 through TD-004 are fixed as part of Sprint 5.1. They are explicitly out of scope per the Sprint 5.1 close-out ruling (`Sprint.md`, `ROADMAP_STATUS.md`) and will be addressed in a dedicated Maintenance Sprint whose sole objective is repository-wide TypeScript debt elimination — independent of BI development. That Sprint should re-run `npm run lint` to a fully clean `tsc --noEmit` as its own Exit Criterion before any further Sprint claims "Type Check Passed" going forward.
