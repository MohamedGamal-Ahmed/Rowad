# STRICT REMEDIATION PROMPT — Make ROWAD Frontend Backend-Ready (NO → YES)

> Give this entire file to the implementation model as its single instruction. Do not summarize it.
> **Decisions are made from the code, never from assumptions in this prompt.** Where this prompt says "delete", it means "delete *only after verification proves it is unreachable*; otherwise migrate it." Verify first, act second.

---

## ROLE

You are a senior frontend engineer performing a **surgical, evidence-driven remediation** of the ROWAD Enterprise Platform (`src/`, React 19 + TypeScript + Vite). An independent CTO review returned **NOT READY FOR BACKEND**. Your only job is to close the listed gaps so the verdict flips to **READY**. You are not redesigning anything, and you do not assume — you verify against the source before every change.

---

## ABSOLUTE RULES (violating any one = task failed)

1. **Do NOT touch the good architecture.** `domain/`, `repositories/`, `services/`, `business-rules/`, `mappers/`, `validators/`, and the `features/` folders are correct. Keep their structure, naming, and dependency direction.
2. **Dependency direction is law:** `domain` imports nothing upward. `repositories` import only `domain`. `business-rules` never import `repositories`/`features`/`views`. Never introduce an upward import.
3. **Decide from the code, not from this prompt.** Before removing or changing anything, prove its current state with grep/usage analysis and paste the evidence. If reality contradicts this prompt, follow the code and report the discrepancy.
4. **No new dependencies.** No new npm packages. No router/state library.
5. **NO NEW LEGACY — this is the prime directive.** Any code you introduce or modify during this remediation MUST follow the new architecture only:
   - No temporary models.
   - No compatibility/bridge layers (you are *removing* the existing ones, not adding more).
   - No duplicate entities.
   - No duplicate DTOs.
   - No duplicate business rules.
   - No duplicate repositories.
   - No duplicate type definitions (one `Project`, one `BilingualString`, one `ExecutionRecord`, one `DocumentRecord`, one attachment model).
6. **Project identity is referenced, never copied.** Any record belonging to a project MUST carry `projectId: string` referencing `Project.id`. Storing `projectName` as identity and matching by string is forbidden (display labels are fine).
7. **The code MUST compile.** `npx tsc --noEmit` must finish with **0 errors** when done. Run it. Do not report success otherwise.
8. **Make the minimum change.** Do not reformat unrelated files, rename outside the tasks, or "improve" working code.
9. **File-size rule (300 lines):** no file you **create** may exceed 300 lines. If a file you **modify** already exceeds 300 lines (legacy not in scope to refactor now), do not force-split it — instead add an **Exception Justification** to your final report stating: the file, why it exceeds, and the target refactoring sprint. New files have no exception.
10. **Repository keeps only repository logic.** When you move seed data out of a repository, the goal is *separation of concerns*, not a line count. Do not split repository logic to hit a number.

---

## EXECUTION MODEL — three phases, in strict order

Run the whole job as **Phase A → Phase B → Phase C**. Do not delete anything in Phase A or B.

```
Phase A — VERIFY     : prove what is reachable, who imports what, what is dead.
Phase B — MIGRATE    : move live functionality onto the new architecture (add projectId, unify types).
Phase C — DELETE      : remove only what Phase A proved unreachable AND Phase B made redundant.
```

For each task below, state which phase the action belongs to and paste the verification evidence before acting.

---

## MANDATORY TASKS

### TASK 1 — Remove the duplicate `BilingualString` and competing `Project` in `src/data.ts`
- **Verify (A):** `grep -rn "from './data'\|from '../data'" src/` — list every importer and exactly which symbols they use.
- **Migrate (B):** repoint `components/BiText.tsx`, `mockData.ts`, and any other importer to `domain/common/BilingualString`. Repoint any `Project` usage to `domain/projects/Project`.
- **Delete (C):** delete `src/data.ts` only after no importer remains.
- **Acceptance:** `grep -rn "from './data'\|from '../data'" src/` → empty; `tsc` green.

### TASK 2 — `ProjectProfile` legacy view: verify, then migrate-or-delete
- **Verify (A):** confirm reachability of `views/ProjectProfile.tsx` by tracing `setSelectedProjectId`. Paste every call site.
- **Decision rule:** *If it is provably unreachable (set only to `null`), delete it and its wiring in `App.tsx`.* If any path can set a real project id, **migrate it** so it routes through `ProjectsPage → ProjectWorkspace` instead of the legacy view — do not keep the legacy component.
- **Acceptance:** either `grep -rn "ProjectProfile" src/` → empty, or ProjectProfile is fully replaced by the workspace path; `tsc` green.

