import { 
  Award, Settings, Play, Pickaxe, Lock, Archive, HelpCircle 
} from 'lucide-react';
import React from 'react';

export interface LifecyclePresentation {
  en: string;
  ar: string;
  badgeClass: string;
  color: string;
  icon: React.ComponentType<any>;
}

export class LifecyclePresentationService {
  /**
   * Translates and styles ProjectLifecycleStage values
   */
  public static getLifecycleStagePresentation(stage?: string): LifecyclePresentation {
    const s = stage || 'Pre-Award';
    switch (s) {
      case 'Pre-Award':
      case 'PRE_AWARD':
        return {
          en: 'Pre-Award',
          ar: 'قبل الترسية',
          badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-150 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900',
          color: 'indigo',
          icon: Award
        };
      case 'Pending Project Setup':
      case 'PENDING_SETUP':
        return {
          en: 'Pending Project Setup',
          ar: 'في انتظار تهيئة المشروع',
          badgeClass: 'bg-amber-50 text-amber-700 border border-amber-150 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
          color: 'amber',
          icon: Settings
        };
      case 'Ready for Mobilization':
      case 'READY_FOR_MOBILIZATION':
        return {
          en: 'Ready for Mobilization',
          ar: 'جاهز للتعبئة والتجهيز',
          badgeClass: 'bg-blue-50 text-blue-700 border border-blue-150 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
          color: 'blue',
          icon: Play
        };
      case 'Execution':
      case 'EXECUTION':
        return {
          en: 'Execution',
          ar: 'التنفيذ والتشغيل',
          badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-150 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
          color: 'emerald',
          icon: Pickaxe
        };
      case 'Close-Out':
      case 'CLOSE_OUT':
      case 'Closing':
        return {
          en: 'Close-Out',
          ar: 'المشروع المغلق النهائي',
          badgeClass: 'bg-slate-50 text-slate-700 border border-slate-150 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
          color: 'slate',
          icon: Lock
        };
      case 'Archived':
      case 'ARCHIVED':
        return {
          en: 'Archived',
          ar: 'مؤرشف تاريخي',
          badgeClass: 'bg-rose-50 text-rose-700 border border-rose-150 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
          color: 'rose',
          icon: Archive
        };
      default:
        return {
          en: s,
          ar: s,
          badgeClass: 'bg-slate-50 text-slate-700 border border-slate-150 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
          color: 'slate',
          icon: HelpCircle
        };
    }
  }
}
