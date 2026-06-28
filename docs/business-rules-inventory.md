# ROWAD Enterprise Platform - Business Rules Inventory

This inventory documents and maps every core business rule in the **ROWAD Enterprise Platform**, identifying its owner, calculation structure, configuration sources, and consuming components. This enforces our rule of **strict single responsibility**: no business formulas should be duplicated or run directly inside React views.

---

## 1. Master Business Rules Inventory

### Rule 1: Bid Bond Percentage
* **Business Rule Name**: Bid Bond %
* **Formula / Policy**: `Estimated Project Value * Bid Bond %` (Standard pre-award bid guarantee required by clients)
* **Owner Service**: `TenderService` / `CalculationService`
* **Owner Calculator**: `FinancialsCalculator`
* **Configuration Source**: Corporate Settings / Administration
* **Settings Key**: `bidBondPercentage` (default: `2.0` or `0.02`)
* **UI Components Consuming**: `TenderWizardModal.tsx`, `OngoingTenders.tsx` (Tender card metric overlays), `TenderFinancialTab.tsx`
* **Repository Consuming**: None (evaluated dynamically)
* **Status**: Fully resolved in v1.3.0. Now consumes dynamic configuration values from `settings.financialSettings` via `FinancialsCalculator.calculateBidBond`. Obsolete code and duplicated hardcoded rules have been fully deleted.

---

### Rule 2: Performance Bond Percentage
* **Business Rule Name**: Performance Bond %
* **Formula / Policy**: `Awarded Contract Value * Performance Bond %` (Required post-award security guarantee)
* **Owner Service**: `ProjectControlsService`
* **Owner Calculator**: `FinancialsCalculator`
* **Configuration Source**: Corporate Settings / Administration
* **Settings Key**: `performanceBondPercentage` (default: `10.0` or `0.10`)
* **UI Components Consuming**: `ProjectExecution.tsx`
* **Repository Consuming**: None

---

### Rule 3: Retention Percentage
* **Business Rule Name**: Retention %
* **Formula / Policy**: `IPC Certified Amount * Retention %` (Retained cash value released upon final project handover)
* **Owner Service**: `ProjectControlsService`
* **Owner Calculator**: `FinancialsCalculator`
* **Configuration Source**: Corporate Settings / Administration
* **Settings Key**: `retentionPercentage` (default: `10.0` or `0.10`)
* **UI Components Consuming**: `ProjectExecution.tsx` (IPC submittal ledgers and claims sheets)
* **Repository Consuming**: None

---

### Rule 4: VAT Percentage
* **Business Rule Name**: VAT %
* **Formula / Policy**: `Gross Certified Subtotal * VAT %` (Regional taxation applied to engineering invoices)
* **Owner Service**: `ProjectControlsService` / `TenderService`
* **Owner Calculator**: `FinancialsCalculator`
* **Configuration Source**: Corporate Settings / Administration
* **Settings Key**: `vatPercentage` (default: `15.0` or `0.15` matching regional KSA laws)
* **UI Components Consuming**: `TenderWizardModal.tsx` (Financial tabs), `ProjectExecution.tsx` (Interim Payment Certificate billings)
* **Repository Consuming**: None

---

### Rule 5: Health Thresholds
* **Business Rule Name**: Health Thresholds
* **Formula / Policy**:
  * `isArchived === true` $\rightarrow$ `HealthStatus.ARCHIVED`
  * `daysRemaining < 0` $\rightarrow$ `HealthStatus.OVERDUE`
  * `daysRemaining <= 7` $\rightarrow$ `HealthStatus.DUE_SOON` (High planning urgency)
  * `daysRemaining > 7` $\rightarrow$ `HealthStatus.HEALTHY`
* **Owner Service**: `TenderService`
* **Owner Calculator**: `HealthCalculator` (via `StandardTenderHealthStrategy`)
* **Configuration Source**: Planning Profiles
* **Settings Key**: `dueSoonThresholdDays` (default: `7`), `overdueThresholdDays` (default: `0`)
* **UI Components Consuming**: `TenderRow.tsx`, `TenderKPICards.tsx`, `TenderOverviewTab.tsx` (via hydration fields in list)
* **Repository Consuming**: None

---

### Rule 6: Timeline Offsets
* **Business Rule Name**: Timeline Offsets (Kick-off, Risk Due, Qualifications, Alignment, Follow-up)
* **Formula / Policy**: 
  * $\text{Milestone Date} = \text{Technical Submission Date} + \text{Offset Days}$
  * Must satisfy: $O_{\text{kick}} < O_{\text{risk}} < O_{\text{qual}} < O_{\text{align}} < O_{\text{follow}} < 0$
* **Owner Service**: `TenderService` / `TimelineService`
* **Owner Calculator**: `TimelineCalculator`
* **Configuration Source**: PMO Configuration Settings
* **Settings Key**: 
  * Kick-off Offset: `kickOffOffset` (default: `-30`)
  * Risk Assessment Due Offset: `riskAssessmentOffset` (default: `-21`)
  * Contractual Qualifications Offset: `contractQualificationOffset` (default: `-14`)
  * Alignment Offset: `alignmentOffset` (default: `-10`)
  * Intermediate Follow-up Offset: `intermediateFollowUpOffset` (default: `-5`)
* **UI Components Consuming**: `SettingsView` (in `Settings.tsx`), `TenderWizardModal.tsx`, `TenderTimelineTab.tsx`
* **Repository Consuming**: `TenderRepository.ts` (Rules guide dynamic milestone calculations during database mapping)

---

