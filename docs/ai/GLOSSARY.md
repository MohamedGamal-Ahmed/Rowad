# ROWAD Enterprise - Core Glossary Companion

This vocabulary reference defines construction engineering terms, abbreviations, and modules used across the ROWAD platform.

For database design shapes, integration maps, and API endpoints, refer to the [Living Product Specification (PROJECT_BOOK.md)](./PROJECT_BOOK.md).

---

## Terminology Directory

| Term / Abbreviation | Definition & Role | Domain Context | Master Reference Link |
| :--- | :--- | :--- | :--- |
| **AED** | United Arab Emirates Dirham. The uniform corporate currency used to parse, balance, and report entire portfolios. | Dashboards, Post-Award | [Non-Functional Specs](./PROJECT_BOOK.md#4-non-functional-requirements) |
| **Bidding Bond** | Tender Bond. Financial guarantee backing contractor capabilities. Auto-calculates dynamically at exactly **2.0%** of estimated value. | Pre-Award proposals | [Pre-Award Module](./PROJECT_BOOK.md#32-module-b-pre-award-proposals-tenders) |
| **BOQ** | Bill of Quantities. Systematic ledger of structural materials, unit rates, and physical tasks. | Estimation panels | [Product Scope](./PROJECT_BOOK.md#2-product-scope) |
| **Claim** | Progressive request for financial compensation or schedule expansions resulting from unforeseen site barriers. | Post-Award execution | [Project Controls Module](./PROJECT_BOOK.md#33-module-c-post-award-project-execution-project-controls) |
| **EDMS** | Electronic Document Management System. Core folder vault managing drawing revisions, files, and engineering transmittals. | Document Control logs | [Document Control Module](./PROJECT_BOOK.md#34-module-d-engineering-document-control-document-control) |
| **IPC** | Interim Payment Certificate. Progressive invoices issued periodically tracking completed physical site milestones. | Post-Award progress | [Project Controls Module](./PROJECT_BOOK.md#33-module-c-post-award-project-execution-project-controls) |
| **Makers & Checkers** | Double-audit pipeline enforcing that creator submissions ("makers") get reviewed by separate authorities ("checkers"). | Document Control, Admin | [Document Control Module](./PROJECT_BOOK.md#34-module-d-engineering-document-control-document-control) |
| **NOC** | No Objection Certificate. Legal municipal clearance certificates authorizing physical works. | Post-Award logging | [Project Controls Module](./PROJECT_BOOK.md#33-module-c-post-award-project-execution-project-controls) |
| **SPR** | Single Page Report. Dynamic visual KPI summary illustrating timeline, margins, and health ratios compiled on-demand. | Dashboard analytics | [Executive Analytics Module](./PROJECT_BOOK.md#31-module-a-executive-analytics-dashboard-dashboard) |
| **Variation Order (VO)** | Explicit contract amendments altering original design shapes, unit rates, or durations on active projects. | Post-Award execution | [Project Controls Module](./PROJECT_BOOK.md#33-module-c-post-award-project-execution-project-controls) |

---

## Conceptual Separations

As detailed in the [Product Scope (PROJECT_BOOK.md#2-product-scope)](./PROJECT_BOOK.md#2-product-scope), ROWAD manages the engineering controls aspect of mega-infrastructure, delegating corporate General Ledger accounting directly to external ERP instances.