### TASK 3 — `ProjectExecution` legacy view: verify, then migrate-or-delete; normalize `ExecutionRecord`
- **Verify (A):** prove whether `views/ProjectExecution.tsx` (the component) is routed anywhere. Paste evidence. Identify every consumer of the `ExecutionRecord` type and `mockExecutionData`.
- **Migrate (B):** move the `ExecutionRecord` **type** to a single canonical location (`features/operations-center/types/` or `domain/project-controls/`) and **add a required `projectId: string`**. Ensure `ProjectControlsMapper` populates `projectId`. Repoint `Dashboard.tsx` and `App.tsx` to the canonical type.
- **Decision rule:** *If the component is unreachable after verification, delete it. Otherwise migrate it completely to the new architecture* (consume domain records via the service/mapper, keyed by `projectId`). Either way, remove `mockExecutionData`.
- **Acceptance:** `ExecutionRecord` has `projectId`; `grep -rn "mockExecutionData" src/` → empty; `tsc` green.

### TASK 4 — Make Document Control consume Project Master by `projectId` (highest-priority SSOT fix)
- **Verify (A):** confirm `views/DocumentControl.tsx` is live (routed) and currently uses `projectName.{en,ar}` + `projectNameEn/projectNameAr` + fuzzy `.includes()`.
- **Migrate (B):** add `projectId: string` to `DocumentRecord` referencing `Project.id`. `projectName` becomes a derived display label, never user-typed. Replace the free-text project inputs with a dropdown populated from `new ProjectRepository().getAll()` (reuse `components/SearchableAutocomplete.tsx`); selection sets `projectId`. All filter/sort by project uses `projectId`.
- **Acceptance:** `grep -n "projectNameEn\|projectNameAr\|projectName.en.includes\|projectName.ar.includes" views/DocumentControl.tsx` → empty; `DocumentRecord` has `projectId`; `tsc` green.

### TASK 5 — Remove the conflicting hardcoded KPI source `src/mockData.ts` (verify first)
- **Verify (A):** `grep -rn "extendedKPIs\|smartAlerts" src/`. If the only hits are inside `mockData.ts`, it is dead.
- **Act (C):** if dead, delete it. If something imports it, repoint that consumer to `DashboardService` (KPIs must be computed, not hardcoded) — do not keep a second KPI truth.
- **Acceptance:** no conflicting hardcoded KPI source remains; `tsc` green.

### TASK 6 — Unify the Audit Contract (do NOT force inheritance blindly)
- **Goal:** one consistent audit/identity convention across the domain. `domain/common/BaseEntity.ts` (`recordStatus`, `auditInfo`) is the intended contract.
- **Verify per entity:** for each interface in `domain/projects/Project.ts`, confirm it actually shares the same lifecycle (create/update/soft-delete + audit). Entities like `ProjectHistory` (an append-only log entry) and `ContextualAttachment` may legitimately differ — do not force them to `extends BaseEntity` if their lifecycle is different.
- **Migrate (B):** entities that share the lifecycle (`Project`, `ProjectMeeting`, `ProjectIPC`, `ProjectClaim`, `ProjectVariationOrder`, `ProjectNOC`, `ProjectSubcontract`, `ProjectDocument`, `ProjectSPR`) adopt the shared audit contract (extend `BaseEntity` or embed the same `auditInfo` shape). Remove ad-hoc `createdBy`/`createdDate` duplicates in favor of `auditInfo`. Keep `auditInfo` optional during migration so seeds still type-check; set `recordStatus` to the active value in seeds.
- **For entities with a different lifecycle:** unify only the *audit fields shape*, with a one-line justification in your report — do not impose unsuitable inheritance.
- **Acceptance:** a single audit convention is used; no entity carries both `auditInfo` and ad-hoc audit fields; `tsc` green.

### TASK 7 — Resolve the attachment model conflict (fixes a real compile error)
- **Compile error to fix:** `ProjectWorkspace.tsx:815` — `ProjectAttachment[]` assigned where `ContextualAttachment[]` expected.
- **Act:** choose ONE attachment model and make it the only one (recommended: keep `ContextualAttachment` — it carries `entityType`/`entityId`/`category` — and retire `ProjectAttachment`, or make it an alias). Update `ProjectWorkspace.tsx` and the repository methods to the single type.
- **Acceptance:** the `ProjectWorkspace.tsx:815` error is gone; exactly one attachment interface is in use.

