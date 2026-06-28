# ROWAD Enterprise - Business Rules Inventory Report
## Permanent Reference Catalog

This index serves as the master authority for all mathematical calculations, timeline propagation offsets, validation matrices, and numbering formats across the ROWAD Enterprise Platform.

Every business rule has exactly **one owner service** and **one pure calculator**. All values are fully editable through the Administration panel and stored within the central `Settings` engine, guaranteeing that no business rules are hardcoded or duplicated.

---

## 1. Master Business Rules Directory

| Permanent ID | Business Rule Name | Owner Service | Owner Calculator | Configuration Source | Settings Key | UI Consumers | Repository Consumers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BR-FIN-001** | Bid Bond % | `TenderService` | `FinancialsCalculator` | Settings Engine | `financialSettings.bidBondPercentage` | `TenderWizardModal`, `OngoingTenders` | `TenderService` |
| **BR-FIN-002** | Performance Bond % | `TenderService` | `FinancialsCalculator` | Settings Engine | `financialSettings.performanceBondPercentage` | `OngoingTenders` | `TenderService` |
| **BR-FIN-003** | Retention % | `TenderService` | `FinancialsCalculator` | Settings Engine | `financialSettings.retentionPercentage` | `OngoingTenders` | `TenderService` |
| **BR-FIN-004** | VAT % | `TenderService` | `FinancialsCalculator` | Settings Engine | `financialSettings.vatPercentage` | `OngoingTenders` | `TenderService` |
| **BR-FIN-005** | Advance Payment % | `TenderService` | `FinancialsCalculator` | Settings Engine | `financialSettings.advancePaymentPercentage` | `OngoingTenders` | `TenderService` |
| **BR-TIM-001** | Target Milestones Offsets | `TenderService` | `TimelineCalculator` | Settings Engine | `timelineRules.*Offset` | `TenderWizardModal`, `OngoingTenders` | `TenderService` |
| **BR-TIM-002** | Proactive Reminder Lead Days | `TenderService` | `TimelineCalculator` | Settings Engine | `timelineRules.reminderDays` | `TenderWizardModal` | `TenderService` |
| **BR-CAL-001** | Weekend Days Filter | `TenderService` | `TimelineCalculator` | Settings Engine | `businessCalendar.weekendDays` | `SettingsView` | `TenderService`, `TimelineCalculator` |
| **BR-CAL-002** | Public Holidays Exclusion | `TenderService` | `TimelineCalculator` | Settings Engine | `businessCalendar.holidayDates` | `SettingsView` | `TenderService`, `TimelineCalculator` |
| **BR-CAL-003** | Working Hours Shifts | `TenderService` | `TimelineCalculator` | Settings Engine | `businessCalendar.workingHours*` | `SettingsView` | `TenderService` |
| **BR-NUM-001** | Project Code Format | `NumberingService` | `NumberingService` | Settings Engine | `numberingSettings.projectFormat` | `TenderWizardModal` | `NumberingService` |
| **BR-NUM-002** | Tender Code Format | `NumberingService` | `NumberingService` | Settings Engine | `numberingSettings.tenderFormat` | `TenderWizardModal` | `NumberingService` |
| **BR-NUM-003** | Record & IPC Format | `NumberingService` | `NumberingService` | Settings Engine | `numberingSettings.ipcFormat` | `ProjectExecution` | `NumberingService` |
| **BR-NUM-004** | Document Control Format | `NumberingService` | `NumberingService` | Settings Engine | `numberingSettings.documentFormat` | `DocumentControl` | `NumberingService` |
| **BR-WRK-001** | Max Workload per Engineer | `TenderService` | `HealthCalculator` | Settings Engine | `workloadSettings.maxTasksPerEngineer` | `SettingsView` | `TenderService` |
| **BR-HLT-001** | Due Soon & Overdue Alerts | `TenderService` | `HealthCalculator` | Settings Engine | `healthSettings.dueSoonThresholdDays` | `OngoingTenders` | `TenderService`, `HealthCalculator` |

---

## 2. Business Rule Detail Definitions

### BR-FIN-001: Bid Bond Calculation
* **Mathematical Formula**: 
  $$\text{Bid Bond Value} = \text{Estimated Tender Value} \times \left(\frac{\text{Bid Bond \%}}{100}\right)$$
* **Context**: Dictates the financial security deposit required during tender bidding phases.
* **Decoupled Path**: UI requests calculation $\rightarrow$ `FinancialsCalculator.calculateBidBond(value, settings.financialSettings)` $\rightarrow$ Returns exact currency formatted results.

### BR-TIM-001: Milestones Target Offsets
* **Mathematical Formula**:
  $$\text{Milestone Date} = \text{addDays}(\text{Technical Submission Date}, \text{Offset}, \text{Business Calendar})$$
* **Context**: Propagates dates for Kick-off, Risk Due, Qualifications, Alignments, and Follow-up meetings relative to the Technical Submission Date.
* **Calendar Exclusions**: Automatically offsets days that correspond to custom business weekends (BR-CAL-001) and holiday dates (BR-CAL-002).

### BR-NUM-001 to BR-NUM-004: Dynamic Reference Numbers
* **Format Processing**:
  Processes dynamic placeholders such as `{YEAR}` (calculated dynamically based on system date) and `{SEQ}` (incremented using the current record counter, left-padded to 3 digits).
* **Decoupled Path**: UI requests numbering $\rightarrow$ `NumberingService.generateIdentifier(template, params)` $\rightarrow$ Returns custom format.

---

## 3. Technical Debt Verification

* **Zero Duplications**: There are no duplicate calculations. Pure calculators reside solely in `/src/business-rules/` and are imported where necessary.
* **Bypass Detection**: No direct mutations bypass the orchestration service or domain layers.
* **Audit Confirmation**: We have confirmed that no business policy is hardcoded inside any React UI rendering file.
