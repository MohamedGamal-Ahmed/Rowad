import React from 'react';
import { StatusPresentationService } from '../services/StatusPresentationService';
import { LifecyclePresentationService } from '../services/LifecyclePresentationService';

interface BadgeProps {
  lang: 'ar' | 'en';
  className?: string;
}

interface WorkflowBadgeProps extends BadgeProps {
  workflowState?: string;
}

export function ProjectWorkflowStateBadge({ workflowState, lang, className = '' }: WorkflowBadgeProps) {
  const presentation = StatusPresentationService.getWorkflowStatePresentation(workflowState);
  const Icon = presentation.icon;
  const isAr = lang === 'ar';
  const label = isAr ? presentation.ar : presentation.en;

  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 border font-mono ${presentation.badgeClass} ${className}`}>
      <Icon className="w-3 h-3" />
      <span>{isAr ? `سير العمل: ${label}` : `Workflow: ${label}`}</span>
    </span>
  );
}

interface StatusBadgeProps extends BadgeProps {
  status?: string;
}

export function ProjectStatusBadge({ status, lang, className = '' }: StatusBadgeProps) {
  const presentation = StatusPresentationService.getProjectStatusPresentation(status);
  const Icon = presentation.icon;
  const isAr = lang === 'ar';
  const label = isAr ? presentation.ar : presentation.en;

  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 border font-mono ${presentation.badgeClass} ${className}`}>
      <Icon className="w-3 h-3" />
      <span>{isAr ? `الحالة: ${label}` : `Status: ${label}`}</span>
    </span>
  );
}

interface LifecycleBadgeProps extends BadgeProps {
  lifecycleStage?: string;
}

export function ProjectLifecycleBadge({ lifecycleStage, lang, className = '' }: LifecycleBadgeProps) {
  const presentation = LifecyclePresentationService.getLifecycleStagePresentation(lifecycleStage);
  const Icon = presentation.icon;
  const isAr = lang === 'ar';
  const label = isAr ? presentation.ar : presentation.en;

  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 border font-mono ${presentation.badgeClass} ${className}`}>
      <Icon className="w-3 h-3" />
      <span>{isAr ? `المرحلة: ${label}` : `Lifecycle: ${label}`}</span>
    </span>
  );
}
