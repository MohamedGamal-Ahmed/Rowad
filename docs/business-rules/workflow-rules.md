# Business Specification: Workflow Rules
**Category:** Estimation & Contract Approvals  
**Status:** Approved Product Specification  

---

## 1. Context and Intent
Workflow rules govern the progress states of bidding tenders. System actions, validations, and user transitions are structured to restrict premature submissions and guarantee legal compliance.

---

## 2. Managed Workflow States
*   **Draft**: Preliminary study. Content is scratchpad quality. Estimators map basic properties.
*   **Under Study**: Formally active. Estimating engineers actively compile BOQs and analyze designs.
*   **Ready for Submission**: Technical and commercial files completed, vetted by legal, and signed off by the PMO Coordinator.
*   **Submitted**: Dispatched to clients. Under external commercial evaluations.
*   **Under Negotiation**: Shortlisted. Client request for clarifying values or negotiating price points.
*   **Awarded**: Contract formally awarded to ROWAD. Generates active Site Controls structures.
*   **Lost / Cancelled**: Tender canceled by client, or bid rejected. Terminal statuses.

---

## 3. Strict State Transition Logic
1.  **Draft to Under Study**: Permitted only if the project contains assignments (Coordinator and Contracts Engineer) registered under the aggregate structure.
2.  **Under Study to Ready for Submission**: Allowed only if all mandatory pre-requisites checklists have been reviewed and marked complete (Drawings, BOQs, Specs).
3.  **Awarded Generation**: Transition to `AWARDED` requires valid non-zero `estimatedValue` values.

---

## 4. Operational Actions
*   Triggers standard visual alerts and log records tracking workflow status changes, enabling comprehensive PMO process monitoring.
