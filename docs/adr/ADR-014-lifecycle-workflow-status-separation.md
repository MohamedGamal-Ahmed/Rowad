# ADR-014: Separation of Lifecycle, Workflow, and Status on the Project Aggregate

## Status
Accepted

## Context
Sprint 4A.1 asked for an explicit review of three fields that all look similar on the `Project` entity — `lifecycleStage`, `workflowState`, and `status` — to confirm there is no overlap and to document what each one is responsible for. This is a documentation task (backfilling the informal decision that already exists in the code), not a redesign: all three fields already exist, are already set at the correct points, and Sprint 4A.1 introduces no changes to this model.

Each field answers a different question about the same Project record:

| Field | Type | Question it answers | Who changes it |
|---|---|---|---|
| `lifecycleStage` | `ProjectLifecycleStage` | *Which phase of its life is this record in?* | System, on structural transitions only (Award, Setup completion, Close-Out, Archive) |
| `workflowState` | `ProjectWorkflowState` | *Has this record cleared the administrative gate to move to the next phase?* | `ProjectSetupService` (setup completion → activation) |
| `status` | `ProjectStatus` | *What is the day-to-day operational state a PM/CA would report right now?* | Project Office / operational updates (Settings, future status-change actions) |

## Decision

**Lifecycle (`ProjectLifecycleStage`) — controls project phase.**
`Pre-Award → Pending Project Setup → Ready for Mobilization → Execution → Closing → Archived`. This is the coarse, structural spine of the record. It only moves forward on specific, irreversible business events: Award (creates the Project in `Pending Project Setup`), Setup+Activation completion (`Ready for Mobilization`), and Close-Out/Archive. Nothing about daily operations (a suspended IPC, a paused site) should ever move this field.

**Workflow (`ProjectWorkflowState`) — controls administrative approval.**
`Draft → Pending Activation → Active → Suspended → Completed`. This is the administrative gate specifically owned by `ProjectSetupService` / `ProjectActivationPolicy`: has the project cleared Commercial, Schedule, Project Office, and Documents validation and been formally activated? `ProjectWorkspace` uses `workflowState !== ACTIVE` as the single switch that locks IPC/Claims/VO/NOC/Subcontractors/SPR/Settings behind the Setup Center — i.e. this field is the literal implementation of the "Reports/Commercial modules never activate before setup is complete" rule (chapter 9/11 of `CLAUDE.md`).

**Status (`ProjectStatus`) — controls operational execution.**
`Inactive → Mobilizing → Active → Suspended → Completed → Closed → Archived`. This is the field a Project Manager reports against week to week — it reflects what's actually happening on site/administratively right now, independent of whether the formal activation gate has been cleared. `ActivationHandler.activateProject()` sets it to `Mobilizing` at the moment of activation; it is expected to continue evolving afterward (e.g., to `Active` once mobilization completes) without touching `lifecycleStage` or `workflowState`.

## Why they don't overlap
A project can be `lifecycleStage = Ready for Mobilization`, `workflowState = Active` (cleared the gate), and `status = Mobilizing` (not yet fully executing) all at the same time — three independent, simultaneously-true facts about one record. Collapsing them into a single field (as a naive implementation might) would force an artificial choice between "what phase" / "is it approved" / "what's happening now," which is exactly the kind of ambiguity that produces stale KPI cards and incorrect module locks. Keeping them separate is what let the Sprint 4A QA audit confirm (Gate 3 observation, `ROWAD_Sprint4A_QA_Report_2026-07-01.md`): a project can correctly show `workflowState = Active` in its header while `isSetupComplete` checklist still reads 25% — two independently true, independently owned facts.

## Consequences
- No code change required; this ADR formalizes an already-correct separation for future contributors (addresses CLAUDE.md §15 "decisions that exist in practice but should be backfilled as formal ADRs").
- Any future status-change UI (Sprint 6 UX Polish backlog) must only ever write to `status`, never reuse it to imply a lifecycle or workflow transition.
- `docs/state-machines/` should cross-reference this ADR when the three state machines are diagrammed in detail.
