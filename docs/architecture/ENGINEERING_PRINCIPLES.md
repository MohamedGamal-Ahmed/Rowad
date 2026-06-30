# ROWAD Enterprise Platform — Engineering Constitution & Principles

This document defines the permanent engineering principles governing every future sprint, feature, refactoring task, backend implementation, and contributor to the **ROWAD Enterprise Platform**. It represents the baseline of technical governance for the Contracts Administration systems.

---

## 1. Architectural Philosophy

ROWAD is designed around the principles of **Domain-Driven Design (DDD)** and **Clean Architecture**. The software exists to serve the Contract Administration Department; therefore, the business domain drives the software structure.

### Core Architecture Tenants:
* **Business-First Design:** The domain vocabulary, entities, value objects, aggregates, and workflows must mirror the real-world responsibilities of a Contracts Administration Department.
* **Separation of Layers:** The codebase is split into strict horizontal layers (UI ➔ Services ➔ Domain/Business Rules ➔ Repositories). Dependencies flow inward; the domain layer does not know about the UI, framework, or storage layers.
* **Business Terminology Rules:** Software naming conventions must match real-world contract management vocabulary. In any naming conflict, business terminology always wins over generic software conventions.

---

## 2. Single Source of Truth (SSoT)

Every business concept, commercial metric, and transactional state must reside in exactly one authoritative source. Under no circumstances may data states be duplicated across repositories or views.

### Applied SSoT Constraints:
* **Project Commercial Baseline:** Sourced solely from the parent `Project` aggregate. Child modules (IPCs, NOCs, Subcontracts) must read the baseline from the parent instead of caching a local copy.
* **Enterprise Settings:** Managed globally and loaded dynamically. Values like tax rates or retention percentages are read on-the-fly.
* **Tender Award:** Award status transition is managed by the `TenderAwardService` which is the sole authority for translating a Tender into a Project and locking the source record.

---

## 3. Business Rules Placement

Business logic and calculations are the core assets of the company. They must be isolated, protected, and easily testable.

### Location Rules:
* **Allowed Layers:** Business logic, mathematical calculations, and invariants reside only inside the **Domain** entities, **Validators**, and the **CalculationService** (specifically delegates like `FinancialsCalculator` or `HealthCalculator`).
* **Forbidden Layers:** No business calculations or validation rules may reside inside React components, presentation layers, data repositories, dashboard files, or read models.

---

## 4. Read Models Policy

Dashboards, monthly executive reports (SPR), KPI cards, and charts are classified as **Read Models**. 

### Constraints:
* **No Ownership:** Read models do not own transactional data. They are derived projections computed dynamically.
* **No Persistence:** Read models never create, modify, or delete transactional records.
* **No Direct Arithmetic:** If a read model requires a calculated metric, it must request it from the centralized `CalculationService` rather than performing independent aggregations.

---

## 5. Repository Responsibilities

Repositories represent the database persistence boundary and follow the Single Responsibility Principle.

### Core Duties:
* **CRUD Only:** Repositories only persist, update, retrieve, and delete records from physical storage.
* **Prohibited Behaviors:** Repositories must never perform arithmetic calculations, validate business rules, schema migrations, or orchestrate workflows. They act as dumb data store bridges.

---

## 6. Service Responsibilities

Application services coordinate domain activities, maps data shapes, and orchestrate transactions.

### Rules of Engagement:
* **Orchestration Only:** Services write the application workflows. They direct domain entities to perform business logic but must not implement the math formulas themselves.
* **Extend Existing Services:** To prevent service bloat and the creation of "God Objects", existing services must be extended whenever the target responsibility matches. A new application service should be registered only when a genuinely new application boundary is established.

---

## 7. Domain Invariants

Domain invariants are the non-negotiable rules of the business that must remain true at all times.

