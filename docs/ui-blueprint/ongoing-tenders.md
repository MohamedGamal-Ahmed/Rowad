# UI Blueprint: Ongoing Tenders Screen
**Status:** Approved Specification  

---

## 1. Purpose
The **Ongoing Tenders** screen provides estimators and PMO directors with a centralized view of all active bidding opportunities, categorized by state and annotated with priority labels, dynamic health indicators, and remaining dates before critical submissions.

---

## 2. Data Sources
*   Durable PostgreSQL `Tenders` table (via the REST API proxy `/api/pre-award/tenders`).
*   Active local storage database caches (for local client execution context).

---

## 3. Services and Mappers Used
*   `TenderService`: Coordinates fetching, soft-deletes, and saving of tenders. Updates remaining days dynamically.
*   `TenderMapper`: Restructures deep relational SQL payloads into domain aggregates and maps them back safely for REST commands.

---

## 4. Domain Objects Involved
*   `Tender` aggregate root.
*   `TimelineInformation`: To retrieve Technical Submission deadlines and display calculated PMO offsets.
*   `FinancialInformation`: Displays the Estimations, Currency configurations, and Bid Bond metrics.

---

## 5. Applied Business Rules & Calculations
*   **Days Remaining Math**: Calculated at runtime relative to the current local server clock.
*   **Health Evaluation**: Uses the extensible `HealthCalculator` strategy (e.g. `Healthy`, `Due Soon`, `Overdue`, `Archived` alerts).
*   **Bilingual Swaps**: Dynamically render appropriate English or Arabic string properties based on active UI locale settings.

---

## 6. Scope of Permissions / User Actions
*   **View List**: Read-all access for estimators.
*   **Search and Filter**: Filter by project code, location, estimator, priority, and health.
*   **Archive/Soft-Delete**: Accessible to PMO coordinators. Launches soft-delete database transactions.
*   **Create/Edit**: Opens the Tender Wizard for bid registration.

---

## 7. Future Extensions
*   **Real-time Collab Presence**: Show other estimators active in the same tender.
*   **Bulk PDF Export**: Export selected ongoing rows in an executive progress spreadsheet format.
