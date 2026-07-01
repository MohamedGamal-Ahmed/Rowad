# Developer Onboarding & Contribution Guide

This document is the onboarding manual and development guide for engineers extending the ROWAD Enterprise Platform. It outlines coding standards, DDD boundaries, and step-by-step implementation guides.

---

## 1. Core Architecture Rules (DDD & Clean Architecture)

All contributions must respect the strict separation of layers:
- **Never bypass layers**: UI components must never import repositories directly or execute direct writes to localStorage. All mutations must go through services.
- **Domain is Pure**: Domain models (`src/domain/`) must be side-effect-free, framework-agnostic TypeScript classes. They must not import React hooks or services.
- **Repositories are CRUD**: Repositories must handle saving/loading data only and must contain no business rules or state transition checks.
- **Centralized Presentation**: Styles, colors, icons, and bilingual translations for domain states must be added to presentation services, not hardcoded in views.

---

## 2. Step-by-Step Implementation Guides

### 2.1 How to Create a New Bounded Domain Model
1. Declare the entity type inside `src/domain/`.
2. Ensure the class owns its identity and encapsulates invariants.
   *Example*:
   ```typescript
   export interface Subcontract {
     id: string;
     projectId: string;
     vendorName: string;
     contractSum: number;
     status: 'Draft' | 'Active' | 'Closed';
   }
   ```
3. Add domain validation methods or rule checks directly inside the domain model folder under a `/policies/` sub-folder or inline as a policy validator.

### 2.2 How to Create a New Repository
1. Define a repository contract class under `src/repositories/`.
2. Inherit from default cache invalidation hooks if it is a mutating aggregate.
   *Example*:
   ```typescript
   export class SubcontractRepository {
     public async save(sub: Subcontract): Promise<boolean> {
       // 1. Persist to storage
       // 2. Trigger invalidation callback
       if (ProjectRepository.onSaveCallback) {
         ProjectRepository.onSaveCallback();
       }
       return true;
     }
   }
   ```

### 2.3 How to Create a New Service
1. Create a service file under `src/services/`. Services act as the application coordinator.
   *Example*:
   ```typescript
   export class SubcontractService {
     constructor(private repo = new SubcontractRepository()) {}
     
     public async registerSubcontract(sub: Subcontract): Promise<boolean> {
       // Validate business rules
       if (sub.contractSum <= 0) throw new Error("Contract value must be positive.");
       return this.repo.save(sub);
     }
   }
   ```

### 2.4 How to Add a Validation Rule
1. Open the appropriate validator (e.g. `src/validators/TenderValidator.ts`) or create a new class.
2. Ensure it returns a list of error strings rather than throwing exceptions directly.
3. Hook the validator into the corresponding service method before calling repository write endpoints.

### 2.5 How to Add a Portfolio KPI
1. Define the KPI property in the target view state (e.g., `src/features/projects/components/ProjectList.tsx` memoized `kpis`).
2. Implement the mathematical aggregation inside `src/business-rules/FinancialsCalculator.ts` or a new calculator class.
3. Render the computed metric inside `ProjectKpiBoard.tsx`.

### 2.6 How to Add a New Panel to the Workspace
1. Create your feature panel file under `src/features/projects/components/workspace/` (e.g., `RisksPanel.tsx`).
2. Register the tab identifier and layout mappings in the main workspace controller [ProjectWorkspace.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/ProjectWorkspace.tsx).
3. Import and render the panel conditionally under the tab content router.

---

## 3. Coding Standards & Naming Conventions

### File Naming Conventions
- **React Components**: PascalCase (e.g., `ProjectStatusBadges.tsx`).
- **Services/Calculators**: PascalCase (e.g., `StatusPresentationService.ts`).
- **Domain Models**: CamelCase or PascalCase based on aggregate definition.

### TypeScript Conventions
- Avoid `any` where possible. Use explicit interface mappings.
- Use enums (`src/enums/`) or string unions for fixed state models (e.g. `RecordStatus`).

---

## 4. Verification Checklists

### Developer Pull Request Checklist
- [ ] TypeScript check compiles clean (`npm run lint` / `npx tsc --noEmit`).
- [ ] Production build succeeds without bundler warnings (`npm run build`).
- [ ] Centralized presentation classes are used (no hardcoded state colors).
- [ ] Cache invalidation callbacks are invoked on every write path.
- [ ] Bilingual text helper `<BiText />` is applied for all user-facing strings.

### QA Regression Checklist
- [ ] Verify state isolation (mutating Project A does not contaminate Project B).
- [ ] Verify browser refresh simulation (local storage reload retains active states).
- [ ] Verify KPI cards calculate sums dynamically.
