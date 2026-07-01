import { ProjectRepository } from '../src/repositories/ProjectRepository';
import { ProjectSetupService } from '../src/services/ProjectSetupService';
import { TenderAwardService } from '../src/services/TenderAwardService';
import { TenderRepository } from '../src/repositories/TenderRepository';
import { ProjectLookupService } from '../src/services/ProjectLookupService';
import { RecordStatus } from '../src/enums/RecordStatus';
import { WorkflowStatus } from '../src/enums/WorkflowStatus';
import { ProjectLifecycleStage, ProjectWorkflowState, ContractType, ProjectStatus, ProjectSetupDraft } from '../src/domain/projects/Project';
import { initialTenders } from '../src/features/pre-award/ongoing-tenders/constants/initialTenders';
import { baselineProjects } from '../src/seed/projectSeed';
import { Clock } from '../src/services/Clock';

// Mock localStorage and sessionStorage for browser environment emulation
class LocalStorageMock {
  public store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}
const localMock = new LocalStorageMock();
(globalThis as any).localStorage = localMock;
(globalThis as any).sessionStorage = new LocalStorageMock();

function assertEquals(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected "${expected}", received "${actual}". Context: ${message}`);
  }
}

function assertDeepEquals(actual: any, expected: any, message: string) {
  const act = JSON.stringify(actual);
  const exp = JSON.stringify(expected);
  if (act !== exp) {
    throw new Error(`Assertion failed: expected "${exp}", received "${act}". Context: ${message}`);
  }
}

async function runRegression() {
  console.log("================ STARTING BROWSER REGRESSION SIMULATION ================");

  // Seed databases
  localStorage.setItem('preaward_tenders_db', JSON.stringify(initialTenders));
  localStorage.setItem('pmo_projects_master', JSON.stringify(baselineProjects));
  localStorage.setItem('preaward_assignments_db', JSON.stringify([]));
  localStorage.setItem('preaward_business_events_db', JSON.stringify([]));

  const tenderRepo = new TenderRepository();
  const projectRepo = new ProjectRepository();
  const lookupService = ProjectLookupService.getInstance();
  const setupService = new ProjectSetupService();
  const awardService = new TenderAwardService();

  const tendersList = await tenderRepo.getAll();
  console.log(`[INIT] Loaded ${tendersList.length} tenders`);

  // Prepare a tender for award
  if (tendersList.length > 0) {
    tendersList[0].status.projectStatus = { en: 'Submitted', ar: 'مقدم' };
    tendersList[0].status.awardStatus = { en: 'Preferred Bidder', ar: 'المقدم المفضل' };
    tendersList[0].status.workflowStatus = WorkflowStatus.SUBMITTED;
    tendersList[0].recordStatus = RecordStatus.ACTIVE;
    await tenderRepo.save(tendersList[0]);
  }

  const freshTenders = await tenderRepo.getAll();
  const tenderToAward = freshTenders[0];
  console.log(`[INIT] Selected tender: ${tenderToAward.tenderNumber}`);

  // 1. Award Project
  console.log("\n>>> STEP 1: Awarding Tender...");
  const TenderMapperModule = await import('../src/mappers/TenderMapper');
  const legacyTender = TenderMapperModule.TenderMapper.toLegacy(tenderToAward);

  const awardResult = await awardService.awardLegacyTender(
    legacyTender,
    'user-1',
    1500000,
    'AED',
    new Date().toISOString().substring(0, 10),
    'LOA-2026-099',
    []
  );

  if (!awardResult.success) {
    throw new Error(`Award failed: ${awardResult.errors.join(', ')}`);
  }
  const project = awardResult.project!;
  console.log(`[AWARD] Project created: ${project.code} (${project.id})`);

  // Initialize lookup cache
  await lookupService.refresh();

  // 2. Setup Project (resume draft)
  console.log("\n>>> STEP 2: Opening Project Setup and Resuming Draft...");
  const initialDraft = await setupService.resumeDraft(project.id);

  // 3. Save Draft
  console.log("\n>>> STEP 3: Saving Draft with valid fields...");
  const completedDraft: ProjectSetupDraft = {
    ...initialDraft,
    completedSteps: [1, 2, 3, 4],
    currentStep: 4,
    commercial: {
      baseCurrency: 'EGP',
      contractCurrency: 'AED',
      exchangeRate: 1,
      exchangeRateDate: '2026-07-01',
      exchangeRateSource: 'Manual',
      contractType: ContractType.LUMP_SUM,
      retentionPercentage: 10,
      advancePaymentPercentage: 10,
      vatPercentage: 15,
      costCenterCode: 'CC-' + project.code,
      employer: 'ORA Developers'
    },
    schedule: {
      startDate: '2026-07-01',
      contractDurationDays: 365,
      mobilizationPeriodDays: 30,
      workingCalendar: '5-Day Week',
      holidayCalendar: 'Egypt Holidays',
      timeZone: 'Africa/Cairo',
      workingHours: '08:00-17:00',
      weekendPattern: 'Friday-Saturday'
    },
    office: {
      teamMembers: [
        { roleId: 'PM', employeeId: 'EMP-Ahmed-Ali', assignedAt: '2026-07-01' },
        { roleId: 'SM', employeeId: 'EMP-Tarek-Hassan', assignedAt: '2026-07-01' },
        { roleId: 'CA', employeeId: 'EMP-Khaled-Mansour', assignedAt: '2026-07-01' },
        { roleId: 'PE', employeeId: 'EMP-Mohamed-Gamal', assignedAt: '2026-07-01' },
        { roleId: 'DC', employeeId: 'EMP-Moustafa-Ibrahim', assignedAt: '2026-07-01' }
      ]
    },
    documents: {
      verifiedDocumentCategories: ['Signed Contract', 'Performance Bond', 'Insurance Certificate']
    }
  };

  const saveSuccess = await setupService.saveDraft(project.id, completedDraft);
  assertEquals(saveSuccess, true, "Save Draft should succeed");
  console.log("[SAVE DRAFT] Draft saved successfully.");

  // Upload required documents as attachments to satisfy policy check
  console.log("\n>>> STEP 4: Simulating required documents upload...");
  const requiredDocsList = setupService.getRequiredDocumentsList();
  for (const docCat of requiredDocsList) {
    await projectRepo.saveAttachment({
      id: `att-${docCat.replace(/\s+/g, '-')}`,
      projectId: project.id,
      category: docCat,
      fileName: `${docCat}.pdf`,
      fileSize: '1.2 MB',
      uploadedBy: 'Estimator Pro',
      uploadedDate: '2026-07-01'
    });
  }
  console.log(`[ATTACHMENTS] Seeded ${requiredDocsList.length} attachments matching required categories.`);

  // 4. Complete Setup
  console.log("\n>>> STEP 5: Completing Setup...");
  const completeResult = await setupService.completeSetup(project.id, completedDraft);
  assertEquals(completeResult.success, true, "Complete Setup should succeed");
  console.log("[COMPLETE SETUP] Setup completed. Project is now Pending Activation.");

  // 5. Activate Project
  console.log("\n>>> STEP 6: Activating Project...");
  const activationResult = await setupService.activateProject(project.id);
  assertEquals(activationResult.success, true, "Activation should succeed");
  console.log("[ACTIVATE] Project activated successfully. workflowState set to ACTIVE.");

  // Clear cache/lookup
  await lookupService.refresh();

  // 6. Close Project -> Reopen Project -> Setup still shows 100% completed
  console.log("\n>>> STEP 7: Reopening Project and checking setup hydration from active aggregate...");
  
  // Re-load the project from repo
  const activeProj = await projectRepo.getById(project.id);
  assertEquals(activeProj?.workflowState, ProjectWorkflowState.ACTIVE, "Project should be ACTIVE");
  assertEquals(activeProj?.setupDraft, undefined, "setupDraft should be removed on active project");

  // Re-run resumeDraft to hydrate setup draft from active aggregate
  const resumedDraft = await setupService.resumeDraft(project.id);

  console.log("\n>>> STEP 8: Asserting Hydrated Draft fields matches activated aggregate...");
  assertEquals(resumedDraft.completedSteps.includes(1), true, "Step 1 should be complete");
  assertEquals(resumedDraft.completedSteps.includes(2), true, "Step 2 should be complete");
  assertEquals(resumedDraft.completedSteps.includes(3), true, "Step 3 should be complete");
  assertEquals(resumedDraft.completedSteps.includes(4), true, "Step 4 should be complete");
  assertEquals(resumedDraft.commercial?.employer, 'ORA Developers', "Commercial employer should match");
  assertEquals(resumedDraft.commercial?.contractType, ContractType.LUMP_SUM, "Commercial contractType should match");
  assertEquals(resumedDraft.schedule?.startDate, '2026-07-01', "Schedule startDate should match");
  assertEquals(resumedDraft.schedule?.contractDurationDays, 365, "Schedule contractDurationDays should match");
  assertEquals(resumedDraft.office?.teamMembers.length, 5, "Office teamMembers count should match");
  
  // Assert validation of hydrated draft returns 100% score
  const finalValidation = await setupService.validateSteps(project.id);
  console.log(`[VALIDATION] Readiness Score: ${finalValidation.readinessScore}%`);
  assertEquals(finalValidation.readinessScore, 100, "Readiness score of active setup should be 100%");
  assertEquals(finalValidation.commercial.isValid, true, "Commercial section should be valid");
  assertEquals(finalValidation.schedule.isValid, true, "Schedule section should be valid");
  assertEquals(finalValidation.office.isValid, true, "Office section should be valid");
  assertEquals(finalValidation.documents.isValid, true, "Documents section should be valid");

  console.log("\n================ BROWSER REGRESSION SIMULATION COMPLETED SUCCESSFULLY ================");
}

runRegression().catch(err => {
  console.error("\n[REGRESSION FAILED]:", err);
  process.exit(1);
});
