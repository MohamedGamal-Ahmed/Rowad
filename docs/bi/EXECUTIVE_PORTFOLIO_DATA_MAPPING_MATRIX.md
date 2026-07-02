# ExecutivePortfolio — Data Mapping Matrix

Operational-layer entity → BI dataset field(s). Complements the Field Dictionary (field-first view) with an entity-first view — useful when a source entity changes shape and you need to know which BI fields are affected.

## `Project` (aggregate root) → `ExecutivePortfolioRow`

Nearly every Identity/Lifecycle/Commercial/Date field on `ExecutivePortfolioRow` maps 1:1 to a same- or similarly-named `Project` field. See `EXECUTIVE_PORTFOLIO_FIELD_DICTIONARY.md` for the full list — not repeated here to avoid duplication (CLAUDE.md §7: no duplicated business logic or field lists as separate sources of truth). Exceptions/derived mappings only:

| `Project` field | Maps to | Note |
|---|---|---|
| `commercialSettings?.exchangeRate` | `exchangeRate` | flattened out of the nested object |
| `commercialSettings?.retentionPercentage` | `retentionPercentage` | flattened |
| `commercialSettings?.advancePaymentPercentage` | `advancePaymentPercentage` | flattened |
| `commercialSettings?.vatPercentage` | `vatPercentage` | flattened |
| `revisedContractValue ?? signedContractValue` | `normalizedContractValue` (via `PortfolioValueCalculator`) | fallback chain, not a raw copy |
| `isSetupComplete` (possibly `undefined`) | `isSetupComplete` | coerced via `Boolean(...)` |

## `ProjectMeeting[]` → `ExecutivePortfolioRow.meetingsCount`

Count of meetings where `recordStatus !== RecordStatus.ARCHIVED`. No other field consumed.

## `ProjectIPC[]` → `ExecutivePortfolioRow.{ipcsCount, totalCertifiedIpcValue, totalOutstandingIpcValue}`

| `ProjectIPC` field | Maps to |
|---|---|
| (count, non-archived) | `ipcsCount` |
| `status ∈ {Certified, Paid, Partially Paid}` + `certifiedGrossValue ?? certifiedAmount` | `totalCertifiedIpcValue` |
| `netCertifiedAmount ?? certifiedAmount` − Σ `payments[].paymentAmount` (excluding archived/rejected) | `totalOutstandingIpcValue` |

IPC commercial fields (`certifiedGrossValue`, `netCertifiedAmount`, `retentionDeduction`, etc.) are read as **already-persisted RAW values** — written by the operational IPCsPanel → `CalculationService.calculateIpcCommercials` flow. `PortfolioValueCalculator` never re-derives retention/advance/withholding math; it only sums what the operational layer already certified.

## `ProjectClaim[]` → `ExecutivePortfolioRow.{claimsCount, totalApprovedClaimValue}`

| `ProjectClaim` field | Maps to |
|---|---|
| (count, non-archived) | `claimsCount` |
| `status === 'Approved'` + `approvedAmount` | `totalApprovedClaimValue` |
| (all claims, via `PortfolioHealthCalculator`/`PortfolioRiskCalculator` inputs) | accepted but unused — both calculators return `undefined` today |

## `ProjectVariationOrder[]` → `ExecutivePortfolioRow.{variationOrdersCount, totalApprovedVoValue}`

| `ProjectVariationOrder` field | Maps to |
|---|---|
| (count, non-archived) | `variationOrdersCount` |
| `status ∈ {Approved, Implemented}` + `approval.approvedAmount` | `totalApprovedVoValue` |

## `ProjectNOC[]` → `ExecutivePortfolioRow.nocsCount`

Count only (non-archived). Also passed into `PortfolioHealthCalculator`/`PortfolioRiskCalculator` — unused, both return `undefined`.

## `ProjectSubcontract[]` → `ExecutivePortfolioRow.{subcontractsCount, totalSubcontractInvoicedValue}`

| `ProjectSubcontract` field | Maps to |
|---|---|
| (count, non-archived) | `subcontractsCount` |
| `tillDateInvoicedAmount` (summed, active only) | `totalSubcontractInvoicedValue` |

## `ProjectDocument[]` → `ExecutivePortfolioRow.documentsCount`

Count only (non-archived).

## `ProjectAttachment[]` → `ExecutivePortfolioRow.attachmentsCount`

Count only. `ContextualAttachment` carries no `recordStatus`, so every returned attachment counts (no archive filter applies).

## `WBSPackage[]` → `ExecutivePortfolioRow.wbsPackageCount`

Count only. `WBSPackage` carries no `recordStatus`, so every returned package counts.

## `ActivationPolicyResult` (from `ProjectSetupService.evaluatePolicy`, not a stored entity — computed on demand) → `ExecutivePortfolioRow.{setupReadinessScore, setupStepsPassed}` and indirectly `executionProgressPercentage`

| `ActivationPolicyResult` field | Maps to |
|---|---|
| `readinessScore` | `setupReadinessScore`, and (only when `lifecycleStage === 'Pending Project Setup'`) `executionProgressPercentage` |
| `stepResults.commercial.pass` | `setupStepsPassed.commercial` |
| `stepResults.schedule.pass` | `setupStepsPassed.schedule` |
| `stepResults.office.pass` | `setupStepsPassed.office` |
| `stepResults.documents.pass` | `setupStepsPassed.documents` |

## Entities intentionally NOT mapped

- **Tender** — `sourceTenderId`/`sourceTenderNumber` are copied RAW from `Project`, but the original `Tender` aggregate itself is never re-read. Dropped during Sprint 5.0 Phase 6 review because no `ExecutivePortfolioRow` field needs pre-award Tender data. Add a lineage entry here only if a future field legitimately requires it.
- **ProjectSPR** — not consumed. SPR is itself a Read Model (ADR-011); this BI dataset does not read from another Read Model.
- **MasterData** (Client/Employer/Consultant/Contractor/Country/Currency master lists) — not joined. `client`/`employer`/`consultant`/`mainContractor`/`country`/`currency` on `ExecutivePortfolioRow` are the free-text values stored directly on `Project` (QA #2/#8/#28/#29 — these fields are not yet FK'd to MasterData at the Project level).
