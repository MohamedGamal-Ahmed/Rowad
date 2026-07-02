# ExecutivePortfolioRow — Field Dictionary

Source of truth: `src/bi/dto/ExecutivePortfolioRow.ts`. Every field is either **RAW** (copied verbatim from the Operational Layer, no math) or **CALCULATED** (produced exclusively by one of the four `src/bi/calculators/*`). A field with no legitimate calculation yet is `undefined` — never `0`, never `''`, never fabricated. `undefined` fields are simply absent from the JSON output (see the real Sprint 5.1 run — `p-1`/`p-3` omit `executionProgressPercentage`, `healthScore`, `riskScore` entirely).

## Identity

| Field | Type | Class | Source |
|---|---|---|---|
| `projectId` | string | RAW | `Project.id` |
| `projectCode` | string | RAW | `Project.code` |
| `nameEn` | string | RAW | `Project.nameEn` |
| `nameAr` | string? | RAW | `Project.nameAr` |
| `sourceTenderId` | string? | RAW | `Project.sourceTenderId` |
| `sourceTenderNumber` | string? | RAW | `Project.sourceTenderNumber` |
| `country` | string | RAW | `Project.country` |
| `city` | string | RAW | `Project.city` |
| `client` | string | RAW | `Project.client` (free-text today — QA #29, not FK'd to MasterData) |
| `employer` | string | RAW | `Project.employer` |
| `consultant` | string | RAW | `Project.consultant` |
| `mainContractor` | string | RAW | `Project.mainContractor` |
| `department` | string | RAW | `Project.department` |
| `businessUnit` | string | RAW | `Project.businessUnit` |
| `coordinator` | string | RAW | `Project.coordinator` (free-text today — QA #8/#28) |
| `projectManager` | string | RAW | `Project.projectManager` |

## Lifecycle

| Field | Type | Class | Source |
|---|---|---|---|
| `recordStatus` | RecordStatus | RAW | `Project.recordStatus` |
| `status` | ProjectStatus | RAW | `Project.status` |
| `lifecycleStage` | ProjectLifecycleStage | RAW | `Project.lifecycleStage` |
| `workflowState` | ProjectWorkflowState? | RAW | `Project.workflowState` |
| `isSetupComplete` | boolean | RAW | `Boolean(Project.isSetupComplete)` |

## Commercial

| Field | Type | Class | Source |
|---|---|---|---|
| `contractType` | ContractType | RAW | `Project.contractType` |
| `deliveryMethod` | DeliveryMethod? | RAW | `Project.deliveryMethod` |
| `currency` | string | RAW | `Project.currency` |
| `exchangeRate` | number? | RAW | `Project.commercialSettings?.exchangeRate` |
| `signedContractValue` | number | RAW | `Project.signedContractValue` (immutable at Award) |
| `revisedContractValue` | number? | RAW | `Project.revisedContractValue` (persisted by `CalculationService.calculateProjectChangeBaseline`, not recomputed here) |
| `approvedVariationValue` | number? | RAW | `Project.approvedVariationTotal` |
| `retentionPercentage` | number? | RAW | `Project.commercialSettings?.retentionPercentage` |
| `advancePaymentPercentage` | number? | RAW | `Project.commercialSettings?.advancePaymentPercentage` |
| `vatPercentage` | number? | RAW | `Project.commercialSettings?.vatPercentage` |
| `normalizedContractValue` | MultiCurrencyValue? | **CALCULATED** | `PortfolioValueCalculator` — `revisedContractValue ?? signedContractValue`, normalized via `FinancialsCalculator.sumAmounts` |

## Important Dates (all RAW)

`awardedAt`, `startDate`, `mobilizationDate`, `contractDurationDays`, `mobilizationPeriodDays`, `approvedEotDays`, `contractualCompletionDate`, `revisedCompletionDate`, `forecastCompletionDate`, `completionDate` — all copied verbatim from the matching `Project` field.

## Setup Progress (CALCULATED — `PortfolioProgressCalculator`)

| Field | Type | Source |
|---|---|---|
| `setupReadinessScore` | number? | `ActivationPolicyResult.readinessScore` from `ProjectSetupService.evaluatePolicy()` — not recomputed |
| `setupStepsPassed` | `{commercial, schedule, office, documents}`? | `ActivationPolicyResult.stepResults.*.pass` |

## Execution Summary

| Field | Type | Class | Source |
|---|---|---|---|
| `meetingsCount` ... `wbsPackageCount` (9 count fields) | number | RAW | Array length from `ProjectLookupService.get*(projectId)`, excluding `RecordStatus.ARCHIVED` sub-records (attachments/WBS have no `recordStatus`, so counted as-is) |
| `totalCertifiedIpcValue` | MultiCurrencyValue? | **CALCULATED** | `PortfolioValueCalculator` — sum of IPCs with status in `{Certified, Paid, Partially Paid}`, using `certifiedGrossValue ?? certifiedAmount` |
| `totalOutstandingIpcValue` | MultiCurrencyValue? | **CALCULATED** | `PortfolioValueCalculator` — `netCertifiedAmount − Σ(non-archived, non-rejected payments)`, floored at 0 |
| `totalApprovedClaimValue` | MultiCurrencyValue? | **CALCULATED** | Sum of claims with `status === 'Approved'`, using `approvedAmount` |
| `totalApprovedVoValue` | MultiCurrencyValue? | **CALCULATED** | Sum of VOs with `status ∈ {Approved, Implemented}`, using `approval.approvedAmount` |
| `totalSubcontractInvoicedValue` | MultiCurrencyValue? | **CALCULATED** | Sum of `tillDateInvoicedAmount` across active subcontracts |

## Management KPIs

| Field | Type | Class | Rule |
|---|---|---|---|
| `executionProgressPercentage` | number? | **CALCULATED** | `PortfolioProgressCalculator`: Pre-Award → `0`; Pending Project Setup → `setupReadinessScore`; Ready for Mobilization → `100`; Execution → `undefined` (Not Implemented — no execution-progress engine exists yet); Completed/Closed (via `status`, since these names live on `status` not `lifecycleStage`) → `100` |
| `healthScore` | HealthStatus? | **CALCULATED** | `PortfolioHealthCalculator` — always `undefined` today. No approved project-health formula exists (the existing `HealthCalculator` is Tender-shaped: daysRemaining/milestones/submissionDate, which `Project` does not carry) |
| `riskScore` | number? | **CALCULATED** | `PortfolioRiskCalculator` — always `undefined` today. No Risk Register module exists yet (CLAUDE.md §12, Future Architecture) |

## `MultiCurrencyValue` shape (used by every monetary field above)

```ts
{
  amount: number;              // raw amount in original transactional currency
  currency: string;            // original currency code
  exchangeRate?: number;
  baseCurrency?: string;       // portfolio reporting currency (AED by default)
  amountInBaseCurrency?: number; // via FinancialsCalculator.sumAmounts — never fabricated
}
```
