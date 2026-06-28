# Business Specification: Import Rules
**Category:** Bid Intake & Data Migration  
**Status:** Approved Product Specification  

---

## 1. Context and Intent
ROWAD staff frequently compile preliminary tenders lists within Excel sheets. The platform provides an integration feature to import spreadsheet rows, automatically parsing and validating entries before inserting them into PostgreSQL.

---

## 2. Spreadsheet Mapping Rules

Incoming Excel columns are processed as follows:

| Spreadsheet Header | Mapped Domain Property | Validation or Defaults Applied |
| :--- | :--- | :--- |
| `projectCode` | `projectCode` | String trimmed. Mandatory. |
| `tenderNumber` | `tenderNumber` | String trimmed. Mandatory. |
| `projectName` | `projectName` | Assigned to both Arabic/English if separate translations are missing. |
| `estimatedValue` | `financials.estimatedValue` | Parsed via `FinancialsCalculator` parsing engine, isolating numerals. |
| `techSubmissionDate` | `timeline.submission` | Parsed as ISO YYYY-MM-DD format. Mandatory. |
| `location` | `general.location` | Standard default placeholder matches regional KSA if missing. |

---

## 3. Mandatory Completeness & Rejections
1.  **Missing Keys Boundary**: Rows that omit `projectCode`, `tenderNumber`, or `techSubmissionDate` are rejected to prevent downstream state corruption.
2.  **Skipped Entries Log**: Rejected rows do not halt the process; they are collected and displayed in a validation summary tab.

---

## 4. Duplicate ID Resolution
If an imported `tenderNumber` matches an existing record in PostgreSQL, the system prompts the user with an option to:
*   *Skip*: Retain the current database entry.
*   *Overwrite*: Run mapper updates over the active record.
