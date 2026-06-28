import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock as ClockIcon, 
  User, 
  Check, 
  X, 
  AlertCircle, 
  HelpCircle, 
  ChevronDown, 
  History, 
  FileText, 
  Award,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Tender } from '../types';
import { Milestone } from '../../../../domain/common/Milestone';
import { MilestoneTemplate } from '../../../../domain/common/MilestoneTemplate';
import { MilestoneWorkflowState } from '../../../../enums/MilestoneWorkflowState';
import { DEFAULT_MILESTONE_TEMPLATES } from '../../../../constants/MilestoneTemplates';
import { MilestoneBusinessRules, ComputedMilestone } from '../../../../business-rules/MilestoneBusinessRules';
import { MilestoneService } from '../../../../services/MilestoneService';

interface TenderMilestonesTabProps {
  selectedTender: Tender;
  isAr: boolean;
  onUpdateTender: (updated: Tender) => void;
  onShowAlert: (msg: string) => void;
}

// Mock User DB matching existing database context
const MOCK_USERS = [
  { id: 'user-1', nameEn: 'Ahmed Mostafa', nameAr: 'أحمد مصطفى', role: 'Contracts Engineer' },
  { id: 'user-2', nameEn: 'Eng. Khalid Al-Saeed', nameAr: 'المهندس خالد السعيد', role: 'Tender Coordinator' },
  { id: 'user-3', nameEn: 'Eng. Sherif Amin', nameAr: 'المهندس شريف أمين', role: 'Tender Coordinator' },
  { id: 'user-4', nameEn: 'Eng. Yasmin Omar', nameAr: 'مهندسة ياسمين عمر', role: 'Tender Coordinator' },
  { id: 'user-5', nameEn: 'Fatma Amer', nameAr: 'فاطمة عامر', role: 'Contracts Engineer' },
  { id: 'user-6', nameEn: 'Salim Mansoor', nameAr: 'سليم منصور', role: 'Contracts Engineer' }
];

