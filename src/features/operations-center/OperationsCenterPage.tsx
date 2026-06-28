import React, { useState } from 'react';
import { 
  Plus, Calendar as CalIcon, Users, Sliders, Briefcase, Sparkles, TrendingUp, AlertTriangle, List, CheckCircle, Kanban
} from 'lucide-react';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { EventModuleType, EventCategory, EventPriority, EventStatus, CalendarEvent } from './types';
import { Settings } from '../../domain/administration/Settings';

// Components
import { AICommandBar } from './components/Shared/AICommandBar';
import { OperationsCommandPanel } from './components/Shared/OperationsCommandPanel';
import { MyWorkPanel } from './components/MyWork/MyWorkPanel';
import { OperationalLoadGrid } from './components/Calendar/OperationalLoadGrid';
import { AgendaPanel } from './components/Agenda/AgendaPanel';
import { TimelineTracks } from './components/Timeline/TimelineTracks';
import { KanbanBoard } from './components/Kanban/KanbanBoard';
import { WorkloadPanel } from './components/Workload/WorkloadPanel';
import { ConflictPanel } from './components/Conflicts/ConflictPanel';
import { AnalyticsPanel } from './components/Analytics/AnalyticsPanel';

const SHOW_FUTURE_CAPABILITIES = false;

interface OperationsCenterPageProps {
  lang: 'ar' | 'en';
  onNavigateToView: (viewId: string) => void;
  settings?: Settings;
}