### TASK 8 — Separate seed data from the repository (separation of concerns)
- **Migrate (B):** move all `baseline*` arrays (`baselineProjects`, `baselineMeetings`, `baselineIPCs`, `baselineClaims`, `baselineVOs`, `baselineNOCs`, `baselineSPRs`, `baselineSubcontracts`, `baselineDocuments`, `baselineAttachments`, `baselineHistories`, `baselineWBS`, `baselineContextualAttachments`, and any others) out of `repositories/ProjectRepository.ts` into `src/seed/projectSeed.ts`. Import them back. The repository must contain repository logic only; **file size is secondary — do not split repository logic to hit a number.**
- **Acceptance:** `grep -c "export const baseline" repositories/ProjectRepository.ts` → 0; repository still functions; `tsc` green.
- **NOTE — FX rates are intentionally OUT OF SCOPE.** This release does no currency conversion (each currency is shown on its own). Do **not** change `FinancialsCalculator` FX handling now; it is deferred to the future Financial Engine.

### TASK 9 — Fix remaining compile errors and settle the SSOT field name
- Fix `OperationsCenterPage.tsx:77` (`CalendarEvent` shape mismatch) so the object satisfies `Omit<CalendarEvent, 'id' | 'hasConflict'>`.
- Fix `tests/run-validation-tests.ts:111` (`process` undefined) — guard with `typeof process !== 'undefined'` or remove the Node-only call.
- Add `businessUnit: string` to `Project` (CTO spec lists Business Unit as an SSOT field; today only `department` exists). Keep `department` if still used; set `businessUnit` in seeds.
- **Acceptance:** `npx tsc --noEmit` → **0 errors**.

---

## DOCUMENTATION UPDATE (MANDATORY — only files that the change actually affects)

After implementation, update — **only if your changes affect them, and only to match the code**:
- `README.md`
- `CHANGELOG.md`
- `AI_HANDOFF.md`
- `PROJECT_BOOK.md`
- Architecture Baseline
- Business Rules Inventory
- Project Readiness

Documentation must always match the code. Do not invent sections; do not update a doc that your change did not touch.

---

## DEFINITION OF DONE (all must be true)

1. `npx tsc --noEmit` → **0 errors**.
2. `grep -rn "from './data'\|from '../data'" src/` → empty.
3. `grep -rn "ProjectProfile\|mockExecutionData" src/` → empty (or ProjectProfile fully migrated, with evidence).
4. `grep -n "projectNameEn\|projectNameAr" views/DocumentControl.tsx` → empty; `DocumentRecord` and `ExecutionRecord` both carry `projectId`.
5. `grep -c "export const baseline" repositories/ProjectRepository.ts` → 0.
6. One audit convention; one attachment model; `ProjectWorkspace.tsx:815` fixed.
7. `Project` has `businessUnit`.
8. No new duplicate type/entity/DTO/repository/business-rule was introduced (Rule 5).
9. App still renders all routes (`dashboard`, `operations-center`, `ongoing-tenders`, `document-control`, `projects`, `settings`).
10. Affected docs updated to match code.

---

## VERIFICATION PROTOCOL (run and paste raw output — no completion claim without it)

1. `npx tsc --noEmit` (0 errors).
2. The grep commands in Definition of Done items 2–5.
3. `npm run build` (Vite) — must succeed.

---

## FINAL DELIVERABLE — ROWAD Architecture Health Report

After verification passes, generate and include this report (this is the project KPI):

```
ROWAD Architecture Health
- Total Files
- Average Lines / File
- Largest Component
- Largest Service
- Largest Repository
- Largest Hook
- Largest Utility
- Files > 300
- Files > 500
- Files > 1000
- Dead Code (remaining)
- Duplicate Logic (remaining)
- Unused Imports
- Circular Dependencies
- Maintainability Score
- Architecture Score
- Ready For Backend (YES / NO)
```

Plus: a table mapping each of the 9 tasks → DONE + acceptance evidence; the raw verification output; the full list of files created/edited/deleted; and any 300-line Exception Justifications. Nothing else — no architecture praise, no roadmap.

---

## HARD CONSTRAINTS RECAP

Verify before you act · decide from the code, not this prompt · Phase A→B→C · **no new legacy of any kind** · `projectId` references everywhere · one type per concept · keep dependency direction · new files ≤300 lines (modified legacy files: exception note) · update only affected docs · 0 compile errors · paste verification + Architecture Health Report. If a task cannot be done without breaking these, STOP and report the blocker instead of guessing.
