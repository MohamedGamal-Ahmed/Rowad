# Implementation Plan - Sprint 1 (Production Stabilization) (Final Revised)

Product Version:
v1.1.0

Development Sprint:
Sprint 1 – Production Stabilization

This implementation plan outlines the revised technical changes to address only the production-blocking defects and stability issues approved for Sprint 1. All UI/UX enhancements, view mode redesigns, search counters, step title renaming, and auto-seeding WBS templates have been completely removed.

## Proposed Changes

### 1. SPR Runtime Stability

#### [MODIFY] [SprReportingEngine.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/registers/SprReportingEngine.tsx)
- Resolve the root cause of the crash by implementing complete null-safety and type-safety checks inside the `useMemo` hooks compiling monthly data arrays (`meetings`, `ipcs`, `claims`, `vos`, `documents`).
- Ensure all filtered list checks verify that each item and its corresponding date string (e.g., `m.date`, `i.ipcSubmissionDate`, `c.submissionDate`) exist and are valid strings before calling `.startsWith(monthStr)`.
- *Note:* The root cause will be eliminated directly in the rendering/filtering logic. An Error Boundary may only be retained as a defensive wrapper, never as the primary fix.

#### [MODIFY] [ProjectWorkspace.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/ProjectWorkspace.tsx)
- Pass a refresh callback `onRefresh={reloadAllProjectData}` to the sub-panels: `IPCsPanel`, `MeetingsPanel`, `ClaimsPanel`, `VariationOrdersPanel`, and `NOCsPanel`.

#### [MODIFY] [IPCsPanel.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/IPCsPanel.tsx), [MeetingsPanel.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/MeetingsPanel.tsx), [ClaimsPanel.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/ClaimsPanel.tsx), [VariationOrdersPanel.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/VariationOrdersPanel.tsx), [NOCsPanel.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/NOCsPanel.tsx)
- Accept `onRefresh?: () => void` in the component props.
- Trigger `onRefresh()` after every database change operation (save, edit, archive, restore, delete) to force parent state update and keep the workspace synchronised.

---

### 2. Dashboard & Sidebar Synchronization

#### [MODIFY] [App.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/App.tsx)
- Compute the active tenders count dynamically from state:
  ```typescript
  const activeTendersCount = tendersList.filter(t => t.recordStatus === 'Active').length;
  ```
- Pass `tendersCount={activeTendersCount}` as a prop to the `Sidebar` component.

#### [MODIFY] [Sidebar.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/components/Sidebar.tsx)
- Accept `tendersCount?: number` (defaulting to 6) in the component signature.
- Bind the Pre-Award Tenders badge count to this dynamic prop:
  ```typescript
  badge: tendersCount
  ```

---

### 3. Tender Validation

#### [MODIFY] [TenderWizardModal.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/pre-award/ongoing-tenders/components/TenderWizardModal.tsx)
- Implement a step validation checker function:
  ```typescript
  const isStepValid = (step: number): { valid: boolean; errorEn: string; errorAr: string } => {
    if (step >= 1) {
      if (!wizardForm.projectNameEn || !wizardForm.projectNameAr || !wizardForm.projectCode) {
        return {
          valid: false,
          errorEn: 'Please enter the required general data in Step 1 to proceed.',
          errorAr: 'يرجى ملء البيانات العامة المطلوبة في الخطوة الأولى للمتابعة.'
        };
      }
    }
    if (step >= 3) {
      if (!wizardForm.techDate || !wizardForm.commDate) {
        return {
          valid: false,
          errorEn: 'Technical and financial submittal dates are mandatory before proceeding.',
          errorAr: 'تواريخ تقديم العطاء الفني والمالي ضرورية جداً لمتابعة برمجة باقي الملفات.'
        };
      }
    }
    return { valid: true, errorEn: '', errorAr: '' };
  };
  ```
- Modify the stepper clicks and "Next Step" button handler to call `isStepValid` and block transition if validation fails, displaying a warning Toast.

---

### 4. Financial Calculations & Decoupling

#### [MODIFY] [SubcontractorsPanel.tsx](file:///d:/M.Gamal/Learn/Projects/Rowad-v1-main/src/features/projects/components/workspace/SubcontractorsPanel.tsx)
- Decouple the input handlers (`handleSubTotalAmtChange`, `handleSubInvAmtChange`, `handleSubCompPctChange`) to remove automatic silent overwriting of already set values.
- Make each field independent so the user can enter `Total Subcontract Amount`, `Till Date Invoiced Amount`, and `Completion Percentage` manually. This ensures user-entered values are preserved exactly.
- Document the WBS limitation by adding a clean helper text below the WBS Work Package dropdown if `wbsPackages.length === 0`:
  - En: `"No WBS packages found. Please define WBS packages in the WBS tab first."`
  - Ar: `"لم يتم العثور على حزم عمل. يرجى تعريف حزم العمل في تبويب WBS أولاً."`

---

## Verification Plan

### Automated Tests
- Run `npx tsx src/tests/run-validation-tests.ts` to verify core business calculations and mappers.
- Run `npx tsc --noEmit` to ensure TypeScript builds with no errors.

### Manual Verification
- Verify that opening the "SPR Reporting" tab on any project loads successfully without white screening.
- Verify that adding a new tender dynamically updates both the Sidebar badge count and Dashboard KPIs.
- Verify that Step 3 dates in the Tender Wizard block step progression when empty.
- Verify that entering/editing subcontractor total amount, invoiced amount, and percentage preserves user inputs exactly.
- Verify that a warning message appears in the subcontractor WBS dropdown when a project has no WBS packages seeded.

### State Synchronization Verification
- Verify that App, Sidebar, Dashboard, Project Workspace, and child panels consume the same application state after CRUD operations, avoiding multiple independent LocalStorage reads during the same session. Ensure that updates in child panels immediately trigger state reload in the parent component and propagate to relevant views without reloading the page.
