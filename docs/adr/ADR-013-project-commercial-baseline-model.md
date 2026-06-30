# ADR-013: Project Commercial Baseline Model Consolidations

## Status
Approved

## Context
During the evolution of Sprint 3 (IPC, Variation Orders, and Subcontracts), the `Project` entity aggregate accumulated several redundant and duplicated financial fields representing the commercial baseline, specifically:
- `contractValue` (legacy initial value)
- `originalContractValue` (redundant initial value duplicate)
- `approvedVoTotal` (cumulative variation total)
- `revisedContractValue` (recalculated baseline total)

Maintainability and Domain-Driven Design (DDD) principles dictate having a single source of truth for the initial immutable signed contract value, a single source of truth for the cumulative variation total, and a single source of truth for the recalculated revised commercial baseline.

## Decision
We consolidate the `Project` financial model by:
1. Renaming `contractValue` to `signedContractValue` across all layers (Domain, Services, UI registers, lists, forms, and seeds).
2. Deleting the redundant `originalContractValue` property entirely from the project aggregate.
3. Renaming `approvedVoTotal` to `approvedVariationTotal` to align with the enterprise term (Variation Orders rather than generic VOs).
4. Keeping `revisedContractValue` as the calculated commercial baseline representing `signedContractValue + approvedVariationTotal`.
5. Offloading local storage database upgrades to a versioned `MigrationRunner` that runs on application startup (`src/main.tsx`), keeping repositories pure CRUD and free of migration logic.

```
[Legacy State]
contractValue (SSoT) ──┐
originalContractValue ─┼─► consolidated into ──► signedContractValue (Immutable)
approvedVoTotal ───────┼─► renamed to ────────► approvedVariationTotal (Calculated)
revisedContractValue ──┘──────────────────────► revisedContractValue (Calculated)
```

## Consequences
- **Single Source of Truth:** Codebase is free of redundant baseline fields.
- **Acyclic Dependencies:** Variation Orders write to the baseline `approvedVariationTotal` and recalculate `revisedContractValue` via `CalculationService`. All downstream modules (IPCs, Subcontracts, Claims, NOCs, and Single Paper Reports) read from `revisedContractValue` but never mutate it.
- **Safe Bootstrapping:** Schema migrations execute once before React mounts, preventing runtime exceptions on old storage records.
