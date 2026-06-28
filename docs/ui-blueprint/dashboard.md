# UI Blueprint: Management Dashboard Screen
**Status:** Approved Specification  

---

## 1. Purpose
The **Management Dashboard** provides executives with high-level KPI overviews, multi-currency bid values, pending operational transactions, and progress indicators across Pre-Award and Site Execution activities.

---

## 2. Data Sources
*   PostgreSQL `Pre-Award Tenders` and `Project Controls (Site Execution)` databases.

---

## 3. Services and Mappers Used
*   `CalculationService`: Aggregates and converts multiple bids, calculating grand totals.
*   `TenderService`: Provides ongoing tenders counts and urgency rates.

---

## 4. Domain Objects Involved
*   `Tender` and `ProjectControlsRecord`.
*   `Money` value objects (for currency conversion reporting).

---

## 5. Applied Business Rules & Calculations
*   **On-Demand Aggregate Computations (ADR-011)**: All totals, averages, and alert badges are computed on-the-fly inside the service layers.
*   **Standard Multi-Currency Summation Math**: Bids in SAR/EGP/USD are converted to AED using standard PMO exchange rates for tabular display consistency.

---

## 6. User Actions
*   **Toggle Target Currencies**: Dynamically refresh the corporate statistics using AED, SAR, or USD.
*   **Click KPI Cards**: Drill-down to filtered lists matching selected categories.

---

## 7. Future Extensions
*   **Predictive Cost Warnings**: Uses historic site transaction trends to flag bids likely to run over estimation margins.
*   **Interactive Geo-mapping**: Map KSA and Dubai active projects onto an interactive geographic map.
