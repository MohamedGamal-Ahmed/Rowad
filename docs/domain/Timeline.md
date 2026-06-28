# Domain Specification: Timeline
**Subdomain:** Operations & PMO  
**Status:** Approved Product Specification  

---

## 1. Purpose
The `TimelineInformation` domain model manages and coordinates task schedules, milestones, and deliverables. Following strict DDD guidelines, it decouples **Stored Information** (immutable entries submitted by coordinates) from **Calculated Information** (milestones generated runtime using corporate PMO standards). This isolates core transactional states from dynamic execution offsets.

---

## 2. Structural Composition (UML Field Mapping)

### SubmissionTimeline (Stored)
Captures immutable external deadlines dictated by clients.

| Field Name | Data Type | Required? | Purpose / Business Scope |
| :--- | :--- | :--- | :--- |
| `techSubmissionDate` | `string` (ISO-8601 Date) | **Yes** | Date baseline for technical tender file dispatch. |
| `commSubmissionDate` | `string` (ISO-8601 Date) | **Yes** | Date baseline for commercial tender file dispatch. |
| `overallSubmissionDate`| `string` (ISO-8601 Date) | **Yes** | Consolidated ultimate submission target. |
| `closingDate` | `string` (ISO-8601 Date) | *No* | Official Client RFP closing date. |

### InternalTimeline (Stored)
Captures stored logistics and review tracks.

| Field Name | Data Type | Required? | Purpose / Business Scope |
| :--- | :--- | :--- | :--- |
| `siteVisitRequired` | `boolean` | *No* | Flag indicating if estimators must inspect physical site layouts. |
| `siteVisitDate` | `string` (ISO-8601 Date) | *No* | Scheduled date for physical engineering site visit. |

### CalculatedTimeline (Computed Runtime - Never Persisted)
Dynamically populated during runtime processing based on active administrative offsets.

| Field Name | Data Type | Purpose / Business Scope |
| :--- | :--- | :--- |
| `kickOffDate` | `string` (ISO Date) | Computed kick-off review session target. |
| `riskDueDate` | `string` (ISO Date) | Computed deadline for technical risk register submission. |
| `contractQualsDueDate`| `string` (ISO Date) | Computed target for contracts team deviation summaries. |
| `alignmentDate` | `string` (ISO Date) | Computed consensus meeting alignment target. |
| `followUpDate` | `string` (ISO Date) | Computed intermediate check-in milestone. |

---

## 3. Separation of Concerns & Calculation Rule
To meet professional database normalization standards, **no calculated fields are written to the database**. This prevents database corruption if corporate rules update. 
*   *Database Table*: Stores only the `SubmissionTimeline` and `InternalTimeline` properties.
*   *Service Layer*: The `TimelineService` processes values from the administrative settings table, adding negative offsets to the baseline `techSubmissionDate` to inject computed milestones on-the-fly when data is queried.

---

## 4. Chronological Validation Rules
1.  **Submission Targets Order Check**: `techSubmissionDate` must precede or match `overallSubmissionDate`.
2.  **Offsets Bounds Evaluation**: Calculated internal milestones must reside chronologically BEFORE the external submission dates. This is enforced during settings validation checks.

---

## 5. Future Extension Roadmap
*   **Google Calendar Auto-Synchronization**: Automatically map internal milestones (e.g. alignment dates, kickoff targets) as group invitation activities inside estimators' Google Calendars.
*   **Gantt Interactive Charting**: Convert calculated tabular milestones into dynamic, interactive timelines under the PMO Planning view.
