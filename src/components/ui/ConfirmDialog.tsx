import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  title?: string;
  message: string;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, renders a text input and behaves as the in-system replacement for window.prompt(). */
  inputMode?: boolean;
  inputRequired?: boolean;
  inputDefaultValue?: string;
  inputPlaceholder?: string;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
}

/**
 * In-system replacement for window.confirm() and window.prompt().
 * - confirm mode: two actions, Cancel / Confirm.
 * - prompt mode (inputMode=true): adds a text field; Confirm is disabled while empty
 *   if inputRequired is set, mirroring the validation the old window.prompt() callers
 *   used to do manually after the fact.
 */
export function ConfirmDialog({
  title,
  message,
  danger,
  confirmLabel,
  cancelLabel,
  inputMode,
  inputRequired,
  inputDefaultValue,
  inputPlaceholder,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [value, setValue] = useState(inputDefaultValue || '');
  const [touched, setTouched] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputMode) {
      inputRef.current?.focus();
    } else {
      confirmRef.current?.focus();
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInvalid = inputMode && inputRequired && !value.trim();

  const handleConfirmClick = () => {
    if (inputMode) {
      setTouched(true);
      if (isInvalid) return;
      onConfirm(value.trim());
    } else {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      role="alertdialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-150 dark:border-slate-800 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${danger ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
              {danger ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <HelpCircle className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="space-y-0.5 pt-1">
              {title && <h4 className="font-black text-xs text-brand-navy dark:text-slate-100 uppercase">{title}</h4>}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-350 hover:text-slate-600 shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {inputMode && (
          <div className="space-y-1">
            <textarea
              ref={inputRef}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={inputPlaceholder}
              rows={2}
              className={`w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-none ${
                touched && isInvalid ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-200 dark:border-slate-850'
              }`}
            />
            {touched && isInvalid && (
              <p className="text-[10px] font-bold text-red-600">
                {inputPlaceholder ? `${inputPlaceholder} is required.` : 'This field is required.'}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
          >
            {cancelLabel || 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            onClick={handleConfirmClick}
            disabled={Boolean(touched && isInvalid)}
            className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-red hover:bg-brand-red-dark'
            }`}
          >
            {confirmLabel || (danger ? 'Delete' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