### Key Invariants:
* **Immutable Signed Contract Value:** The signed contract sum established at project award is immutable. It must never be altered by subsequent change requests or claims.
* **Calculated Approved Variation Total:** The variation balance is the dynamic sum of approved additions and omissions.
* **Consolidated Baseline:** The `revisedContractValue` is the active commercial baseline (`signedContractValue + approvedVariationTotal`) consumed by subsequent payment claims.
* **VO Impact:** Only Approved or Implemented Variation Orders alter project baselines. Draft, Submitted, Under Review, or Rejected variation orders have zero financial impact.

---

## 8. Migration Policy

Data schemas evolve over time. All schema evolution, table refactoring, or storage re-mapping must occur through sequential, versioned migrations.

### Schema Upgrade Architecture:
```
Application Startup ➔ MigrationRunner ➔ Versioned Migration Scripts (up()) ➔ Repository Access
```
* **Execution:** Migration checks run on startup and execute exactly once per version.
* **Decoupled Logic:** Repositories must never execute schema migrations. Migration scripts handle raw storage upgrades before repositories are initialized.

---

## 9. Architecture Decision Record (ADR) Policy

Every significant architectural decision, database technology shift, security policy, or domain boundary modification requires a formal Architecture Decision Record (ADR) stored in `docs/adr/`.

* **Triggers:** Structural changes to DDD aggregates, persistence strategy adjustments, backend REST integrations, or authentication protocols require an ADR signed off by the engineering team before work begins.

---

## 10. Sprint Execution Policy

The ROWAD platform follows a strict **One Business Module Per Iteration** policy to isolate changes and minimize regression risk.

### Execution Cycle:
1. **Implementation:** Code the business module.
2. **Type Check:** `npm run lint` (`tsc --noEmit`) clean compile.
3. **Build Verification:** `npm run build` succeeds.
4. **Manual Verification:** Audit against business specs.
5. **Regression Testing:** Ensure existing modules are unbroken.
6. **Documentation Update:** Record in README/sprints/CHANGELOG.md.
7. **Git Commit & Push:** Push changes to GitHub.
8. **Next Module:** Initiate next sprint task.

---

## 11. Backward Compatibility

Enterprise software must protect client records. Schema upgrades must support backward compatibility:
* **No Silent Discard:** User records must never be deleted or discarded due to name refactorings.
* **Self-Healing Data:** Migration runners must gracefully upgrade old storage records to target formats, providing default values where necessary.

---

## 12. Enterprise Coding Standards

* **Explicit Over Clever:** Code readability takes precedence over clever shorthand tricks.
* **Explicit Naming:** Avoid custom abbreviations (e.g. use `signedContractValue` rather than `cVal` or `oContractVal`).
* **Bilingual UI:** All frontend text displays must support Arabic and English layout bindings using the `<BiText>` component.

---

## 13. Future Backend Alignment

The client-side architecture must remain fully forward-compatible with the planned backend stack.
* **Planned Stack:** `FastAPI` (Python) + `PostgreSQL` + `SQLAlchemy` (ORM) + `Alembic` (Migrations) + `JWT` (Authentication).
* **Alignment Rules:** Data structures, relation links, and validation logic must be written such that they can easily map to relational schemas (ERD-aligned) and REST APIs.

---

## 14. Core Engineering Values

Every developer contributing to ROWAD holds these fundamental engineering values:

* **Correctness Over Convenience:** We write correct, complete code. We do not use shims, adapter placeholders, or temporary hacks.
* **Accuracy Over Speed:** Business mathematical accuracy takes precedence over implementation schedule.
* **Architecture Over Shortcuts:** We respect architectural boundaries even for the simplest changes.
* **Readability Over Cleverness:** We write readable code for the next engineer.
* **Deterministic Calculations:** Calculations must be mathematical, reproducible, and verifiable.
* **Immutable History:** Financial records and audit logs are append-only.
* **Long-Term Maintainability:** Every line of code is written with backend migration and future modules in mind.
* **Enterprise-Grade Quality:** Every component is optimized for performance, accessibility, and clean presentation.
