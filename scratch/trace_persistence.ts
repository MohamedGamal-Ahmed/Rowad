import { ProjectRepository } from '../src/repositories/ProjectRepository';
import { ProjectLookupService } from '../src/services/ProjectLookupService';
import { ProjectSetupService } from '../src/services/ProjectSetupService';
import { TenderAwardService } from '../src/services/TenderAwardService';
import { TenderRepository } from '../src/repositories/TenderRepository';
import { RecordStatus } from '../src/enums/RecordStatus';
import { WorkflowStatus } from '../src/enums/WorkflowStatus';
import { ProjectLifecycleStage, ProjectWorkflowState } from '../src/domain/projects/Project';
import { initialTenders } from '../src/features/pre-award/ongoing-tenders/constants/initialTenders';
import { baselineProjects } from '../src/seed/projectSeed';

// Mock localStorage and sessionStorage
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

async function run() {
  console.log("================ STARTING PERSISTENCE TRACE ================");

  // Seed databases before instantiating repositories!
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
  console.log(`[INIT] Loaded ${tendersList.length} tenders from database`);

  // Force first tender to be eligible for award
  if (tendersList.length > 0) {
    tendersList[0].status.projectStatus = { en: 'Submitted', ar: 'مقدم' };
    tendersList[0].status.awardStatus = { en: 'Preferred Bidder', ar: 'المقدم المفضل' };
    tendersList[0].status.workflowStatus = WorkflowStatus.SUBMITTED;
    tendersList[0].recordStatus = RecordStatus.ACTIVE;
    await tenderRepo.save(tendersList[0]);
  }

  // Find an active tender to award
  const freshTenders = await tenderRepo.getAll();
  const tenderToAward = freshTenders.find(t => 
    t.status.workflowStatus === WorkflowStatus.SUBMITTED || 
    t.status.workflowStatus === WorkflowStatus.UNDER_NEGOTIATION ||
    t.status.workflowStatus === WorkflowStatus.UNDER_STUDY
  );
  
  if (!tenderToAward) {
    console.error("No active tender found to award.");
    return;
  }
  console.log(`[INIT] Selected tender for award: ${tenderToAward.tenderNumber} (${tenderToAward.id})`);

  // Initialize lookupService cache to mirror the stale in-memory cache situation
  await lookupService.getProjects(); // Cache starts empty, loads baseline projects.

  // 2. Award Tender (Save #1)
  console.log("\n>>> STEP 2: Awarding Tender...");
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
    console.error("Failed to award tender:", awardResult.errors);
    return;
  }
  const project = awardResult.project!;
  console.log(`[AWARD] Project created: ${project.code} (${project.id})`);

  // 3. Open Project Setup & Resume Draft (seeds default draft)
  console.log("\n>>> STEP 3: Resuming draft (seeds default draft)...");
  const initialDraft = await setupService.resumeDraft(project.id);
  
  // 4. Stale cache population (simulating user opening workspace first time before saving draft)
  console.log("\n>>> STEP 4: Simulating cache population (Workspace Mount)...");
  await lookupService.getProjects(false); // Cache gets populated with the default/seeded setupDraft project!

  // 5. Fill in wizard fields
  const completedDraft = {
    ...initialDraft,
    completedSteps: [1, 2, 3, 4],
    currentStep: 3, // We are on step 3 (Office Setup)
    commercial: {
      baseCurrency: 'EGP',
      contractCurrency: 'AED',
      exchangeRate: 1,
      exchangeRateDate: new Date().toISOString().substring(0, 10),
      exchangeRateSource: 'Manual' as const,
      contractType: 'Lump Sum' as const,
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
        { roleId: 'PM', employeeId: 'emp-101', assignedAt: '2026-07-01' },
        { roleId: 'SM', employeeId: 'emp-102', assignedAt: '2026-07-01' },
        { roleId: 'CA', employeeId: 'emp-103', assignedAt: '2026-07-01' }
      ]
    },
    documents: {
      verifiedDocumentCategories: ['Signed Contract', 'Performance Bond', 'Insurance Certificate']
    }
  };

  // 6. Click Save Draft (Save #2 - Saves directly to LocalStorage, bypassing cache!)
  console.log("\n>>> STEP 5: Clicking Save Draft...");
  const saveSuccess = await setupService.saveDraft(project.id, completedDraft);
  console.log(`[SAVE DRAFT] Save setup draft success: ${saveSuccess}`);

  // 7. Verify LocalStorage contains the saved draft
  const projectsInStorage = JSON.parse(localStorage.getItem('pmo_projects_master') || '[]');
  const projectInStorage = projectsInStorage.find((p: any) => p.id === project.id);
  console.log(`\n[LOCALSTORAGE CHECK] setupDraft.commercial.employer:`, projectInStorage?.setupDraft?.commercial?.employer);
  console.log(`[LOCALSTORAGE CHECK] setupDraft.schedule.startDate:`, projectInStorage?.setupDraft?.schedule?.startDate);

  // 8. Simulate reopening project via stale cache
  console.log("\n>>> STEP 6: Reopening project using stale cache...");
  // First, get projects from lookupService (returns stale cache list because saveDraft bypassed lookupService cache)
  const staleProjectsList = await lookupService.getProjects(false);
  const staleProject = staleProjectsList.find(p => p.id === project.id)!;
  console.log(`[REOPEN] staleProject.setupDraft.commercial.employer:`, staleProject.setupDraft?.commercial?.employer);
  console.log(`[REOPEN] staleProject.setupDraft.schedule.startDate:`, staleProject.setupDraft?.schedule?.startDate);

  // 9. Simulate saving settings or project details using the stale project object (The Overwrite)
  console.log("\n>>> STEP 7: Simulating project update/save using the stale project (The Overwrite)...");
  // Let's say ProjectsPage or settings panel saves an update
  const updatedProject = {
    ...staleProject,
    settings: {
      workingCalendar: 'Standard 5-Day',
      workingDays: [0, 1, 2, 3, 4],
      timeZone: 'Asia/Riyadh',
      currency: 'AED',
      documentNumberingRules: 'DOC-{YEAR}-{SEQ}',
      approvalWorkflow: 'Standard',
      escalationRules: '7 Days',
      projectRoles: [],
      approvers: [],
      riskMatrix: '5x5'
    }
  };

  // This is the second save (Save #3 in this trace) which overwrites the draft!
  console.log("\n>>> STEP 8: Calling saveProject (Save #3)...");
  const saveProjectSuccess = await lookupService.saveProject(updatedProject);
  console.log(`[OVERWRITE CHECK] saveProject success: ${saveProjectSuccess}`);

  // 10. Load from LocalStorage again to check if draft is gone!
  console.log("\n>>> STEP 9: Checking LocalStorage after overwrite...");
  const finalProjectsInStorage = JSON.parse(localStorage.getItem('pmo_projects_master') || '[]');
  const finalProjectInStorage = finalProjectsInStorage.find((p: any) => p.id === project.id);
  console.log(`[FINAL CHECK] finalProject.setupDraft.commercial.employer:`, finalProjectInStorage?.setupDraft?.commercial?.employer);
  console.log(`[FINAL CHECK] finalProject.setupDraft.schedule.startDate:`, finalProjectInStorage?.setupDraft?.schedule?.startDate);

  console.log("\n================ PERSISTENCE TRACE COMPLETED ================");
}

run().catch(console.error);
