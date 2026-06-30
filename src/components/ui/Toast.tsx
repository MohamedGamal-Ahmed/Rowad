import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300',
  error: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300',
  info: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
};

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-slate-500'
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

/** In-system notification stack — replaces ad-hoc alert() usage for non-blocking confirmations. */
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 sm:inset-x-auto sm:right-4 z-[1100] flex flex-col items-center sm:items-end gap-2 px-4 sm:px-0 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2 w-full sm:w-auto sm:max-w-sm border rounded-xl shadow-sm px-3.5 py-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 ${STYLES[t.type]}`}
            role="status"
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${ICON_COLOR[t.type]}`} />
            <span className="flex-1 leading-snug">{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
