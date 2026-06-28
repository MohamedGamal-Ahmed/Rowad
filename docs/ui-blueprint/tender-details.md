# UI Blueprint: Tender Details Screen
**Status:** Approved Specification  

---

## 1. Purpose
The **Tender Details Panel** provides an in-depth view of a selected bidding file. It allows users to study technical pre-requisites, checklist states, detailed financial estimates, attached drawings, and threaded communication notes.

---

## 2. Data Sources
*   Durable PostgreSQL database (retrieved via `/api/pre-award/tenders/{id}`).

---

## 3. Services and Mappers Used
*   `TenderService`: Coordinates checklist updates, document uploads, and comment stream additions.
*   `TimelineService`: Regenerates calculated dates immediately if submission date properties are updated.

---

## 4. Domain Objects Involved
*   `Tender` aggregate root.
*   `DocumentRecord`: Attached contract specifications and files.
*   `NoteRecord`: Internal communication comments thread.
*   `ChecklistInformation`: Drawings, BOQs, Specs review progress toggles.

---

## 5. Applied Business Rules & Calculations
*   **Workflow Guard Rules**: Checked before transitioning a tender to `Ready for Submission`. Checklists must be fully completed.
*   **Audit Info Logging**: Creation and amendment stamps tracked inside the `auditInfo` payload.

---

## 6. User Actions
*   **Toggle Checklists**: Inform the system of pre-study checklist task completion.
*   **Upload Documents**: Drag-and-drop or select contract files to trigger PostgreSQL/CDN storage linkages.
*   **Post Comments**: Append threaded engineering remarks.
*   **Modify Statuses**: Transition workflow nodes (e.g., from `Under Study` to `Ready for Submission`).

---

## 7. Future Extensions
*   **Automated Document Intelligence**: Read uploaded specification files using Gemini, auto-generating relevant risk records.
*   **Assigned Tasks Tracking**: Integrated checklist to-do items assigned to specific estimators with Google Tasks integration.
