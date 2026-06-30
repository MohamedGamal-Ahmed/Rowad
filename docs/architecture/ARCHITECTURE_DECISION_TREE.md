# ROWAD Enterprise Platform — Architecture Decision Tree & Governance Guide

This document defines the official **Engineering Decision Guide** for the ROWAD Enterprise Platform. Every contributor must consult this document before initiating any architectural, business, or technical changes. The goal is to eliminate inconsistent design decisions and ensure every change follows a predictable, governed path before any code is written.

---

## 1. Purpose

The ROWAD architecture represents the core business integrity of the Contract Administration Department. Architectural mistakes are expensive to correct once deployed. Therefore, no architectural, model-level, or business-rule changes should begin directly in code. Every significant change must follow a defined decision path, obtaining appropriate engineering and business alignment beforehand.

---

## 2. Decision Matrix

Use the matrix below to determine the governance path required for your proposed change:

| Proposed Action | Governance Path | Artifacts Required |
| :--- | :--- | :--- |
| **Add a Business Rule** | ADR + Sprint Scope | Updated `ADR`, `BUSINESS_RULES_INDEX.md` |
| **Change a Domain Model** | ADR + Domain Review + Sprint Scope | Updated `ADR`, Model Diff, Tests |
| **Add a UI Feature** | Sprint Scope Review | UI Mockups, Components |
| **Refactor Existing Code** | Internal Architecture Review | Pull Request Diff |
| **Rename Entities** | ADR + Domain Review | Updated `ADR`, Migration Script |
| **Change Database Schema** | Versioned Migration Script | Alembic migration file |
| **Change LocalStorage Schema** | Versioned LocalStorage Migration | `Migration_xxx.ts` in MigrationRunner |
| **Change Dashboard Only** | Sprint Scope Review | No ADR required unless data layers change |
| **Modify Reports** | Verify Read Model principles | Compliance checklist against ADR-011 |
| **Add Enterprise Settings** | Enterprise Settings Policy Review | Setting field documentation |
| **Add a New Service** | Service Responsibility Review | Justification report |
| **Add a Repository** | Architecture Review | Justification report |
| **Introduce a New Module** | Domain Review + ADR | Full aggregate specification + ADR |

---

## 3. Engineering Review Checklist

Before starting any implementation, every contributor must verify the following checklist:

* [ ] **Existing Services:** Is there already an existing service that owns this responsibility? (Avoid creating duplicate application services).
* [ ] **Existing Domains:** Is there already an existing domain aggregate or value object that can house this field? (Avoid property bloat).
* [ ] **Single Source of Truth:** Will this create a second source of truth? (Duplicate status fields, duplicated totals, or redundant configurations are strictly forbidden).
* [ ] **Domain Placement:** Does this logic belong in the Domain/Calculator layer? (React components and repositories must never contain business rules).
* [ ] **UI Boundaries:** Is the UI decoupled from the math? (Views must only consume computed view models).
* [ ] **ADR Threshold:** Does this change modify schema models or service contracts? (If yes, an ADR is required).
* [ ] **Migration Check:** Does this alter historical data formats? (If yes, a versioned migration runner script is mandatory).
* [ ] **Backward Compatibility:** Can existing LocalStorage records or database entries load successfully after the change without data loss?

---

## 4. Architecture Escalation Levels

Proposed changes must be classified into one of the following five escalation levels to determine the necessary review and approval authority:

```
[Level 1: Bug Fix] ➔ [Level 2: Feature] ➔ [Level 3: Biz Rule] ➔ [Level 4: Domain Model] ➔ [Level 5: Architecture]
```

### Level 1: Small Bug Fix
* **Scope:** Localized bug corrections, alignment fixes, type syntax errors.
* **Approval:** Sprint Scope only. No external review required.

### Level 2: Feature Enhancement
* **Scope:** Adding new UI components, extra reports presentation, or new view forms.
* **Approval:** Sprint Review and frontend lead sign-off.

