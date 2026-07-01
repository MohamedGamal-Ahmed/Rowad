# Investigation Report: Project Setup Persistence Failure

## 1. Repository Save Timeline

The following sequence of saves was tracked during the simulation of the Project Setup and navigation flow:

### Save #1: Project Creation (Tender Award)
* **Timestamp**: `2026-07-01T12:46:01.030Z`
* **Caller**: `TenderAwardService.awardLegacyTender()` via `ProjectRepository.save()`
* **Project ID**: `p-award-t-1`
* **Project Code**: `PRJ-PC-2026-NEOM`
* **Workflow State**: `undefined`
* **Lifecycle Stage**: `Pending Project Setup`
* **Draft Status**: `setupDraft exists?: false`
* **Key Values**:
  * `startDate: ""` (default)
  * `employer: "NEOM Authority Co."` (copied from Tender client)
* **Cache Cleanliness**: Invalided. `TenderAwardService` calls `ProjectLookupService.getInstance().refresh()` right after save, clearing the cache.

---

### Save #2: Setup Draft Persistence (Save Draft Clicked)
* **Timestamp**: `2026-07-01T12:46:01.036Z`
* **Caller**: `ProjectSetupService.saveDraft()` via `ProjectRepository.save()`
* **Project ID**: `p-award-t-1`
* **Project Code**: `PRJ-PC-2026-NEOM`
* **Workflow State**: `undefined`
* **Lifecycle Stage**: `Pending Project Setup`
* **Draft Status**: `setupDraft exists?: true`
* **Key Values**:
  * `setupDraft.commercial.employer: "ORA Developers"`
  * `setupDraft.schedule.startDate: "2026-07-01"`
* **Cache Cleanliness**: **STALE**. `ProjectSetupService.saveDraft()` writes directly to `ProjectRepository` in LocalStorage, **bypassing the ProjectLookupService caching mechanism entirely**. It fails to call `ProjectLookupService.getInstance().refresh()` or `cache.delete('projects_list')`.
* **State Result**: LocalStorage holds the correct, completed draft values. However, `ProjectLookupService`'s cache still holds the stale project object containing the empty default/seeded draft (where `startDate` is `""` and `employer` is `"NEOM Authority Co."`).

---

### Save #3: Stale Cache Overwrite (Project Reopened & Updated)
* **Timestamp**: `2026-07-01T12:46:01.038Z`
* **Caller**: `ProjectLookupService.saveProject()` via `ProjectRepository.save()`
* **Project ID**: `p-award-t-1`
* **Project Code**: `PRJ-PC-2026-NEOM`
* **Workflow State**: `undefined`
* **Lifecycle Stage**: `Pending Project Setup`
* **Draft Status**: `setupDraft exists?: true`
* **Key Values (Stale Overwrite)**:
  * `setupDraft.commercial.employer: "NEOM Authority Co."` (reverted to default)
  * `setupDraft.schedule.startDate: ""` (reverted to empty)
* **Cache Cleanliness**: Re-synchronized (but with stale data).
* **State Result**: The stale project object loaded from the `ProjectLookupService` cache (which had default values) was written back to LocalStorage by a routine save operation (such as updating settings, changing attributes, or toggling workspace parameters). This completely overwrote the correct draft, reverting the readiness score from 100% back to 25%.

---

## 2. Root Cause Analysis

The root cause is a **Caching Desynchronization** between the application's read model layer (`ProjectLookupService`) and the write model layer (`ProjectSetupService`).

1. **Direct Database Write**: `ProjectSetupService` writes directly to `ProjectRepository` when saving setup drafts (`saveDraft()`, `resumeDraft()`, `completeSetup()`).
2. **Missing Cache Invalidation**: These direct repository writes never notify `ProjectLookupService` to invalidate its cached `'projects_list'`.
3. **Workspace Mounts on Cache**: When a user navigates to the Projects list or workspace, the application queries `ProjectLookupService.getProjects(false)`. Since `force` is `false`, it returns the cached list containing the old project data (with the default/empty draft).
4. **Stale Object Mutation & Save**: When any settings panel, edit dialog, or administrative action is triggered on the reopened project, it acts on this cached stale project object and saves it back to storage using `ProjectLookupService.saveProject()`. Because the stale object is saved, the complete draft data inside LocalStorage is overwritten with the stale draft data.

---

## 3. Recommended Fix

To establish a Single Source of Truth and ensure cache-safety, we must make sure all writes to the project repository invalidate the read cache. 

We can achieve this by modifying the write pathways:

### Option A: Delegate through ProjectLookupService
Update `ProjectSetupService` to call `ProjectLookupService.getInstance().saveProject(project)` instead of calling `this.projectRepository.save(project)` directly. Since `ProjectLookupService.saveProject` already handles deleting the `'projects_list'` cache key, this automatically keeps the cache in sync.

### Option B: Perform Cache Invalidation in ProjectSetupService
Inside `ProjectSetupService`'s write methods (`resumeDraft`, `saveDraft`, `completeSetup`), call `ProjectLookupService.getInstance().refresh()` or `ProjectLookupService.getInstance().saveProject()` to guarantee that any cached project data is evicted immediately after a setup change.
