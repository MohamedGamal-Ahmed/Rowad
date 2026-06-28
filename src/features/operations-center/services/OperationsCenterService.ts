import { 
  CalendarEvent, EventModuleType, EventCategory, EventPriority, EventStatus, EventNote, EventAttachment, CalendarEventType 
} from '../types';
import { initialTenders } from '../../pre-award/ongoing-tenders/constants/initialTenders';
import { mockExecutionData, mockDocuments } from '../../../seed/mockData';
import { Settings } from '../../../domain/administration/Settings';
import { ProjectDocument } from '../../../domain/projects/Project';
import { ProjectLookupService } from '../../../services/ProjectLookupService';
import { ConflictDetectionEngine } from './ConflictEngine';

export class OperationsCenterService {
  /**
   * Generates a unique, high-density sequence ID for manual items
   */
  private generateId(): string {
    return 'ev-man-' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Helper to fetch meeting scheduling metadata for Pre-Award milestones
   */
  private getEventScheduling(eventId: string, scheduledMeta: any, defaultType: CalendarEventType) {
    const meta = scheduledMeta[eventId];
    if (meta) {
      return {
        calendarEventType: meta.calendarEventType || CalendarEventType.MEETING,
        startTime: meta.startTime,
        endTime: meta.endTime,
        durationMinutes: meta.durationMinutes,
        meetingType: meta.meetingType,
        meetingLink: meta.meetingLink,
        meetingRoom: meta.meetingRoom,
        attendees: meta.attendees
      };
    } else {
      return {
        calendarEventType: defaultType,
        startTime: undefined,
        endTime: undefined,
        durationMinutes: undefined,
        meetingType: undefined,
        meetingLink: undefined,
        meetingRoom: undefined,
        attendees: undefined
      };
    }
  }

  /**
   * Fetches and synthesizes events from all platform repositories
   */
  public async fetchSynthesizedEvents(): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    // 1. Pre-Award Tenders Integration
    const rawTenders = localStorage.getItem('preaward_tenders_db');
    const tenders = rawTenders ? JSON.parse(rawTenders) : initialTenders;

    const rawScheduledMeta = localStorage.getItem('operations_preaward_scheduling_metadata');
    const scheduledMeta = rawScheduledMeta ? JSON.parse(rawScheduledMeta) : {};

    tenders.forEach((t: any) => {
      const pCode = t.projectCode || 'PC-PRE-AWARD';
      const pName = t.projectName || { en: 'Pre-Award Tender', ar: 'مناقصة جارية' };
      const ownerName = typeof t.coordinator === 'object' ? t.coordinator.en : (t.coordinator || 'Sara Al-Mansoori');
      const ownerId = 'usr-sara';
      
      const assignedToNames: string[] = [];
      const assignedToIds: string[] = [];
      if (t.contractsEngineer) {
        assignedToNames.push(typeof t.contractsEngineer === 'object' ? t.contractsEngineer.en : t.contractsEngineer);
        assignedToIds.push('usr-engineer');
      }
      if (t.tenderStudyEngineer) {
        assignedToNames.push(typeof t.tenderStudyEngineer === 'object' ? t.tenderStudyEngineer.en : t.tenderStudyEngineer);
        assignedToIds.push('usr-study');
      }

      const notes: EventNote[] = (t.notes || []).map((n: any, idx: number) => ({
        id: n.id || `n-${idx}`,
        authorName: n.author || 'System',
        timestamp: n.date || '2026-06-22',
        text: n.text || ''
      }));

      const attachments: EventAttachment[] = (t.documents || []).map((d: any, idx: number) => ({
        id: d.id || `doc-${idx}`,
        fileName: d.name || 'document.pdf',
        fileSize: d.size || '1.2 MB',
        uploadedBy: 'Sara Al-Mansoori',
        uploadDate: '2026-06-22',
        downloadUrl: d.link || '#'
      }));

      // Map priority
      let priority = EventPriority.MEDIUM;
      if (t.priority === 'Critical') priority = EventPriority.CRITICAL;
      else if (t.priority === 'High') priority = EventPriority.HIGH;
      else if (t.priority === 'Low') priority = EventPriority.LOW;

      // Status mapping based on health/dates
      let status = EventStatus.IN_PROGRESS;
      if (t.health === 'Overdue') status = EventStatus.OVERDUE;

      // Define standard sub-events for each Tender to represent DAG
      const kickOffDate = t.kickOffDate || '2026-06-22';
      const riskDueDate = t.riskDueDate || '2026-06-25';
      const techDate = t.techSubmissionDate || '2026-07-01';
      const alignDate = t.alignmentDate || '2026-07-05';
      const commDate = t.commSubmissionDate || '2026-07-10';

      const kickoffId = `${t.id}-kickoff`;
      const kickoffSched = this.getEventScheduling(kickoffId, scheduledMeta, CalendarEventType.MILESTONE);

      // EVENT 1: Technical Kickoff Meeting / Milestone
      events.push({
        id: kickoffId,
        title: {
          en: `Technical Kickoff - ${t.projectName.en}`,
          ar: `الاجتماع التمهيدي الفني - ${t.projectName.ar}`
        },
        description: {
          en: `Initial structural alignment and coordination kickoff for tender ${t.tenderNumber}`,
          ar: `الاجتماع التمهيدي الأول لتنسيق دراسة المناقصة رقم ${t.tenderNumber}`
        },
        projectCode: pCode,
        projectName: pName,
        module: EventModuleType.PRE_AWARD,
        eventType: EventCategory.KICK_OFF,
        ownerId,
        ownerName,
        assignedToIds,
        assignedToNames,
        priority,
        status: t.daysRemaining > 20 ? EventStatus.COMPLETED : EventStatus.IN_PROGRESS,
        startDate: kickOffDate,
        endDate: kickOffDate,
        ...kickoffSched,
        predecessorIds: [],
        successorIds: [`${t.id}-risk`],
        lagDays: 3,
        sourceId: t.id,
        deepLinkPath: 'ongoing-tenders',
        deepLinkLabel: { en: 'Open Tender (Pre-Award)', ar: 'افتح ملف المناقصة (دراسة العطاءات)' },
        notes,
        attachments,
        hasConflict: false,
        colorTheme: {
          bg: 'bg-blue-50/70 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-900',
          text: 'text-blue-900 dark:text-blue-300',
          iconColor: 'text-blue-500'
        },
        lucideIconName: 'PlayCircle'
      });

      const riskId = `${t.id}-risk`;
      const riskSched = this.getEventScheduling(riskId, scheduledMeta, CalendarEventType.MILESTONE);

      // EVENT 2: Risk Assessment Check
      events.push({
        id: riskId,
        title: {
          en: `Risk Assessment Review - ${t.projectName.en}`,
          ar: `مراجعة تقييم المخاطر - ${t.projectName.ar}`
        },
        description: {
          en: `Evaluate geological, contract risks, and financial liquid bond requirements`,
          ar: `تقييم المخاطر الجيولوجية والتعاقدية ومتطلبات الضمان البنكي للمشروع`
        },
        projectCode: pCode,
        projectName: pName,
        module: EventModuleType.PRE_AWARD,
        eventType: EventCategory.RISK_ASSESSMENT,
        ownerId,
        ownerName,
        assignedToIds,
        assignedToNames,
        priority: EventPriority.HIGH,
        status: EventStatus.IN_PROGRESS,
        startDate: riskDueDate,
        endDate: riskDueDate,
        ...riskSched,
        predecessorIds: [kickoffId],
        successorIds: [`${t.id}-tech`],
        lagDays: 6,
        sourceId: t.id,
        deepLinkPath: 'ongoing-tenders',
        deepLinkLabel: { en: 'Open Tender (Pre-Award)', ar: 'افتح ملف المناقصة (دراسة العطاءات)' },
        notes,
        attachments,
        hasConflict: false,
        colorTheme: {
          bg: 'bg-amber-50/70 dark:bg-amber-950/20',
          border: 'border-amber-200 dark:border-amber-900',
          text: 'text-amber-900 dark:text-amber-300',
          iconColor: 'text-amber-500'
        },
        lucideIconName: 'AlertTriangle'
      });

      const techId = `${t.id}-tech`;
      const techSched = this.getEventScheduling(techId, scheduledMeta, CalendarEventType.MILESTONE);

      // EVENT 3: Technical Submission Deadline
      events.push({
        id: techId,
        title: {
          en: `Technical Proposal Submission - ${t.projectName.en}`,
          ar: `تقديم العطاء الفني - ${t.projectName.ar}`
        },
        description: {
          en: `Deadline to submit civil, methodology, and engineering submittals to client`,
          ar: `الموعد النهائي لتقديم الملف الفني والهندسي ومنهجية العمل للجهة المالكة`
        },
        projectCode: pCode,
        projectName: pName,
        module: EventModuleType.PRE_AWARD,
        eventType: EventCategory.TECH_SUBMISSION,
        ownerId,
        ownerName,
        assignedToIds,
        assignedToNames,
        priority: EventPriority.CRITICAL,
        status,
        startDate: techDate,
        endDate: techDate,
        ...techSched,
        predecessorIds: [riskId],
        successorIds: [`${t.id}-alignment`],
        lagDays: 4,
        sourceId: t.id,
        deepLinkPath: 'ongoing-tenders',
        deepLinkLabel: { en: 'Open Tender (Pre-Award)', ar: 'افتح ملف المناقصة (دراسة العطاءات)' },
        notes,
        attachments,
        hasConflict: false,
        colorTheme: {
          bg: 'bg-blue-100/60 dark:bg-blue-900/30',
          border: 'border-blue-300 dark:border-blue-800',
          text: 'text-blue-950 dark:text-blue-200',
          iconColor: 'text-blue-600'
        },
        lucideIconName: 'FileCheck'
      });

      const alignId = `${t.id}-alignment`;
      const alignSched = this.getEventScheduling(alignId, scheduledMeta, CalendarEventType.MILESTONE);

      // EVENT 4: Client Alignment Meeting
      events.push({
        id: alignId,
        title: {
          en: `Client Alignment Workshop - ${t.projectName.en}`,
          ar: `ورشة التنسيق مع العميل - ${t.projectName.ar}`
        },
        description: {
          en: `Discuss technical clarifications, soil test exceptions, and operational constraints`,
          ar: `مناقشة التوضيحات الفنية واستثناءات اختبارات التربة والاشتراطات التشغيلية`
        },
        projectCode: pCode,
        projectName: pName,
        module: EventModuleType.PRE_AWARD,
        eventType: EventCategory.ALIGNMENT_MEETING,
        ownerId,
        ownerName,
        assignedToIds,
        assignedToNames,
        priority: EventPriority.MEDIUM,
        status: EventStatus.WAITING_FOR_OTHERS,
        startDate: alignDate,
        endDate: alignDate,
        ...alignSched,
        predecessorIds: [techId],
        successorIds: [`${t.id}-comm`],
        lagDays: 5,
        sourceId: t.id,
        deepLinkPath: 'ongoing-tenders',
        deepLinkLabel: { en: 'Open Tender (Pre-Award)', ar: 'افتح ملف المناقصة (دراسة العطاءات)' },
        notes,
        attachments,
        hasConflict: false,
        colorTheme: {
          bg: 'bg-zinc-100/80 dark:bg-zinc-800/50',
          border: 'border-zinc-300 dark:border-zinc-700',
          text: 'text-zinc-900 dark:text-zinc-300',
          iconColor: 'text-zinc-500'
        },
        lucideIconName: 'Users'
      });

      const commId = `${t.id}-comm`;
      const commSched = this.getEventScheduling(commId, scheduledMeta, CalendarEventType.MILESTONE);

      // EVENT 5: Commercial Submission Deadline
      events.push({
        id: commId,
        title: {
          en: `Commercial Bid Opening - ${t.projectName.en}`,
          ar: `فتح المظاريف المالية والأسعار - ${t.projectName.ar}`
        },
        description: {
          en: `Official submission and public opening of bid pricing and bank bond security`,
          ar: `التقديم الرسمي والجلسة العلنية لفتح الأسعار وعروض الأسعار والضمانات البنكية`
        },
        projectCode: pCode,
        projectName: pName,
        module: EventModuleType.PRE_AWARD,
        eventType: EventCategory.COMM_SUBMISSION,
        ownerId,
        ownerName,
        assignedToIds,
        assignedToNames,
        priority: EventPriority.CRITICAL,
        status: EventStatus.PENDING,
        startDate: commDate,
        endDate: commDate,
        ...commSched,
        predecessorIds: [alignId],
        successorIds: [],
        lagDays: 0,
        sourceId: t.id,
        deepLinkPath: 'ongoing-tenders',
        deepLinkLabel: { en: 'Open Tender (Pre-Award)', ar: 'افتح ملف المناقصة (دراسة العطاءات)' },
        notes,
        attachments,
        hasConflict: false,
        colorTheme: {
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          border: 'border-emerald-200 dark:border-emerald-900',
          text: 'text-emerald-900 dark:text-emerald-300',
          iconColor: 'text-emerald-500'
        },
        lucideIconName: 'DollarSign'
      });
    });

    // 2. Project Controls Execution Integration
    const rawPC = localStorage.getItem('project_controls_records_db');
    const pcRecords = rawPC ? JSON.parse(rawPC) : mockExecutionData;

    pcRecords.forEach((r: any) => {
      const pCode = r.code || 'PC-EXEC';
      const pName = r.projectName || { en: 'Active Construction', ar: 'تنفيذ المشروع الميداني' };
      const ownerName = 'Mohamed Al-Amri';
      const ownerId = 'usr-mohamed';

      let eventType = EventCategory.IPC_DEADLINE;
      let titlePrefixEn = 'IPC Payment Milestone';
      let titlePrefixAr = 'دفعة مستخلص جاري';
      let colorTheme = {
        bg: 'bg-emerald-100/50 dark:bg-emerald-950/10',
        border: 'border-emerald-200 dark:border-emerald-900/60',
        text: 'text-emerald-950 dark:text-emerald-300',
        iconColor: 'text-emerald-500'
      };
      let icon = 'Receipt';

      if (r.type === 'Claim') {
        eventType = EventCategory.CLAIM_DEADLINE;
        titlePrefixEn = 'Contractual Claim Deadline';
        titlePrefixAr = 'الموعد النهائي لمطالبة تعاقدية';
        colorTheme = {
          bg: 'bg-rose-50 dark:bg-rose-950/20',
          border: 'border-rose-200 dark:border-rose-900',
          text: 'text-rose-900 dark:text-rose-300',
          iconColor: 'text-rose-500'
        };
        icon = 'Scale';
      } else if (r.type === 'VO') {
        eventType = EventCategory.VO_DEADLINE;
        titlePrefixEn = 'Variation Order Revision';
        titlePrefixAr = 'أمر تغيير وتعديل المخطط';
        colorTheme = {
          bg: 'bg-indigo-50 dark:bg-indigo-950/20',
          border: 'border-indigo-200 dark:border-indigo-900',
          text: 'text-indigo-900 dark:text-indigo-300',
          iconColor: 'text-indigo-500'
        };
        icon = 'Layers';
      } else if (r.type === 'NOC') {
        eventType = EventCategory.NOC_DEADLINE;
        titlePrefixEn = 'NOC Clearance Deadline';
        titlePrefixAr = 'خطاب عدم ممانعة وتصاريح';
        colorTheme = {
          bg: 'bg-cyan-50 dark:bg-cyan-950/20',
          border: 'border-cyan-200 dark:border-cyan-900',
          text: 'text-cyan-900 dark:text-cyan-300',
          iconColor: 'text-cyan-500'
        };
        icon = 'FileShield';
      }

      let priority = EventPriority.MEDIUM;
      if (r.health === 'Urgent') priority = EventPriority.CRITICAL;
      else if (r.health === 'Review Required') priority = EventPriority.HIGH;

      let status = EventStatus.IN_PROGRESS;
      if (r.status?.en?.includes('Approved') || r.status?.en?.includes('Released')) {
        status = EventStatus.COMPLETED;
      } else if (r.health === 'Urgent') {
        status = EventStatus.OVERDUE;
      }

      events.push({
        id: `pc-${r.id}`,
        title: {
          en: `${titlePrefixEn} - ${r.projectName.en}`,
          ar: `${titlePrefixAr} - ${r.projectName.ar || r.projectName.en}`
        },
        description: {
          en: `Valued at ${r.valueAED}. Status: ${r.status?.en || 'Submitted'}. Contractor: ${r.contractor || 'Rowad'}`,
          ar: `بقيمة تقريبية ${r.valueAED}. الحالة الحالية: ${r.status?.ar || 'قيد المراجعة'}. المقاول: ${r.contractor || 'رواد التنفيذ'}`
        },
        projectCode: pCode,
        projectName: pName,
        module: EventModuleType.PROJECT_CONTROLS,
        eventType,
        ownerId,
        ownerName,
        assignedToIds: ['usr-engineer'],
        assignedToNames: [r.contractor || 'Site Supervisor'],
        priority,
        status,
        startDate: r.submittedDate || '2026-06-25',
        endDate: r.submittedDate || '2026-06-25',
        calendarEventType: CalendarEventType.DEADLINE,
        startTime: undefined,
        endTime: undefined,
        predecessorIds: [],
        successorIds: [],
        sourceId: r.id,
        deepLinkPath: 'project-execution',
        deepLinkLabel: { en: 'Open Controls Ledger (Execution)', ar: 'افتح سجل المتابعة والرقابة المالية والميدانية' },
        notes: [],
        attachments: [],
        hasConflict: false,
        colorTheme,
        lucideIconName: icon
      });
    });

    // 3. Document Control Integration
    const rawDocs = localStorage.getItem('document_control_records_db');
    const docRecords: ProjectDocument[] = rawDocs ? JSON.parse(rawDocs) : mockDocuments;
    const projectsList = await ProjectLookupService.getInstance().getProjects();

    docRecords.forEach((d: ProjectDocument) => {
      let priority = EventPriority.MEDIUM;
      if (d.priority === 'High') priority = EventPriority.HIGH;
      else if (d.priority === 'Low') priority = EventPriority.LOW;

      let status = EventStatus.WAITING_FOR_ME;
      if (d.status.includes('Approved') || d.status.includes('Delivered')) {
        status = EventStatus.COMPLETED;
      }

      const proj = projectsList.find(p => p.id === d.projectId);
      const pCode = proj ? proj.code : 'UNKNOWN';
      const pName = proj ? { en: proj.nameEn, ar: proj.nameAr || proj.nameEn } : { en: 'Unknown Project', ar: 'مشروع غير معروف' };

      events.push({
        id: `doc-${d.id}`,
        title: {
          en: `Document Submittal Check - ${d.code}`,
          ar: `تدقيق وثيقة هندسية صادر ووارد - ${d.code}`
        },
        description: {
          en: `${d.titleEn}. Category: ${d.category}. From: ${d.sender} To: ${d.recipient}`,
          ar: `${d.titleAr || d.titleEn}. التصنيف: ${d.category}. المرسل: ${d.sender} المستقبل: ${d.recipient}`
        },
        projectCode: pCode,
        projectName: pName,
        module: EventModuleType.DOCUMENT_CONTROL,
        eventType: EventCategory.SUBMITTAL_REVIEW,
        ownerId: 'usr-sarah',
        ownerName: 'Sarah Al-Mansoori',
        assignedToIds: [],
        assignedToNames: [],
        priority,
        status,
        startDate: d.dateReceived || '2026-06-18',
        endDate: d.dateReceived || '2026-06-18',
        calendarEventType: CalendarEventType.DEADLINE,
        startTime: undefined,
        endTime: undefined,
        predecessorIds: [],
        successorIds: [],
        sourceId: d.id,
        deepLinkPath: 'document-control',
        deepLinkLabel: { en: 'Open Document Transmittals', ar: 'افتح مراقبة المستندات والخطابات الصادرة والواردة' },
        notes: [],
        attachments: [{
          id: `att-${d.id}`,
          fileName: d.titleEn + '.pdf',
          fileSize: '2.4 MB',
          uploadedBy: d.sender,
          uploadDate: d.dateReceived,
          downloadUrl: '#'
        }],
        hasConflict: false,
        colorTheme: {
          bg: 'bg-slate-100 dark:bg-slate-800/40',
          border: 'border-slate-300 dark:border-slate-700',
          text: 'text-slate-900 dark:text-slate-300',
          iconColor: 'text-slate-600'
        },
        lucideIconName: 'FileText'
      });
    });

    // 4. Custom Manual Events
    const rawManual = localStorage.getItem('operations_manual_events');
    if (rawManual) {
      const manualList = JSON.parse(rawManual);
      events.push(...manualList);
    }

    // 5. Evaluate Conflicts (Resource Double-Bookings & Sequence Chronology / Lag slippage)
    this.detectAndApplyConflicts(events);

    return events;
  }

