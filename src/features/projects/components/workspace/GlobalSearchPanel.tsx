import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowUpRight, Folder, FileText, Calendar, Users, Receipt, 
  AlertTriangle, PenTool, Award, Pickaxe, Activity, ShieldCheck 
} from 'lucide-react';
import { Project, ProjectMeeting, ProjectIPC, ProjectClaim, ProjectVariationOrder, ProjectNOC, ProjectSPR, ProjectSubcontract, ProjectDocument } from '../../../../domain/projects/Project';
import { BiText } from '../../../../components/BiText';

interface GlobalSearchPanelProps {
  lang: 'ar' | 'en';
  project: Project;
  meetings: ProjectMeeting[];
  ipcs: ProjectIPC[];
  claims: ProjectClaim[];
  vos: ProjectVariationOrder[];
  nocs: ProjectNOC[];
  subcontracts: ProjectSubcontract[];
  documents: ProjectDocument[];
  sprs: ProjectSPR[];
  onNavigateToRecord: (tabId: string, recordId: string) => void;
}

interface SearchResult {
  id: string;
  tabId: string;
  module: string;
  icon: any;
  code: string;
  title: string;
  details: string;
  status?: string;
}

export function GlobalSearchPanel({
  lang,
  project,
  meetings,
  ipcs,
  claims,
  vos,
  nocs,
  subcontracts,
  documents,
  sprs,
  onNavigateToRecord
}: GlobalSearchPanelProps) {
  const isAr = lang === 'ar';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // 1. Check Project Code / Identity
    if (project.code.toLowerCase().includes(q) || project.nameEn.toLowerCase().includes(q) || (project.nameAr && project.nameAr.toLowerCase().includes(q))) {
      matches.push({
        id: project.id,
        tabId: 'overview',
        module: 'Project Identity',
        icon: Folder,
        code: project.code,
        title: isAr && project.nameAr ? project.nameAr : project.nameEn,
        details: project.description || '',
        status: project.status
      });
    }

    // 2. Search Meetings
    meetings.forEach(m => {
      if (m.title.toLowerCase().includes(q) || (m.titleAr && m.titleAr.toLowerCase().includes(q)) || (m.remarks && m.remarks.toLowerCase().includes(q))) {
        matches.push({
          id: m.id,
          tabId: 'meetings',
          module: 'Meeting',
          icon: Users,
          code: m.startTime,
          title: isAr && m.titleAr ? m.titleAr : m.title,
          details: `${m.date} | ${m.meetingType} - ${m.locationOrLink || ''}`,
          status: m.date >= new Date().toISOString().substring(0, 10) ? 'Scheduled' : 'Passed'
        });
      }
    });

    // 3. Search IPCs
    ipcs.forEach(i => {
      if (i.ipcNumber.toLowerCase().includes(q) || (i.remarks && i.remarks.toLowerCase().includes(q))) {
        matches.push({
          id: i.id,
          tabId: 'ipc',
          module: 'IPC Account',
          icon: Receipt,
          code: i.ipcNumber,
          title: `IPC Gross: ${i.invoiceGrossValue.toLocaleString()} ${project.currency}`,
          details: `${isAr ? 'تاريخ التقديم: ' : 'Submitted: '}${i.ipcSubmissionDate} | ${i.remarks || ''}`,
          status: i.status
        });
      }
    });

    // 4. Search Claims
    claims.forEach(c => {
      if (c.claimNumber.toLowerCase().includes(q) || (c.notes && c.notes.toLowerCase().includes(q))) {
        matches.push({
          id: c.id,
          tabId: 'claims',
          module: 'Claim',
          icon: AlertTriangle,
          code: c.claimNumber,
          title: `${c.claimType} - ${c.additionalClaimedAmount.toLocaleString()} ${project.currency}`,
          details: c.notes || '',
          status: c.status
        });
      }
    });

    // 5. Search VOs
    vos.forEach(v => {
      if (v.voNumber.toLowerCase().includes(q) || v.technicalDescription.description.toLowerCase().includes(q) || (v.remarks && v.remarks.toLowerCase().includes(q))) {
        matches.push({
          id: v.id,
          tabId: 'vo',
          module: 'Variation Order',
          icon: PenTool,
          code: v.voNumber,
          title: `${v.technicalDescription.additionOrOmission} - ${v.commercialOffer.amount.toLocaleString()} ${project.currency}`,
          details: v.technicalDescription.description,
          status: v.status
        });
      }
    });

    // 6. Search NOCs
    nocs.forEach(n => {
      if (n.nocNumber.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q) || (n.remarks && n.remarks.toLowerCase().includes(q))) {
        matches.push({
          id: n.id,
          tabId: 'noc',
          module: 'NOC Permit',
          icon: Award,
          code: n.nocNumber,
          title: n.subject,
          details: `${isAr ? 'الجهة الفاعلة: ' : 'Pending: '}${n.pendingActionBy} | ${n.remarks || ''}`,
          status: n.status
        });
      }
    });

    // 7. Search Documents
    documents.forEach(d => {
      if (d.code.toLowerCase().includes(q) || d.titleEn.toLowerCase().includes(q) || (d.titleAr && d.titleAr.toLowerCase().includes(q))) {
        matches.push({
          id: d.id,
          tabId: 'documents',
          module: 'Document',
          icon: FileText,
          code: d.code,
          title: isAr && d.titleAr ? d.titleAr : d.titleEn,
          details: `${d.category} | ${isAr ? 'المرسل: ' : 'Sender: '}${d.sender} -> ${d.recipient}`,
          status: d.status
        });
      }
    });

    // 8. Search Subcontracts
    subcontracts.forEach(s => {
      if (s.subcontractNumber.toLowerCase().includes(q) || (s.remarks && s.remarks.toLowerCase().includes(q))) {
        matches.push({
          id: s.id,
          tabId: 'subcontractors',
          module: 'Subcontract',
          icon: Pickaxe,
          code: s.subcontractNumber,
          title: `Subcontract: ${s.totalSubcontractAmount.toLocaleString()} ${project.currency}`,
          details: s.remarks || '',
          status: s.status
        });
      }
    });

    setResults(matches);
  }, [query, project, meetings, ipcs, claims, vos, nocs, subcontracts, documents, sprs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-xs">
      
      {/* Search Header */}
      <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
        <h3 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-widest font-mono">
          {isAr ? 'محرك البحث المؤسسي الموحد (Global Search)' : 'Unified Enterprise Search Engine'}
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          {isAr 
            ? 'البحث الفوري المفهرس في جميع السجلات والمستندات والاجتماعات والأموال التعاقدية.' 
            : 'Index-based unified search across all project modules, IPCs, claims, VOs, NOCs, meetings, and documents.'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={isAr ? 'ابحث برقم المستخلص، كود الوثيقة، اسم المخطط أو كلمة دليلية...' : 'Search by IPC code, drawing code, title, description or notes...'}
          className="w-full pl-12 pr-4 rtl:pl-4 rtl:pr-12 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold shadow-xs focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-hidden text-brand-navy dark:text-slate-100"
        />
      </div>

      {/* Results panel */}
      <div className="space-y-4">
        {results.length > 0 && (
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {isAr ? `تم العثور على (${results.length}) نتائج تطابق البحث` : `Found (${results.length}) matches`}
          </p>
        )}

        <div className="space-y-3">
          {results.map(res => {
            const Icon = res.icon;
            return (
              <div 
                key={`${res.tabId}-${res.id}`} 
                className="flex items-center justify-between p-4 bg-slate-50/70 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-2xl shadow-xs hover:shadow-md transition-all gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 bg-white dark:bg-slate-850 rounded-xl shrink-0 border border-slate-100 dark:border-slate-800">
                    <Icon className="w-4 h-4 text-brand-red" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-bold">
                        {res.code}
                      </span>
                      <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-sm uppercase font-mono">
                        {res.module}
                      </span>
                      {res.status && (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[9px] font-extrabold rounded-full">
                          {res.status}
                        </span>
                      )}
                    </div>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                      {res.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {res.details}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToRecord(res.tabId, res.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white transition-all text-[10px] font-bold rounded-lg cursor-pointer shrink-0"
                >
                  <span>{isAr ? 'انتقال فوري' : 'Open Link'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {query.trim() && results.length === 0 && (
            <div className="text-center text-slate-400 py-12">
              {isAr ? 'لم يتم العثور على أية نتائج تطابق هذا البحث.' : 'No matching results found.'}
            </div>
          )}

          {!query.trim() && (
            <div className="text-center text-slate-400 py-16">
              <div className="p-3 bg-slate-100 dark:bg-slate-850 rounded-full w-fit mx-auto mb-4">
                <Search className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500">
                {isAr ? 'ادخل كلمة البحث أعلاه للبدء' : 'Enter a search term to begin indexing'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr 
                  ? 'يمكنك البحث عن المستخلصات، المطالبات، الوثائق، أو الفواتير بجميع الحقول.' 
                  : 'Search indexed documents, payments, and commercial claims simultaneously.'}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
