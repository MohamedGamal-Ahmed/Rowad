# Business Specification: Health & Delay Indicators Rules
**Category:** Operations Advisory Dashboard  
**Status:** Approved Product Specification  

---

## 1. Context and Intent
The platform uses visual health flags to direct planners' attention to critical deadlines, delaying crises through early warnings rather than late alerts.

---

## 2. Health Calculations Strategy Specifications

Calculated using days remaining ($D_{rem}$) until the Technical Submission Date ($D_{tech}$).

$$D_{rem} = \text{Target\_Submission\_Date} - \text{Current\_Date}$$

The **Health Evaluation Strategy** maps $D_{rem}$ to status codes:

### Standard Strategy Logic Code
1.  **Archived**: If the envelope `RecordStatus === RECORD_STATUS.ARCHIVED`, the health label returns `Archived` regardless of dates.
2.  **Overdue**: If $D_{rem} < 0$, the tender is marked `Overdue`.
3.  **Due Soon**: If $D_{rem} \in [0, 7]$ days, the tender is flagged `Due Soon`. Represents high urgency.
4.  **Healthy**: If $D_{rem} > 7$ days, the file is in a safe planning window, displayed as `Healthy`.

---

## 3. Extensible Strategy Design Pattern
By leveraging the **Strategy Pattern** inside the `HealthCalculator`, the company can hot-swap planning profiles:
*   *Tight Deadlines Strategy*: Scales "Due Soon" warnings to 3 days.
*   *Extended Megaproject Strategy*: Sets "Due Soon" thresholds at 14 days, reflecting long administrative sign-off processes on multi-billion SAR KSA bids.

---

## 4. Visual Dashboard Cues
*   `Healthy`: Soft emerald color tone.
*   `Due Soon`: Warning amber.
*   `Overdue`: High-contrast dark crimson.
*   `Archived`: Neutral corporate gray.
