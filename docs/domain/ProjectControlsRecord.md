# Domain Specification: Project Controls Record
**Subdomain:** Project Controls & Site Execution  
**Status:** Approved Product Specification  

---

## 1. Purpose
The `ProjectControlsRecord` (previously `ExecutionRecord` in raw UI models) represents transaction submittal logs generated during active site execution. It links technical construction operations with executive financial tracking, monitoring Interim Payment Certificates (IPCs), Scope Variations, Claims, and No Objection Certificates (NOCs) against pre-award commercial estimates.

---

## 2. Structural Composition (UML Field Mapping)

| Field Name | Data Type | Required? | Purpose / Business Scope |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID v4) | **Yes** | Persistent record ID matching the PostgreSQL database index. |
| `recordStatus` | `RecordStatus` (Enum) | **Yes** | Administrative visibility (`ACTIVE` or `ARCHIVED`). |
| `type` | `ProjectControlsRecordType` | **Yes** | Standard submittal categories: `IPC`, `Claim`, `Variation Order`, `NOC`. |
| `code` | `string` | **Yes** | Serial tracking number of the operational record (e.g. `PC-VO-002`). |
| `projectName` | `BilingualString` | **Yes** | Bilingual description of the execution project. |
| `submittedDate` | `string` (ISO-8601) | **Yes** | Date the transaction log was formally dispatched to the Consultant. |
| `valueAED` | `Money` | **Yes** | Strongly typed Value Object expressing financial transaction weight. |
| `status` | `BilingualString` | **Yes** | Execution status label (e.g., "Approved with Comments", "Rejected"). |
| `health` | `HealthStatus` (Enum) | **Yes** | Evaluates delay alerts (`HEALTHY`, `URGENT`, `UNDER_REVIEW`). |
| `department` | `BilingualString` | **Yes** | Leading execution team (e.g., Commercial Department). |
| `contractor` | `string` | **Yes** | Main contractor or executing subcontractor name. |
| `progress` | `number` | **Yes** | Percentage representing physical site installation completion (0 to 100). |
| `auditInfo` | `AuditInfo` | **No**| Tracing logs containing creation and modification timestamps. |

---

## 3. Allowed Record Types
1.  **IPC (Interim Payment Certificate)**: Represents progressive monthly valuations submitted to the Client.
2.  **Claim**: Financial or extension of time (EOT) recovery items submitted from ROWAD to the Client.
3.  **Variation Order (VO)**: Scope variations impacting the main contractual amount.
4.  **NOC (No Objection Certificate)**: Authority/Utility site access permissions.

---

## 4. Business Rules & Financial Validation
1.  **Progress Boundaries Check**: Physical `progress` is strictly validated to fit in the numerical range of `[0.00, 100.00]`.
2.  **Code Format Standard**: Codes must enforce a standard structure: `[Project-Prefix]-[Type-Identifier]-[Serial]`. E.g., `ROWAD-IPC-014`.
3.  **Cross-Currency Standardization**: The underlying database supports other Middle Eastern currencies; however, for reporting consolidations, high-level dashboards aggregate all values in **AED** through dynamic conversion helpers inside `FinancialsCalculator`.

---

## 5. Domain Relationships
*   **Belongs to Project**: References a parent Project ID (which originates from an `AWARDED` Tender aggregate).
*   **One-to-Many Documents**: Can attach certifications, verified BOQ sheets, and design amendment PDFs.

---

## 6. Future Extension Roadmap
*   **Live ERP Synchronizer**: Connect directly to Oracle / SAP cloud financial ledgers to fetch physical billings and actual expenditures, mapping cost variances against budget structures.
*   **Smart Claim Generator**: Read daily site logs, automatically flagging weather delays or variation claims using AI models.