### Rule 7: Reminder Days
* **Business Rule Name**: Reminder Days
* **Formula / Policy**: `Current Date >= Milestone Date - Reminder Days` $\rightarrow$ Alert notification compiled
* **Owner Service**: `NotificationService`
* **Owner Calculator**: `TimelineCalculator`
* **Configuration Source**: Corporate Settings / Administration
* **Settings Key**: `reminderDays` (default: `3` days)
* **UI Components Consuming**: Header notifications tab, Operations Center workload alert bars
* **Repository Consuming**: None

---

### Rule 8: Working Days
* **Business Rule Name**: Working Days
* **Formula / Policy**: Exclude non-working days from duration estimates and active Gantt-track timelines
* **Owner Service**: `TimelineService`
* **Owner Calculator**: `TimelineCalculator`
* **Configuration Source**: Corporate Settings / Administration
* **Settings Key**: `workingDays` (default: `[0, 1, 2, 3, 4]` corresponding to Sun-Thu regional schedules)
* **UI Components Consuming**: `OperationalLoadGrid.tsx`, `CalendarPanel.tsx` in Operations Center
* **Repository Consuming**: None

---

### Rule 9: Holiday Calendar
* **Business Rule Name**: Holiday Calendar
* **Formula / Policy**: Custom arrays of regional holiday dates excluded from active PMO lead times
* **Owner Service**: `TimelineService`
* **Owner Calculator**: `TimelineCalculator`
* **Configuration Source**: Corporate Settings / Administration
* **Settings Key**: `holidayDates` (list of ISO string dates)
* **UI Components Consuming**: `OperationalLoadGrid.tsx`, `CalendarPanel.tsx`
* **Repository Consuming**: None

---

### Rule 10: Commercial Offset
* **Business Rule Name**: Commercial Offset
* **Formula / Policy**: Relationship between Technical Submission Date and Commercial Submission Date
* **Owner Service**: `TenderService`
* **Owner Calculator**: `TimelineCalculator`
* **Configuration Source**: PMO Configuration Settings
* **Settings Key**: `commercialOffset` (default: `0` days delay)
* **UI Components Consuming**: `TenderWizardModal.tsx`
* **Repository Consuming**: None

---

### Rule 11: Risk Offset
* **Business Rule Name**: Risk Offset
* **Formula / Policy**: Target risk assessment completion deadline offset
* **Owner Service**: `TenderService` / `TimelineService`
* **Owner Calculator**: `TimelineCalculator`
* **Configuration Source**: PMO Configurations stored in `localStorage: "preaward_timeline_rules"`
* **Settings Key**: `riskAssessmentOffset` (default: `-21`)
* **UI Components Consuming**: `SettingsView`, `TenderWizardModal.tsx`, `TenderTimelineTab.tsx`
* **Repository Consuming**: None

---

### Rule 12: Qualification Offset
* **Business Rule Name**: Qualification Offset
* **Formula / Policy**: Hard deadline for legal review qualification departures
* **Owner Service**: `TenderService` / `TimelineService`
* **Owner Calculator**: `TimelineCalculator`
* **Configuration Source**: PMO Configurations stored in `localStorage: "preaward_timeline_rules"`
* **Settings Key**: `contractQualificationOffset` (default: `-14`)
* **UI Components Consuming**: `SettingsView`, `TenderWizardModal.tsx`, `TenderTimelineTab.tsx`
* **Repository Consuming**: None

---

### Rule 13: Alignment Offset
* **Business Rule Name**: Alignment Offset
* **Formula / Policy**: Bid review team alignment coordination meeting target offset
* **Owner Service**: `TenderService` / `TimelineService`
* **Owner Calculator**: `TimelineCalculator`
* **Configuration Source**: PMO Configurations stored in `localStorage: "preaward_timeline_rules"`
* **Settings Key**: `alignmentOffset` (default: `-10`)
* **UI Components Consuming**: `SettingsView`, `TenderWizardModal.tsx`, `TenderTimelineTab.tsx`
* **Repository Consuming**: None

---

### Rule 14: Project Numbering
* **Business Rule Name**: Project Numbering
* **Formula / Policy**: Generates standardized and unique corporate prefix formats (e.g., `PRJ-{CLIENT}-{YEAR}`)
* **Owner Service**: `ProjectControlsService` / `ImportService`
* **Owner Calculator**: `ProjectControlsMapper` / `TenderMapper`
* **Configuration Source**: System Admin Default Settings
* **Settings Key**: `projectNumberFormat`
* **UI Components Consuming**: `ProjectProfile.tsx`, `ProjectExecution.tsx`
* **Repository Consuming**: `ProjectControlsRepository.ts` (uniqueness constraint checking)

---

### Rule 15: Document Numbering
* **Business Rule Name**: Document Numbering
* **Formula / Policy**: Generates compliant ISO document identifiers (e.g., `DOC-{SUBMITTAL_TYPE}-{SERIAL}`)
* **Owner Service**: `ImportService` / `ProjectControlsService`
* **Owner Calculator**: `ProjectControlsMapper` / `TenderMapper`
* **Configuration Source**: System Admin Default Settings
* **Settings Key**: `documentNumberFormat`
* **UI Components Consuming**: `DocumentControl.tsx` (Submittals list and indexers)
* **Repository Consuming**: None

---

## 2. Technical Debt & Duplication Log

* **Identified Duplication**: The **Bid Bond Percentage** calculation (`Value * 0.02`) is implemented natively inside the following locations:
  1. `src/features/pre-award/ongoing-tenders/components/TenderWizardModal.tsx`
  2. `src/features/pre-award/ongoing-tenders/hooks/useTenderActions.ts`
  3. `src/views/OngoingTenders.tsx`
* **Remediation Plan**: Move the factor into `FinancialsCalculator` and read from the global Business Configuration settings context dynamically on next sprint refactoring. No other duplication was detected.
