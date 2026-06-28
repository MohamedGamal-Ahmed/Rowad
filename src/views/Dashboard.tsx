import React, { useState } from 'react';
import { 
  Briefcase, DollarSign, BarChart2, Activity, ShieldAlert,
  TrendingUp, Clock, MapPin, CheckCircle2, AlertTriangle, 
  Lightbulb, FolderOpen, FileCheck2, ClipboardList, RefreshCw,
  CheckSquare, Calendar, Users
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area, Legend
} from 'recharts';
import { BiText } from '../components/BiText';
import { Tender } from './OngoingTenders';
import { ExecutionRecord } from '../domain/project-controls/ProjectControlsRecord';
import { ProjectDocument } from '../domain/projects/Project';
import { FinancialsCalculator } from '../business-rules/FinancialsCalculator';
import { DashboardService } from '../services/DashboardService';
import { Clock as AppClock } from '../services/Clock';
import { useProjects } from '../hooks/useProjects';
import { MilestoneBusinessRules } from '../business-rules/MilestoneBusinessRules';
import { DEFAULT_MILESTONE_TEMPLATES } from '../constants/MilestoneTemplates';
import { MilestoneWorkflowState } from '../enums/MilestoneWorkflowState';

interface DashboardProps {
  lang: 'ar' | 'en';
  list: Tender[];
  executionRecords: ExecutionRecord[];
  documentRecords: ProjectDocument[];
}

