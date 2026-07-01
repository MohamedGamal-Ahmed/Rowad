# Portfolio & Workspace KPI Engine Specification

This document details every KPI metric implemented in the ROWAD Enterprise Platform, specifying their calculation formulas, data sources, and roadmap categorization.

---

## 1. Overview
The platform aggregates portfolio metrics for portfolio dashboard summary grids. To prevent data staleness, metrics are computed dynamically rather than duplicated in storage databases.

---

## 2. KPI Catalog & Classifications

Each metric falls into one of three classifications:
- **Implemented**: Authoritative business formula calculated from active aggregate data.
- **Placeholder**: Hardcoded UI representation to be replaced by backend calculations.
- **Future Engine**: Scope scheduled for future development.

---

### 2.1 Implemented KPIs

#### A. Total Portfolio
- **Classification**: Implemented
- **Description**: Total count of active, non-archived projects in the system.
- **Calculation**: Count of projects where `recordStatus !== 'Archived'`.
- **Source**: `ProjectRepository.getAll()` / `ProjectLookupService.getProjects()`.

#### B. Active Workload
- **Classification**: Implemented
- **Description**: Count of projects currently under mobilization or execution.
- **Calculation**: Count of projects where `status === ProjectStatus.ACTIVE || status === ProjectStatus.MOBILIZING` and `recordStatus !== 'Archived'`.
- **Source**: `ProjectLookupService.getProjects()`.

#### C. Near Due Projects
- **Classification**: Implemented
- **Description**: Active projects that are approaching their contract completion date.
- **Calculation**: Count of projects where status is `Active` or `Mobilizing`, `completionDate` is set, and the remaining days to completion is between 0 and `NEAR_DUE_THRESHOLD_DAYS` (90 days).
  $$\text{Remaining Days} = \text{completionDate} - \text{Clock.today()}$$
  $$0 \le \text{Remaining Days} \le 90$$
- **Source**: `AppConstants.NEAR_DUE_THRESHOLD_DAYS` and `Clock.diffInDays()`.

#### D. Total Portfolio Value
- **Classification**: Implemented
- **Description**: The cumulative budget value of the portfolio converted to the base currency (EGP).
- **Calculation**: Sums the contract value of all non-archived projects. For each project, it selects the revised contract value, falling back to the signed contract value. Each project's currency is converted to EGP using the currency exchange rate registry in `FinancialsCalculator.sumAmounts`.
  $$\text{Total Value} = \sum_{p \in \text{Projects}} \text{ExchangeToEGP}(p.\text{revisedValue} \parallel p.\text{signedValue})$$
- **Source**: `FinancialsCalculator.sumAmounts`.

---

### 2.2 Placeholder KPIs

#### A. Financial Progress
- **Classification**: Placeholder
- **Description**: Evaluates the billed amount percentage against the contract sum.
- **Calculation**: Currently returns `undefined` (represented as `—` or `Not Available` in UI) to signify that no payment certificate engine is implemented in the domain layer. Completed projects default to `100%`.
- **Future Roadmap**: Once Sprint 5 (IPC module) completes, this will be calculated dynamically:
  $$\text{Financial Progress} = \frac{\text{Total Billed Approved}}{\text{Revised Contract Value}} \times 100\%$$

#### B. Schedule Progress & Variance
- **Classification**: Future Engine
- **Description**: Compares actual execution progress against baseline scheduling.
- **Future Roadmap**: Once schedule integrations (Primavera / MS Project XML imports) are established, variance will calculate Schedule Variance (SV) and Schedule Performance Index (SPI):
  $$\text{SPI} = \frac{\text{Earned Value (EV)}}{\text{Planned Value (PV)}}$$

#### C. Quality & Safety Index
- **Classification**: Future Engine
- **Description**: Tracks HSE and non-conformance metrics.
- **Future Roadmap**: Will compile counts of NCRs (Non-Conformance Reports) and safety incidents.
