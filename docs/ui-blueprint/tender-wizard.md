# UI Blueprint: Tender Wizard Screen
**Status:** Approved Specification  

---

## 1. Purpose
The **Tender Wizard** UI provides a structured process for registering new tenders or editing existing entries without overwhelming users with complex fields all at once.

---

## 2. Data Sources
*   PostgreSQL Tenders API endpoints.

---

## 3. Services and Mappers Used
*   `TenderService`: Validates complete draft parameters and persists aggregates.
*   `TenderValidator`: Ensures the input data satisfies business and chronological rules before submission.

---

## 4. Domain Objects Involved
*   `Tender` aggregate root.
*   `GeneralInformation`, `AssignmentInformation`, `FinancialInformation`, `TimelineInformation`.

---

## 5. Applied Business Rules & Calculations
*   **Validation Rules**: Disallows negative estimates, enforces bilingual names, verifies that Technical and Commercial dates are valid calendar strings.
*   **PMO Milestones Offsets**: Automatically shows calculated target milestones (e.g., Alignment Date, Kick-off Date) using negative offsets dynamically.

---

## 6. User Actions
*   **Multi-Step Navigation**: Step 1 (General & Assignments), Step 2 (Timeline Dates), Step 3 (Financials).
*   **Validate parameters**: Automated real-time alerts if a step lacks required data.
*   **Submit**: Triggers final DDD-safe save operations through `TenderService`.

---

## 7. Future Extensions
*   **Pre-fill API**: Search global company registries to auto-fill client parameters and regional location metrics.