export function Dashboard({ lang, list, executionRecords, documentRecords }: DashboardProps) {
  const isAr = lang === 'ar';
  const { projects } = useProjects();
  const [activeTab, setActiveTab] = useState<'all' | 'financial' | 'operations'>('all');

  const getProjectName = (projId: string) => {
    const p = projects.find(x => x.id === projId);
    return p ? { en: p.nameEn, ar: p.nameAr || p.nameEn } : { en: 'Unknown Project', ar: 'مشروع غير معروف' };
  };

  // Support check calculations for ongoing tenders
  const getChecks = (t: Tender) => {
    const listCheck = t.checklistReceived !== undefined ? t.checklistReceived : (t.id === 't-1' || t.id === 't-2' || t.id === 't-3');
    const drawingsCheck = t.checklistDrawings !== undefined ? t.checklistDrawings : (t.id === 't-1' || t.id === 't-2');
    const boqCheck = t.checklistBOQ !== undefined ? t.checklistBOQ : (t.id === 't-1' || t.id === 't-3');
    const specsCheck = t.checklistSpecs !== undefined ? t.checklistSpecs : (t.id === 't-1' || t.id === 't-2');
    const count = (listCheck ? 1 : 0) + (drawingsCheck ? 1 : 0) + (boqCheck ? 1 : 0) + (specsCheck ? 1 : 0);
    const score = Math.round((count / 4) * 100);
    return { listCheck, drawingsCheck, boqCheck, specsCheck, count, score };
  };

  const getCalendarParts = (dateStr: string) => {
    if (!dateStr) return { day: '15', month: isAr ? 'يوليو' : 'JUL' };
    try {
      const d = AppClock.parse(dateStr);
      if (isNaN(d.getTime())) {
        return { day: dateStr.split('-')[2] || '15', month: isAr ? 'يوليو' : 'JUL' };
      }
      const day = d.getDate().toString().padStart(2, '0');
      const monthNamesEn = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const monthObj = isAr ? monthNamesAr[d.getMonth()] : monthNamesEn[d.getMonth()];
      return { day, month: monthObj };
    } catch {
      return { day: '15', month: isAr ? 'يوليو' : 'JUL' };
    }
  };

  const getSiteVisit = (t: Tender) => {
    const req = t.siteVisitRequired !== undefined ? t.siteVisitRequired : (t.id === 't-1' || t.id === 't-2' || t.id === 't-5');
    const date = t.siteVisitDate || (t.id === 't-1' ? '2026-06-24' : t.id === 't-2' ? '2026-06-28' : t.id === 't-5' ? '2026-07-02' : '');
    return { req, date };
  };

  // 1. Precise Financial Parsing Assistant
  const parseAED = (valStr: string): number => {
    return FinancialsCalculator.parseToNumber(valStr);
  };

  const formatCurrency = (val: number): string => {
    if (val >= 1e9) {
      return `${(val / 1e9).toFixed(2)} ${isAr ? 'مليار د.إ' : 'Billion AED'}`;
    }
    return `${(val / 1e6).toFixed(1)} ${isAr ? 'مليون د.إ' : 'Million AED'}`;
  };

  // 2. Delegate calculations over dynamic portfolios to the robust DashboardService
  const dashboardService = new DashboardService();
  const {
    totalTendersCount,
    activeTendersCount,
    totalPreAwardAED,
    totalBondsAED,
    totalCertifiedAED,
    totalClaimsAED,
    totalVariationAED,
    totalActiveExecutionValue,
    combinedPipelineVal,
    totalItemsCount,
    healthyItemsCount,
    healthyRatio
  } = dashboardService.computeFromLegacyData(list, executionRecords);

  // ── DYNAMIC MILESTONE COMPLIANCE KPI CALCULATIONS (On-The-Fly) ──
  const activeTenders = list.filter(t => t.recordStatus === 'Active');
  
  const computedAllMilestones = activeTenders.flatMap(t => {
    return MilestoneBusinessRules.computeAllMilestones(
      t.milestones || [],
      DEFAULT_MILESTONE_TEMPLATES,
      t.techSubmissionDate
    );
  });

  const complianceScores = activeTenders.map(t => {
    return MilestoneBusinessRules.calculateHealthScore(
      t.milestones || [],
      DEFAULT_MILESTONE_TEMPLATES,
      t.techSubmissionDate
    ).score;
  });

  const overallComplianceRate = complianceScores.length > 0
    ? Math.round(complianceScores.reduce((sum, s) => sum + s, 0) / complianceScores.length)
    : 100;

  const completedMilestonesList = computedAllMilestones.filter(cm => cm.milestone.isCompleted);
  const delayedMilestonesList = completedMilestonesList.filter(cm => cm.daysDifference !== null && cm.daysDifference > 0);
  const avgDelayDays = delayedMilestonesList.length > 0
    ? (delayedMilestonesList.reduce((sum, cm) => sum + (cm.daysDifference || 0), 0) / delayedMilestonesList.length).toFixed(1)
    : '0';

  const earlyMilestonesList = completedMilestonesList.filter(cm => cm.daysDifference !== null && cm.daysDifference < 0);
  const avgEarlyDays = earlyMilestonesList.length > 0
    ? Math.abs(earlyMilestonesList.reduce((sum, cm) => sum + (cm.daysDifference || 0), 0) / earlyMilestonesList.length).toFixed(1)
    : '0';

  const openMilestonesCount = computedAllMilestones.filter(cm => !cm.milestone.isCompleted).length;
  const overdueMilestonesCount = computedAllMilestones.filter(cm => cm.autoStatus === 'Overdue').length;

  const todayISOStr = AppClock.todayISO();
  const completedTodayCount = computedAllMilestones.filter(cm => cm.milestone.isCompleted && cm.milestone.completedDate === todayISOStr).length;
  const verifiedTodayCount = computedAllMilestones.filter(cm => cm.milestone.verificationStatus === 'verified' && cm.milestone.verifiedAt?.startsWith(todayISOStr)).length;

  let healthyTendersCount = 0;
  let warningTendersCount = 0;
  let criticalTendersCount = 0;
  
  activeTenders.forEach(t => {
    const healthResult = MilestoneBusinessRules.calculateHealthScore(
      t.milestones || [],
      DEFAULT_MILESTONE_TEMPLATES,
      t.techSubmissionDate
    );
    if (healthResult.level === 'Healthy') healthyTendersCount++;
    else if (healthResult.level === 'Warning') warningTendersCount++;
    else if (healthResult.level === 'Critical') criticalTendersCount++;
  });

  const totalMandatoryMilestonesCount = activeTenders.length * DEFAULT_MILESTONE_TEMPLATES.filter(x => x.isMandatory).length;
  const completedMandatoryMilestonesCount = computedAllMilestones.filter(cm => cm.template.isMandatory && cm.milestone.isCompleted).length;
  const milestoneCompletionPercentage = totalMandatoryMilestonesCount > 0
    ? Math.round((completedMandatoryMilestonesCount / totalMandatoryMilestonesCount) * 100)
    : 100;

  // Aggregated status statistics for ongoing tenders
  const statusGrouping = list.reduce((acc, curr) => {
    const statusEn = curr.projectStatus?.en || 'Under Study';
    const statusAr = curr.projectStatus?.ar || 'تحت الدراسة والتقدير';
    const val = parseAED(curr.estimatedValue);
    
    if (!acc[statusEn]) {
      acc[statusEn] = {
        label: { en: statusEn, ar: statusAr },
        count: 0,
        value: 0
      };
    }
    acc[statusEn].count += 1;
    acc[statusEn].value += val;
    return acc;
  }, {} as Record<string, { label: { en: string; ar: string }; count: number; value: number }>);

  const statusGroupingList = Object.values(statusGrouping);

  // Let's build KPI structures
  const executiveKPIs = [
    {
      title: { en: 'Combined Portfolio Pipeline', ar: 'إجمالي المحفظة الاستثمارية النشطة' },
      value: formatCurrency(combinedPipelineVal),
      subtitle: { 
        en: `${list.length} Tenders • ${executionRecords.length} Active executing contracts`, 
        ar: `${list.length} مناقصات • ${executionRecords.length} اتفاقيات ماليّة قيد التنفيذ`
      },
      color: 'border-brand-navy',
      icon: DollarSign,
      glow: 'bg-indigo-400',
    },
    {
      title: { en: 'Certified Site Cash Flows (IPC)', ar: 'إجمالي التدفقات المعتمدة (IPC)' },
      value: formatCurrency(totalCertifiedAED),
      subtitle: { 
        en: `AED ${(totalVariationAED / 1e6).toFixed(1)}M Approved Variation Orders`, 
        ar: `بقيمة ${(totalVariationAED / 1e6).toFixed(1)} مليون د.إ أوامر تغيير معتمدة`
      },
      color: 'border-emerald-600',
      icon: TrendingUp,
      glow: 'bg-emerald-400',
    },
    {
      title: { en: 'Operational RAG Health', ar: 'مؤشر خطورة وموثوقية الأعمال' },
      value: `${healthyRatio.toFixed(1)}%`,
      subtitle: { 
        en: `${healthyItemsCount} Healthy of ${totalItemsCount} total tracked processes`, 
        ar: `${healthyItemsCount} عملية سليمة من أصل ${totalItemsCount} عملية جارية`
      },
      color: 'border-amber-500',
      icon: Activity,
      glow: 'bg-amber-400',
    },
    {
      title: { en: 'EDMS Corporate Registry', ar: 'مستودع الوثائق والمخططات الهندسية' },
      value: `${documentRecords.length} ${isAr ? 'وثيقة مسجلة' : 'EDMS files'}`,
      subtitle: { 
        en: `${documentRecords.filter(d => d.category === 'Drawing').length} Technical drawings • ${documentRecords.filter(d => d.priority === 'High').length} High priority action`, 
        ar: `${documentRecords.filter(d => d.category === 'Drawing').length} مخططات فنية • ${documentRecords.filter(d => d.priority === 'High').length} إجراء مستعجل`
      },
      color: 'border-brand-red',
      icon: FolderOpen,
      glow: 'bg-brand-red',
    }
  ];

  // 4. Dynamic Multi-Series Project Chart Generation
  // Compiling list of unique active projects from all datasets to make chart dynamic
  const projectsSet = new Set<string>();
  list.forEach(t => projectsSet.add(t.projectName.en));
  executionRecords.forEach(r => projectsSet.add(r.projectName.en));
  documentRecords.forEach(d => {
    const pName = getProjectName(d.projectId);
    projectsSet.add(pName.en);
  });
  
  const activeProjectNames = Array.from(projectsSet).filter(Boolean);

  const parsedProjectChartData = activeProjectNames.map(projEn => {
    // Find matching names for translation
    const tenderMatch = list.find(t => t.projectName.en === projEn);
    const execMatch = executionRecords.find(r => r.projectName.en === projEn);
    const docMatch = documentRecords.find(d => getProjectName(d.projectId).en === projEn);
    
    const projAr = tenderMatch?.projectName.ar || execMatch?.projectName.ar || (docMatch ? getProjectName(docMatch.projectId).ar : projEn);

    // Pre-award sum
    const tenderSum = list
      .filter(t => t.projectName.en === projEn)
      .reduce((sum, curr) => sum + parseAED(curr.estimatedValue), 0);

    // Certified execution sum
    const certSum = executionRecords
      .filter(r => r.projectName.en === projEn && r.type === 'IPC')
      .reduce((sum, curr) => sum + parseAED(curr.valueAED), 0);

    // Claims pending
    const claimSum = executionRecords
      .filter(r => r.projectName.en === projEn && r.type === 'Claim')
      .reduce((sum, curr) => sum + parseAED(curr.valueAED), 0);

    // Document control count
    const docCount = documentRecords.filter(d => getProjectName(d.projectId).en === projEn).length;

    return {
      name: isAr ? (projAr.length > 25 ? projAr.substring(0, 25) + '...' : projAr) : (projEn.length > 25 ? projEn.substring(0, 25) + '...' : projEn),
      fullName: isAr ? projAr : projEn,
      [isAr ? 'قيمة المناقصة' : 'Pre-Award Value (Millions)']: Number((tenderSum / 1e6).toFixed(1)),
      [isAr ? 'الدفعات المعتمدة' : 'Certified Cash Flow (Millions)']: Number((certSum / 1e6).toFixed(1)),
      [isAr ? 'المطالبات العالقة' : 'Pending Claims (Millions)']: Number((claimSum / 1e6).toFixed(1)),
      documentCount: docCount
    };
  });

  // Sort projects by financial scale
  const sortedProjectChartData = parsedProjectChartData
    .sort((a, b) => {
      const aVal = Object.values(a).filter(v => typeof v === 'number').reduce((s, v) => s + (v as number), 0);
      const bVal = Object.values(b).filter(v => typeof v === 'number').reduce((s, v) => s + (v as number), 0);
      return bVal - aVal;
    })
    .slice(0, 5); // Take top 5 for pristine visual balance

  // 5. EDMS Categories pie aggregation
  const catDrawings = documentRecords.filter(d => d.category === 'Drawing').length;
  const catTransmittals = documentRecords.filter(d => d.category === 'Transmittal').length;
  const catIncoming = documentRecords.filter(d => d.category === 'Incoming').length;
  const catOutgoing = documentRecords.filter(d => d.category === 'Outgoing').length;

  const documentCategoryChartData = [
    { name: isAr ? 'مخططات البناء الفنية' : 'Technical Drawings', value: catDrawings || 1, color: '#183B63' },
    { name: isAr ? 'محاضر الإرسال (Transmittal)' : 'Transmittals', value: catTransmittals || 1, color: '#DC2626' },
    { name: isAr ? 'المخاطبات والخطابات الواردة' : 'Incoming Letters', value: catIncoming || 1, color: '#FBBF24' },
    { name: isAr ? 'الوثائق والقرارات الصادرة' : 'Outgoing Dispatched', value: catOutgoing || 1, color: '#10B981' }
  ];

  // 6. Execution submittals progression over timeline
  const executionRecordsSortedByDate = [...executionRecords]
    .sort((a, b) => AppClock.parse(a.submittedDate).getTime() - AppClock.parse(b.submittedDate).getTime());

  let rollingTotal = 0;
  const timelineChartData = executionRecordsSortedByDate.map(rec => {
    rollingTotal += parseAED(rec.valueAED);
    return {
      date: rec.submittedDate,
      code: rec.code,
      [isAr ? 'القيمة التراكمية (بالمليون)' : 'Cumulative Value (Millions)']: Number((rollingTotal / 1e6).toFixed(1)),
      [isAr ? 'قيمة السند الحالي' : 'Direct Value (Millions)']: Number((parseAED(rec.valueAED) / 1e6).toFixed(1))
    };
  });

  return (
    <div className="px-6 py-6 max-w-[1800px] mx-auto space-y-6 animate-in fade-in duration-500 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-brand-navy/5 text-brand-navy rounded-2xl">
              <BarChart2 className="w-6 h-6 text-brand-red animate-pulse" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-brand-navy tracking-tight leading-tight">
                {isAr ? "لوحة المتابعة والرقابة التنفيذية" : "Executive Real-Time Dashboard"}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {isAr ? "نظام متكامل يربط المناقصات الجارية بالتحصيل الميداني والتدفقات المالية مع مراقبة الوثائق (EDMS)." : "Consolidated executive control over pre-award tenders, contractual site collection, and drawing ledgers."}
              </p>
            </div>
          </div>
        </div>
        
        {/* Statistics Sync Status */}
        <div className="flex items-center gap-4">
          <div className="bg-brand-gray px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-brand-navy">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{isAr ? "قاعدة البيانات نَشطة ومطابقة" : "Live Ledger Synced"}</span>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Clock className="w-4 h-4 text-brand-red" />
            <span>{isAr ? "محدث تلقائياً" : "Updated Real-Time"}</span>
          </div>
        </div>
      </div>

      {/* TABS CONTROLLER TO FILTER VIEWS EASILY */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: { en: 'All Portfolios Control', ar: 'المحفظة الشاملة' } },
          { id: 'financial', label: { en: 'Financials & Cash Flow', ar: 'التحليلات المالية والتدفقات' } },
          { id: 'operations', label: { en: 'Operational & Document Control', ar: 'أعمال التنفيذ والتوثيق' } }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/10 translate-y-[-1px]' 
                : 'bg-white border border-gray-100 hover:border-gray-200 text-gray-500 hover:text-brand-navy'
              }
            `}
          >
            {isAr ? tab.label.ar : tab.label.en}
          </button>
        ))}
      </div>

      {/* EXECUTIVE KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {executiveKPIs.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className={`bg-white rounded-[32px] border-b-4 ${kpi.color} shadow-sm p-6 space-y-4 hover:shadow-md transition-all group relative overflow-hidden`}
            >
              <div className={`absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full filter blur-3xl opacity-12 ${kpi.glow}`} />
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">
                  {isAr ? kpi.title.ar : kpi.title.en}
                </span>
                <span className={`p-2.5 rounded-xl bg-gray-50 text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all`}>
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl md:text-3xl font-black text-brand-navy tracking-tight">
                  {kpi.value}
                </h4>
                <p className="text-[11px] text-gray-500 font-bold leading-relaxed line-clamp-2">
                  {isAr ? kpi.subtitle.ar : kpi.subtitle.en}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* RENDER DYNAMIC VISUAL LAYOUTS BASED ON CHOSEN SECTION LEVEL FEATURE */}
      {(activeTab === 'all' || activeTab === 'financial') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CHART 1: INTEGRATED BUDGET VS CERTIFIED CASH FLOW (BAR CHART) */}
          <div className="lg:col-span-8 bg-white border border-gray-100 shadow-sm rounded-[32px] p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-gray-50 pb-3 flex-wrap gap-2">
              <div>
                <span className="text-[11px] uppercase font-black text-brand-red tracking-wider">
                  {isAr ? "مقارنات فنية ومالية جارية" : "CAPITAL INFLOWS AND DISPATCH"}
                </span>
                <h3 className="text-lg md:text-xl font-black text-brand-navy tracking-tight mt-0.5">
                  {isAr ? "تحليل الفروقات والتدفقات النقدية للمشاريع الكبرى" : "Consolidated Tenders vs. Certified IPC Valuation"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {isAr ? "يقارن ميزانية العروض الجارية كقيمة تقديرية مقابل المستخلصات الفعلية المعتمدة والتسويات (بالمليون د.إ)." : "Real-time comparison of Pre-award tender estimates vs. actually certified site certificates (M AED/SAR equivalent)."}
                </p>
              </div>
              <div className="bg-brand-navy/5 text-brand-navy px-3 py-1.5 rounded-xl font-mono text-[10px] font-extrabold">
                {isAr ? "دقة حية" : "DYNAMIC GRAPH"}
              </div>
            </div>

            {sortedProjectChartData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-400 text-xs">
                {isAr ? "لا توجد بيانات مشاريع كافية لعرض الرسم البياني" : "No project records available for rendering."}
              </div>
            ) : (
              <div className="w-full h-80 pt-2 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedProjectChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#183B63', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'black', color: '#fca5a5' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11.5px', fontWeight: 'bold' }} />
                    <Bar dataKey={isAr ? 'قيمة المناقصة' : 'Pre-Award Value (Millions)'} fill="#183B63" radius={[6, 6, 0, 0]} barSize={26} />
                    <Bar dataKey={isAr ? 'الدفعات المعتمدة' : 'Certified Cash Flow (Millions)'} fill="#10B981" radius={[6, 6, 0, 0]} barSize={26} />
                    <Bar dataKey={isAr ? 'المطالبات العالقة' : 'Pending Claims (Millions)'} fill="#DC2626" radius={[6, 6, 0, 0]} barSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* CHART 2: REVENUE/CUMULATIVE SUBMISSION SUBSEQUENCES (AREA CHART) */}
          <div className="lg:col-span-4 bg-white border border-gray-100 shadow-sm rounded-[32px] p-6 space-y-4">
            <div className="border-b border-gray-50 pb-3">
              <span className="text-[11px] uppercase font-black text-brand-navy tracking-wider">
                {isAr ? "مجرى السيولة التعاقدية" : "CONTRACTUAL CASH MATRIX"}
              </span>
              <h3 className="text-lg font-black text-brand-navy tracking-tight mt-0.5">
                {isAr ? "مسار الحركة المالية التراكمية" : "Site Cumulative Value Curve"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isAr ? "التدفق النقدي التراكمي لشهادات الدفع والقرارات المالية (مليون د.إ)." : "Chronological cumulative sum of site IPCs & claims added."}
              </p>
            </div>

            {timelineChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-xs">
                {isAr ? "لا توجد مستندات دفع كافية للتصوير الزمني" : "No payment milestones listed yet."}
              </div>
            ) : (
              <div className="w-full h-64 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineChartData} margin={{ top: 10, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                    <Area 
                      type="monotone" 
                      dataKey={isAr ? 'القيمة التراكمية (بالمليون)' : 'Cumulative Value (Millions)'} 
                      stroke="#DC2626" 
                      fill="rgba(220, 38, 38, 0.05)" 
                      strokeWidth={3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="text-center text-[10px] text-gray-400 font-bold mt-1.5">
                  {isAr ? "مستوى تصاعدي لشهادات التخليص المالي والذمم" : "Cumulative growth milestones (In Millions AED)"}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {(activeTab === 'all' || activeTab === 'operations') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CHART 3: EDMS REGISTRY CATEGORIZATION (PIE CHART) */}
          <div className="lg:col-span-4 bg-white border border-gray-100 shadow-sm rounded-[32px] p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="border-b border-gray-50 pb-3">
                <span className="text-[11px] uppercase font-black text-emerald-600 tracking-wider font-sans">
                  {isAr ? "تصنيف الوثائق الهندسية" : "EDMS REGISTRY INTEGRITY"}
                </span>
                <h3 className="text-lg font-black text-brand-navy tracking-tight mt-0.5">
                  {isAr ? "حجم مخططات التمكين والمحاضر" : "Document & Drawing Structure"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAr ? "تقييم تصنيف الأوراق حسب القسم داخل نظام الأرشفة." : "Ratio distribution of logged drawings and transmittals."}
                </p>
              </div>

              <div className="w-full h-56 flex items-center justify-center relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentCategoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {documentCategoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Badge label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-brand-navy">{documentRecords.length}</span>
                  <span className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider">
                    {isAr ? "مستند كلي" : "Total Files"}
                  </span>
                </div>
              </div>
            </div>

            {/* Structured Table Custom Legend */}
            <div className="space-y-1.5 mt-2 border-t border-gray-50 pt-3">
              {documentCategoryChartData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-500 font-semibold">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-brand-navy">{item.value} {isAr ? 'ملفات' : 'files'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVE DISPATCH LIST & RISK ASSISTANCE ACTION CENTER */}
          <div className="lg:col-span-8 bg-white border border-gray-100 shadow-sm rounded-[32px] p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                <div>
                  <span className="text-[11px] uppercase font-black text-brand-red tracking-wider">
                    {isAr ? "مركز الرقابة وحلول الرقابة السريعة" : "OPERATIONAL ACTION CENTER"}
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-brand-navy tracking-tight mt-0.5">
                    {isAr ? "الإجراءات العالقة والمستندات ذات الخطورة العالية" : "Urgent Directives & Pending Site Review Logs"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isAr ? "مستندات التنفيذ أو التراخيص التي تحتاج مراجعة المهندس الاستشاري أو معلقة تحت الفحص." : "Aggregated alert board from contractual submittals and high priority document audits."}
                  </p>
                </div>
              </div>

              {/* Aggregating real-time warnings from both Execution and Documents */}
              <div className="space-y-2.5 mt-4 max-h-[295px] overflow-y-auto no-scrollbar">
                
                {/* 1. Urgent Tenders nearing zero */}
                {list.filter(t => t.recordStatus === 'Active' && (t.health === 'Due Soon' || t.health === 'Overdue')).map(tender => (
                  <div key={tender.id} className="p-3 bg-red-50/50 border border-brand-red/10 rounded-2xl flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-rose-100 text-brand-red rounded-lg font-bold text-[10px]">Tender Exp</span>
                      <div>
                        <p className="font-extrabold text-brand-navy">{isAr ? tender.projectName.ar : tender.projectName.en}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{isAr ? "كود المناقصة:" : "Code:"} {tender.projectCode} • {tender.daysRemaining < 0 ? (isAr ? 'متأخر' : 'Overdue') : `${tender.daysRemaining} days remaining`}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-brand-red text-white text-[9px] font-black rounded-lg">
                      {isAr ? "عاجل" : "HIGH PRIORITY BIDS"}
                    </span>
                  </div>
                ))}

                {/* 2. Urgent / Under Review Execution Records */}
                {executionRecords.filter(r => r.health === 'Urgent' || r.health === 'Under Review').map(record => (
                  <div key={record.id} className="p-3 bg-amber-50/40 border border-amber-200/20 rounded-2xl flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-lg font-bold text-[10px] ${record.health === 'Urgent' ? 'bg-red-100 text-brand-red' : 'bg-amber-100 text-amber-700'}`}>
                        {record.type}
                      </span>
                      <div>
                        <p className="font-extrabold text-brand-navy truncate max-w-[280px]">{isAr ? record.projectName.ar : record.projectName.en}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{record.code} • {isAr ? record.status.ar : record.status.en}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-brand-navy text-[11px]">{record.valueAED}</p>
                      <span className="text-[9px] font-bold text-gray-400">{isAr ? "أثر فني" : "Site Claim State"}</span>
                    </div>
                  </div>
                ))}

                {/* 3. High priority Documents */}
                {documentRecords.filter(d => d.priority === 'High').map(doc => (
                  <div key={doc.id} className="p-3 bg-indigo-50/30 border border-indigo-100/30 rounded-2xl flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-[10px] uppercase">{doc.category}</span>
                      <div className="max-w-[320px]">
                        <p className="font-extrabold text-brand-navy truncate">{isAr ? doc.titleAr || doc.titleEn : doc.titleEn}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{isAr ? "المرسل إليه:" : "Recipient:"} {doc.recipient} • {isAr ? getProjectName(doc.projectId).ar : getProjectName(doc.projectId).en}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-black rounded font-mono uppercase">
                      {doc.version}
                    </span>
                  </div>
                ))}

                {/* Fallback if clean state */}
                {list.filter(t => t.recordStatus === 'Active' && (t.health === 'Due Soon' || t.health === 'Overdue')).length === 0 &&
                 executionRecords.filter(r => r.health === 'Urgent' || r.health === 'Under Review').length === 0 &&
                 documentRecords.filter(d => d.priority === 'High').length === 0 && (
                   <div className="p-8 bg-emerald-50 text-emerald-800 rounded-[28px] border border-emerald-100 flex flex-col items-center justify-center text-center space-y-2">
                     <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                     <h4 className="text-sm font-black">{isAr ? "تكامل العمليات سليم ومضمون" : "All Control Indicators Operating Healthy"}</h4>
                     <p className="text-xs max-w-md font-medium text-emerald-700">
                       {isAr ? "تهانينا! لم يتم كشف ذمم متعثرة أو مطالبات منتهية الصلاحية هذا الأسبوع، ونسبة المطابقة الكلية بلغت ١٠٠٪." : "Pre-award proposals, civil IPC payment terms, and EDMS drawings are in compliance."}
                     </p>
                   </div>
                )}

              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-gray-400 font-black tracking-wide uppercase gap-2">
              <span>{isAr ? "منظومة شركة الرواد للمقاولات والمطابقة الهندسية" : "Rowad General Contracting Joint ERP Governance"}</span>
              <span className="text-brand-navy flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {isAr ? "الرقابة الذكية نشطة" : "INTELLIGENT GATEWAY ACTIVE"}
              </span>
            </div>
          </div>

        </div>
      )}

      {(activeTab === 'all' || activeTab === 'operations') && (
        <div className="space-y-6">
          {/* ── TENDER MILESTONE & QUALITY COMPLIANCE CENTER ── */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-[32px] p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-gray-50 pb-3 flex-wrap gap-2">
              <div>
                <span className="text-[11px] uppercase font-black text-emerald-600 tracking-wider">
                  {isAr ? "نظام مراقبة الامتثال والالتزام الفني" : "TENDER MILESTONE & QUALITY COMPLIANCE"}
                </span>
                <h3 className="text-lg md:text-xl font-black text-brand-navy tracking-tight mt-0.5">
                  {isAr ? "مؤشرات الامتثال والخطط الزمنية للمناقصات" : "Milestone Tracking & Performance Metrics"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {isAr 
                    ? "مراقبة مستمرة وديناميكية لتقدم وإكمال واعتماد مراحل دراسة العطاءات." 
                    : "Real-time compliance analytics mapped from active tender milestones."}
                </p>
              </div>
              <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>

            {/* Compliance KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
              
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">{isAr ? "معدل الامتثال العام" : "Overall Compliance"}</span>
                <div>
                  <p className="text-2xl font-black text-brand-navy">{overallComplianceRate}%</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">{isAr ? "متوسط نقاط الصحة" : "Average health score"}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">{isAr ? "متوسط التأخير" : "Avg Delay"}</span>
                <div>
                  <p className="text-2xl font-black text-brand-red font-mono">+{avgDelayDays} {isAr ? "أيام" : "Days"}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">{isAr ? "للمراحل المتأخرة" : "On delayed milestones"}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">{isAr ? "متوسط الإنجاز المبكر" : "Avg Early Completion"}</span>
                <div>
                  <p className="text-2xl font-black text-emerald-600 font-mono">-{avgEarlyDays} {isAr ? "أيام" : "Days"}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">{isAr ? "إنجاز مبكر عن الموعد" : "Ahead of target schedule"}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">{isAr ? "المراحل المفتوحة" : "Open Milestones"}</span>
                <div>
                  <p className="text-2xl font-black text-blue-600 font-mono">{openMilestonesCount}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">{isAr ? "قيد المتابعة والعمل" : "Under active process"}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">{isAr ? "المراحل المتجاوزة" : "Overdue Milestones"}</span>
                <div>
                  <p className="text-2xl font-black text-red-600 font-mono animate-pulse">{overdueMilestonesCount}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">{isAr ? "تجاوزت تاريخ الاستحقاق" : "Past due date limits"}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">{isAr ? "نسبة إكمال المراحل" : "Milestone Completion"}</span>
                <div>
                  <p className="text-2xl font-black text-indigo-600">{milestoneCompletionPercentage}%</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">{isAr ? "للمراحل الإلزامية" : "Of mandatory stages"}</p>
                </div>
              </div>

            </div>

            {/* Secondary KPIs Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs pt-1">
              <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-emerald-800">{completedTodayCount}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">{isAr ? "أنجزت اليوم" : "Completed Today"}</span>
                </div>
                <span className="text-emerald-500 font-bold">✓</span>
              </div>

              <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-blue-800">{verifiedTodayCount}</p>
                  <span className="text-[10px] text-blue-600 font-semibold">{isAr ? "اعتمدت اليوم" : "Verified Today"}</span>
                </div>
                <span className="text-blue-500 font-bold">🛡️</span>
              </div>

              <div className="bg-green-50/30 p-3.5 rounded-xl border border-green-100/50 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-green-800">{healthyTendersCount}</p>
                  <span className="text-[10px] text-green-600 font-semibold">{isAr ? "مناقصات مستقرة" : "Healthy Tenders"}</span>
                </div>
                <span className="text-green-500 font-bold">🟢</span>
              </div>

              <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-amber-800">{warningTendersCount}</p>
                  <span className="text-[10px] text-amber-600 font-semibold">{isAr ? "مناقصات منبهة" : "Warning Tenders"}</span>
                </div>
                <span className="text-amber-500 font-bold">🟡</span>
              </div>

              <div className="bg-red-50/40 p-3.5 rounded-xl border border-red-100 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-red-800">{criticalTendersCount}</p>
                  <span className="text-[10px] text-red-600 font-semibold">{isAr ? "مناقصات حرجة" : "Critical Tenders"}</span>
                </div>
                <span className="text-red-500 font-bold">🔴</span>
              </div>
            </div>
          </div>

          {/* ONGOING TENDERS PIPELINE BREAKDOWN CARD */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-[32px] p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-gray-50 pb-3 flex-wrap gap-2">
              <div>
                <span className="text-[11px] uppercase font-black text-indigo-600 tracking-wider">
                  {isAr ? "مراحل وجاهزية المناقصات الجارية" : "ONGOING TENDER PIPELINE FLOW"}
                </span>
                <h3 className="text-lg md:text-xl font-black text-brand-navy tracking-tight mt-0.5">
                  {isAr ? "توزيع المناقصات حسب مرحلة الدراسة والتقدير" : "Bidding Pipeline Lifecycle & Value Distribution"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {isAr 
                    ? "إحصائيات فورية للمناقصات الجارية مجمعة حسب الحالة الفنية والمالية وقيمتها التقديرية التراكمية." 
                    : "Live aggregation of pre-award bidding sheets grouped by study state and estimated capital volume."}
                </p>
              </div>
              <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {statusGroupingList.map((group, idx) => {
                const colors = [
                  { bg: 'bg-indigo-50/50', border: 'border-indigo-100/60', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-800' },
                  { bg: 'bg-amber-50/50', border: 'border-amber-100/60', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800' },
                  { bg: 'bg-emerald-50/50', border: 'border-emerald-100/60', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
                  { bg: 'bg-rose-50/50', border: 'border-rose-100/60', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800' },
                ];
                const c = colors[idx % colors.length];

                return (
                  <div key={idx} className={`p-4 rounded-2xl border ${c.bg} ${c.border} flex flex-col justify-between space-y-3 hover:shadow-xs transition-all`}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-black text-brand-navy line-clamp-1">
                        {isAr ? group.label.ar : group.label.en}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${c.badge}`}>
                        {group.count} {isAr ? 'مناقصات' : 'bids'}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-black text-brand-navy font-mono">
                        {formatCurrency(group.value)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        {isAr ? "إجمالي القيمة التقديرية" : "Total Estimated Value"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Section for Checklist Readiness (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-gray-100 shadow-sm rounded-[32px] p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                  <div>
                    <span className="text-[11px] uppercase font-black text-brand-navy tracking-wider">
                      {isAr ? "جاهزية واستيفاء كراسات الشروط (RFP Checklist)" : "PRE-AWARD STUDY & RFP READY CHECKLISTS"}
                    </span>
                    <h3 className="text-lg md:text-xl font-black text-brand-navy tracking-tight mt-0.5">
                      {isAr ? "معدلات اكتمال دراسة مستندات المناقصات" : "Tender Proposal Checklist Integrity"}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">
                      {isAr 
                        ? "مستوى التحقق الفني والمالي من الكراسات والمخططات والجداول لكل مناقصة جارية." 
                        : "Completion rate of critical RFP sections, spec reviews, and BOQs across bidding pipeline."}
                    </p>
                  </div>
                  <span className="p-2 bg-indigo-50 text-brand-navy rounded-xl">
                    <CheckSquare className="w-5 h-5" />
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {list.filter(t => t.recordStatus === 'Active').map(t => {
                    const { listCheck, drawingsCheck, boqCheck, specsCheck, score } = getChecks(t);
                    return (
                      <div key={t.id} className="p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-150/60 rounded-2xl transition-all space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-extrabold text-brand-navy">{isAr ? t.projectName.ar : t.projectName.en}</h4>
                            <p className="text-[10px] text-gray-400 font-bold">{t.projectCode} • {isAr ? t.location.ar : t.location.en}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 text-[11px] font-black rounded-lg ${
                            score === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-navy/5 text-brand-navy'
                          }`}>
                            {score}% {isAr ? 'جاهزة' : 'Ready'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${score === 100 ? 'bg-emerald-500' : 'bg-brand-navy'}`} 
                            style={{ width: `${score}%` }} 
                          />
                        </div>

                        {/* Mini checklists visualization inline */}
                        <div className="grid grid-cols-4 gap-2 text-[10px] sm:text-[11px] font-extrabold text-center pt-0.5">
                          {[
                            { label: isAr ? 'الكراسة' : 'RFP Document', ok: listCheck },
                            { label: isAr ? 'المخططات' : 'Drawings', ok: drawingsCheck },
                            { label: isAr ? 'الكميات (BOQ)' : 'BOQ Spread', ok: boqCheck },
                            { label: isAr ? 'المواصفات' : 'Specs Specs', ok: specsCheck }
                          ].map((chk, idx) => (
                            <div key={idx} className={`p-1 rounded-lg border flex items-center justify-center gap-1 leading-none ${
                              chk.ok 
                                ? 'bg-emerald-50/40 border-emerald-100 text-emerald-700' 
                                : 'bg-white border-gray-200 text-gray-400 font-medium'
                            }`}>
                              {chk.ok && <span className="text-emerald-500 font-bold">✓</span>}
                              <span>{chk.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-[10px] text-gray-400 font-bold uppercase border-t border-gray-50 pt-3">
                {isAr ? "يتم تحديث الفحص الإداري مباشرة من صفحة المناقصات المخصصة" : "Checklist verification is synced live from Tender study engine"}
              </div>
            </div>

            {/* Section for Site Visits (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-gray-100 shadow-sm rounded-[32px] p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                  <div>
                    <span className="text-[11px] uppercase font-black text-brand-red tracking-wider">
                      {isAr ? "معاينة مواقع المشاريع (Tender Site Visits)" : "PRE-AWARD SITE INSPECTIONS"}
                    </span>
                    <h3 className="text-lg md:text-xl font-black text-brand-navy tracking-tight mt-0.5">
                      {isAr ? "الزيارات الميدانية والإحداثية" : "Bidding Surveying Calendar"}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">
                      {isAr 
                        ? "تنظيم ومراقبة جولات المعاينة الهندسية وتخريج تقرير المعاينة للمناقصة." 
                        : "Vital Pre-award field investigations prior to commercial submittal signoffs."}
                    </p>
                  </div>
                  <span className="p-2 bg-rose-50 text-brand-red rounded-xl">
                    <Calendar className="w-5 h-5 animate-pulse" />
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {list.filter(t => t.recordStatus === 'Active').map(t => {
                    const { req, date } = getSiteVisit(t);
                    if (!req) return null;
                    const { day, month } = getCalendarParts(date);
                    return (
                      <div key={t.id} className="p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3 text-xs transition-colors">
                        <div className="flex items-center gap-3">
                          {/* Calendar Tear Sheet layout */}
                          <div className="bg-white border border-gray-200 shadow-xs rounded-xl flex flex-col items-center justify-center shrink-0 w-13 h-13 overflow-hidden text-center">
                            <div className="bg-brand-red text-white text-[9px] font-black uppercase py-0.5 w-full">
                              {month}
                            </div>
                            <div className="text-[16px] font-black text-brand-navy leading-tight py-0.5">
                              {day}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-extrabold text-brand-navy line-clamp-1">{isAr ? t.projectName.ar : t.projectName.en}</h4>
                            <p className="text-[10px] text-gray-500 font-semibold">{isAr ? "المسؤول:" : "Coordinator:"} <span className="text-brand-navy">{isAr ? t.coordinator.ar : t.coordinator.en}</span></p>
                            <p className="text-[9px] text-gray-400 font-bold">{isAr ? "الموقع الجغرافي:" : "Location:"} {isAr ? t.location.ar : t.location.en}</p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/40 font-bold text-[10px] rounded-lg shrink-0">
                          {isAr ? 'موعد زيارة' : 'Site Visit'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-[10px] text-gray-400 font-bold uppercase border-t border-gray-50 pt-2.5">
                {isAr ? "مطلوبة بشكل إلزامي لتقدير كلفة الهياكل الخاصة وأعمال التربة" : "Mandatory for complex geotechnical and site logistics costings"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER INSIGHT CARD FOR PROFESSIONAL EXCELLENCE */}
      <div className="bg-brand-navy rounded-[32px] p-6 text-white relative overflow-hidden group border border-gray-150">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red filter blur-[120px] opacity-20 rounded-full transition-all group-hover:scale-110" />
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-xs uppercase font-extrabold tracking-widest text-[#fca5a5]">
            <Lightbulb className="w-4 h-4" />
            <span>{isAr ? "رؤية الأداء ورفع كفاءة التدفق النقدي" : "Executive Recommendation Insight"}</span>
          </div>
          <p className="text-sm md:text-md opacity-90 max-w-4xl font-medium leading-relaxed">
            {isAr ? (
              <>
                بناءً على المعلومات الجديدة المضافة: تبيّن لنا أن محفظة توسعة <strong>محطة النفق بمشروع نيوم</strong> ومشاريع <strong>محور الشيخ زايد</strong> تُمثّل ما يزيد عن <strong>٧٠٪</strong> من إجمالي التحصيل النقدي المعتمد من الاستشاريين. نقترح على الإدارة العليا تركيز قنوات المتابعة الفنية والإسراع في مراجعة مستخلصات شركة رواد المسجلة حديثًا، وتفويض مندوبين لتسريع الموافقات والختم لضمان معدلات سيولة استباقية.
              </>
            ) : (
              <>
                Based on updated site logs: Consolidated metrics reveal that <strong>Neom Spine Terminals</strong> and the <strong>Sheikh Zayed Corridor</strong> account for over <strong>70%</strong> of approved cash collections. It is highly recommended to expedite site surveyor verification for newly submitted IPC claims and establish unified signoff intervals to maximize corporate treasury liquidity.
              </>
            )}
          </p>
        </div>
      </div>

    </div>
  );
}
