import React, { useState, useEffect } from 'react';
import { 
  Clock, Filter, Users, Calendar, Activity, BookOpen, AlertCircle, FileSearch 
} from 'lucide-react';
import { ProjectHistory } from '../../../../domain/projects/Project';
import { ProjectRepository } from '../../../../repositories/ProjectRepository';
import { BiText } from '../../../../components/BiText';

interface ActivityFeedTimelineProps {
  lang: 'ar' | 'en';
  projectId: string;
}

export function ActivityFeedTimeline({
  lang,
  projectId
}: ActivityFeedTimelineProps) {
  const isAr = lang === 'ar';
  const projectRepo = new ProjectRepository();

  const [rawHistory, setRawHistory] = useState<ProjectHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ProjectHistory[]>([]);

  // Filter states
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const loadHistory = async () => {
    const list = await projectRepo.getHistory(projectId);
    // Sort descending chronologically
    const sorted = list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    setRawHistory(sorted);
    setFilteredHistory(sorted);
  };

  useEffect(() => {
    loadHistory();
  }, [projectId]);

  // Apply filters
  useEffect(() => {
    let result = [...rawHistory];

    if (selectedUser) {
      result = result.filter(h => h.performedBy === selectedUser);
    }
    if (selectedModule) {
      result = result.filter(h => h.module === selectedModule);
    }
    if (searchCode) {
      result = result.filter(h => 
        (h.entityCode && h.entityCode.toLowerCase().includes(searchCode.toLowerCase())) ||
        (h.action && h.action.toLowerCase().includes(searchCode.toLowerCase())) ||
        (h.details && h.details.toLowerCase().includes(searchCode.toLowerCase()))
      );
    }
    if (selectedDate) {
      result = result.filter(h => h.timestamp.startsWith(selectedDate));
    }

    setFilteredHistory(result);
  }, [selectedUser, selectedModule, searchCode, selectedDate, rawHistory]);

  // Extract unique users and modules for filter options
  const uniqueUsers = Array.from(new Set(rawHistory.map(h => h.performedBy).filter(Boolean)));
  const uniqueModules = Array.from(new Set(rawHistory.map(h => h.module).filter(Boolean)));

  const handleResetFilters = () => {
    setSelectedUser('');
    setSelectedModule('');
    setSearchCode('');
    setSelectedDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-xs">
      
      {/* Title ribbon */}
      <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
        <h3 className="text-xs font-black text-brand-navy dark:text-slate-100 uppercase tracking-widest font-mono">
          {isAr ? 'سجل الأنشطة والتدفق الميداني المتكامل' : 'Enterprise Activity Timeline'}
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          {isAr 
            ? 'مراقبة وتتبع جميع العمليات التي تمت على المشروع بالتاريخ والمستخدم المسئول.' 
            : 'Audit history and chronological activity logs of all business events and document uploads.'}
        </p>
      </div>

      {/* Filters Area */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/60 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        
        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase">
            {isAr ? 'البحث عن كلمات دليلية' : 'Search Keywords / Codes'}
          </label>
          <input 
            type="text" 
            value={searchCode} 
            onChange={e => setSearchCode(e.target.value)}
            placeholder="e.g. IPC-08, VO-ZED..."
            className="w-full p-2 border rounded-lg bg-white text-slate-800"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase">
            {isAr ? 'المستخدم المسؤول' : 'Performed By'}
          </label>
          <select 
            value={selectedUser} 
            onChange={e => setSelectedUser(e.target.value)}
            className="w-full p-2 border rounded-lg bg-white text-slate-800"
          >
            <option value="">{isAr ? 'كل المستخدمين' : '[All Users]'}</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase">
            {isAr ? 'الوحدة / التصنيف' : 'System Module'}
          </label>
          <select 
            value={selectedModule} 
            onChange={e => setSelectedModule(e.target.value)}
            className="w-full p-2 border rounded-lg bg-white text-slate-800"
          >
            <option value="">{isAr ? 'كل الوحدات' : '[All Modules]'}</option>
            {uniqueModules.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase">
            {isAr ? 'تاريخ التنفيذ' : 'Action Date'}
          </label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded-lg bg-white text-slate-800"
          />
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="w-full p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer text-center"
        >
          {isAr ? 'إعادة ضبط' : 'Reset Filters'}
        </button>

      </div>

      {/* Activity Timeline Tree */}
      <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 rtl:ml-0 rtl:mr-4 pl-6 rtl:pl-0 rtl:pr-6 space-y-6">
        {filteredHistory.map((item, index) => {
          return (
            <div key={item.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-[31px] rtl:left-auto rtl:-right-[31px] top-1.5 w-4 h-4 bg-white dark:bg-slate-900 border-2 border-brand-red rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                <Clock className="w-2 h-2 text-brand-red" />
              </div>

              {/* Card wrapper */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[13px]">
                      {item.action}
                    </span>
                    {item.module && (
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-sm uppercase font-mono border border-indigo-100/50">
                        {item.module}
                      </span>
                    )}
                    {item.entityCode && (
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-bold font-mono rounded">
                        #{item.entityCode}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
                    {item.timestamp}
                  </span>
                </div>

                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                  {item.details}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-850/40 text-[9px] font-bold text-slate-400">
                  <span>{isAr ? 'بواسطة:' : 'By:'}</span>
                  <span className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-850 font-sans">{item.performedBy}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredHistory.length === 0 && (
          <div className="text-center text-slate-400 py-10">
            {isAr ? 'لم يتم العثور على أية أحداث مطابقة للمحددات.' : 'No activity logs match the selected filters.'}
          </div>
        )}
      </div>

    </div>
  );
}