export default function OperationsCenterPage({ lang, onNavigateToView, settings }: OperationsCenterPageProps) {
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'mywork' | 'calendar' | 'agenda' | 'timeline' | 'kanban' | 'workload' | 'conflicts' | 'analytics'>('mywork');
  const [showNewEventForm, setShowNewEventForm] = useState(false);

  // New manual event state
  const [newEventTitleEn, setNewEventTitleEn] = useState('');
  const [newEventTitleAr, setNewEventTitleAr] = useState('');
  const [newEventDescEn, setNewEventDescEn] = useState('');
  const [newEventDescAr, setNewEventDescAr] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-06-25');
  const [newEventPriority, setNewEventPriority] = useState<EventPriority>(EventPriority.MEDIUM);

  const {
    filteredEvents,
    events,
    searchQuery,
    setSearchQuery,
    selectedEvent,
    setSelectedEventId,
    rescheduleEvent,
    updateEventDetails,
    completeEvent,
    reassignEventOwner,
    addEventNote,
    attachFileToEvent,
    createManualEvent,
    refresh
  } = useCalendarEvents();

  // Active conflicts count for tab badge
  const conflictsCount = events.filter(e => e.hasConflict).length;

  const handleAICommand = (command: string, actionType: string, filterVal?: string) => {
    if (actionType === 'filter' && filterVal === 'overdue') {
      setSearchQuery('overdue');
    } else if (actionType === 'tab' && filterVal) {
      setActiveTab(filterVal as any);
    } else {
      setSearchQuery(command);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitleEn.trim()) return;

    await createManualEvent({
      title: { en: newEventTitleEn, ar: newEventTitleAr || newEventTitleEn },
      description: { en: newEventDescEn, ar: newEventDescAr || newEventDescEn },
      projectCode: 'PC-MANUAL',
      projectName: { en: 'Manual Custom Milestone', ar: 'مرحلة عمل إضافية مخصصة' },
      module: EventModuleType.MANUAL,
      eventType: EventCategory.INTERNAL_MEETING,
      ownerId: 'usr-sara',
      ownerName: 'Sara Al-Mansoori',
      assignedToIds: [],
      assignedToNames: [],
      priority: newEventPriority,
      status: EventStatus.PENDING,
      startDate: newEventDate,
      endDate: newEventDate,
      startTime: '10:00',
      endTime: '11:00',
      predecessorIds: [],
      successorIds: [],
      sourceId: 'manual',
      deepLinkPath: '',
      deepLinkLabel: { en: 'View Details', ar: 'عرض التفاصيل' },
      notes: [],
      attachments: [],
      colorTheme: {
        bg: 'bg-indigo-50 dark:bg-indigo-950/20',
        border: 'border-indigo-200 dark:border-indigo-900',
        text: 'text-indigo-900 dark:text-indigo-300',
        iconColor: 'text-indigo-500'
      },
      lucideIconName: 'Plus'
    });

    // Reset Form
    setNewEventTitleEn('');
    setNewEventTitleAr('');
    setNewEventDescEn('');
    setNewEventDescAr('');
    setShowNewEventForm(false);
  };

  // Automated DAG conflict shift solver
  const handleAutoResolveConflict = (conflict: any) => {
    if (conflict.type === 'chronological_violation' || conflict.type === 'lag_buffer_violation') {
      const parent = conflict.affectedEvents[0];
      const child = conflict.affectedEvents[1];
      if (parent && child) {
        // Compute new start and end for child based on predecessor end + lag days
        const parentEnd = new Date(parent.endDate);
        const minLag = child.lagDays || 1;
        const targetDate = new Date(parentEnd);
        targetDate.setDate(targetDate.getDate() + minLag);

        const targetDateStr = targetDate.toISOString().split('T')[0];
        rescheduleEvent(child.id, targetDateStr, targetDateStr);
      }
    } else if (conflict.type === 'double_booking') {
      // Reassign or shift second event forward by 2 hours
      const target = conflict.affectedEvents[1];
      if (target) {
        if (target.startTime && target.endTime) {
          const [sh, sm] = target.startTime.split(':').map(Number);
          const [eh, em] = target.endTime.split(':').map(Number);
          const newStart = `${String((sh + 2) % 24).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
          const newEnd = `${String((eh + 2) % 24).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
          
          const cloned = {
            ...target,
            startTime: newStart,
            endTime: newEnd,
            notes: [{
              id: `sys-res-${Date.now()}`,
              authorName: 'System Diagnostic',
              timestamp: new Date().toISOString().split('T')[0],
              text: 'Auto-resolved double-booking conflict by shifting the schedule slots forward.'
            }, ...target.notes]
          };
          updateEventDetails(cloned);
        }
      }
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden" id="operations-center-root">
      {/* Primary Deck Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
        
        {/* Header Ribbon bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="bg-brand-red text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full font-mono">
                ROWAD OPERATIONS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="text-xs text-slate-400 font-mono">Active Command Desk</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
              {isAr ? 'مركز العمليات والمحفظة التشغيلية' : 'OPERATIONS CENTER'}
            </h1>
            <p className="text-sm text-slate-500">
              {isAr ? 'إدارة ومزامنة العطاءات، التدقيق الميداني والمخططات في لوحة ذكية موحدة' : 'Unified control deck mapping pre-award submissions, controls deadlines, and drawing approvals'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Custom Manual Milestone form trigger */}
            <button
              onClick={() => setShowNewEventForm(!showNewEventForm)}
              className="flex items-center gap-2 bg-brand-red text-white text-xs px-5 py-2.5 rounded-xl font-bold hover:bg-brand-red/90 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'مرحلة إضافية مخصصة' : 'Add Custom Milestone'}</span>
            </button>
          </div>
        </div>

        {/* Custom Event Slide Down Drawer Form */}
        {showNewEventForm && (
          <form 
            onSubmit={handleCreateEvent}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-md animate-in slide-in-from-top-3 duration-300"
          >
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 font-sans uppercase tracking-wider">
              {isAr ? 'إضافة مرحلة عمل مخصصة للمحفظة' : 'Create Custom Operations Milestone'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {isAr ? (
                <div>
                  <label className="text-slate-400 font-bold block mb-1">العنوان (العربية) *:</label>
                  <input 
                    type="text" 
                    value={newEventTitleAr} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewEventTitleAr(val);
                      setNewEventTitleEn(val);
                    }}
                    placeholder="مثال: ورشة عمل الشراكة الاستراتيجية لتنفيذ النفق"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Title (EN) *:</label>
                  <input 
                    type="text" 
                    value={newEventTitleEn} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewEventTitleEn(val);
                      setNewEventTitleAr(val);
                    }}
                    placeholder="e.g., Joint Venture Coordination Workshop"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  {isAr ? 'الوصف والتفاصيل:' : 'Description:'}
                </label>
                <input 
                  type="text" 
                  value={isAr ? newEventDescAr : newEventDescEn} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (isAr) {
                      setNewEventDescAr(val);
                      setNewEventDescEn(val);
                    } else {
                      setNewEventDescEn(val);
                      setNewEventDescAr(val);
                    }
                  }}
                  placeholder={isAr ? 'تفاصيل المخرجات أو التنسيق...' : 'Details of alignment or specific deliverables...'}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  {isAr ? 'تاريخ الجدولة المخطط لها:' : 'Scheduled Planned Date:'}
                </label>
                <input 
                  type="date" 
                  value={newEventDate} 
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button 
                type="button"
                onClick={() => setShowNewEventForm(false)}
                className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl font-bold border border-slate-200 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-brand-red text-white rounded-xl font-bold cursor-pointer"
              >
                {isAr ? 'تأكيد وإدراج' : 'Insert Milestone'}
              </button>
            </div>
          </form>
        )}

        {/* Sparkles AI Command Uploader Bar */}
        <AICommandBar lang={lang} onExecuteCommand={handleAICommand} />

        {/* Tab Selection Hub Row */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-2 pb-px shrink-0">
          {[
            { id: 'mywork', label: { en: 'My Work', ar: 'مهامي الفردية' }, icon: Briefcase },
            { id: 'calendar', label: { en: 'Operational Matrix', ar: 'خريطة الكثافة' }, icon: CalIcon },
            { id: 'agenda', label: { en: 'High-Density Chronicle', ar: 'الأجندة المفصلة' }, icon: List },
            { id: 'timeline', label: { en: 'Gantt Tracks', ar: 'المخطط الزمني (غانت)' }, icon: Sliders },
            { id: 'kanban', label: { en: 'Status Board', ar: 'لوحة كانبان' }, icon: Kanban },
            ...(SHOW_FUTURE_CAPABILITIES ? [
              { id: 'workload', label: { en: 'Resource Capacity', ar: 'طاقة الموارد' }, icon: Users },
              { id: 'conflicts', label: { en: 'Diagnostics', ar: 'التدقيق والتعارضات' }, icon: AlertTriangle, alertCount: conflictsCount },
              { id: 'analytics', label: { en: 'PMO Analytics', ar: 'إحصائيات الجودة' }, icon: TrendingUp }
            ] : [])
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery(''); // Reset search when switching tab
                }}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider font-sans border-b-2 transition-all cursor-pointer shrink-0
                  ${isActive 
                    ? 'border-brand-red text-brand-red dark:text-white font-black' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }
                `}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{isAr ? tab.label.ar : tab.label.en}</span>

                {/* Conflict Alert Counter badge */}
                {tab.alertCount && tab.alertCount > 0 ? (
                  <span className="w-5 h-5 bg-brand-red text-white text-[9px] font-black rounded-full flex items-center justify-center font-mono animate-bounce">
                    {tab.alertCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Tab Panel Viewports */}
        <div className="flex-1 min-h-0 min-w-0">
          {activeTab === 'mywork' && (
            <MyWorkPanel 
              lang={lang} 
              events={filteredEvents} 
              onSelectEvent={setSelectedEventId} 
              onCompleteEvent={completeEvent}
            />
          )}

          {activeTab === 'calendar' && (
            <OperationalLoadGrid 
              lang={lang} 
              events={filteredEvents} 
              onSelectEvent={setSelectedEventId} 
            />
          )}

          {activeTab === 'agenda' && (
            <AgendaPanel 
              lang={lang} 
              events={filteredEvents} 
              onSelectEvent={setSelectedEventId} 
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineTracks 
              lang={lang} 
              events={filteredEvents} 
              onSelectEvent={setSelectedEventId} 
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanBoard 
              lang={lang} 
              events={filteredEvents} 
              onSelectEvent={setSelectedEventId} 
            />
          )}

          {activeTab === 'workload' && (
            <WorkloadPanel 
              lang={lang} 
              events={filteredEvents} 
            />
          )}

          {activeTab === 'conflicts' && (
            <ConflictPanel 
              lang={lang} 
              events={events} // Keep direct events list so diagnostics checks whole database
              onSelectEvent={setSelectedEventId} 
              onAutoResolve={handleAutoResolveConflict}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPanel 
              lang={lang} 
              events={filteredEvents} 
            />
          )}
        </div>

      </div>

      {/* Floating sliding Bezel panel on selected event */}
      {selectedEvent && (
        <OperationsCommandPanel
          lang={lang}
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
          onComplete={completeEvent}
          onReschedule={rescheduleEvent}
          onReassign={reassignEventOwner}
          onAddNote={addEventNote}
          onAttachFile={attachFileToEvent}
          onNavigateToView={onNavigateToView}
          onUpdateDetails={updateEventDetails}
        />
      )}
    </div>
  );
}
