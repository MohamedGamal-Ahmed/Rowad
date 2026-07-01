# Architectural Decision Record: ADR-015
**Title:** Repository Callback Invalidation Architecture  
**Status:** Approved  
**Date:** 2026-07-01  

---

## Context
The platform utilizes `ProjectLookupService` to cache the projects array list in memory under a `'projects_list'` cache key. This optimizes performance by preventing redundant LocalStorage parsing / database queries on UI screen transitions. 

However, direct modifications to the project aggregate root via `ProjectRepository.save()` or `delete()` bypassed the cached list in `ProjectLookupService`, leading to stale state rendering (e.g. project showing "Inactive" status in the Portfolio Grid on return from the setup workspace page). 

Directly injecting `ProjectLookupService` into `ProjectRepository` to call `refresh()` causes a circular dependency, as the lookup service already injects the repository to load the database files.

---

## Decision
We implement a **Static Callback Invalidation Pattern** on the repository. The repository declares a static optional callback hook:
```typescript
public static onSaveCallback?: () => void;
```
Inside the `save()` and `delete()` methods, the repository invokes this hook if it is registered:
```typescript
if (ProjectRepository.onSaveCallback) {
  ProjectRepository.onSaveCallback();
}
```
During bootstrap/initialization, the `ProjectLookupService` singleton registers a subscriber to this static callback within its constructor:
```typescript
ProjectRepository.onSaveCallback = () => {
  this.refresh();
};
```
This forces the cache to clear automatically whenever any repository write transaction succeeds.

---

## Consequences
* **Decoupled Architecture**: Eliminates circular references between repositories and lookup services.
* **Guaranteed Synchronization**: Any project creation, update, setup save, delete, or activation automatically invalidates lookup caches across the system.
* **Performance Integrity**: Caching remains operational for read-only navigation, only fetching from disk when mutations are explicitly executed.