  /**
   * Internal routine to evaluate scheduling conflicts across the portfolio:
   * - Resource Overlaps: Same employee assigned to meetings/events at identical hours
   * - Chronological Errors: Predecessor date scheduled LATER than successor date
   * - Lag Buffer Violations: Successor scheduled within violating lagDays buffer
   */
  private detectAndApplyConflicts(events: CalendarEvent[]): void {
    let settings: Settings | null = null;
    try {
      const saved = localStorage.getItem('pmo_enterprise_settings');
      if (saved) {
        settings = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error parsing settings in OperationsCenterService:', e);
    }

    const finalSettings: Settings = settings || {
      conflictSettings: {
        minGapBetweenMeetings: 30,
        travelBuffer: 15,
        conflictThreshold: 0,
        allowBackToBack: true
      }
    } as any;

    // Reset all flags first
    events.forEach(e => {
      e.hasConflict = false;
    });

    const engine = new ConflictDetectionEngine();
    const results = engine.evaluateAll(events, finalSettings);

    results.forEach(res => {
      // Set hasConflict = true ONLY for real conflicts (double bookings, sequence errors, lag violations)
      // Sequential/Back-to-back and travel warnings do not trigger hard conflict state on events
      if (
        res.type === 'double_booking' || 
        res.type === 'chronological_violation' || 
        res.type === 'lag_buffer_violation'
      ) {
        res.affectedEvents.forEach(affected => {
          const ev = events.find(item => item.id === affected.id);
          if (ev) {
            ev.hasConflict = true;
          }
        });
      }
    });
  }

  /**
   * Propagates dates recursively inside the DAG when a parent event shifts
   */
  public propagateRescheduling(
    events: CalendarEvent[],
    changedEventId: string,
    newStartDate: string,
    newEndDate: string
  ): CalendarEvent[] {
    // Deep clone to avoid mutating state directly
    const clonedEvents = JSON.parse(JSON.stringify(events)) as CalendarEvent[];
    const target = clonedEvents.find(e => e.id === changedEventId);
    if (!target) return clonedEvents;

    // Calculate shift in days
    const oldStart = new Date(target.startDate);
    const updatedStart = new Date(newStartDate);
    const diffMs = updatedStart.getTime() - oldStart.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0 && target.endDate === newEndDate) {
      return clonedEvents; // No real shift
    }

    // Apply change to target
    target.startDate = newStartDate;
    target.endDate = newEndDate;

    // Recursive helper to update children
    const queue = [target.id];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentEvent = clonedEvents.find(e => e.id === currentId);
      if (!currentEvent) continue;

      const currentEnd = new Date(currentEvent.endDate);

      // Find children where predecessorIds contains currentId
      const children = clonedEvents.filter(e => e.predecessorIds && e.predecessorIds.includes(currentId));
      
      children.forEach(child => {
        const childStart = new Date(child.startDate);
        const childEnd = new Date(child.endDate);
        const minBufferDays = child.lagDays || 0;
        
        // Target ideal start date based on lag
        const idealStart = new Date(currentEnd);
        idealStart.setDate(idealStart.getDate() + minBufferDays);

        // If the successor's start date is earlier than required, shift it forward!
        if (childStart < idealStart) {
          const shiftMs = idealStart.getTime() - childStart.getTime();
          const shiftDays = Math.round(shiftMs / (1000 * 60 * 60 * 24));
          
          if (shiftDays > 0) {
            const newChildStart = new Date(childStart);
            newChildStart.setDate(newChildStart.getDate() + shiftDays);
            
            const newChildEnd = new Date(childEnd);
            newChildEnd.setDate(newChildEnd.getDate() + shiftDays);

            child.startDate = newChildStart.toISOString().split('T')[0];
            child.endDate = newChildEnd.toISOString().split('T')[0];
            
            // Log audit note on the shifted child
            const noteText = `Auto-shifted dates by +${shiftDays} days to respect predecessor lag constraint.`;
            child.notes.unshift({
              id: `sys-${Date.now()}-${Math.random()}`,
              authorName: 'System Engine',
              timestamp: new Date().toISOString().split('T')[0],
              text: noteText
            });

            // Queue the child's children
            queue.push(child.id);
          }
        }
      });
    }

