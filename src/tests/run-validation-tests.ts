import { FinancialsCalculator } from '../business-rules/FinancialsCalculator';
import { TimelineCalculator } from '../business-rules/TimelineCalculator';
import { HealthCalculator } from '../business-rules/HealthCalculator';
import { TenderMapper, LegacyTender } from '../mappers/TenderMapper';
import { Currency } from '../enums/Currency';
import { StatusInformation } from '../domain/pre-award/StatusInformation';
import { RecordStatus } from '../enums/RecordStatus';
import { WorkflowStatus } from '../enums/WorkflowStatus';

function assertEquals(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected "${expected}", received "${actual}". Context: ${message}`);
  }
}

function runTests() {
  console.log('--- RUNNING ROWAD ENTERPRISE PLATFORM DDD LIGHTWEIGHT TESTS ---');

  // Test 1: FinancialsCalculator (parseToNumber)
  console.log('Test 1: FinancialsCalculator currency cleaning...');
  assertEquals(FinancialsCalculator.parseToNumber('AED 12,500,000'), 12500000, 'Integer cleanup with delimiters');
  assertEquals(FinancialsCalculator.parseToNumber('SAR 4,200.50'), 4200.50, 'Float cleanup with delimiters');
  assertEquals(FinancialsCalculator.parseToNumber(''), 0, 'Empty string boundary fallback');

  // Test 2: FinancialsCalculator (Multi-currency summation checks)
  console.log('Test 2: FinancialsCalculator multi-currency aggregations...');
  const priceItems = [
    { amount: 1000, currency: Currency.AED },
    { amount: 1000, currency: Currency.AED }
  ];
  const total = FinancialsCalculator.sumAmounts(priceItems, Currency.AED);
  assertEquals(total.amount, 2000, 'Direct sum in baseline currency');
  assertEquals(total.currency, Currency.AED, 'Currency check');

  // Test 3: TimelineCalculator (Timeline offsets calculations)
  console.log('Test 3: TimelineCalculator PMO chronological baseline offsets math...');
  const techSubmissionBaseline = '2026-07-01';
  const rules = {
    kickOffOffset: -30,
    riskAssessmentOffset: -20,
    contractQualificationOffset: -15,
    alignmentOffset: -10,
    intermediateFollowUpOffset: -5
  };
  const response = TimelineCalculator.calculateMilestones(techSubmissionBaseline, rules);
  assertEquals(response.kickOffDate, '2026-06-01', 'Kick-off date calculation');
  assertEquals(response.riskDueDate, '2026-06-11', 'Risk assessment date calculation');
  assertEquals(response.alignmentDate, '2026-06-21', 'Internal alignment check-in calculation');

  // Test 4: HealthCalculator Strategy Pattern checks
  console.log('Test 4: HealthCalculator Strategy evaluation thresholds...');
  const healthCalc = new HealthCalculator();
  assertEquals(healthCalc.evaluate(15, false), 'Healthy', 'Healthy status threshold (>7 days remaining)');
  assertEquals(healthCalc.evaluate(5, false), 'Due Soon', 'Due Soon status threshold (<=7 days remaining)');
  assertEquals(healthCalc.evaluate(-2, false), 'Overdue', 'Overdue status threshold (<0 days remaining)');
  assertEquals(healthCalc.evaluate(10, true), 'Archived', 'Archived status threshold override');

  // Test 5: Tender Mappers Roundtrip Transformation integrity
  console.log('Test 5: TenderMapper roundtrip conversion preservation...');
  const legacyIn: LegacyTender = {
    id: 'T-001',
    projectCode: 'PC-990-RIYADH',
    tenderNumber: 'TENDER-CIVIL-8827',
    projectName: { en: 'Riyadh Infrastructure Bridge Grounding', ar: 'تأريض جسر البنية التحتية بالرياض' },
    location: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
    coordinator: { en: 'Eng. Ahmed', ar: 'م. أحمد' },
    contractsEngineer: { en: 'Eng. Sarah', ar: 'م. سارة' },
    techSubmissionDate: '2026-08-15',
    commSubmissionDate: '2026-08-20',
    overallSubmissionDate: '2026-08-20',
    projectStatus: { en: 'Under Study', ar: 'تحت الدراسة' },
    awardStatus: { en: 'Pending', ar: 'معلق' },
    recordStatus: 'Active',
    daysRemaining: 54,
    health: 'Healthy',
    estimatedValue: 'AED 3,400,000',
    bondAmount: 'AED 150,000',
    currency: 'AED',
    tenderType: { en: 'Infrastructure', ar: 'بنية تحتية' },
    clientName: { en: 'Riyadh Municipality', ar: 'أمانة منطقة الرياض' },
    notes: [
      { id: 'N-1', author: 'Eng. Ahmed', date: '2026-06-22', text: 'Initial study checklist completed' }
    ],
    documents: [
      { id: 'D-1', name: 'RFT-Specs-V1.pdf', size: '15.4 MB', link: '#' }
    ],
    checklistReceived: true,
    checklistDrawings: true,
    checklistBOQ: false,
    checklistSpecs: false
  };

  const domainModel = TenderMapper.toDomain(legacyIn);
  assertEquals(domainModel.id, 'T-001', 'Tender ID preserved');
  assertEquals(domainModel.financials.estimatedValue.amount, 3400000, 'Tender Value parsed to clean numeric amount');
  assertEquals(domainModel.financials.estimatedValue.currency, Currency.AED, 'Tender Currency parsed to proper Currency enum');

  const legacyOut = TenderMapper.toLegacy(domainModel);
  assertEquals(legacyOut.id, 'T-001', 'Legacy Tender ID mapped back');
  assertEquals(legacyOut.estimatedValue, 'AED 3,400,000', 'Formatted pricing string reconstructed');
  assertEquals(legacyOut.priority, 'Medium', 'Default Priority fallback successfully evaluated');

  console.log('--- ALL ROWAD ENTERPRISE PLATFORM DDD LIGHTWEIGHT TESTS COMPLETED SUCCESSFULLY ---');
}

// Automatically runs verification if executed via tsx CLI
try {
  runTests();
} catch (e: any) {
  console.error('Validation test suite failure:', e.message);
  if (typeof process !== 'undefined') {
    process.exit(1);
  } else {
    throw e;
  }
}