### Level 3: Business Rule Change
* **Scope:** Modifying calculations, tax rates, retention caps, or workflow transition constraints.
* **Approval:** Business Review + Architecture Decision Record (ADR) approval.

### Level 4: Domain Model Change
* **Scope:** Structural modification to aggregate roots, database entity models, or renaming database columns.
* **Approval:** CTO Sign-Off + ADR + Database Migration Strategy review.

### Level 5: Architecture Change
* **Scope:** Changing database technologies, switching ORM frameworks, REST endpoint conventions, or authentication mechanisms.
* **Approval:** Full Architecture Board Review + ADR + Full Regression & Rollback Plan.

---

## 5. Module Ownership

To prevent overlapping responsibilities and code entanglement, module boundaries are strictly enforced:

* **Tender:** Owns the pre-award Tender lifecycle and pricing studies. Tenders become read-only upon award.
* **Project:** Owns the Project aggregate, WBS packages, and the Project Commercial Baseline.
* **IPC:** Owns Interim Payment Certificates, consultant certification values, and actual receipt matching.
* **Variation Orders:** Own the commercial change management lifecycle (additions, omissions, EOTs).
* **Claims:** Own entitlement requests and claim dispute tracking.
* **Dashboard:** Owns portfolio-wide read-only presentation summaries.
* **SPR:** Owns the monthly Single Paper Report read-model compilation.
* **Enterprise Settings:** Owns global system configurations, currency listings, tax structures, and calendar setups.

No module may write to or alter the invariants of another module. Inter-module communication must flow through defined service APIs.

---

## 6. Dependency Rules

Dependencies must always flow inward from the delivery layers to the business domains:

$$\text{Delivery (UI/Views)} \rightarrow \text{Repositories (Persistence)} \rightarrow \text{Services (Orchestration)} \rightarrow \text{Domain / Business Rules}$$

* Delivery layers (React components) may call services.
* Services may call repositories and domain logic.
* Domain logic (aggregates and calculators) has zero external dependencies and must remain completely isolated.
* **Dependency reversal (e.g. domain calling a service, or repository calling the UI) is strictly prohibited.**

---

## 7. Migration Decision Rules

Whenever a database schema or LocalStorage structure changes, the code upgrades must follow the versioned migration protocol:

1. **Repository Purity:** Never write schema transition code inside repository classes. Repositories must remain purely CRUD-focused.
2. **No Silent Upgrades:** Never update data structures silently on-the-fly inside get/save methods.
3. **Strict Path:** All changes must declare a new `BaseMigration` class and run sequentially through the `MigrationRunner` at application startup before repositories load.

---

## 8. Release Policy

Every code release must proceed through the pipeline sequentially. Under no circumstances may verification steps be bypassed:

$$\text{Development} \rightarrow \text{Verification (lint/build)} \rightarrow \text{Regression Audit} \rightarrow \text{Documentation Sync} \rightarrow \text{Commit} \rightarrow \text{Push} \rightarrow \text{Git Tag (SemVer)} \rightarrow \text{Release}$$

* Release versioning follows Semantic Versioning (`vMAJOR.MINOR.PATCH`).
* Sprint exits trigger a new minor version tag (e.g., `v1.3.0` for Sprint 3).

---

## 9. Engineering Principles Cross-Reference

This decision guide acts in concert with the other core documents of the ROWAD Governance Framework:
* **`ENGINEERING_PRINCIPLES.md`:** The baseline coding standard and architectural values handbook.
* **`CLAUDE.md`:** The local engineering execution environment rules.
* **`docs/adr/`:** The repository of formal Architecture Decision Records.
* **`ROADMAP_STATUS.md`:** The live sprint tracking and execution status.
* **`CHANGELOG.md`:** The chronological ledger of completed and unreleased platform additions.

---

## 10. Closing Statement

> **Architecture is a product feature.**
> 
> Every engineering decision must preserve correctness, maintainability, auditability, and business integrity before implementation speed.
