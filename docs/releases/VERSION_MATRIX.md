# Platform Version Matrix

This document tracks major releases, functional changes, structural adjustments, and database migrations from the initial baseline to the current release.

---

## 1. Release History Index

| Version | Release Name | Date | Status | Major Milestone |
| :--- | :--- | :--- | :--- | :--- |
| **v1.0.0** | Initial Baseline | 2026-06-01 | Released | Core layout and localStorage seeds |
| **v1.1.0** | Pre-Award Estimator | 2026-06-10 | Released | Tender wizard and bidding bonds |
| **v1.2.0** | Operations Planner | 2026-06-18 | Released | Scheduling center and meetings conflict checks |
| **v1.3.0** | Document EDMS | 2026-06-25 | Released | Engineering document registers and Maker-Checker |
| **v1.4.0** | SPR Analytics | 2026-06-28 | Released | Single Paper Report dynamic generator |
| **v1.5.0** | Enterprise Foundation | 2026-07-01 | **Current** | Project Setup, Activation Policies, and Cache Sync |

---

## 2. Version Specifications

### 2.1 Version v1.0.0
- **Major Features**: Dashboard analytics widgets, navigation layouts, mock database aggregates.
- **Architectural Changes**: Introduction of features-based clean architecture pattern.
- **Breaking Changes**: None.
- **Database / Schema Changes**: Created `pmo_projects_master` localStorage key.
- **Migration Required**: None.

### 2.2 Version v1.1.0
- **Major Features**: Pre-award estimation wizard (Steps 1-5).
- **Architectural Changes**: Added validators layer (`TenderValidator`).
- **Breaking Changes**: Refactored `Tender` aggregate to enforce bilingual name maps.
- **Database / Schema Changes**: Added `preaward_tenders_db` localStorage key.
- **Migration Required**: Automated seed mappings in `App.tsx` on mount.

### 2.3 Version v1.2.0
- **Major Features**: Scheduling calendar, separate Milestones (deadlines) from Meetings (events). Travel buffer and meeting conflict checks.
- **Architectural Changes**: Added `OperationsCenterService` orchestration manager.
- **Breaking Changes**: Shifted calendar events shape to support separated participants arrays.
- **Database / Schema Changes**: Added `preaward_business_events_db`.
- **Migration Required**: Cleared legacy events in storage.

### 2.4 Version v1.3.0
- **Major Features**: Engineering document management, multi-discipline filters, approval/signature logs.
- **Architectural Changes**: Integrated `ProjectControlsService` and mappers layer.
- **Database / Schema Changes**: Added `pmo_project_attachments`.
- **Migration Required**: Promoted uploaded tender files to active database.

### 2.5 Version v1.4.0
- **Major Features**: Single Paper Report (SPR) dynamic engine.
- **Architectural Changes**: Enforced "Reports Never Own Data" architectural decision (ADR-011).
- **Breaking Changes**: Removed physical tables for reports.
- **Migration Required**: Excluded SPR from persistence tracking.

### 2.6 Version v1.5.0 (Current)
- **Major Features**: Centralized Project Setup wizard (Commercial, Schedule, Office, Documents), ProjectActivationPolicy checks, dynamic cache invalidation static callbacks, centralized status badging.
- **Architectural Changes**: Decoupled repository writes from cached lookups using callbacks. Centralized status mapping translation rules.
- **Breaking Changes**: Setup draft collections are evicted from database on project activation; configurations are promoted to project aggregate settings.
- **Database / Schema Changes**: Added `pmo_projects_setup_drafts` database key. Added `lifecycleStage` property on projects list.
- **Migration Required**: Project setups hydrated dynamically from aggregate fields if draft is missing.
