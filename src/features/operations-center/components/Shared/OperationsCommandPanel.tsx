import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, CheckCircle2, Calendar, User, Folder, Paperclip, Plus, Send, Link, AlertTriangle, Clock, Video, MapPin, Users
} from 'lucide-react';
import { CalendarEvent, EventStatus, EventPriority, EventModuleType, CalendarEventType } from '../../types';
import { BiText } from '../../../../components/BiText';

interface OperationsCommandPanelProps {
  lang: 'ar' | 'en';
  event: CalendarEvent;
  onClose: () => void;
  onComplete: (id: string) => void;
  onReschedule: (id: string, start: string, end: string) => void;
  onReassign: (id: string, ownerName: string) => void;
  onAddNote: (id: string, author: string, text: string) => void;
  onAttachFile: (id: string, name: string, size: string) => void;
  onNavigateToView: (viewId: string) => void;
  onUpdateDetails?: (event: CalendarEvent) => void;
}

export function OperationsCommandPanel({
  lang,
  event,
  onClose,
  onComplete,
  onReschedule,
  onReassign,
  onAddNote,
  onAttachFile,
  onNavigateToView,
  onUpdateDetails
}: OperationsCommandPanelProps) {
  const isAr = lang === 'ar';
  const [commentText, setCommentText] = useState('');
  const [newStart, setNewStart] = useState(event.startDate);
  const [newEnd, setNewEnd] = useState(event.endDate);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignName, setReassignName] = useState(event.ownerName);
  const [dragActive, setDragActive] = useState(false);

  // Meeting scheduling form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [meetType, setMeetType] = useState<CalendarEventType>(event.calendarEventType || CalendarEventType.MILESTONE);
  const [startTime, setStartTime] = useState(event.startTime || '09:00');
  const [duration, setDuration] = useState<number>(event.durationMinutes || 60);
  const [format, setFormat] = useState<'online' | 'physical'>(event.meetingType || 'online');
  const [link, setLink] = useState(event.meetingLink || '');
  const [room, setRoom] = useState(event.meetingRoom || '');
  const [attendeesText, setAttendeesText] = useState(event.attendees?.join(', ') || '');

  // Reset internal states when the active event changes
  useEffect(() => {
    setNewStart(event.startDate);
    setNewEnd(event.endDate);
    setReassignName(event.ownerName);
    setMeetType(event.calendarEventType || CalendarEventType.MILESTONE);
    setStartTime(event.startTime || '09:00');
    setDuration(event.durationMinutes || 60);
    setFormat(event.meetingType || 'online');
    setLink(event.meetingLink || '');
    setRoom(event.meetingRoom || '');
    setAttendeesText(event.attendees?.join(', ') || '');
    setShowScheduleForm(false);
    setShowReschedule(false);
    setShowReassign(false);
  }, [event]);

  // Automatic End Time Calculation
  const calculatedEndTime = useMemo(() => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    const totalMinutes = hours * 60 + minutes + Number(duration);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }, [startTime, duration]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddNote(event.id, isAr ? 'المستخدم الحالي' : 'Active Admin', commentText.trim());
    setCommentText('');
  };

  const handleApplyReschedule = () => {
    onReschedule(event.id, newStart, newEnd);
    setShowReschedule(false);
  };

  const handleApplyReassign = () => {
    onReassign(event.id, reassignName);
    setShowReassign(false);
  };

  const handleSaveMeeting = () => {
    if (!onUpdateDetails) return;
    onUpdateDetails({
      ...event,
      calendarEventType: meetType,
      startTime,
      endTime: calculatedEndTime,
      durationMinutes: Number(duration),
      meetingType: format,
      meetingLink: format === 'online' ? link : undefined,
      meetingRoom: format === 'physical' ? room : undefined,
      attendees: attendeesText ? attendeesText.split(',').map(s => s.trim()).filter(Boolean) : []
    });
    setShowScheduleForm(false);
  };

  const handleRevertToMilestone = () => {
    if (!onUpdateDetails) return;
    onUpdateDetails({
      ...event,
      calendarEventType: CalendarEventType.MILESTONE,
      startTime: undefined,
      endTime: undefined,
      durationMinutes: undefined,
      meetingType: undefined,
      meetingLink: undefined,
      meetingRoom: undefined,
      attendees: []
    });
    setShowScheduleForm(false);
  };

  // Mock file drop handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      onAttachFile(event.id, file.name, sizeStr);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      onAttachFile(event.id, file.name, sizeStr);
    }
  };

  // Get localized status badge colors
  const statusColors: { [key in EventStatus]: string } = {
    [EventStatus.PENDING]: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200',
    [EventStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300 border-blue-200',
    [EventStatus.WAITING_FOR_ME]: 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300 border-amber-200',
    [EventStatus.WAITING_FOR_OTHERS]: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200',
    [EventStatus.COMPLETED]: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 border-emerald-200',
    [EventStatus.OVERDUE]: 'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300 border-rose-200 animate-pulse'
  };

  const priorityColors: { [key in EventPriority]: string } = {
    [EventPriority.CRITICAL]: 'bg-brand-red/10 text-brand-red border-brand-red/20 font-black',
    [EventPriority.HIGH]: 'bg-orange-50 text-orange-800 border-orange-200',
    [EventPriority.MEDIUM]: 'bg-slate-50 text-slate-800 border-slate-200',
    [EventPriority.LOW]: 'bg-zinc-50 text-zinc-600 border-zinc-200'
  };

  // Check if current event is treated as a scheduled interactive meeting
  const isScheduledMeeting = event.calendarEventType && (
    event.calendarEventType === CalendarEventType.MEETING ||
    event.calendarEventType === CalendarEventType.WORKSHOP ||
    event.calendarEventType === CalendarEventType.SITE_VISIT ||
    event.calendarEventType === CalendarEventType.CLIENT_VISIT ||
    event.calendarEventType === CalendarEventType.NEGOTIATION_SESSION
  );

  return (
    <aside 
      className="w-full lg:w-[480px] bg-white dark:bg-slate-900 border-l rtl:border-r rtl:border-l-0 border-slate-150 dark:border-slate-800 flex flex-col h-full shadow-2xl overflow-y-auto no-scrollbar z-50 animate-in slide-in-from-right duration-300"
      id="operations-command-panel"
    >
      {/* Header Bezel */}
      <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-8 bg-brand-red rounded-full"></div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-sans">
              {isAr ? 'لوحة التحكم والعمليات المباشرة' : 'OPERATIONS COMMAND PANEL'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              {event.projectCode}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Core Event Header Card */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${statusColors[event.status]}`}>
              {isAr ? {
                [EventStatus.PENDING]: 'قيد الانتظار',
                [EventStatus.IN_PROGRESS]: 'جاري العمل',
                [EventStatus.WAITING_FOR_ME]: 'بانتظاري',
                [EventStatus.WAITING_FOR_OTHERS]: 'بانتظار الآخرين',
                [EventStatus.COMPLETED]: 'مكتمل',
                [EventStatus.OVERDUE]: 'متأخر للغاية ⚠'
              }[event.status] : event.status.replace('_', ' ')}
            </span>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${priorityColors[event.priority]}`}>
              {isAr ? {
                [EventPriority.CRITICAL]: 'حرِج للغاية',
                [EventPriority.HIGH]: 'أولوية عالية',
                [EventPriority.MEDIUM]: 'أولوية متوسطة',
                [EventPriority.LOW]: 'أولوية منخفضة'
              }[event.priority] : event.priority}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {isAr ? event.title.ar : event.title.en}
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
            {isAr ? event.description?.ar : event.description?.en}
          </p>
        </div>

        {/* Project Summary */}
        <div className="bg-slate-50/60 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">
            {isAr ? 'ملخص وبيانات المشروع' : 'PROJECT SUMMARY'}
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 mb-0.5">{isAr ? 'رمز المشروع:' : 'Project Code:'}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{event.projectCode}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">{isAr ? 'العميل مالك المشروع:' : 'Client Authority:'}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {isAr ? event.projectName.ar : event.projectName.en}
              </p>
            </div>
          </div>
        </div>

        {/* Active Responsible Owner */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">
            {isAr ? 'المسؤول المباشر والمكلفين' : 'RESPONSIBLE OWNER'}
          </span>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800 rounded-2xl p-3">
            <div className="w-10 h-10 rounded-full bg-brand-navy text-white font-bold flex items-center justify-center shrink-0">
              {event.ownerName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{event.ownerName}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                {isAr ? 'رئيس اللجنة الفنية وإعداد المظاريف' : 'Primary Assignment Owner'}
              </p>
            </div>
          </div>
        </div>

        {/* Date & Time Settings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              {isAr ? 'التوقيت وجدولة المواعيد' : 'DATE & SCHEDULE'}
            </span>
            <button 
              onClick={() => setShowReschedule(!showReschedule)}
              className="text-xs text-brand-red hover:underline font-bold cursor-pointer"
            >
              {isAr ? 'تعديل الجدولة' : 'Reschedule'}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {event.startDate} {event.startTime && `| ${event.startTime} - ${event.endTime || ''}`}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isAr ? 'الجدولة الزمنية الحالية للمرحلة' : 'Currently active timeline bounds'}
                </p>
              </div>
            </div>

            {/* In-Line Rescheduling Controls */}
            {showReschedule && (
              <div className="pt-3 border-t border-slate-150 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {isAr ? 'تاريخ البداية' : 'Start Date'}
                    </label>
                    <input 
                      type="date" 
                      value={newStart} 
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {isAr ? 'تاريخ النهاية' : 'End Date'}
                    </label>
                    <input 
                      type="date" 
                      value={newEnd} 
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button 
                    onClick={() => setShowReschedule(false)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    onClick={handleApplyReschedule}
                    className="px-3 py-1.5 bg-brand-red text-white rounded-lg font-bold cursor-pointer"
                  >
                    {isAr ? 'حفظ وتحديث الجدولة' : 'Apply & Propagate'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meeting Scheduling Metadata Block */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              {isAr ? 'تنسيق الاجتماع وجلسات التنسيق' : 'MEETING SCHEDULING METADATA'}
            </span>
            {onUpdateDetails && (
              <button 
                onClick={() => {
                  if (!isScheduledMeeting) {
                    setMeetType(CalendarEventType.MEETING);
                  }
                  setShowScheduleForm(!showScheduleForm);
                }}
                className="text-xs text-brand-red hover:underline font-bold cursor-pointer"
              >
                {isScheduledMeeting 
                  ? (isAr ? 'تعديل حجز الاجتماع' : 'Edit Meeting Slots')
                  : (isAr ? '📅 جدولة حجز اجتماع' : '📅 Schedule Meeting / Workshop')
                }
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-4">
            
            {/* 1. View mode if meeting details are already mapped */}
            {isScheduledMeeting && !showScheduleForm && (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <span className="text-slate-400">{isAr ? 'نوع الحدث المجدول:' : 'Meeting Type:'}</span>
                  <span className="font-extrabold text-brand-red uppercase tracking-wider bg-brand-red/5 px-2.5 py-0.5 rounded-full text-[10px]">
                    {isAr ? {
                      [CalendarEventType.MEETING]: 'اجتماع عمل 👥',
                      [CalendarEventType.WORKSHOP]: 'ورشة عمل فنية ⚙',
                      [CalendarEventType.SITE_VISIT]: 'زيارة ميدانية للموقع 🗺',
                      [CalendarEventType.CLIENT_VISIT]: 'مراجعة مع العميل 🤝',
                      [CalendarEventType.NEGOTIATION_SESSION]: 'جلسة مفاوضات 💰'
                    }[event.calendarEventType || CalendarEventType.MEETING] : (event.calendarEventType || 'meeting').replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">{isAr ? 'الوقت والمدة:' : 'Time & Duration:'}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {event.startTime} - {event.endTime} ({event.durationMinutes}m)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {event.meetingType === 'online' ? (
                      <Video className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">{isAr ? 'تنسيق الجلسة:' : 'Meeting Format:'}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {event.meetingType === 'online' 
                          ? (isAr ? 'اجتماع افتراضي (Teams)' : 'Online (MS Teams)') 
                          : (isAr ? `حضوري: ${event.meetingRoom || 'قاعة الاجتماعات'}` : `Physical: ${event.meetingRoom || 'Boardroom'}`)
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {event.meetingType === 'online' && event.meetingLink && (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Video className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate text-[11px] font-mono text-slate-500">{event.meetingLink}</span>
                    </div>
                    <a 
                      href={event.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-brand-red font-bold hover:underline shrink-0 ml-2"
                    >
                      {isAr ? 'انضم الآن' : 'Join Link'}
                    </a>
                  </div>
                )}

                {event.attendees && event.attendees.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold mb-1.5 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{isAr ? 'المشاركون والمدعوون:' : 'Participants / Attendees:'}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {event.attendees.map((att, idx) => (
                        <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          {att}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Display text when it is a pure all-day Milestone */}
            {!isScheduledMeeting && !showScheduleForm && (
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {isAr 
                      ? 'هذا الحدث مسجل حالياً كمعلم رئيسي أو موعد نهائي طوال اليوم (All-Day Milestone). لا يشغل ساعات محددة من يوم العمل المكتبي، ويتم تجاهله تماماً في تداخلات المواعيد.'
                      : 'This event is currently registered as an All-Day Milestone or Deadline. It does not occupy a specific hour block in the workforce schedule, and is completely ignored by the scheduling conflict checks.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* 3. Interactive scheduling form */}
            {showScheduleForm && (
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-300">
                
                {/* Event Type / Sub-Category */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    {isAr ? 'تصنيف النشاط المجدول:' : 'Scheduled Activity Type:'}
                  </label>
                  <select
                    value={meetType}
                    onChange={(e) => setMeetType(e.target.value as CalendarEventType)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value={CalendarEventType.MEETING}>{isAr ? 'اجتماع تنسيقي وبدء عمل' : 'Meeting'}</option>
                    <option value={CalendarEventType.WORKSHOP}>{isAr ? 'ورشة عمل فنية للمهندسين' : 'Technical Workshop'}</option>
                    <option value={CalendarEventType.SITE_VISIT}>{isAr ? 'زيارة تفقدية للموقع الميداني' : 'Site Visit'}</option>
                    <option value={CalendarEventType.CLIENT_VISIT}>{isAr ? 'جلسة مراجعة مع جهة الإشراف والعميل' : 'Client Alignment Visit'}</option>
                    <option value={CalendarEventType.NEGOTIATION_SESSION}>{isAr ? 'جلسة مفاوضات ومظاريف الأسعار' : 'Negotiation Session'}</option>
                  </select>
                </div>

                {/* Start Time and Duration (Calculates End Time) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {isAr ? 'وقت البدء *:' : 'Start Time *:'}
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {isAr ? 'المدة المخططة *:' : 'Duration *:'}
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      <option value={30}>{isAr ? '30 دقيقة' : '30 mins'}</option>
                      <option value={45}>{isAr ? '45 دقيقة' : '45 mins'}</option>
                      <option value={60}>{isAr ? 'ساعة واحدة (60د)' : '1 hour'}</option>
                      <option value={90}>{isAr ? 'ساعة ونصف (90د)' : '1.5 hours'}</option>
                      <option value={120}>{isAr ? 'ساعتان (120د)' : '2 hours'}</option>
                      <option value={180}>{isAr ? '3 ساعات' : '3 hours'}</option>
                      <option value={240}>{isAr ? '4 ساعات' : '4 hours'}</option>
                    </select>
                  </div>
                </div>

                {/* Auto Calculated End Time display */}
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-2.5 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">{isAr ? 'وقت الانتهاء التلقائي:' : 'Calculated End Time:'}</span>
                  <span className="font-mono font-black text-brand-red text-sm">{calculatedEndTime}</span>
                </div>

                {/* Format selection */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    {isAr ? 'قناة الاجتماع والاتصال:' : 'Meeting Format:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('online')}
                      className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                        format === 'online'
                          ? 'border-brand-red bg-brand-red/5 text-brand-red'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {isAr ? 'افتراضي (Zoom/Teams)' : 'Online / Link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('physical')}
                      className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                        format === 'physical'
                          ? 'border-brand-red bg-brand-red/5 text-brand-red'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {isAr ? 'حضوري بالمقر' : 'In-Person / Physical'}
                    </button>
                  </div>
                </div>

                {/* Conditional Locations details inputs */}
                {format === 'online' ? (
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {isAr ? 'رابط الانضمام الإلكتروني:' : 'Online Meeting Link:'}
                    </label>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://teams.microsoft.com/l/meetup-join/..."
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      {isAr ? 'اسم قاعة الاجتماعات أو الموقع الميداني:' : 'Meeting Room / Facility Location:'}
                    </label>
                    <input
                      type="text"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder={isAr ? 'قاعة الاجتماعات الرئيسية - الطابق الرابع' : 'e.g., Executive Boardroom, Al Reem Tower'}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                )}

                {/* Attendees list inputs */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    {isAr ? 'أسماء المدعوين للمشاركة (مفصولة بفاصلة):' : 'Attendees / Invitees (Comma-separated):'}
                  </label>
                  <input
                    type="text"
                    value={attendeesText}
                    onChange={(e) => setAttendeesText(e.target.value)}
                    placeholder="Sara Al-Mansoori, Mohamed Al-Amri, Engineer Ali"
                    className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Action controls buttons */}
                <div className="flex justify-between gap-2 text-xs pt-2">
                  {isScheduledMeeting && (
                    <button
                      type="button"
                      onClick={handleRevertToMilestone}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-lg font-bold border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                    >
                      {isAr ? 'إلغاء الاجتماع كلياً' : 'Revert to Milestone'}
                    </button>
                  )}
                  <div className="flex gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(false)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-850 rounded-lg font-bold text-slate-500 cursor-pointer"
                    >
                      {isAr ? 'تراجع' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMeeting}
                      className="px-4 py-2 bg-brand-red text-white rounded-lg font-bold cursor-pointer"
                    >
                      {isAr ? 'تأكيد وحفظ التعديلات' : 'Commit Meeting'}
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Dependency DAG Path */}
        {(event.predecessorIds.length > 0 || event.successorIds.length > 0) && (
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">
              {isAr ? 'سلسلة الاعتمادية والمراحل المرتبطة' : 'DEPENDENCY SEQUENCE CHAIN'}
            </span>
            <div className="border border-slate-150 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/40 dark:bg-slate-950/5 space-y-3 text-xs">
              {event.predecessorIds.length > 0 && (
                <div>
                  <p className="text-slate-400 mb-1">{isAr ? 'المرحلة السابقة (يجب اكتمالها أولاً):' : 'Predecessor (Must complete first):'}</p>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="truncate">{isAr ? 'الاجتماع التحضيري أو مراجعة المخاطر' : 'Prerequisite Event Task'}</span>
                    {event.lagDays && <span className="ml-auto font-mono text-[10px] text-brand-red font-bold">+{event.lagDays}d Lag</span>}
                  </div>
                </div>
              )}
              {event.successorIds.length > 0 && (
                <div>
                  <p className="text-slate-400 mb-1">{isAr ? 'المرحلة اللاحقة (تتأثر تلقائياً بالترحيل):' : 'Successor (Auto-shifts if delayed):'}</p>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">{isAr ? 'تقديم العطاء أو مراجعة التفاصيل المالية' : 'Successive Task Milestones'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deep Links & Source Records */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">
            {isAr ? 'روابط التتبع للمصدر الأصلي' : 'DEEP LINKS & SOURCE RECORDS'}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateToView(event.deepLinkPath)}
              className="flex items-center gap-2 bg-brand-navy text-white text-xs px-4 py-2.5 rounded-xl font-bold hover:bg-brand-navy/90 transition-all cursor-pointer"
            >
              <Link className="w-4 h-4" />
              <span>{isAr ? event.deepLinkLabel.ar : event.deepLinkLabel.en}</span>
            </button>
          </div>
        </div>

        {/* Related Files & Drop Zone */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">
            {isAr ? 'المرفقات والملفات الهندسية' : 'ATTACHMENTS & MATERIALS'}
          </span>
          
          <div className="space-y-2">
            {event.attachments.map((att) => (
              <div 
                key={att.id}
                className="flex items-center justify-between border border-slate-150 dark:border-slate-800 rounded-xl p-2.5 bg-white dark:bg-slate-950/20 text-xs text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                  <p className="font-bold truncate">{att.fileName}</p>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{att.fileSize}</span>
                </div>
                <a 
                  href="#" 
                  className="text-xs text-brand-red font-bold hover:underline shrink-0"
                  onClick={(e) => e.preventDefault()}
                >
                  {isAr ? 'تحميل' : 'Download'}
                </a>
              </div>
            ))}

            {/* Drag & Drop Target Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors relative
                ${dragActive 
                  ? 'border-brand-red bg-brand-red/5' 
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                }
              `}
            >
              <input 
                type="file" 
                id="panel-file-upload" 
                className="hidden" 
                onChange={handleFileChange}
              />
              <label htmlFor="panel-file-upload" className="cursor-pointer block text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'اسحب الملف هنا أو تصفح المرفقات' : 'Drag file here or browse files'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAr ? 'BOQ، عروض أسعار، كشوف حسابات' : 'BOQ, tenders, specifications pdf/xlsx'}
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Notes Log & Comments Engine */}
        <div className="space-y-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">
            {isAr ? 'سجل التعليقات ومحاضر المتابعة' : 'COMMENTS & AUDIT TRAIL'}
          </span>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input 
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={isAr ? 'إضافة تعليق أو ملاحظة تشغيلية...' : 'Add a new operational remark...'}
              className="flex-1 text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
            <button 
              type="submit" 
              className="bg-brand-red hover:bg-brand-red/90 text-white p-2 rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {event.notes.map((note) => (
              <div key={note.id} className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between font-mono text-[9px] text-slate-400">
                  <span className="font-bold">{note.authorName}</span>
                  <span>{note.timestamp}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-sans">{note.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Drawer Action Toolbar */}
      <div className="sticky bottom-0 p-5 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 flex gap-2">
        {event.status !== EventStatus.COMPLETED && (
          <button 
            onClick={() => onComplete(event.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-3 rounded-xl font-bold transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAr ? 'اعتماد واكتمال المرحلة' : 'Complete Event & Resolve'}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
