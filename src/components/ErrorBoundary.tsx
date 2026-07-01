import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Short label identifying the boundary in logs, e.g. "Project Setup Wizard". */
  label: string;
  lang?: 'ar' | 'en';
  /** Optional fallback action, e.g. navigate back to a safe tab. */
  onRecover?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic, reusable React Error Boundary.
 *
 * Sprint 4A.1 (BUG-003): no component in the workspace was isolated against render-time
 * exceptions, so any uncaught error (e.g. ProjectSetupWizard's undefined-array crash)
 * propagated to a full white screen with no recovery path. This wraps any risky
 * subtree so a crash degrades to a scoped, recoverable fallback instead of taking
 * down the whole workspace.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.label}]`, error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRecover?.();
  };

  render() {
    if (this.state.hasError) {
      const isAr = this.props.lang === 'ar';
      return (
        <div className="flex flex-col items-center justify-center text-center p-10 min-h-[300px] bg-rose-50/50 dark:bg-rose-950/10 border border-dashed border-rose-200 dark:border-rose-900/40 rounded-3xl">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-extrabold text-brand-navy dark:text-slate-100 mb-1">
            {isAr ? `تعذر عرض ${this.props.label}` : `${this.props.label} is temporarily unavailable`}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
            {isAr
              ? 'حدث خطأ غير متوقع أثناء عرض هذا القسم. تم عزل الخطأ ولن يؤثر على باقي أقسام المشروع. يمكنك إعادة المحاولة أو التواصل مع الدعم الفني إذا استمرت المشكلة.'
              : 'An unexpected error occurred while rendering this section. It has been isolated and will not affect the rest of the project workspace. Retry, or contact support if this persists.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white hover:bg-brand-red/90 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
