import { TenderRepository } from '../src/repositories/TenderRepository';
import { ProjectRepository } from '../src/repositories/ProjectRepository';
import { ProjectLookupService } from '../src/services/ProjectLookupService';
import { ProjectSetupService } from '../src/services/ProjectSetupService';
import { TenderAwardService } from '../src/services/TenderAwardService';
import { ProjectWorkflowState, ProjectStatus, ProjectLifecycleStage } from '../src/domain/projects/Project';
import { FinancialsCalculator } from '../src/business-rules/FinancialsCalculator';
import { Currency } from '../src/enums/Currency';
import { AppConstants } from '../src/constants/AppConstants';
import { Clock } from '../src/services/Clock';
import { TenderMapper } from '../src/mappers/TenderMapper';

// Fake localStorage for Node context testing
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

if (typeof sessionStorage === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).sessionStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

async function runRegression() {
  console.log('================ STARTING PORTFOLIO SYNCHRONIZATION REGRESSION ================');

  // Initialize
  const tenderRepo = new TenderRepository();
  const projectRepo = new ProjectRepository();
  const lookupService = ProjectLookupService.getInstance();
  const setupService = new ProjectSetupService();
  const awardService = new TenderAwardService();

  // Reset localStorage
  localStorage.clear();

  // Seed baseline tenders db
  const { initialTenders } = await import('../src/views/OngoingTenders');
  localStorage.setItem('preaward_tenders_db', JSON.stringify(initialTenders));

  // Load baseline tenders
  const tenders = await tenderRepo.getAll();
  console.log(`[INIT] Seeded ${tenders.length} tenders.`);
  const targetTender = tenders[0];
  console.log(`[INIT] Selected Tender for Award: ${targetTender.tenderNumber}`);

  // Scenario 1: Award -> Setup -> Activate -> Check immediate Portfolio sync
  console.log('\n>>> SCENARIO 1 & 7: Awarding Tender...');
  const legacyTender = TenderMapper.toLegacy(targetTender);
  const awardResult = await awardService.awardLegacyTender(
    legacyTender,
    'user-admin',
    750000000,
    Currency.SAR,
    '2026-07-15',
    'LOA-NEOM-CIV-09'
  );

  if (!awardResult.success || !awardResult.project) {
    throw new Error(`Award Tender failed: ${awardResult.errors.join(', ')}`);
  }
  const projectId = awardResult.project.id;
  const projectCode = awardResult.project.code;
  console.log(`[AWARD] Created Project ID: ${projectId} with code: ${projectCode}`);

  // Fill and save setup draft
  console.log('\n>>> Resuming setup draft and saving completed steps...');
  const draft = await setupService.resumeDraft(projectId);
  draft.completedSteps = [1, 2, 3, 4];
  draft.currentStep = 4;
  draft.commercial = {
    employer: 'Rowad Client',
    contractType: 'Lump Sum' as any,
    contractCurrency: 'SAR',
    baseCurrency: 'SAR',
    exchangeRate: 1.0,
    retentionPercentage: 10,
    advancePaymentPercentage: 10,
    vatPercentage: 15,
    costCenterCode: 'CC-NEOM-09'
  };
  draft.schedule = {
    workingCalendar: 'Standard 5-Day',
    timeZone: 'GMT+3 (Riyadh)',
    weekendPattern: 'Fri-Sat',
    startDate: '2026-07-15',
    contractDurationDays: 730,
    mobilizationPeriodDays: 30,
    holidayCalendar: 'Egypt Holidays',
    workingHours: '08:00-17:00'
  };
  draft.office = {
    teamMembers: [
      { roleId: 'PM', employeeId: 'EMP-PM-Khaled', assignedAt: new Date().toISOString() },
      { roleId: 'SM', employeeId: 'EMP-SM-Ahmed', assignedAt: new Date().toISOString() },
      { roleId: 'CA', employeeId: 'EMP-CA-Sara', assignedAt: new Date().toISOString() }
    ]
  };
  draft.documents = {
    verifiedDocumentCategories: [
      'Letter of Award',
      'Signed Contract',
      'Commencement Letter',
      'BOQ',
      'IFC Drawings',
      'Baseline Schedule'
    ]
  };

  await setupService.saveDraft(projectId, draft);

  // Seed compliance attachments
  await projectRepo.saveAttachment({
    id: 'att-1',
    projectId,
    fileName: 'LOA.pdf',
    fileSize: '2.5MB',
    category: 'Letter of Award',
    uploadedBy: 'System',
    uploadedDate: new Date().toISOString()
  });
  await projectRepo.saveAttachment({
    id: 'att-2',
    projectId,
    fileName: 'Contract.pdf',
    fileSize: '4.2MB',
    category: 'Signed Contract',
    uploadedBy: 'System',
    uploadedDate: new Date().toISOString()
  });

  // Complete setup
  const completeRes = await setupService.completeSetup(projectId, draft);
  if (!completeRes.success) {
    throw new Error(`Complete Setup failed: ${completeRes.errors.join(', ')}`);
  }
  console.log('[SETUP] Completed project setup. State is now PENDING_ACTIVATION.');

  // Activate project
  const activateRes = await setupService.activateProject(projectId);
  if (!activateRes.success) {
    throw new Error(`Activate Project failed: ${activateRes.errors.join(', ')}`);
  }
  console.log('[ACTIVATION] Project activated successfully.');

  // Check lookup service cache invalidation
  const allProjects = await lookupService.getProjects();
  const activatedProj = allProjects.find(p => p.id === projectId);
  if (!activatedProj) {
    throw new Error('Activated Project not found in Portfolio list!');
  }

  console.log('\n>>> Verifying Synchronization across Portfolio Grid:');
  console.log(`- Project Code: ${activatedProj.code}`);
  console.log(`- Workflow State: ${activatedProj.workflowState}`);
  console.log(`- Operational Status: ${activatedProj.status}`);
  console.log(`- Lifecycle Stage: ${activatedProj.lifecycleStage}`);

  if (activatedProj.workflowState !== ProjectWorkflowState.ACTIVE) {
    throw new Error(`Expected WorkflowState 'Active', got: ${activatedProj.workflowState}`);
  }
  if (activatedProj.status !== ProjectStatus.MOBILIZING) {
    throw new Error(`Expected Status 'Mobilizing', got: ${activatedProj.status}`);
  }
  if (activatedProj.lifecycleStage !== ProjectLifecycleStage.READY_FOR_MOBILIZATION) {
    throw new Error(`Expected LifecycleStage 'Ready for Mobilization', got: ${activatedProj.lifecycleStage}`);
  }
  console.log('[SUCCESS] Scenario 1 verified! Status, Workflow State, and Lifecycle Stage are perfectly synchronized.');

  // Scenario 2, 3, 5: Refresh/Vite Restart Simulation (Direct localStorage reload)
  console.log('\n>>> SCENARIO 5: Simulating Refresh / Browser Reopen / Vite Restart...');
  const newLookupInstance = ProjectLookupService.getInstance();
  await newLookupInstance.refresh(); // Clear cache to simulate full reload
  const reloadedProjects = await newLookupInstance.getProjects();
  const reloadedProj = reloadedProjects.find(p => p.id === projectId);
  if (!reloadedProj || reloadedProj.status !== ProjectStatus.MOBILIZING || reloadedProj.workflowState !== ProjectWorkflowState.ACTIVE) {
    throw new Error('Status sync lost after simulation refresh!');
  }
  console.log('[SUCCESS] Scenario 5 verified! State remains identical after full reload.');

  // Scenario 6: Edit Activated Project & Synchronize Immediately
  console.log('\n>>> SCENARIO 6: Editing Activated Project and verifying immediate synchronization...');
  reloadedProj.nameEn = 'NEOM CIV Phase 1 - Updated Title';
  await projectRepo.save(reloadedProj); // Repository save should trigger invalidation automatically

  const postEditProjects = await lookupService.getProjects();
  const postEditProj = postEditProjects.find(p => p.id === projectId);
  if (!postEditProj || postEditProj.nameEn !== 'NEOM CIV Phase 1 - Updated Title') {
    throw new Error('Portfolio did not synchronize edited project title immediately!');
  }
  console.log(`- Updated Project Title in Portfolio: ${postEditProj.nameEn}`);
  console.log('[SUCCESS] Scenario 6 verified! Edits synchronize across lookup service immediately.');

  // Scenario 4: Multiple Projects State Isolation
  console.log('\n>>> SCENARIO 4: Activating Multiple Projects & Checking State Isolation...');
  const secondTender = tenders[1];
  secondTender.status.workflowStatus = 'Submitted' as any;
  secondTender.status.projectStatus = { en: 'Submitted', ar: 'تم التقديم' };
  secondTender.status.awardStatus = { en: 'Preferred Bidder', ar: 'مفضل' };
  const legacyTender2 = TenderMapper.toLegacy(secondTender);
  const award2 = await awardService.awardLegacyTender(
    legacyTender2,
    'user-admin',
    200000000,
    Currency.EGP,
    '2026-08-01',
    'LOA-ZED-02'
  );
  if (!award2.success || !award2.project) {
    throw new Error(`Second Award failed: ${award2.errors.join(', ')}`);
  }
  const project2Id = award2.project.id;
  console.log(`[AWARD] Created Second Project ID: ${project2Id}`);
  
  const proj2 = await projectRepo.getById(project2Id);
  if (!proj2 || proj2.status !== ProjectStatus.INACTIVE) {
    throw new Error(`Second Project status is not Inactive: ${proj2?.status}`);
  }
  console.log(`- Project 1 (PRJ-NEOM-CIV-09) Status: ${postEditProj.status}`);
  console.log(`- Project 2 (PRJ-ZED-02) Status: ${proj2.status}`);
  if (postEditProj.status === proj2.status) {
    throw new Error('State isolation failed! Second project status contaminated first project.');
  }
  console.log('[SUCCESS] Scenario 4 verified! State isolation behaves correctly.');

  // Scenario 7: Financial Progress Falling Back to Business Layer Undefined
  console.log('\n>>> SCENARIO 7: Verifying Financial Progress Falls Back to Undefined...');
  const finProgress = FinancialsCalculator.calculateFinancialProgress(postEditProj);
  console.log(`- FinancialsCalculator.calculateFinancialProgress returned: ${finProgress}`);
  if (finProgress !== undefined) {
    throw new Error(`Expected financial progress to be undefined, got: ${finProgress}`);
  }
  console.log('[SUCCESS] Scenario 7 verified! Returns undefined when no engine is implemented.');

  // Dynamic Portfolio KPI Cards calculations
  console.log('\n>>> VERIFYING DYNAMIC KPI CARD CALCULATIONS:');
  const activeCount = postEditProjects.filter(p => p.recordStatus !== 'Archived' && (p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.MOBILIZING)).length;
  console.log(`- Active Projects Count: ${activeCount}`);

  // Near Due Projects calculation referencing NEAR_DUE_THRESHOLD_DAYS constant
  const threshold = AppConstants.NEAR_DUE_THRESHOLD_DAYS;
  const nearDueCount = postEditProjects.filter(p => {
    if (p.recordStatus === 'Archived') return false;
    if (p.status !== ProjectStatus.ACTIVE && p.status !== ProjectStatus.MOBILIZING) return false;
    if (!p.completionDate) return false;
    const diff = Clock.diffInDays(p.completionDate);
    return diff >= 0 && diff <= threshold;
  }).length;
  console.log(`- Near Due Projects Count (Threshold ${threshold} days): ${nearDueCount}`);

  // Dynamic currency sum converted to target target currency EGP
  const moneyItems = postEditProjects
    .filter(p => p.recordStatus !== 'Archived')
    .map(p => ({
      amount: p.revisedContractValue ?? p.signedContractValue ?? 0,
      currency: p.currency as any
    }));
  const totalValMoney = FinancialsCalculator.sumAmounts(moneyItems, Currency.EGP);
  console.log(`- Total Portfolio Value: ${totalValMoney.amount} ${totalValMoney.currency}`);

  console.log('\n================ PORTFOLIO SYNCHRONIZATION REGRESSION PASSED SUCCESSFULLY ================');
}

runRegression().catch(err => {
  console.error('[REGRESSION FAILURE]', err);
  process.exit(1);
});
