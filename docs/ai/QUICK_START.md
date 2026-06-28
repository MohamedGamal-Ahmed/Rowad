# ROWAD Enterprise - Developer Onboarding & Quick Start

Welcome to the **ROWAD Enterprise Platform**. This guide provides a rapid 5-minute onboarding path.

For complete architectural mapping, structural database planning, and system strategies, consult the master [Living Product Specification (PROJECT_BOOK.md)](./PROJECT_BOOK.md).

---

## 1. Fast Diagnostics

Ensure system health before and after code changes by invoking:

```bash
# Compile and check TypeScript syntax & declarations
npm run lint
```

Maintain **Zero TypeScript Errors** and **Zero ESLint Warnings**.

---

## 2. Dynamic Architecture Summary

All files in this repository strictly adhere to Clean Architecture boundaries:

```
[React View] ──► [Application Service] ──► [Repository Layer] ──► [Mapper] ──► [Pure Domain Model / Rules]
```

* **UI Controllers**: Pure React files under `/src/views` and `/src/features` handle only visual layout. They list, sort, and display state using Tailwind CSS classes.
* **Orchestration Services**: Services in `/src/services` handle state mutations, triggers, and query calculations.
* **Calculators & Rules**: Immutable mathematical operations reside inside `/src/business-rules/`. 

To understand detailed service orchestration dependencies, see the [Service Dependency Matrix](./PROJECT_BOOK.md#7-service-dependency-matrix).

---

## 3. The Onboarding Commandments (Must Never Break)

1. **Zero Calculations inside React**: All estimations, day offsets, status indicators, and currency conversions belong inside raw calculators or orchestration services.
2. **Never Call Repositories directly from Views**: React UI cards must never know that databases, mappers, or repositories exist. Access them exclusively through services.
3. **No Const Enums**: Declare standard TypeScript `enum` models. Verify that all standard imports reside at the top of file headers.

These rules are programmatically enforced. For detailed engineering guidelines, consult the [AI Collaboration Guide (PROJECT_BOOK.md#21-ai-collaboration-guide-mandatory-commandments)](#).

---

## 4. Primary Development Paths

* **`DashboardService`**: Connects active pre-award estimates and post-award execution ledgers to deliver unified KPIs. Includes cache controllers.
* **`TenderService`**: Connects proposal wizards to business guidelines.
* **`ProjectControlsService`**: Tracks construction ledger transactions (IPCs, Claims, Variation Orders).
* **`FinancialsCalculator` / `TimelineCalculator`**: Pure mathematical calculations.

To begin implementation, refer to the [Functional Requirements by Module in the Master Book](./PROJECT_BOOK.md#3-functional-requirements-by-module).
