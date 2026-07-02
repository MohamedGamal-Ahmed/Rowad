import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './views/Dashboard';
import { OngoingTenders, initialTenders, Tender } from './views/OngoingTenders';
import { DocumentControl } from './views/DocumentControl';
import { ProjectDocument } from './domain/projects/Project';
import { ExecutionRecord } from './domain/project-controls/ProjectControlsRecord';
import { mockExecutionData, mockDocuments } from './seed/mockData';
import { SettingsView } from './views/Settings';
import { Settings } from './domain/administration/Settings';
import { TenderService } from './services/TenderService';
import { ProjectControlsService } from './services/ProjectControlsService';
import { ProjectControlsMapper } from './mappers/ProjectControlsMapper';
import { OperationsCenterPage } from './features/operations-center';
import { ProjectsPage } from './views/ProjectsPage';
import { BIPortfolioDatasetViewer } from './views/dev/BIPortfolioDatasetViewer';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Unified pre-award portfolio state
  const [tendersList, setTendersList] = useState<Tender[]>(initialTenders);

  // Unified execution & document control states
  const [executionRecords, setExecutionRecords] = useState<ExecutionRecord[]>(mockExecutionData);
  const [documentRecords, setDocumentRecords] = useState<ProjectDocument[]>(mockDocuments);

  // Configurable administrative settings
  const [settings, setSettings] = useState<Settings>(() => {
    const defaultConflictSettings = {
      minGapBetweenMeetings: 30,
      travelBuffer: 15,
      conflictThreshold: 0,
      allowBackToBack: true
    };

    const saved = localStorage.getItem('pmo_enterprise_settings');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (!parsed.conflictSettings) {
          parsed.conflictSettings = defaultConflictSettings;
        }
        return parsed; 
      } catch (e) {}
    }
    
    // Check and migrate legacy preaward timeline rules if they exist
    let oldRules: any = {};
    const oldSaved = localStorage.getItem('preaward_timeline_rules');
    if (oldSaved) {
      try { oldRules = JSON.parse(oldSaved); } catch (e) {}
    }

    return {
      id: 'admin-settings',
      userId: 'admin',
      preferredLanguage: 'ar',
      timelineRules: {
        kickOffOffset: oldRules.kickOffOffset !== undefined ? oldRules.kickOffOffset : -30,
        riskAssessmentOffset: oldRules.riskAssessmentOffset !== undefined ? oldRules.riskAssessmentOffset : -21,
        contractQualificationOffset: oldRules.contractQualificationOffset !== undefined ? oldRules.contractQualificationOffset : -14,
        alignmentOffset: oldRules.alignmentOffset !== undefined ? oldRules.alignmentOffset : -10,
        intermediateFollowUpOffset: oldRules.intermediateFollowUpOffset !== undefined ? oldRules.intermediateFollowUpOffset : -5,
        reminderDays: 3,
        followUpDays: 5,
        escalationDays: 7
      },
      financialSettings: {
        bidBondPercentage: 2.0,
        performanceBondPercentage: 10.0,
        retentionPercentage: 10.0,
        vatPercentage: 15.0,
        advancePaymentPercentage: 10.0,
        defaultCurrency: 'AED',
        currencyDisplayMode: 'individual'
      },
      businessCalendar: {
        country: 'Saudi Arabia',
        region: 'Riyadh',
        weekendDays: [5, 6], // Friday & Saturday
        holidayDates: ['2026-09-23', '2026-02-22'], // National Day, Founding Day
        workingHoursStart: '08:00',
        workingHoursEnd: '17:00',
        halfWorkingDays: [],
        specialClosures: []
      },
      numberingSettings: {
        projectFormat: 'PRJ-{YEAR}-{SEQ}',
        tenderFormat: 'PA-{YEAR}-{SEQ}',
        ipcFormat: 'IPC-{PROJECT}-{SEQ}',
        claimFormat: 'CLM-{PROJECT}-{SEQ}',
        voFormat: 'VO-{PROJECT}-{SEQ}',
        nocFormat: 'NOC-{PROJECT}-{SEQ}',
        documentFormat: 'DOC-{TYPE}-{SEQ}'
      },
      workloadSettings: {
        maxTasksPerEngineer: 5,
        warningThreshold: 80
      },
      healthSettings: {
        dueSoonThresholdDays: 7,
        overdueThresholdDays: 0
      },
      conflictSettings: {
        minGapBetweenMeetings: 30,
        travelBuffer: 15,
        conflictThreshold: 0,
        allowBackToBack: true
      }
    };
  });

  const handleUpdateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('pmo_enterprise_settings', JSON.stringify(newSettings));
  };

  // Modern Clean Architecture Syncer
  useEffect(() => {
    async function loadTenders() {
      // Seed initial mock tenders in database if completely empty to bootstrap system smoothly
      const rawData = localStorage.getItem('preaward_tenders_db');
      if (!rawData) {
        localStorage.setItem('preaward_tenders_db', JSON.stringify(initialTenders));
      }

      // Seed initial mock assignments if empty
      const rawAssignments = localStorage.getItem('preaward_assignments_db');
      if (!rawAssignments) {
        const seedAssignments = [
          // t-1
          { assignmentId: 'asg-t1-1', tenderId: 't-1', employeeId: 'user-2', roleId: 'role-coordinator', status: 'Active', assignedDate: '2026-06-01', effectiveFrom: '2026-06-01', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t1-2', tenderId: 't-1', employeeId: 'user-1', roleId: 'role-contracts-eng', status: 'Active', assignedDate: '2026-06-01', effectiveFrom: '2026-06-01', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t1-3', tenderId: 't-1', employeeId: 'user-7', roleId: 'role-study-eng', status: 'Active', assignedDate: '2026-06-01', effectiveFrom: '2026-06-01', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          // t-2
          { assignmentId: 'asg-t2-1', tenderId: 't-2', employeeId: 'user-3', roleId: 'role-coordinator', status: 'Active', assignedDate: '2026-06-05', effectiveFrom: '2026-06-05', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t2-2', tenderId: 't-2', employeeId: 'user-13', roleId: 'role-contracts-eng', status: 'Active', assignedDate: '2026-06-05', effectiveFrom: '2026-06-05', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t2-3', tenderId: 't-2', employeeId: 'user-8', roleId: 'role-study-eng', status: 'Active', assignedDate: '2026-06-05', effectiveFrom: '2026-06-05', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          // t-3
          { assignmentId: 'asg-t3-1', tenderId: 't-3', employeeId: 'user-14', roleId: 'role-coordinator', status: 'Active', assignedDate: '2026-06-10', effectiveFrom: '2026-06-10', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t3-2', tenderId: 't-3', employeeId: 'user-5', roleId: 'role-contracts-eng', status: 'Active', assignedDate: '2026-06-10', effectiveFrom: '2026-06-10', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t3-3', tenderId: 't-3', employeeId: 'user-9', roleId: 'role-study-eng', status: 'Active', assignedDate: '2026-06-10', effectiveFrom: '2026-06-10', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          // t-4
          { assignmentId: 'asg-t4-1', tenderId: 't-4', employeeId: 'user-4', roleId: 'role-coordinator', status: 'Active', assignedDate: '2026-06-12', effectiveFrom: '2026-06-12', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t4-2', tenderId: 't-4', employeeId: 'user-6', roleId: 'role-contracts-eng', status: 'Active', assignedDate: '2026-06-12', effectiveFrom: '2026-06-12', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t4-3', tenderId: 't-4', employeeId: 'user-10', roleId: 'role-study-eng', status: 'Active', assignedDate: '2026-06-12', effectiveFrom: '2026-06-12', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          // t-5
          { assignmentId: 'asg-t5-1', tenderId: 't-5', employeeId: 'user-2', roleId: 'role-coordinator', status: 'Active', assignedDate: '2026-06-15', effectiveFrom: '2026-06-15', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t5-2', tenderId: 't-5', employeeId: 'user-1', roleId: 'role-contracts-eng', status: 'Active', assignedDate: '2026-06-15', effectiveFrom: '2026-06-15', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t5-3', tenderId: 't-5', employeeId: 'user-11', roleId: 'role-study-eng', status: 'Active', assignedDate: '2026-06-15', effectiveFrom: '2026-06-15', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          // t-6
          { assignmentId: 'asg-t6-1', tenderId: 't-6', employeeId: 'user-4', roleId: 'role-coordinator', status: 'Active', assignedDate: '2026-06-18', effectiveFrom: '2026-06-18', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t6-2', tenderId: 't-6', employeeId: 'user-3', roleId: 'role-contracts-eng', status: 'Active', assignedDate: '2026-06-18', effectiveFrom: '2026-06-18', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' },
          { assignmentId: 'asg-t6-3', tenderId: 't-6', employeeId: 'user-12', roleId: 'role-study-eng', status: 'Active', assignedDate: '2026-06-18', effectiveFrom: '2026-06-18', effectiveTo: null, notes: 'Seeded assignment', createdAt: new Date().toISOString(), createdBy: 'System', modifiedAt: new Date().toISOString(), modifiedBy: 'System', archivedAt: null, archivedBy: null, recordStatus: 'Active' }
        ];
        localStorage.setItem('preaward_assignments_db', JSON.stringify(seedAssignments));
      }

      // Seed initial mock business events if empty
      const rawEvents = localStorage.getItem('preaward_business_events_db');
      if (!rawEvents) {
        const seedEvents = [
          { eventId: 'event-t1-c', tenderId: 't-1', timestamp: '2026-06-01T08:00:00.000Z', userId: 'System', source: 'System', moduleId: 'Pre-Award', entityType: 'Tender', entityId: 't-1', action: 'Project Created', remarks: 'Project initialized in pre-award pipeline.' },
          { eventId: 'event-t2-c', tenderId: 't-2', timestamp: '2026-06-05T08:00:00.000Z', userId: 'System', source: 'System', moduleId: 'Pre-Award', entityType: 'Tender', entityId: 't-2', action: 'Project Created', remarks: 'Project initialized in pre-award pipeline.' },
          { eventId: 'event-t3-c', tenderId: 't-3', timestamp: '2026-06-10T08:00:00.000Z', userId: 'System', source: 'System', moduleId: 'Pre-Award', entityType: 'Tender', entityId: 't-3', action: 'Project Created', remarks: 'Project initialized in pre-award pipeline.' },
          { eventId: 'event-t4-c', tenderId: 't-4', timestamp: '2026-06-12T08:00:00.000Z', userId: 'System', source: 'System', moduleId: 'Pre-Award', entityType: 'Tender', entityId: 't-4', action: 'Project Created', remarks: 'Project initialized in pre-award pipeline.' },
          { eventId: 'event-t5-c', tenderId: 't-5', timestamp: '2026-06-15T08:00:00.000Z', userId: 'System', source: 'System', moduleId: 'Pre-Award', entityType: 'Tender', entityId: 't-5', action: 'Project Created', remarks: 'Project initialized in pre-award pipeline.' },
          { eventId: 'event-t6-c', tenderId: 't-6', timestamp: '2026-06-18T08:00:00.000Z', userId: 'System', source: 'System', moduleId: 'Pre-Award', entityType: 'Tender', entityId: 't-6', action: 'Project Created', remarks: 'Project initialized in pre-award pipeline.' }
        ];
        localStorage.setItem('preaward_business_events_db', JSON.stringify(seedEvents));
      }

      const service = new TenderService();
      // Solve dynamic calculated dates, days remaining, and health indicators chronologically using persistent offsets
      const legacyTenders = await service.getLegacyTenders(settings);
      setTendersList(legacyTenders);
    }
    loadTenders();
  }, [settings]);

  // Load Project Controls records cleanly on component mount using service-managed repository layer
  useEffect(() => {
    async function loadProjectControls() {
      const pcService = new ProjectControlsService();
      const records = await pcService.getRecords();
      const legacyRecords = records.map(r => ProjectControlsMapper.toLegacy(r));
      setExecutionRecords(legacyRecords);
    }
    loadProjectControls();
  }, []);

  const handleUpdateTendersList = async (updater: React.SetStateAction<Tender[]>) => {
    const updatedList = typeof updater === 'function' ? (updater as any)(tendersList) : updater;
    setTendersList(updatedList);

    // Persist only modified items into the repository via TenderService
    const service = new TenderService();
    const changedItems = updatedList.filter((item: Tender) => {
      const existing = tendersList.find(t => t.id === item.id);
      if (!existing) return true;
      return JSON.stringify(item) !== JSON.stringify(existing);
    });

    for (const item of changedItems) {
      const res = await service.commitLegacyTender(item);
      if (!res.success) {
        console.error("Failed to commit tender:", res.errors);
      }
    }
  };

  const handleUpdateRecordsList = async (updater: React.SetStateAction<ExecutionRecord[]>) => {
    const updatedList = typeof updater === 'function' ? (updater as any)(executionRecords) : updater;
    setExecutionRecords(updatedList);

    // Persist only modified items into storage via ProjectControlsService
    const pcService = new ProjectControlsService();
    const changedItems = updatedList.filter((item: ExecutionRecord) => {
      const existing = executionRecords.find(r => r.id === item.id);
      if (!existing) return true;
      return JSON.stringify(item) !== JSON.stringify(existing);
    });

    for (const item of changedItems) {
      const domainRec = ProjectControlsMapper.toDomain(item);
      const res = await pcService.commitRecord(domainRec);
      if (!res.success) {
        console.error("Failed to commit execution record:", res.errors);
      }
    }
  };

  useEffect(() => {
    // Set to logical properties mechanism layout handler
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ar' : 'en');
  
  const handleNavigate = (viewId: string) => {
    setCurrentView(viewId);
  };

  return (
    <div className="flex min-h-screen bg-brand-gray w-full font-sans text-brand-navy selection:bg-brand-red/20 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        lang={lang} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        tendersCount={tendersList.filter(t => t.recordStatus === 'Active').length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header lang={lang} onToggleLang={toggleLanguage} />
        
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          {currentView === 'dashboard' ? (
            <Dashboard 
              lang={lang} 
              list={tendersList}
              executionRecords={executionRecords}
              documentRecords={documentRecords}
            />
          ) : currentView === 'operations-center' ? (
            <OperationsCenterPage 
              lang={lang}
              onNavigateToView={handleNavigate}
              settings={settings}
            />
          ) : currentView === 'ongoing-tenders' ? (
            <OngoingTenders 
              lang={lang} 
              list={tendersList}
              onUpdateList={handleUpdateTendersList}
              settings={settings}
            />
          ) : currentView === 'document-control' ? (
            <DocumentControl 
              lang={lang} 
              documents={documentRecords}
              onUpdateDocuments={setDocumentRecords}
              settings={settings}
            />
          ) : currentView === 'projects' ? (
            <ProjectsPage 
              lang={lang} 
              settings={settings} 
            />
          ) : currentView === 'settings' ? (
            <SettingsView
              lang={lang}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          ) : currentView === 'dev-bi-portfolio' && import.meta.env.DEV ? (
            // Sprint 5.1 close-out (CTO ruling): never a business feature —
            // excluded entirely from production builds, not just hidden from
            // navigation. `import.meta.env.DEV` is false in `npm run build`
            // output, so this branch is dead code (and tree-shaken) in prod.
            <BIPortfolioDatasetViewer />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 p-8">
              <div className="text-center max-w-md bg-white p-12 rounded-[32px] shadow-sm border border-gray-100">
                <h2 className={`text-2xl font-bold text-brand-navy mb-4 ${lang === 'ar' ? 'font-arabic' : ''}`}>
                  {lang === 'en' ? 'Module Coming Soon' : 'الوحدة قيد التطوير'}
                </h2>
                <p className="text-sm">
                  {lang === 'en' 
                    ? 'This module is part of the future enterprise platform roadmap.' 
                    : 'هذه الوحدة جزء من خارطة طريق منصة المؤسسة المستقبلية.'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
