# Implementation Plan - Sprint 2 (Tender Award Workflow)

Product Version:
v1.2.0 pending

Development Sprint:
Sprint 2 - Tender & Award

This plan records the approved Award workflow slice implemented in this change. It does not expand scope into Claims lifecycle completion or Tender Financial step completion.

## Approved Scope Implemented

### Tender to Project Award Workflow

#### [ADD] `src/services/TenderAwardService.ts`
- Orchestrate the Tender Award process through existing repositories.
- Validate Award eligibility against the approved workflow rules:
  - Tender must not be archived.
  - Tender must have a valid non-zero estimated value.
  - Tender must be submitted, preferred bidder, or under negotiation.
- Prevent duplicate Project creation by checking existing Projects by source tender, awarded project id, and project code.
- Create the Project from Tender data:
  - client
  - consultant
  - contract value
  - tender type / scope summary
  - currency
  - location
  - coordinator and contracts engineer
- Transfer Tender documents into Project attachments as metadata.
- Transfer Tender business events into Project history.
- Log the Award event against the Tender.

#### [MODIFY] Domain and UI-Facing Types
- Add optional bidirectional relationship metadata:
  - `Tender.awardedProjectId`
  - `Tender.awardedAt`
  - `Project.sourceTenderId`
  - `Project.sourceTenderNumber`
  - `Project.awardedAt`
- Preserve backward compatibility by making all relationship fields optional.

#### [MODIFY] Pre-Award Inspection Drawer
- Replace the "Architecture Extension Point" toast with an Award confirmation wizard.
- Confirming the wizard calls `TenderAwardService`.
- After Award, the Tender shows as Awarded and becomes read-only.
- Disable repeat Award, document registration, notes, assignments, and milestone edits on awarded Tenders.

## Subsequent Slices (Completed)

### Claims Lifecycle Completion
- Added `ClaimStatus` union type in `domain/projects/Project.ts`.
- Extracted `ClaimLifecycleValidator` to `business-rules/ClaimLifecycleValidator.ts`.
- Full 8-state lifecycle enforced with terminal state blocking.

### Tender Financial Review Step
- Wizard Step 4 relabeled and transformed into a read-only financial analysis screen.
- Displays: value, cost, margin, margin %, bid bond, performance bond, advance payment, retention.
- Existing Step 1 inputs untouched. Checklist preserved below financial review.

### Tender Lifecycle Full State Machine
- Created `TenderLifecycleValidator` in `business-rules/TenderLifecycleValidator.ts`:
  - Full state machine: Draft → Under Study → Ready for Submission → Submitted → Under Negotiation → Awarded
  - Lost/Cancelled allowed from any pre-award state
  - Terminal states (Awarded, Lost, Cancelled) block further transitions
- Added `TenderService.transitionTenderStatus()` and `TenderService.getStatusLabels()` for workflow status persistence and bilingual label mapping.
- Added `WorkflowStatus` enum field to UI `Tender` type and `LegacyTender` for type-safe tracking.
- Added status transition dropdown in TenderOverviewTab showing allowed next states when transitions are available.
- All BusinessEvents logged for each transition.
- Seed data updated with correct `WorkflowStatus` values.

## Out of Scope

- IPC, VO, NOC, Subcontracts.
- Backend/API implementation.
- RBAC.
- UI redesign.

## Verification

- `npm.cmd run lint` passed.
- `npx.cmd tsx src\tests\run-validation-tests.ts` passed.
- `npm.cmd run build` passed with the existing Vite chunk-size warning.