export function TenderMilestonesTab({
  selectedTender,
  isAr,
  onUpdateTender,
  onShowAlert,
}: TenderMilestonesTabProps) {
  const milestoneService = new MilestoneService();
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);

  // Compute milestones dynamically
  const computedMilestones = MilestoneBusinessRules.computeAllMilestones(
    selectedTender.milestones || [],
    DEFAULT_MILESTONE_TEMPLATES,
    selectedTender.techSubmissionDate
  );

  // Health summary
  const healthScore = MilestoneBusinessRules.calculateHealthScore(
    selectedTender.milestones || [],
    DEFAULT_MILESTONE_TEMPLATES,
    selectedTender.techSubmissionDate
  );

  const handleStateTransition = async (milestone: Milestone, toState: MilestoneWorkflowState) => {
    const res = await milestoneService.transitionWorkflow(
      milestone,
      toState,
      selectedTender.milestones || [],
      DEFAULT_MILESTONE_TEMPLATES,
      'user-1' // Current user simulated ID
    );

    if (!res.success) {
      onShowAlert(isAr ? `تعذر تحديث الحالة: ${res.errors.join(', ')}` : `Cannot transition: ${res.errors.join(', ')}`);
      return;
    }

    const updatedMilestones = (selectedTender.milestones || []).map(m => 
      m.id === milestone.id ? res.updatedMilestone : m
    );

    onUpdateTender({
      ...selectedTender,
      milestones: updatedMilestones
    });

    onShowAlert(isAr ? 'تم تحديث حالة المرحلة بنجاح.' : 'Milestone state transitioned successfully.');
  };

  const handleReopen = async (milestone: Milestone) => {
    const res = await milestoneService.reopenMilestone(milestone, 'user-1');
    const updatedMilestones = (selectedTender.milestones || []).map(m => 
      m.id === milestone.id ? res.updatedMilestone : m
    );

    onUpdateTender({
      ...selectedTender,
      milestones: updatedMilestones
    });

    onShowAlert(isAr ? 'تم إعادة فتح المرحلة.' : 'Milestone reopened.');
  };

  const handleUserChange = async (milestone: Milestone, newUserId: string) => {
    const updated = await milestoneService.updateResponsibleUser(milestone, newUserId, 'user-1');
    const updatedMilestones = (selectedTender.milestones || []).map(m => 
      m.id === milestone.id ? updated : m
    );

    onUpdateTender({
      ...selectedTender,
      milestones: updatedMilestones
    });

    onShowAlert(isAr ? 'تم تغيير المستخدم المسؤول.' : 'Responsible user updated.');
  };

  const handleVerify = async (milestone: Milestone, status: 'verified' | 'rejected') => {
    if (!verificationNotes.trim()) {
      onShowAlert(isAr ? 'يرجى كتابة ملاحظات التحقق أولاً.' : 'Please add verification notes.');
      return;
    }

    const updated = await milestoneService.verifyMilestone(
      milestone,
      status,
      'user-1', // Verifier user ID
      verificationNotes.trim()
    );

    const updatedMilestones = (selectedTender.milestones || []).map(m => 
      m.id === milestone.id ? updated : m
    );

    onUpdateTender({
      ...selectedTender,
      milestones: updatedMilestones
    });

    setVerificationNotes('');
    setActiveMilestoneId(null);
    onShowAlert(status === 'verified' 
      ? (isAr ? 'تم اعتماد المرحلة بنجاح!' : 'Milestone verified successfully!')
      : (isAr ? 'تم رفض المرحلة وإعادتها للتنفيذ.' : 'Milestone rejected and sent back to started state.')
    );
  };

  const getUserName = (userId: string) => {
    const u = MOCK_USERS.find(user => user.id === userId);
    if (!u) return isAr ? 'غير معين' : 'Unassigned';
    return isAr ? u.nameAr : u.nameEn;
  };

  const getStatusColor = (status: ComputedMilestone['autoStatus']) => {
    switch (status) {
      case 'Completed Early': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Completed On Time': return 'text-green-600 bg-green-50 border-green-200';
      case 'Completed Late': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Overdue': return 'text-red-600 bg-red-50 border-red-200 border-dashed animate-pulse';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getWorkflowBadge = (state: MilestoneWorkflowState) => {
    switch (state) {
      case MilestoneWorkflowState.PENDING: return 'bg-gray-100 text-gray-600';
      case MilestoneWorkflowState.STARTED: return 'bg-blue-100 text-blue-700';
      case MilestoneWorkflowState.COMPLETED: return 'bg-amber-100 text-amber-700';
      case MilestoneWorkflowState.VERIFIED: return 'bg-emerald-100 text-emerald-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-sans">
      
      {/* Dynamic Compliance Progress & Health Score Header */}
      <div className="bg-gradient-to-r from-[#183B63] to-[#255b94] rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4 translate-x-4">
          <Award className="w-40 h-40" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider block">
                {isAr ? 'نقاط الامتثال والالتزام' : 'COMPLIANCE SCORE'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{healthScore.score}</span>
                <span className="text-xs font-semibold text-white/80">/ 100</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              healthScore.level === 'Healthy' 
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                : healthScore.level === 'Warning'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                : 'bg-red-500/20 text-red-200 border border-red-500/30 animate-pulse'
            }`}>
              {isAr 
                ? (healthScore.level === 'Healthy' ? 'مستقر' : healthScore.level === 'Warning' ? 'تنبيه' : 'حرج')
                : healthScore.level
              }
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-white/80">
              <span>{isAr ? 'التقدم الإجمالي:' : 'Completion Progress:'}</span>
              <span>{healthScore.compliancePercentage}%</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${healthScore.compliancePercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-white/70">
            <div>📈 {isAr ? 'مكتمل:' : 'Completed:'} <strong className="text-white">{healthScore.completedCount} / {healthScore.totalMandatory}</strong></div>
            <div>⚠️ {isAr ? 'متأخر:' : 'Overdue:'} <strong className="text-white">{healthScore.overdueCount}</strong></div>
          </div>
        </div>
      </div>

      {/* Milestones Timeline Stack */}
      <div className="space-y-4">
        <span className="text-[11px] text-gray-400 uppercase font-black block tracking-widest pl-1">
          {isAr ? 'إجراءات ومراحل الامتثال' : 'COMPLIANCE MILESTONES'}
        </span>

        <div className="space-y-4.5">
          {computedMilestones.map((cm, idx) => {
            const m = cm.milestone;
            const t = cm.template;
            const isExpanded = activeMilestoneId === m.id;
            const hasDependencies = t.dependsOn.length > 0;
            
            return (
              <div 
                key={m.id} 
                className={`bg-white rounded-2xl border transition-all duration-200 p-4 space-y-3.5 ${
                  isExpanded ? 'border-brand-navy shadow-sm ring-1 ring-brand-navy/10' : 'border-gray-150 hover:border-gray-300'
                }`}
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-brand-navy text-[13px] truncate">
                        {isAr ? t.displayName.ar : t.displayName.en}
                      </h4>
                      {t.isMandatory && (
                        <span className="text-[9px] bg-red-50 text-red-600 font-extrabold px-1.5 py-0.5 rounded border border-red-100">
                          {isAr ? 'إلزامي' : 'Mandatory'}
                        </span>
                      )}
                      {t.healthWeight > 0 && (
                        <span className="text-[9px] bg-slate-50 text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                          {isAr ? `وزن: ${t.healthWeight}` : `Weight: ${t.healthWeight}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold pt-1">
                      <span>📅 {isAr ? 'المستهدف:' : 'Due:'} <strong className="text-gray-500">{cm.dueDate || (isAr ? 'يدوي' : 'Manual')}</strong></span>
                      {m.completedDate && (
                        <span>✓ {isAr ? 'المكتمل:' : 'Completed:'} <strong className="text-gray-500">{m.completedDate}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getWorkflowBadge(m.workflowState)}`}>
                      {isAr ? (
                        m.workflowState === MilestoneWorkflowState.PENDING ? 'معلق' :
                        m.workflowState === MilestoneWorkflowState.STARTED ? 'جاري' :
                        m.workflowState === MilestoneWorkflowState.COMPLETED ? 'مكتمل' : 'معتمد'
                      ) : m.workflowState}
                    </span>
                    
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusColor(cm.autoStatus)}`}>
                      {isAr ? (
                        cm.autoStatus === 'Pending' ? 'معلق' :
                        cm.autoStatus === 'Completed Early' ? 'مبكر' :
                        cm.autoStatus === 'Completed On Time' ? 'في الموعد' :
                        cm.autoStatus === 'Completed Late' ? 'متأخر' : 'متجاوز'
                      ) : cm.autoStatus}
                      {m.isCompleted && cm.daysDifference !== null && cm.daysDifference !== 0 && ` (${cm.delayDisplay})`}
                    </span>
                  </div>
                </div>

                {/* Predecessors / Dependencies warning if blocked */}
                {hasDependencies && !m.isCompleted && (
                  <div className="flex items-center gap-1.5 text-[10px] bg-gray-50 p-2 rounded-xl text-gray-500">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {isAr ? 'يتطلب إنجاز:' : 'Depends on:'}{' '}
                      <strong className="text-brand-navy">
                        {t.dependsOn.map(depId => {
                          const depT = DEFAULT_MILESTONE_TEMPLATES.find(x => x.id === depId);
                          return depT ? (isAr ? depT.displayName.ar : depT.displayName.en) : depId;
                        }).join(', ')}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Details toggle button */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-[11px] font-bold text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{isAr ? 'المسؤول:' : 'Assigned:'} <strong className="text-[#183B63]">{getUserName(m.responsibleUserId)}</strong></span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowHistoryId(showHistoryId === m.id ? null : m.id)}
                      className="text-slate-400 hover:text-brand-navy flex items-center gap-0.5 cursor-pointer"
                      title={isAr ? 'سجل التغييرات' : 'Audit Trail'}
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={() => setActiveMilestoneId(isExpanded ? null : m.id)}
                      className="text-brand-red hover:text-brand-navy flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{isExpanded ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'إجراءات' : 'Actions')}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Audit trail history box */}
                {showHistoryId === m.id && (
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-2 mt-2 text-[10px] animate-in fade-in duration-200">
                    <div className="font-extrabold text-slate-500 uppercase tracking-wider border-b pb-1 mb-1">{isAr ? 'سجل مراجعة المرحلة' : 'MILESTONE AUDIT LOG'}</div>
                    {m.auditHistory.length === 0 ? (
                      <div className="text-gray-400 italic">{isAr ? 'لا يوجد سجل تعديل.' : 'No audit entries.'}</div>
                    ) : (
                      m.auditHistory.map(entry => (
                        <div key={entry.id} className="flex justify-between items-start gap-2 border-b border-gray-100 pb-1.5 last:border-0 last:pb-0">
                          <div className="min-w-0">
                            <span className="font-extrabold text-[#183B63]">{isAr ? entry.action : entry.action}</span>
                            {entry.newValue && <span className="text-slate-400 ml-1">({entry.newValue})</span>}
                            <span className="block text-[8px] text-gray-400 mt-0.5">{isAr ? 'بواسطة:' : 'By:'} {getUserName(entry.actor)}</span>
                          </div>
                          <span className="text-[8px] font-mono text-gray-400 shrink-0">{entry.timestamp.split('T')[0]}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Expanded actions panel */}
                {isExpanded && (
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-4.5 mt-2 animate-in slide-in-from-top-2 duration-150">
                    
                    {/* 1. Workflow Transition controls */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        {isAr ? 'تحديث مرحلة العمل' : 'TRANSITION WORKFLOW'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.workflowState === MilestoneWorkflowState.PENDING && (
                          <button
                            onClick={() => handleStateTransition(m, MilestoneWorkflowState.STARTED)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-3 py-1.5 text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span>{isAr ? 'بدء العمل' : 'Start Milestone'}</span>
                          </button>
                        )}

                        {m.workflowState === MilestoneWorkflowState.STARTED && (
                          <button
                            onClick={() => handleStateTransition(m, MilestoneWorkflowState.COMPLETED)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-3 py-1.5 text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isAr ? 'إكمال المرحلة' : 'Complete Milestone'}</span>
                          </button>
                        )}

                        {(m.workflowState === MilestoneWorkflowState.COMPLETED || m.workflowState === MilestoneWorkflowState.VERIFIED) && (
                          <button
                            onClick={() => handleReopen(m)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg px-3 py-1.5 text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{isAr ? 'إعادة فتح' : 'Reopen Milestone'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Responsible User picker */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        {isAr ? 'الموظف المسؤول' : 'RESPONSIBLE ENGINEER'}
                      </span>
                      <select
                        value={m.responsibleUserId}
                        onChange={(e) => handleUserChange(m, e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none w-full font-bold text-slate-700 cursor-pointer"
                      >
                        {MOCK_USERS.map(user => (
                          <option key={user.id} value={user.id}>
                            {isAr ? user.nameAr : user.nameEn} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Verification Model (Approval Engine Ready) */}
                    {m.workflowState === MilestoneWorkflowState.COMPLETED && (
                      <div className="space-y-2.5 pt-2.5 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-brand-navy" />
                          <span>{isAr ? 'اعتماد ومطابقة الجودة (مركز التدقيق)' : 'VERIFY QUALITY COMPLIANCE'}</span>
                        </span>
                        
                        <input
                          type="text"
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder={isAr ? 'اكتب ملاحظات الاعتماد أو أسباب الرفض...' : 'Type verification comments...'}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-brand-navy transition-all"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerify(m, 'verified')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg py-1.5 text-[11px] transition-all cursor-pointer text-center"
                          >
                            {isAr ? 'اعتماد وإغلاق' : 'Approve & Close'}
                          </button>
                          <button
                            onClick={() => handleVerify(m, 'rejected')}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-lg px-4 py-1.5 text-[11px] transition-all cursor-pointer text-center"
                          >
                            {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