    // Re-evaluate conflicts
    this.detectAndApplyConflicts(clonedEvents);

    return clonedEvents;
  }

  /**
   * Persists event changes back to the actual databases (Pre-Award, Project Controls, Docs, or Manual)
   */
  public async saveEvent(event: CalendarEvent): Promise<boolean> {
    try {
      // 1. Manual Event Persistence
      if (event.module === EventModuleType.MANUAL) {
        const rawManual = localStorage.getItem('operations_manual_events');
        let manualList: CalendarEvent[] = rawManual ? JSON.parse(rawManual) : [];
        const idx = manualList.findIndex(e => e.id === event.id);
        if (idx !== -1) {
          manualList[idx] = event;
        } else {
          manualList.push(event);
        }
        localStorage.setItem('operations_manual_events', JSON.stringify(manualList));
        return true;
      }

      // 2. Pre-Award Tender Synchronization
      if (event.module === EventModuleType.PRE_AWARD && event.sourceId) {
        const rawTenders = localStorage.getItem('preaward_tenders_db');
        if (rawTenders) {
          const tenders = JSON.parse(rawTenders);
          const tIdx = tenders.findIndex((t: any) => t.id === event.sourceId);
          if (tIdx !== -1) {
            const tender = tenders[tIdx];
            
            // Map event dates back to tender milestones based on category
            if (event.eventType === EventCategory.KICK_OFF) {
              tender.kickOffDate = event.startDate;
            } else if (event.eventType === EventCategory.RISK_ASSESSMENT) {
              tender.riskDueDate = event.startDate;
            } else if (event.eventType === EventCategory.TECH_SUBMISSION) {
              tender.techSubmissionDate = event.startDate;
            } else if (event.eventType === EventCategory.ALIGNMENT_MEETING) {
              tender.alignmentDate = event.startDate;
            } else if (event.eventType === EventCategory.COMM_SUBMISSION) {
              tender.commSubmissionDate = event.startDate;
            }

            // Sync notes back
            if (event.notes && event.notes.length > 0) {
              tender.notes = event.notes.map(n => ({
                id: n.id,
                author: n.authorName,
                date: n.timestamp,
                text: n.text
              }));
            }

            // Sync status back
            if (event.status === EventStatus.COMPLETED) {
              tender.projectStatus = { en: 'Completed Review', ar: 'مكتمل التدقيق والمراجعة' };
            }

            tenders[tIdx] = tender;
            localStorage.setItem('preaward_tenders_db', JSON.stringify(tenders));

            // ALSO save meeting metadata overrides
            const rawScheduledMeta = localStorage.getItem('operations_preaward_scheduling_metadata');
            const scheduledMeta = rawScheduledMeta ? JSON.parse(rawScheduledMeta) : {};
            
            if (event.calendarEventType && event.calendarEventType !== CalendarEventType.MILESTONE) {
              scheduledMeta[event.id] = {
                calendarEventType: event.calendarEventType,
                startTime: event.startTime,
                endTime: event.endTime,
                durationMinutes: event.durationMinutes,
                meetingType: event.meetingType,
                meetingLink: event.meetingLink,
                meetingRoom: event.meetingRoom,
                attendees: event.attendees
              };
            } else {
              delete scheduledMeta[event.id];
            }
            localStorage.setItem('operations_preaward_scheduling_metadata', JSON.stringify(scheduledMeta));
          }
        }
        return true;
      }

      // 3. Project Controls Synchronization
      if (event.module === EventModuleType.PROJECT_CONTROLS && event.sourceId) {
        const rawPC = localStorage.getItem('project_controls_records_db');
        if (rawPC) {
          const records = JSON.parse(rawPC);
          const rIdx = records.findIndex((r: any) => r.id === event.sourceId);
          if (rIdx !== -1) {
            const record = records[rIdx];
            record.submittedDate = event.startDate;
            
            if (event.status === EventStatus.COMPLETED) {
              record.status = { en: 'Approved & Released', ar: 'معتمد ومفرج عنه مالياً' };
              record.health = 'Healthy';
              record.progress = 100;
            } else if (event.status === EventStatus.OVERDUE) {
              record.health = 'Urgent';
            }

            records[rIdx] = record;
            localStorage.setItem('project_controls_records_db', JSON.stringify(records));
          }
        }
        return true;
      }

      // 4. Document Control Synchronization
      if (event.module === EventModuleType.DOCUMENT_CONTROL && event.sourceId) {
        const rawDocs = localStorage.getItem('document_control_records_db');
        if (rawDocs) {
          const docs = JSON.parse(rawDocs);
          const dIdx = docs.findIndex((d: any) => d.id === event.sourceId);
          if (dIdx !== -1) {
            const doc = docs[dIdx];
            doc.dateReceived = event.startDate;
            
            if (event.status === EventStatus.COMPLETED) {
              doc.status = 'Approved & Archiving Complete';
            }

            docs[dIdx] = doc;
            localStorage.setItem('document_control_records_db', JSON.stringify(docs));
          }
        }
        return true;
      }

    } catch (error) {
      console.error('Error synchronizing calendar changes back to master logs:', error);
    }
    return false;
  }

  /**
   * Commits a completely new manual event to localStorage
   */
  public async createManualEvent(event: Omit<CalendarEvent, 'id' | 'hasConflict'>): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: this.generateId(),
      hasConflict: false
    };

    const rawManual = localStorage.getItem('operations_manual_events');
    const manualList: CalendarEvent[] = rawManual ? JSON.parse(rawManual) : [];
    manualList.push(newEvent);
    localStorage.setItem('operations_manual_events', JSON.stringify(manualList));

    return newEvent;
  }
}
