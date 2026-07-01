# Architectural Decision Record: ADR-017
**Title:** Setup Draft Hydration Strategy  
**Status:** Approved  
**Date:** 2026-07-01  

---

## Context
When a project is activated, the transient `SetupDraft` document is deleted from storage database tables to clean up space and avoid stale configuration records. 

However, if a user reopens the Project Setup workspace panel after project activation, the Setup Center needs to display the configurations. If the draft record is missing, the setup pages would show 0% progress and blank fields, creating a regression.

---

## Decision
We implement a **Fallback Aggregate Hydration Strategy** inside the `ProjectSetupService.resumeDraft()` method. 

When a draft is requested:
1. The service checks if the transient setup draft exists in storage.
2. If it exists, it returns it directly.
3. If it does not exist (meaning the project is already active), the service dynamically reconstructs a fully completed `ProjectSetupDraft` object directly by parsing the active fields on the `Project` aggregate root:
   - **Commercial fields**: Loaded from `project.commercialSettings`, `project.employer`, and `project.contractType`.
   - **Schedule fields**: Loaded from `project.startDate`, `project.contractDurationDays`, `project.mobilizationPeriodDays`, and `project.calendarFoundation`.
   - **Office fields**: Loaded from `project.projectOffice?.teamMembers`.
   - **Documents fields**: Reconstructed by setting verified document checklists to all mandatory categories.
   - **Readiness Score**: Sets completed steps to `[1, 2, 3, 4]` and returns a `100%` readiness score.

---

## Consequences
* **State Consistency**: Reopening the Setup Center page for active projects will always show 100% completed configurations matching the running project values.
* **Storage Optimization**: We do not need to persist redundant draft settings collections once setup parameters are successfully promoted to the aggregate.
* **Clean Architecture Preservation**: Maintains the Project Aggregate as the Single Source of Truth (SSoT) for active data, dynamically reassembling read-view models when required.
