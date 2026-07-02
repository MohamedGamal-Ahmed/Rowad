# ExecutivePortfolio — Data Lineage

Traces every value on `ExecutivePortfolioRow` back to its physical origin in the Operational Layer, through the exact code path that touches it. No field on this dataset is entered directly by a BI-layer user — everything traces to a Project (or a Project sub-entity) created through the existing operational workflows (Award, Setup Wizard, IPC/Claims/VO/NOC/Subcontract panels).

## Lineage chain (per row)

```
LocalStorage key "pmo_projects_master"
  → ProjectRepository.getAll() / getById()
    → ProjectLookupService.getProjects() (cached, invalidated on ProjectRepository.onSaveCallback)
      → ExecutivePortfolioService.getPortfolio()
        → ExecutivePortfolioBuilder.build(project)
          ├─ collectRelatedEntities(project)  — reads 9 sub-entity collections via ProjectLookupService
          │    (LocalStorage keys: pmo_project_meetings, pmo_project_ipcs, pmo_project_claims,
          │     pmo_project_vos, pmo_project_nocs, pmo_project_subcontracts, pmo_project_documents,
          │     pmo_project_attachments, pmo_project_wbs — see src/repositories/ProjectRepository.ts)
          ├─ ProjectSetupService.evaluatePolicy(project.id)
          │    → ProjectActivationPolicy.evaluate(project, undefined, attachments, requiredDocs)
          ├─ PortfolioValueCalculator.calculate({project, ipcs, claims, variationOrders, subcontracts})
          │    → FinancialsCalculator.sumAmounts(...) for every MultiCurrencyValue
          ├─ PortfolioProgressCalculator.calculate({project, setupPolicyResult})
          ├─ PortfolioHealthCalculator.calculate({project, nocs, claims, variationOrders}) → always undefined
          ├─ PortfolioRiskCalculator.calculate({project, claims, variationOrders, nocs}) → always undefined
          └─ assembleRow(...) — pure merge, zero computation
        → PortfolioFilterEngine.apply(rows, filter)
      → ExecutivePortfolioDataset (= ExecutivePortfolioRow[])
```

## Example lineage — `p-1` / `ZED-Z02` (from the captured Sprint 5.1 run)

| BI field | Value | Physically comes from |
|---|---|---|
| `projectCode` | `"ZED-Z02"` | `src/seed/projectSeed.ts` → `baselineProjects[0].code`, persisted into `localStorage["pmo_projects_master"]` on first load |
| `signedContractValue` | `1,250,000,000` | Same seed row, `signedContractValue` — set once at Award, never recalculated |
| `normalizedContractValue.amountInBaseCurrency` | `95,000,000` AED | `revisedContractValue` (1,250,000,000 EGP) × `FinancialsCalculator`'s fixed EGP→AED rate (0.076) |
| `variationOrdersCount` | `1` | `localStorage["pmo_project_vos"]` filtered to `projectId === 'p-1'`, `recordStatus !== 'Archived'` — from `src/seed/projectRecordsSeed.ts` |
| `totalApprovedVoValue.amount` | `1,850,000` EGP | Sum of `approval.approvedAmount` across that project's VOs with `status ∈ {Approved, Implemented}` |
| `setupReadinessScore` | `0` | `ProjectActivationPolicy.evaluate()` — this seed project has no `commercialSettings`/`setupDraft`, so every step (`commercial`, `schedule`, `office`, `documents`) fails validation |
| `executionProgressPercentage` | *(absent — undefined)* | `lifecycleStage === 'Execution'` → `PortfolioProgressCalculator` returns `undefined` by design (no execution-progress engine exists) |

## Notable lineage finding from the proof run (data-quality observation, not a dataset defect)

All 3 seed projects (`p-1`, `p-2`, `p-3`) have `setupReadinessScore = 0` because none of them carry `Project.commercialSettings` in the seed data, even though `p-1` and `p-3` are already `lifecycleStage: 'Execution'` with real IPC/Claim/VO activity. This is a genuine gap in `src/seed/projectSeed.ts` (projects were seeded directly into Execution without a corresponding completed Setup Wizard run) — the BI layer is correctly surfacing it rather than masking it. Flagged for whoever owns seed-data fidelity; not a Sprint 5.1 BI defect.

## Cache invalidation note

`ProjectLookupService` caches `getProjects()` results and only invalidates on `ProjectRepository.onSaveCallback` (fired by `ProjectRepository.save()`). The dataset itself is never cached by the BI layer — every `getPortfolio()` call re-reads from `ProjectLookupService`, so a stale `ProjectLookupService` cache is the only possible staleness vector, and it already exists independently of this BI layer.
