# Architectural Decision Record: ADR-012
**Title:** Canonical Award Workflow  
**Status:** Accepted  
**Date:** 2026-06-30  

---

## Context
In the contract administration domain, there are two distinct business concepts that eventually lead to a tender status of "Awarded":
1. **Tender Status Transition**: The typical lifecycle progression of a tender (e.g., from `Draft` to `Under Study`, `Submitted`, `Under Negotiation`, or terminal states like `Lost` or `Cancelled`).
2. **Tender Award**: The administrative process of officially awarding a tender to the organization, which triggers project creation, document transfers, audit history conversion, and locking the source tender as read-only.

Previously, there was ambiguity as to whether the Award process should reuse the generic `TenderService.transitionTenderStatus()` function or act as a separate pipeline. Reusing `transitionTenderStatus()` within the Award workflow introduced critical technical issues:
1. **Duplicate Audit Events**: `transitionTenderStatus()` automatically generates a generic status-change `BusinessEvent`. The award process, however, logs a much richer, detail-oriented event (e.g., including linked project details). Running both results in duplicate/redundant event logs.
2. **Stale Repository Reads**: `transitionTenderStatus()` re-fetches the tender aggregate from the repository. During the award process, the tender model is modified in memory (e.g., updated with `awardedProjectId`), which would be overwritten by a fresh repository read if `transitionTenderStatus()` were invoked mid-flight.
3. **Overlapping Core Responsibilities**: Generic status changes should not assume or trigger project creation, document migrations, or historical audits.

---

## Decision
We will not reuse `TenderService.transitionTenderStatus()` inside the award workflow. Instead, `TenderAwardService` owns and acts as the exclusive application orchestration boundary for the canonical award process. 

The canonical award path is defined as:
`TenderAwardService.awardLegacyTender()` → `validateAwardEligibility()` → `buildProjectFromTender()` → `commitLegacyTender()` → `logAwardEvent()`.

`TenderAwardService` is responsible for:
- Orchestrating award validation (e.g., ensuring value is non-zero, status is valid, and the tender is not archived).
- Creating/persisting the new `Project` record.
- Creating the bidirectional link between `Tender` and `Project` (`awardedProjectId` and `sourceTenderId`).
- Copying/registering documents from the tender as `ProjectAttachment` files.
- Exporting the tender's full pre-award `BusinessEvent` audit log to the project's historical logs.
- Marking the `Tender` status as `Awarded` and locking it as read-only.
- Logging a single, unified `Tender Awarded` event in the audit trail.

`TenderService.transitionTenderStatus()` remains solely responsible for generic pre-award status transitions (e.g., `Draft` → `Under Study`).

---

## Consequences
*   **Single Source of Truth**: There is exactly one canonical workflow responsible for converting a tender into an active project.
*   **Clean Audit Trails**: Duplicate business events are eliminated, keeping the pre-award history logs clean and accurate.
*   **Logical Decoupling**: Generic state transitions remain lightweight and decoupled from project execution models.
*   **Diverging Code Paths (Trade-off)**: We accept two separate paths that can transition a tender status to `Awarded`. However, this is an intentional reflection of the business domain, as the side effects of manual status updates differ significantly from a formal contract award.
