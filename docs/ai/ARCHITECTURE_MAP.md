# ROWAD Enterprise - Core Architecture & Diagrams Map

This visual companion maps layers, directory boundaries, and sequence operations. 

For the complete service lists, repository maps, database roadmaps, and technical specifications, see the [Living Product Specification (PROJECT_BOOK.md)](./PROJECT_BOOK.md).

---

## 1. Directory Dependencies Map

The dependency flow between project directions is strictly unidirectional, preventing circular reference warnings:

```mermaid
graph TD
  Views[src/views/ - Stateless React UI]
  Services[src/services/ - Application Orchestrator Layer]
  Repos[src/repositories/ - Infrastructure/Persistence Adapters]
  Mappers[src/mappers/ - Bidirectional DTO Translators]
  Domain[src/domain/ - Core Aggregates and Models]
  Calculators[src/business-rules/ - Pure Math Calculators]

  Views --> |Call Services only| Services
  Services --> |Manage Repositories| Repos
  Services --> |Engage Calculators| Calculators
  Repos --> |Invoke Mappers| Mappers
  Mappers --> |Generate Domain Models| Domain
  Mappers --> |Use Business Calculators| Calculators
```

For domain aggregates and model definitions, refer to [Data Ownership Matrix (PROJECT_BOOK.md#6-data-ownership--schema-mapping-matrix)](./PROJECT_BOOK.md#6-data-ownership--schema-mapping-matrix).

---

## 2. Dynamic Sequence: Dashboard KPI Refresh

This model charts the cached real-time performance aggregation managed by the application services:

```mermaid
sequenceDiagram
  autonumber
  actor User as Executive User
  participant React as /src/views/Dashboard.tsx
  participant DBService as /src/services/DashboardService.ts
  participant Cache as /src/services/CacheService.ts
  participant Repos as Repositories Layer

  User->>React: Mount Dashboard / Refresh Click
  React->>DBService: getDashboardMetrics()
  DBService->>Cache: get("executive_dashboard_kpis_cache_key")
  
  alt Cache Hit - Zero Latency Ready
    Cache-->>DBService: Return Cached KPIs Summary
  else Cache Miss - Fetch & Calculate
    DBService->>Repos: Fetch active pre-award & project records
    Repos-->>DBService: Return raw lists
    DBService->>DBService: Compute sums, safety ratios, and health
    DBService->>Cache: set("executive_dashboard_kpis_cache_key", calculatedVal, 60s)
  end

  DBService-->>React: Return verified KPI statistics
  React->>User: Render polished graphics & charts
```

For analytical formulas and caching specifications, refer to [Functional Requirements by Module (PROJECT_BOOK.md#31-module-a-executive-analytics-dashboard-dashboard)](./PROJECT_BOOK.md#31-module-a-executive-analytics-dashboard-dashboard).

---

## 3. Dynamic Sequence: Proposal Wizard Submit

This diagram maps the transaction verification pipeline when committing new pre-award estimations:

```mermaid
sequenceDiagram
  autonumber
  actor User as Estimator / Tender Coordinator
  participant UI as /src/views/OngoingTenders.tsx
  participant Service as /src/services/TenderService.ts
  participant Validator as /src/business-rules/Validators.ts
  participant Mapper as /src/mappers/TenderMapper.ts
  participant Repos as /src/repositories/TenderRepository.ts

  User->>UI: Enter step fields & submit proposal
  UI->>Service: commitLegacyTender(legacyFormObj)
  Service->>Mapper: toDomain(legacyFormObj)
  Mapper-->>Service: Return Tender Domain Aggregate
  Service->>Validator: Validate tender entity schema
  
  alt Schema Valid
    Service->>Repos: Save domain tender instance
    Repos-->>Service: Commit Successful
    Service-->>UI: Return Success Flag
    UI->>User: Display success modal & update lists
  else Exception / Invalid Inputs
    Validator-->>Service: Throw Validation Errors list
    Service-->>UI: Return Failed status with errors
    UI->>User: Render highlight input errors
  end
```

For validator functions and step configurations, see the [Pre-Award Proposals Module Specs in PROJECT_BOOK.md](./PROJECT_BOOK.md#32-module-b-pre-award-proposals-tenders).

---

## 4. Layer Isolation Guardrails

* **Stateless Visuals**: React code remains isolated from storage engines or calculators.
* **Pure Domain Core**: Models under `src/domain` remain fully isolated from external framework dependencies (React, state managers, persistence adapters).

For detailed coding standards and structure guidelines, refer to [Coding Standards (PROJECT_BOOK.md#18-coding-standards)](./PROJECT_BOOK.md#18-coding-standards).
