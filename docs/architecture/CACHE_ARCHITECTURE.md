# Cache Architecture & Invalidation Specification

This document details the cache invalidation scheme and synchronization data flow between repository writes, service caching singletons, and React UI layers.

---

## 1. Overview
Previously, updates to the Project aggregate root via the Repository did not automatically synchronize with the Portfolio Grid or the Sidebar counters. The Portfolio Grid loaded data from `ProjectLookupService.getProjects()`, which cached the list in memory. Directly saving a project bypassed this cache, causing visual drift (e.g. projects remaining "Inactive" in the grid after successful activation).

---

## 2. Invalidation Data Flow Diagram

The following diagram displays how write operations propagate invalidation events to the lookup cache and trigger UI updates:

```mermaid
flowchart TD
    UI[React Views: Portfolio Grid / Workspace] -->|Calls| Lookup[ProjectLookupService Singleton]
    Lookup -->|Checks Cache| Cache{Cache Hit?}
    
    Cache -->|Yes| UI
    Cache -->|No| Repo[ProjectRepository]
    Repo -->|Loads from Storage| Db[(LocalStorage / Mock DB)]
    Db --> Repo
    Repo -->|Hydrates Aggregates| Lookup
    Lookup -->|Caches array| UI

    %% Mutation Path
    WriteService[ProjectSetupService / EditService] -->|Calls| Repo
    Repo -->|Mutates Database| Db
    Repo -->|Invokes Static Hook| Callback[ProjectRepository.onSaveCallback]
    Callback -->|Triggers Cache Eviction| Lookup
    Note over Lookup: Clears 'projects_list' key
    
    %% Next Render
    UI2[React Views] -->|Calls next frame| Lookup
    Lookup -->|Cache Miss| Repo
```

---

## 3. Core Components

### 3.1 ProjectRepository (Mutation Endpoint)
- **Role**: Standardizes data access.
- **Implementation**:
  ```typescript
  public static onSaveCallback?: () => void;

  public async save(project: Project): Promise<boolean> {
    // ... write logic ...
    if (ProjectRepository.onSaveCallback) {
      ProjectRepository.onSaveCallback();
    }
  }
  ```

### 3.2 ProjectLookupService (Cache Singleton)
- **Role**: Controls queries. Registers a listener to the repository's static hook in its constructor:
  ```typescript
  export class ProjectLookupService {
    private constructor() {
      // Register cache invalidation callback
      ProjectRepository.onSaveCallback = () => {
        this.refresh();
      };
    }
  }
  ```
  This decouples `ProjectRepository` from direct service injection, eliminating circular references.

---

## 4. Why Stale Cache Issues Are Resolved
1. **Decoupled Subscription**: Repositories remain unaware of service details, but notify the lookup system immediately upon database mutations.
2. **Immediate Eviction**: Every successful save or delete action clears the singleton cache instantly.
3. **Reactive Re-fetching**: React components hook into the lookup list; since the cache is evicted, navigating back to the Portfolio page triggers a cache miss, causing a fresh load of the updated project status.

---

## 5. Future Improvements
- **Targeted Cache Invalidation**: Instead of evicting the entire list array, implement key-based caching for individual project IDs to optimize performance for large-scale portfolios.
