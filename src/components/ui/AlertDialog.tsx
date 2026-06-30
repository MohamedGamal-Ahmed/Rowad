import React, { useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AlertDialogProps {
  title?: string;
  message: string;
  onClose: () => void;
}

/**
 * In-system replacement for window.alert(). Renders as a centered modal instead of
 * a native browser dialog so it never blocks the JS thread and is fully visible to
 * automated QA / accessibility tooling.
 */
export function AlertDialog({ title, message, onClose }: AlertDialogProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      role="alertdialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-150 dark:border-slate-800 max-w-sm w-full p-5 space-y-3 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-0.5 pt-1">
              {title && <h4 className="font-black text-xs text-brand-navy dark:text-slate-100 uppercase">{title}</h4>}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-350 hover:text-slate-600 shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end pt-1">
          <button
            ref={buttonRef}
            onClick={onClose}
            className="px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl font-bold text-xs cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
