import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Save, Edit3, Archive, RotateCcw, Calendar, Clock, 
  MapPin, Users, HelpCircle, FileText, CheckSquare, X, ListPlus 
} from 'lucide-react';
import { ProjectMeeting } from '../../../../domain/projects/Project';
import { ProjectLookupService } from '../../../../services/ProjectLookupService';
import { RecordStatus } from '../../../../enums/RecordStatus';
import { BiText } from '../../../../components/BiText';
import { useDialog } from '../../../../components/ui/DialogProvider';

interface MeetingsPanelProps {
  lang: 'ar' | 'en';
  projectId: string;
  projectCode: string;
  isProjectArchived: boolean;
  onRefresh?: () => void;
}

export function MeetingsPanel({
  lang,
  projectId,
  projectCode,
  isProjectArchived,
  onRefresh
}: MeetingsPanelProps) {
  const isAr = lang === 'ar';
  const lookupService = ProjectLookupService.getInstance();
  const dialog = useDialog();

  const [meetings, setMeetings] = useState<ProjectMeeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingMeeting, setEditingMeeting] = useState<ProjectMeeting | null>(null);

  // Form Fields
  const [meetTitle, setMeetTitle] = useState('');
  const [meetTitleAr, setMeetTitleAr] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetStart, setMeetStart] = useState('09:00');
  const [meetEnd, setMeetEnd] = useState('10:00');
  const [meetType, setMeetType] = useState('Technical Coordination');
  const [meetLocation, setMeetLocation] = useState('');
  const [meetAttendees, setMeetAttendees] = useState('');
  const [relatedEntityType, setRelatedEntityType] = useState('');
  const [relatedEntityId, setRelatedEntityId] = useState('');
  const [outcome, setOutcome] = useState('');
  const [decisions, setDecisions] = useState<string[]>([]);
  const [newDecision, setNewDecision] = useState('');
  
  // Action Items State
  const [actionItems, setActionItems] = useState<{
    taskDescription: string;
    assignee: string;
    dueDate: string;
    status: 'Open' | 'Closed' | 'Cancelled';
  }[]>([]);
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');
  const [newActionDueDate, setNewActionDueDate] = useState('');

  // Filtering states
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived'>('Active');
  const [searchQuery, setSearchQuery] = useState('');

  const reloadMeetings = async () => {
    const list = await lookupService.getMeetings(projectId);
    setMeetings(list);
  };

  useEffect(() => {
    reloadMeetings();
  }, [projectId]);

  // Handle decisions & action items lists in forms
  const addDecision = () => {
    if (newDecision.trim()) {
      setDecisions([...decisions, newDecision.trim()]);
      setNewDecision('');
    }
  };

  const removeDecision = (index: number) => {
    setDecisions(decisions.filter((_, i) => i !== index));
  };

  const addActionItem = () => {
    if (newActionTask.trim() && newActionAssignee.trim()) {
      setActionItems([
        ...actionItems,
        {
          taskDescription: newActionTask.trim(),
          assignee: newActionAssignee.trim(),
          dueDate: newActionDueDate || new Date().toISOString().substring(0, 10),
          status: 'Open'
        }
      ]);
      setNewActionTask('');
      setNewActionAssignee('');
      setNewActionDueDate('');
    }
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const toggleActionItemStatus = (index: number, nextStatus: 'Open' | 'Closed' | 'Cancelled') => {
    const updated = [...actionItems];
    updated[index].status = nextStatus;
    setActionItems(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;

    // Data Integrity Check: Ensure parent project is active before adding/editing
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'لا يمكن تعديل السجلات لأن المشروع مؤرشف حالياً.' : 'Cannot save changes because the project is currently archived.');
      return;
    }

    const targetId = editingMeeting ? editingMeeting.id : `meet-${Date.now()}`;
    const auditInfo = editingMeeting ? editingMeeting.auditInfo : {
      createdBy: 'User',
      createdAt: new Date().toISOString()
    };

    const meetingRecord: ProjectMeeting = {
      id: targetId,
      recordStatus: editingMeeting ? editingMeeting.recordStatus : RecordStatus.ACTIVE,
      auditInfo,
      projectId,
      title: meetTitle.trim(),
      titleAr: meetTitleAr.trim() || undefined,
      date: meetDate || new Date().toISOString().substring(0, 10),
      startTime: meetStart,
      endTime: meetEnd,
      meetingType: meetType,
      locationOrLink: meetLocation,
      attendees: meetAttendees.split(',').map(a => a.trim()).filter(Boolean),
      remarks: editingMeeting?.remarks || 'Managed from Project Workspace',
      relatedEntityType: relatedEntityType || undefined,
      relatedEntityId: relatedEntityId || undefined,
      decisions,
      actionItems,
      outcome: outcome.trim() || undefined
    };

    const success = await lookupService.saveMeeting(meetingRecord);
    if (success) {
      await lookupService.addHistory(
        projectId,
        editingMeeting ? 'Meeting Details Updated' : 'Meeting Scheduled',
        'User',
        `Meeting title: ${meetTitle}`,
        'Meeting',
        targetId
      );
      setShowForm(false);
      resetForm();
      reloadMeetings();
      if (onRefresh) onRefresh();
    }
  };

  const startCreate = async () => {
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    resetForm();
    setFormMode('create');
    setShowForm(true);
  };

  const startEdit = async (meeting: ProjectMeeting) => {
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'المشروع مؤرشف للقراءة فقط.' : 'Project is archived (Read-Only).');
      return;
    }
    loadMeetingIntoForm(meeting);
    setFormMode('edit');
    setShowForm(true);
  };

  const startView = (meeting: ProjectMeeting) => {
    loadMeetingIntoForm(meeting);
    setFormMode('view');
    setShowForm(true);
  };

  const loadMeetingIntoForm = (meeting: ProjectMeeting) => {
    setEditingMeeting(meeting);
    setMeetTitle(meeting.title);
    setMeetTitleAr(meeting.titleAr || '');
    setMeetDate(meeting.date);
    setMeetStart(meeting.startTime || '09:00');
    setMeetEnd(meeting.endTime || '10:00');
    setMeetType(meeting.meetingType || 'Technical Coordination');
    setMeetLocation(meeting.locationOrLink || '');
    setMeetAttendees(meeting.attendees.join(', '));
    setRelatedEntityType(meeting.relatedEntityType || '');
    setRelatedEntityId(meeting.relatedEntityId || '');
    setDecisions(meeting.decisions || []);
    setActionItems(meeting.actionItems || []);
    setOutcome(meeting.outcome || '');
  };

  const resetForm = () => {
    setEditingMeeting(null);
    setMeetTitle('');
    setMeetTitleAr('');
    setMeetDate(new Date().toISOString().substring(0, 10));
    setMeetStart('09:00');
    setMeetEnd('10:00');
    setMeetType('Technical Coordination');
    setMeetLocation('');
    setMeetAttendees('');
    setRelatedEntityType('');
    setRelatedEntityId('');
    setDecisions([]);
    setActionItems([]);
    setOutcome('');
    setNewDecision('');
    setNewActionTask('');
    setNewActionAssignee('');
    setNewActionDueDate('');
  };

  const handleArchive = async (meeting: ProjectMeeting) => {
    if (isProjectArchived) return;
    const reason = await dialog.promptText(
      isAr ? 'أدخل سبب أرشفة الاجتماع (إلزامي):' : 'Enter meeting archive reason (mandatory):',
      { required: true, title: isAr ? 'أرشفة الاجتماع' : 'Archive Meeting' }
    );
    if (!reason || !reason.trim()) {
      return;
    }

    const updated: ProjectMeeting = {
      ...meeting,
      recordStatus: RecordStatus.ARCHIVED,
      archiveInfo: {
        archivedBy: 'User',
        archivedAt: new Date().toISOString(),
        archiveReason: reason.trim()
      }
    };

    const success = await lookupService.saveMeeting(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'Meeting Archived',
        'User',
        `Archived meeting: ${meeting.title}. Reason: ${reason}`
      );
      reloadMeetings();
      if (onRefresh) onRefresh();
    }
  };

  const handleRestore = async (meeting: ProjectMeeting) => {
    // Restrict Restore Rule: Parent project must be active
    if (isProjectArchived) {
      await dialog.alert(isAr ? 'لا يمكن استعادة السجل لأن المشروع الأب مؤرشف.' : 'Cannot restore meeting because the parent project is archived.');
      return;
    }

    const updated: ProjectMeeting = {
      ...meeting,
      recordStatus: RecordStatus.ACTIVE,
      archiveInfo: undefined
    };

    const success = await lookupService.saveMeeting(updated);
    if (success) {
      await lookupService.addHistory(
        projectId,
        'Meeting Restored',
        'User',
        `Restored meeting: ${meeting.title}`
      );
      reloadMeetings();
      if (onRefresh) onRefresh();
    }
  };

  // Filter list
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      const matchStatus = statusFilter === 'Archived' 
        ? m.recordStatus === RecordStatus.ARCHIVED 
        : m.recordStatus !== RecordStatus.ARCHIVED;
      
      const q = searchQuery.toLowerCase();
      const matchQuery = !searchQuery.trim() || 
        m.title.toLowerCase().includes(q) || 
        (m.titleAr && m.titleAr.toLowerCase().includes(q)) || 
        m.meetingType.toLowerCase().includes(q);
      
      return matchStatus && matchQuery;
    });
  }, [meetings, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 text-xs">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-brand-navy dark:text-slate-100 uppercase">
            {isAr ? 'سجل محاضر وتنسيق الاجتماعات' : 'Meeting Minutes & Logs'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isAr ? 'تسجيل محاضر التنسيق الفني، تدوين التوصيات، والقرارات الإلزامية وتعيين المهام.' : 'Bilingual coordination logs, action item lifecycles, and target resolution tracking.'}
          </p>
        </div>

        {!showForm && !isProjectArchived && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل اجتماع جديد' : 'Record Meeting'}</span>
          </button>
        )}
      </div>

      {/* Form Area */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-6">
          <h4 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase border-b pb-2">
            {formMode === 'view' ? (isAr ? 'عرض تفاصيل الاجتماع' : 'View Meeting details') :
             formMode === 'edit' ? (isAr ? 'تعديل السجل الحالي' : 'Edit Meeting Minutes') : 
             (isAr ? 'تسجيل محضر اجتماع جديد' : 'New Meeting Minutes Record')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'عنوان الاجتماع (EN) *' : 'Meeting Title (EN) *'}</label>
              <input
                type="text"
                required
                disabled={formMode === 'view'}
                value={meetTitle}
                onChange={e => setMeetTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'عنوان الاجتماع (AR)' : 'Meeting Title (AR)'}</label>
              <input
                type="text"
                disabled={formMode === 'view'}
                value={meetTitleAr}
                onChange={e => setMeetTitleAr(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تصنيف الاجتماع' : 'Meeting Type'}</label>
              <select
                disabled={formMode === 'view'}
                value={meetType}
                onChange={e => setMeetType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="Technical Coordination">Technical Coordination</option>
                <option value="Kick-Off">Kick-Off</option>
                <option value="Progress Review">Progress Review</option>
                <option value="Claims Negotiation">Claims Negotiation</option>
                <option value="VO Review">VO Review</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ الاجتماع' : 'Date'}</label>
              <input
                type="date"
                required
                disabled={formMode === 'view'}
                value={meetDate}
                onChange={e => setMeetDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'وقت البدء' : 'Start Time'}</label>
              <input
                type="time"
                disabled={formMode === 'view'}
                value={meetStart}
                onChange={e => setMeetStart(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'وقت الانتهاء' : 'End Time'}</label>
              <input
                type="time"
                disabled={formMode === 'view'}
                value={meetEnd}
                onChange={e => setMeetEnd(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'رابط الاجتماع / الموقع' : 'Location or Link'}</label>
              <input
                type="text"
                disabled={formMode === 'view'}
                value={meetLocation}
                onChange={e => setMeetLocation(e.target.value)}
                placeholder="e.g. Teams Link, Meeting Room 4"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'أسماء الحاضرين (مفصولة بفواصل)' : 'Attendees (comma-separated)'}</label>
              <input
                type="text"
                disabled={formMode === 'view'}
                value={meetAttendees}
                onChange={e => setMeetAttendees(e.target.value)}
                placeholder="e.g. Ahmed Kamel, Eng. John Smith"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            {/* Related Entity Linkage */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'ارتباط بكيان تجاري' : 'Link to Business Entity'}</label>
              <select
                disabled={formMode === 'view'}
                value={relatedEntityType}
                onChange={e => setRelatedEntityType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800"
              >
                <option value="">{isAr ? 'لا يوجد ارتباط' : 'No Link'}</option>
                <option value="ProjectClaim">{isAr ? 'مطالبة تعاقدية (Claim)' : 'Claim'}</option>
                <option value="ProjectVariationOrder">{isAr ? 'أمر تغييري (VO)' : 'Variation Order'}</option>
                <option value="ProjectIPC">{isAr ? 'مستخلص مالي (IPC)' : 'IPC'}</option>
                <option value="ProjectNOC">{isAr ? 'تصريح ممانعة (NOC)' : 'NOC'}</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'كود الكيان المرتبط (UUID)' : 'Related Entity Reference ID'}</label>
              <input
                type="text"
                disabled={formMode === 'view' || !relatedEntityType}
                value={relatedEntityId}
                onChange={e => setRelatedEntityId(e.target.value)}
                placeholder="e.g. claim-uuid, vo-uuid"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none font-mono"
              />
            </div>

          </div>

          {/* Decisions Section */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{isAr ? 'القرارات المتخذة بالاجتماع' : 'Decisions Approved'}</span>
            
            {formMode !== 'view' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDecision}
                  onChange={e => setNewDecision(e.target.value)}
                  placeholder={isAr ? 'اكتب القرار الجديد...' : 'Enter new decision details...'}
                  className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={addDecision}
                  className="px-3 py-2 bg-brand-navy hover:bg-brand-navy/95 text-white font-bold rounded-lg cursor-pointer text-xs"
                >
                  {isAr ? 'إضافة' : 'Add'}
                </button>
              </div>
            )}

            <ul className="list-decimal list-inside pl-2 space-y-1 font-semibold text-slate-700 dark:text-slate-300">
              {decisions.map((dec, idx) => (
                <li key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                  <span>{dec}</span>
                  {formMode !== 'view' && (
                    <button
                      type="button"
                      onClick={() => removeDecision(idx)}
                      className="text-brand-red p-1 hover:bg-red-50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
              {decisions.length === 0 && <span className="text-slate-450 text-[10px] italic block">{isAr ? 'لم يتم تسجيل قرارات بعد.' : 'No decisions added.'}</span>}
            </ul>
          </div>

          {/* Action Items Section */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{isAr ? 'بنود العمل والمهام وتواريخ التسليم' : 'Action Items & Deliverables'}</span>
            
            {formMode !== 'view' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50">
                <input
                  type="text"
                  value={newActionTask}
                  onChange={e => setNewActionTask(e.target.value)}
                  placeholder={isAr ? 'تفاصيل المهمة...' : 'Task description...'}
                  className="p-2 border rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={newActionAssignee}
                  onChange={e => setNewActionAssignee(e.target.value)}
                  placeholder={isAr ? 'المسؤول عنها...' : 'Assignee name...'}
                  className="p-2 border rounded-lg text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newActionDueDate}
                    onChange={e => setNewActionDueDate(e.target.value)}
                    className="p-2 border rounded-lg text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={addActionItem}
                    className="px-3 bg-brand-navy hover:bg-brand-navy/95 text-white font-bold rounded-lg cursor-pointer"
                  >
                    {isAr ? 'إضافة' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              {actionItems.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 gap-2">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-slate-700 dark:text-slate-200">{item.taskDescription}</div>
                    <div className="text-[10px] text-slate-400 font-semibold font-sans">
                      Assignee: <span className="text-slate-650">{item.assignee}</span> | Due: <span className="font-mono">{item.dueDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      item.status === 'Open' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      item.status === 'Closed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                    {formMode !== 'view' && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => toggleActionItemStatus(idx, 'Closed')}
                          className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border rounded text-[9px] font-bold"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActionItemStatus(idx, 'Cancelled')}
                          className="px-1.5 py-0.5 bg-slate-50 text-slate-500 border rounded text-[9px] font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => removeActionItem(idx)}
                          className="text-brand-red p-1 hover:bg-red-50 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {actionItems.length === 0 && <span className="text-slate-450 text-[10px] italic block">{isAr ? 'لم يتم تعيين مهام حتى الآن.' : 'No action items set.'}</span>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'ملخص مخرجات وتوصيات الاجتماع' : 'Outcome Summary'}</label>
            <textarea
              rows={3}
              disabled={formMode === 'view'}
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
              placeholder={isAr ? 'اكتب ملخصاً عاماً لما تم التوصل إليه...' : 'Provide a general outcome summary...'}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
            >
              {formMode === 'view' ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'إلغاء' : 'Cancel')}
            </button>
            {formMode !== 'view' && (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold rounded-xl cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{formMode === 'edit' ? (isAr ? 'حفظ التغييرات' : 'Save Changes') : (isAr ? 'حفظ الاجتماع' : 'Save Minutes')}</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* Grid List View */}
      {!showForm && (
        <div className="space-y-3">
          {/* List Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'البحث عن اجتماع...' : 'Search meetings...'}
              className="w-full sm:w-80 p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg"
            />
            
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{isAr ? 'تصفية الحالة:' : 'Filter:'}</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="border rounded p-1 bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none"
              >
                <option value="Active">{isAr ? 'النشطة' : 'Active Logs'}</option>
                <option value="Archived">{isAr ? 'المؤرشفة' : 'Archived'}</option>
              </select>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((meet) => (
                <div key={meet.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4 hover:border-slate-250 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[9px]">
                        {meet.meetingType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        meet.recordStatus === 'Archived' ? 'bg-rose-50 text-rose-600 border border-rose-100/50' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                      }`}>
                        {meet.recordStatus || 'Active'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-[13px] hover:text-brand-red cursor-pointer transition-colors" onClick={() => startView(meet)}>
                        {isAr && meet.titleAr ? meet.titleAr : meet.title}
                      </h4>
                      {meet.titleAr && meet.titleAr !== meet.title && (
                        <p className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5">{meet.title}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1.5 border-t border-slate-50 dark:border-slate-850 text-[10px] text-slate-500 font-semibold font-sans">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                        <span>{meet.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                        <span className="font-mono">{meet.startTime} - {meet.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                        <span className="truncate">{meet.locationOrLink || 'Not Specified'}</span>
                      </div>
                      {meet.relatedEntityType && (
                        <div className="flex items-center gap-1 col-span-2 text-brand-red font-mono text-[9px] uppercase tracking-wider">
                          <span>Link: {meet.relatedEntityType} ({meet.relatedEntityId?.substring(0, 8)})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-850">
                    <button
                      onClick={() => startView(meet)}
                      className="text-brand-navy hover:text-brand-red font-extrabold text-[10px]"
                    >
                      {isAr ? 'عرض المحضر الكلي ➔' : 'View Full Minutes ➔'}
                    </button>

                    {!isProjectArchived && (
                      <div className="flex items-center gap-1">
                        {meet.recordStatus === 'Archived' ? (
                          <button
                            onClick={() => handleRestore(meet)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-100 cursor-pointer"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(meet)}
                              className="p-1 text-slate-650 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleArchive(meet)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-100 cursor-pointer"
                              title="Archive"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                <p className="font-bold">{isAr ? 'لا توجد اجتماعات مسجلة مطابقة.' : 'No registered meetings found.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
