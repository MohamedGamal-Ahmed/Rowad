# Domain Specification: Document Record
**Subdomain:** Common  
**Status:** Approved Product Specification  

---

## 1. Purpose
The `DocumentRecord` is a reusable, shared domain entity designed to store digital metadata references to project assets, tenders specifications, drawings, and billing logs. It represents files formally registered in the system, maintaining clean references to durable storage objects.

---

## 2. Structural Composition (UML Field Mapping)

| Field Name | Data Type | Required? | Purpose / Business Scope |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID v4) | **Yes** | Persistent record ID. |
| `name` | `string` | **Yes** | Human-readable file name with extension (e.g. `BOQ-Civil-Final-Rev3.xlsx`). |
| `size` | `string` | **Yes** | Standard human-readable package size (e.g. `12.4 MB`, `850 KB`). |
| `link` | `string` | **Yes** | Secure CDN, Google Drive, or Cloud Storage bucket URI. |

---

## 3. General Architecture & Shared Scope
Instead of duplicating file metadata definitions inside every feature folder:
*   `DocumentRecord` resides in `src/domain/common/`.
*   It is directly referenceable by multiple aggregates:
    *   **Pre-Award**: RFP specifications, commercial drawings.
    *   **Project Controls/Execution**: Signed IPC certificates, variation sheets.
    *   **Subcontractor Claims**: Supplier agreements, tax invoices.

---

## 4. Business Validation Rules
1.  **Strict Extension Whitelist**: File names must belong to accepted structural and documentation formats: `pdf`, `doc`, `docx`, `xls`, `xlsx`, `dwg`, `zip`, `rar`, `png`, `jpg`. Executable modules (`.exe`, `.sh`) are strictly blocked for infrastructure security.
2.  **Size Limits validation**: Direct file uploads through the ROWAD browser portal enforce a soft limit of **100MB** per single file registry, unless connected directly to internal Google Workspace cloud drives.

---

## 5. Domain Relationships
*   **Belongs to parent Context**: Holds no native knowledge of its parent container. Storage mappings are tracked inside joining tables (e.g., `tender_documents_link` table in PostgreSQL), allowing a document to be linked across tender and active execution contexts cleanly.

---

## 6. Future Extension Roadmap
*   **Google Drive Bidirectional Hotlink**: Integrate seamlessly with the workspace OAuth skill, allowing contracts engineers to pick drawings directly from Google Workspace folders.
*   **DocuSign/Adobe Sign Tracking Status**: Append digital signature meta blocks to track signed states on contract documents.
