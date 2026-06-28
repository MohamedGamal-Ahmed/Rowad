# Business Specification: Timeline Rules
**Category:** PMO & Schedule Optimization  
**Status:** Approved Product Specification  

---

## 1. Context and Intent
The PMO uses standardized timeline offsets to plan bid tracking progress. By applying these rules relative to the client's Technical Submission Date, estimators are structured into progress tracks without manual calculation overhead.

---

## 2. Offset Rules Math Specifications

All calculations use the baseline Technical Submission Date ($D_{tech}$) and apply negative integer values (days prior).

$$M_{milestone} = D_{tech} + Offset_{days}$$

### Baseline PMO Configurations
*   **Kick-off Offset ($O_{kick}$)**: `-30` days. Specifies when the team initiates the study.
*   **Risk Assessment Offset ($O_{risk}$)**: `-20` days. Target deadline for risk register analysis.
*   **Contractual Qualifications Offset ($O_{qual}$)**: `-15` days. Absolute deadline for drafting legal deviations.
*   **Alignment Offset ($O_{align}$)**: `-10` days. Specifies the team reconciliation review meeting.
*   **Intermediate Follow-up Offset ($O_{follow}$)**: `-5` days. Final technical sanity verification checklist.

---

## 3. Boundary & Validation Rules
1.  **Rule Chronical Integrity ($V_{chrono}$)**: 
    $$O_{kick} < O_{risk} < O_{qual} < O_{align} < O_{follow} < 0$$
    If any administrative setting violates this order, the settings validator raises errors to prevent planning conflicts.
2.  **Date Validity Check**: If the $D_{tech}$ string is empty, null, or represents an invalid calendar date, the Calculator returns empty results gracefully without throwing script runtime crashes.

---

## 4. Operational Actions
*   **Configuration Control**: PMO Administrators update global offsets from the corporate Settings Panel. Updates are immediately reflected across calculated lists upon refresh.
