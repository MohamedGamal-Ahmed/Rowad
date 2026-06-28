# Business Specification: Archive Rules
**Category:** Data Retention & Compliance  
**Status:** Approved Product Specification  

---

## 1. Context and Intent
The ROWAD platform enforces strict data retention regulations. Records are soft-deleted or archived instead of permanently deleted to preserve bidding histories for audit tracking.

---

## 2. Archive Criteria Specifications
A tender or control log can be transitioned to the `ARCHIVED` status if:
1.  **Terminal Workflow Reached**: The record workflow status is either `SAVED_LOST`, `CANCELLED`, or `READY_FOR_ARCHIVE`.
2.  **Date Elapse Requirements**: A bid remains closed (completed and awarded/lost) for at least **30 calendar days** before archiving is permitted on the landing boards.
3.  **Manual PMO Authorization**: PMO directors can manually bypass date rules to archive outdated duplicates.

---

## 3. Storage Consequences
*   **Archived Board Filtering**: Archived tenders are moved off main work dashboards to declutter working views.
*   **Immutable Lock**: Once `RecordStatus === RECORD_STATUS.ARCHIVED`, the record is locked; details fields cannot be edited unless unarchived.
*   **KPI Statistics Exclusion**: Archived project values are excluded from active dashboard financial aggregates.

---

## 4. Unarchive Rules
*   Only designated PMO administrators can unarchive items, restoring files to `Active` status if a client reopens negotiations.
