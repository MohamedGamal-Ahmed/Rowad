# UI Blueprint: Project Controls Screen
**Status:** Approved Specification  

---

## 1. Purpose
The **Project Controls Screen** (previously Project Execution) is the portal for site transaction control. It tracks contract events (IPCs, Claims, Scope Changes, NOCs) on active construct contracts, ensuring complete auditing trails.

---

## 2. Data Sources
*   PostgreSQL site transactions database.

---

## 3. Services and Mappers Used
*   `ProjectControlsRepository`: Direct database fetch loops.
*   `FinancialsCalculator`: Standardizes values, formatting currencies dynamically.

---

## 4. Domain Objects Involved
*   `ProjectControlsRecord` (Transaction models of type IPC, Claim, Variation Order, NOC).
*   `SinglePaperReport` (dynamically generated report).

---

## 5. Applied Business Rules & Calculations
*   **State Machine Transitions**: Evaluates allowed site claim states (e.g. Logged ➔ Under Review ➔ Approved ➔ Paid).
*   **Progress Bounds Enforcement**: Validates that physical site install completeness is always inside `[0, 100]`.

---

## 6. User Actions
*   **Submit Site Log**: Register a new contract claim or payment certificate.
*   **Transition Statuses**: Advance logs through review loops.
*   **Generate SPR (Single Paper Report)**: Pull live contract values to construct reporting dashboards on-demand.

---

## 7. Future Extensions
*   **Bidirectional ERP Integration**: Sync directly with financial ledger applications.
