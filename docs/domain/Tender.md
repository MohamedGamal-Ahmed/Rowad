# Domain Specification: Tender Aggregate Root
**Subdomain:** Pre-Award  
**Status:** Approved Product Specification  

---

## 1. Purpose
The `Tender` entity is the **Aggregate Root** of the Pre-Award Subdomain. It governs the lifecycle of bidding opportunities from the initial request for proposal (RFP) stage, through estimating checks, detailed physical site feasibility surveys, internal PMO alignment studies, up to client submission and final contract award status evaluations.

---

## 2. Structural Composition (UML Field Mapping)

| Field Name | Data Type | Required? | Purpose / Business Scope |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID v4) | **Yes** | Unique entity identifier matching PostgreSQL primary key. |
| `recordStatus` | `RecordStatus` (Enum) | **Yes** | Controls administrative visibility: `ACTIVE` or `ARCHIVED`. |
| `projectCode` | `string` | **Yes** | Cross-platform code connecting the tender with future execution modules (e.g. `PC-991-RIYADH`). |
| `tenderNumber` | `string` | **Yes** | Client-issued legal bidding code (e.g. `TENDER-CIVIL-8827`). |
| `projectName` | `BilingualString` | **Yes** | Bilingual description (English and Arabic) of the tender. |
| `general` | `GeneralInformation` | **Yes** | Captures geographic location, bidding priority, and client parameters. |
| `assignments` | `AssignmentInformation` | **Yes** | Stakeholders coordinating and reviewing the bid estimation files. |
| `timeline` | `TimelineInformation` | **Yes** | Embedded chronological dates split into stored and calculated entities. |
| `financials` | `FinancialInformation` | **Yes** | Composition of money items charting estimated values, costs, and bonds. |
| `status` | `StatusInformation` | **Yes** | Independent record lifecycle and workflow status trackers. |
| `checklist` | `ChecklistInformation` | **Yes** | Pre-study reviews progress indicators (Drawings, BOQs, Specs). |
| `documents` | `DocumentRecord[]` | **Yes** | Array of supporting drawings, letters, and transmittals. |
| `notes` | `NoteRecord[]` | **Yes** | Communications logs between contracts engineers and estimators. |

---

## 3. Detailed Inner Objects Specs

### GeneralInformation
*   `location` (`BilingualString`): Physical site location.
*   `priority` (`Priority` Enum): Bidding urgency `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
*   `department` (`string`): Lead estimating unit.
*   `clientName` (`BilingualString`): Issuing authority or developer.
*   `consultant` (`BilingualString` - Optional): Project supervisory consultant.
*   `branch` (`BilingualString` - Optional): Regional branch managing the file.
*   `businessUnit` (`BilingualString` - Optional): Corporate division owning the bid.
*   `tenderType` (`BilingualString`): E.g., Infrastructure, Civil Construction, MEP.

### AssignmentInformation
*   `coordinator` (`BilingualString`): Administrative PMO bid coordinator.
*   `contractsEngineer` (`BilingualString`): Engineer drafting raw contracts qualifications.
*   `tenderStudyEngineer` (`BilingualString` - Optional): Lead technical estimator.

---

## 4. Business Validation Rules
1.  **Unique Code Enforcement**: `tenderNumber` combined with `projectCode` must form a unique constraint key in the PostgreSQL layer.
2.  **Required Bid bond Ratio**: The bid security `bondAmount` must not exceed 20% of the `estimatedValue`.
3.  **Positive Financial Safeguard**: `estimatedValue` and `bondAmount` are stored as non-negative floats. Negative values are caught during pre-persistence validator checks.

---

## 5. Domain Relationships
*   **One-to-Many with Documents**: A single Tender aggregate rules a local collection of `DocumentRecord` elements.
*   **One-to-Many with Notes**: Translates to a threaded logs chain on the bidding inspect panel.
*   **One-to-One with Project Profile**: Once a Tender workflow state migrates to `AWARDED`, it acts as a generator to instantiate a new `Project` record inside the active Project Controls domain.

---

## 6. Future Extension Roadmap
*   **Costing Engine Sync**: Integrate with an auto-pricing estimator module, mapping live BOQ database rates directly into `estimatedCost` parameter blocks.
*   **RFP Auto-Import**: Connect Gemini Document Intelligence to parse incoming client bids, automatically constructing the `Tender` aggregate.
