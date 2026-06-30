import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertDialog } from './AlertDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { ToastContainer, ToastMessage, ToastType } from './Toast';

/**
 * Shared UI Dialog System (Sprint 3 Hotfix — Infrastructure).
 *
 * Replaces browser-native window.alert() / window.confirm() / window.prompt() across
 * the entire app with in-system, themed, Promise-based equivalents. Native dialogs
 * block the JS thread, cannot be styled/localized properly, and are invisible to
 * automated QA tooling — this is why they were flagged as a Release Blocker.
 *
 * Usage (inside any function component, anywhere under <DialogProvider>):
 *
 *   const dialog = useDialog();
 *   await dialog.alert('Message', { title: 'Optional title' });
 *   const ok = await dialog.confirm('Are you sure?', { danger: true });
 *   const reason = await dialog.promptText('Enter a reason', { required: true });
 *   dialog.toast('Saved successfully', 'success');
 */

interface AlertRequest {
  id: number;
  type: 'alert';
  message: string;
  title?: string;
  resolve: () => void;
}

interface ConfirmRequest {
  id: number;
  type: 'confirm';
  message: string;
  title?: string;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (confirmed: boolean) => void;
}

interface PromptRequest {
  id: number;
  type: 'prompt';
  message: string;
  title?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  resolve: (value: string | null) => void;
}

type DialogRequest = AlertRequest | ConfirmRequest | PromptRequest;

interface DialogContextValue {
  alert: (message: string, options?: { title?: string }) => Promise<void>;
  confirm: (message: string, options?: { title?: string; danger?: boolean; confirmLabel?: string; cancelLabel?: string }) => Promise<boolean>;
  promptText: (message: string, options?: { title?: string; required?: boolean; defaultValue?: string; placeholder?: string }) => Promise<string | null>;
  toast: (message: string, type?: ToastType) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog() must be used within <DialogProvider>. Wrap the app root with <DialogProvider>.');
  }
  return ctx;
}

let requestSeq = 0;
let toastSeq = 0;

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queueRef = useRef<DialogRequest[]>([]);
  queueRef.current = queue;

  const enqueue = useCallback((req: DialogRequest) => {
    setQueue(prev => [...prev, req]);
  }, []);

  const dequeue = useCallback((id: number) => {
    setQueue(prev => prev.filter(r => r.id !== id));
  }, []);

  const alert = useCallback((message: string, options?: { title?: string }) => {
    return new Promise<void>(resolve => {
      const id = ++requestSeq;
      enqueue({ id, type: 'alert', message, title: options?.title, resolve: () => { dequeue(id); resolve(); } });
    });
  }, [enqueue, dequeue]);

  const confirm = useCallback((message: string, options?: { title?: string; danger?: boolean; confirmLabel?: string; cancelLabel?: string }) => {
    return new Promise<boolean>(resolve => {
      const id = ++requestSeq;
      enqueue({
        id,
        type: 'confirm',
        message,
        title: options?.title,
        danger: options?.danger,
        confirmLabel: options?.confirmLabel,
        cancelLabel: options?.cancelLabel,
        resolve: (v: boolean) => { dequeue(id); resolve(v); }
      });
    });
  }, [enqueue, dequeue]);

  const promptText = useCallback((message: string, options?: { title?: string; required?: boolean; defaultValue?: string; placeholder?: string }) => {
    return new Promise<string | null>(resolve => {
      const id = ++requestSeq;
      enqueue({
        id,
        type: 'prompt',
        message,
        title: options?.title,
        required: options?.required,
        defaultValue: options?.defaultValue,
        placeholder: options?.placeholder,
        resolve: (v: string | null) => { dequeue(id); resolve(v); }
      });
    });
  }, [enqueue, dequeue]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastSeq;
    setToasts(prev => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const current = queue[0];

  return (
    <DialogContext.Provider value={{ alert, confirm, promptText, toast }}>
      {children}

      {current && current.type === 'alert' && (
        <AlertDialog
          title={current.title}
          message={current.message}
          onClose={current.resolve}
        />
      )}

      {current && current.type === 'confirm' && (
        <ConfirmDialog
          title={current.title}
          message={current.message}
          danger={current.danger}
          confirmLabel={current.confirmLabel}
          cancelLabel={current.cancelLabel}
          onConfirm={() => current.resolve(true)}
          onCancel={() => current.resolve(false)}
        />
      )}

      {current && current.type === 'prompt' && (
        <ConfirmDialog
          title={current.title}
          message={current.message}
          inputMode
          inputRequired={current.required}
          inputDefaultValue={current.defaultValue}
          inputPlaceholder={current.placeholder}
          onConfirm={(value) => current.resolve(value ?? '')}
          onCancel={() => current.resolve(null)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </DialogContext.Provider>
  );
}
