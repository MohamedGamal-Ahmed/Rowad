import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
}

/**
 * Generic, portal-based modal shell.
 *
 * Sprint 4A.1 (Part 1.3): dialogs that were rendered inline inside animated/transformed
 * ancestors (e.g. the Award Wizard inside the sliding TenderDetailsDrawer) inherited a CSS
 * containing block from `transform`/`animate-in` classes on those ancestors. That silently
 * breaks `position: fixed` — the overlay clips to the ancestor instead of the viewport,
 * producing exactly the "renders behind page / z-index / scroll" symptoms QA reported.
 *
 * Rendering through a portal into `document.body` removes the dialog from that DOM
 * subtree entirely, so it is always positioned against the viewport regardless of what
 * animation/transform classes any parent component uses. This is the root-cause fix,
 * not a z-index band-aid.
 *
 * Layout: sticky header, scrollable body, sticky footer, body scroll lock while open.
 */
export function Modal({ open, onClose, title, eyebrow, children, footer, maxWidthClassName = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full ${maxWidthClassName} max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-150`}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6 pb-4">
          <div className="min-w-0">
            {eyebrow && (
              <span className="text-[10px] font-black uppercase text-brand-red tracking-wider block mb-1">
                {eyebrow}
              </span>
            )}
            <h4 className="text-lg font-black text-brand-navy dark:text-slate-100 leading-tight">
              {title}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto premium-scrollbar p-5 sm:p-6 py-4 space-y-4 text-xs">
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-5 sm:p-6 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
