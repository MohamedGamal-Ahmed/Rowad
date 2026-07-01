import { 
  Edit3, Clock, CheckCircle2, AlertCircle, ShieldCheck, 
  Truck, Pause, Check, Lock, Archive, HelpCircle 
} from 'lucide-react';
import React from 'react';

export interface StatusPresentation {
  en: string;
  ar: string;
  badgeClass: string;
  color: string;
  icon: React.ComponentType<any>;
}

export class StatusPresentationService {
  /**
   * Translates and styles ProjectWorkflowState values
   */
  public static getWorkflowStatePresentation(state?: string): StatusPresentation {
    const s = state || 'Draft';
    switch (s) {
      case 'Draft':
        return {
          en: 'Draft',
          ar: 'مسودة',
          badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          color: 'slate',
          icon: Edit3
        };
      case 'Pending Activation':
      case 'PENDING_ACTIVATION':
        return {
          en: 'Pending Activation',
          ar: 'في انتظار التفعيل',
          badgeClass: 'bg-amber-50 text-amber-600 border border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
          color: 'amber',
          icon: Clock
        };
      case 'Active':
      case 'ACTIVE':
        return {
          en: 'Active',
          ar: 'نشط',
          badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
          color: 'emerald',
          icon: CheckCircle2
        };
      case 'Suspended':
      case 'SUSPENDED':
        return {
          en: 'Suspended',
          ar: 'موقوف مؤقتاً',
          badgeClass: 'bg-rose-50 text-rose-600 border border-rose-200/50 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
          color: 'rose',
          icon: AlertCircle
        };
      case 'Completed':
      case 'COMPLETED':
        return {
          en: 'Completed',
          ar: 'مكتمل',
          badgeClass: 'bg-blue-50 text-blue-600 border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
          color: 'blue',
          icon: ShieldCheck
        };
      default:
        return {
          en: s,
          ar: s,
          badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          color: 'slate',
          icon: HelpCircle
        };
    }
  }

  /**
   * Translates and styles ProjectStatus values
   */
  public static getProjectStatusPresentation(status?: string): StatusPresentation {
    const s = status || 'Inactive';
    switch (s) {
      case 'Inactive':
      case 'INACTIVE':
        return {
          en: 'Inactive',
          ar: 'غير نشط',
          badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          color: 'slate',
          icon: AlertCircle
        };
      case 'Mobilizing':
      case 'MOBILIZING':
        return {
          en: 'Mobilizing',
          ar: 'قيد التجهيز',
          badgeClass: 'bg-blue-50 text-blue-600 border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
          color: 'blue',
          icon: Truck
        };
      case 'Active':
      case 'ACTIVE':
        return {
          en: 'Active',
          ar: 'نشط',
          badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
          color: 'emerald',
          icon: CheckCircle2
        };
      case 'Suspended':
      case 'SUSPENDED':
        return {
          en: 'Suspended',
          ar: 'موقوف مؤقتاً',
          badgeClass: 'bg-amber-50 text-amber-600 border border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
          color: 'amber',
          icon: Pause
        };
      case 'Completed':
      case 'COMPLETED':
        return {
          en: 'Completed',
          ar: 'مكتمل',
          badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
          color: 'emerald',
          icon: Check
        };
      case 'Closed':
      case 'CLOSED':
        return {
          en: 'Closed',
          ar: 'مغلق',
          badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          color: 'slate',
          icon: Lock
        };
      case 'Archived':
      case 'ARCHIVED':
        return {
          en: 'Archived',
          ar: 'مؤرشف',
          badgeClass: 'bg-rose-50 text-rose-600 border border-rose-200/50 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
          color: 'rose',
          icon: Archive
        };
      case 'Pre-Award':
      case 'PRE_AWARD':
        return {
          en: 'Pre-Award',
          ar: 'قبل الترسية',
          badgeClass: 'bg-indigo-50 text-indigo-600 border border-indigo-200/50 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900',
          color: 'indigo',
          icon: HelpCircle
        };
      default:
        return {
          en: s,
          ar: s,
          badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          color: 'slate',
          icon: HelpCircle
        };
    }
  }
}
