import React from 'react';
import { 
  BarChart2, Compass, Briefcase, Folder, Settings, 
  ChevronLeft, ChevronRight, Calendar, Building2
} from 'lucide-react';
import { BiText } from './BiText';

export interface navItem {
  icon: any;
  label: { en: string; ar: string };
  id: string;
  badge?: number;
}

export function Sidebar({ 
  currentView, 
  onNavigate,
  lang,
  isCollapsed,
  onToggleCollapse,
  tendersCount = 6
}: { 
  currentView: string; 
  onNavigate: (view: string) => void;
  lang: 'ar' | 'en';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  tendersCount?: number;
}) {
  const isAr = lang === 'ar';
  const CollapseIcon = isCollapsed 
    ? (isAr ? ChevronLeft : ChevronRight) 
    : (isAr ? ChevronRight : ChevronLeft);

  const groups = [
    {
      title: { en: 'EXECUTIVE', ar: 'الإدارة العليا والرقابة' },
      items: [
        { icon: BarChart2, label: { en: 'Executive Dashboard', ar: 'لوحة التحكم القيادية' }, id: 'dashboard' }
      ]
    },
    {
      title: { en: 'OPERATIONS', ar: 'إدارة العمليات والتنفيذ' },
      items: [
        { icon: Calendar, label: { en: 'Operations Calendar', ar: 'التقويم التشغيلي الموحد' }, id: 'operations-center' },
        { icon: Building2, label: { en: 'Projects Portfolio', ar: 'محفظة المشاريع الكبرى' }, id: 'projects' },
        { icon: Briefcase, label: { en: 'Pre-Award Tenders', ar: 'المناقصات الجارية' }, id: 'ongoing-tenders', badge: tendersCount },
        { icon: Folder, label: { en: 'Document Control', ar: 'مراقبة الصادر والوارد' }, id: 'document-control' }
      ]
    },
    {
      title: { en: 'ADMINISTRATION', ar: 'الإعدادات والصلاحيات' },
      items: [
        { icon: Settings, label: { en: 'Settings & Security', ar: 'إعدادات النظام والأمان' }, id: 'settings' }
      ]
    }
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-brand-navy text-white flex flex-col h-screen sticky top-0 shrink-0 border-r rtl:border-l rtl:border-r-0 border-gray-100 z-20 overflow-y-auto no-scrollbar transition-all duration-300`}>
      {/* Brand Logo Section */}
      <div className="flex items-center justify-between p-5 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex -space-x-1 shrink-0">
            <div className="w-3.5 h-8 bg-brand-red -skew-x-12 transform origin-bottom"></div>
            <div className="w-3.5 h-8 bg-white -skew-x-12 transform origin-bottom translate-y-1"></div>
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300">
              <h1 className="font-bold text-xl tracking-wide leading-tight">ROWAD</h1>
              <p className="text-[10px] text-gray-400 tracking-wider font-medium uppercase font-sans">Enterprise Platform</p>
            </div>
          )}
        </div>

        {/* Stateful Toggle Button */}
        <button 
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
          title={isAr ? 'تقليص القائمة' : 'Collapse Sidebar'}
        >
          <CollapseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 py-4 px-3 space-y-6">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <span className="text-[10px] font-black text-white/40 tracking-widest block px-4 py-1.5 font-sans uppercase">
                {isAr ? group.title.ar : group.title.en}
              </span>
            )}
            
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center py-3' : 'px-4 py-3'} rounded-xl transition-all duration-200 group relative cursor-pointer
                      ${isActive 
                        ? 'bg-white/10 text-white shadow-sm font-bold' 
                        : 'text-white/60 hover:bg-white/5 hover:text-white hover:opacity-100 opacity-70'
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-2.5 rtl:ml-2.5'}`} strokeWidth={isActive ? 2.2 : 1.6} />
                    
                    {!isCollapsed ? (
                      <>
                        <BiText 
                          text={item.label} 
                          primaryLang={lang}
                          stacked={true}
                          className="text-start flex-1"
                          primaryClassName={`text-sm ${isActive ? 'text-white' : 'group-hover:text-white'}`}
                          secondaryClassName={`text-[10px] ${isActive ? 'text-white/80' : 'text-white/60 group-hover:text-white/80'}`}
                        />
                        {item.badge && (
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-white text-brand-navy' : 'bg-brand-red text-white'}`}>
                            {item.badge}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Collapsed Hover Tooltip support */
                      <div className="absolute left-16 rtl:left-auto rtl:right-16 bg-brand-navy border border-white/10 text-white font-sans text-xs py-2 px-3 rounded-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all z-50 whitespace-nowrap shadow-xl">
                         {isAr ? item.label.ar : item.label.en}
                         {item.badge && <span className="ml-2 rtl:mr-2 bg-brand-red text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      
      {/* Bottom Profile and metadata */}
      <div className="p-4 border-t border-white/5 text-center">
        {!isCollapsed ? (
          <div>
            <p className="text-[10px] text-white/30 font-sans tracking-widest font-bold">
              ROWAD ENTERPRISE v3.0
            </p>
          </div>
        ) : (
          <span className="text-[10px] text-white/20 font-bold font-mono">v3</span>
        )}
      </div>
    </aside>
  );
}
