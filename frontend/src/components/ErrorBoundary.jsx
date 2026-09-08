import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL REACT RENDER ERROR:', error);
    console.error('COMPONENT STACK TRACE:', errorInfo?.componentStack);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env?.DEV);

      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center p-6 bg-[var(--background)] text-[var(--text-primary)]">
          <div className="surface max-w-xl w-full rounded-3xl p-6 sm:p-8 text-center border border-[var(--border)] shadow-2xl bg-[var(--surface)]">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/15 text-rose-500">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h1 className="display-face m-0 text-xl font-bold text-[var(--text-primary)]">Something went wrong</h1>
            <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
              StudyVault encountered a temporary rendering issue. Please try refreshing.
            </p>

            {/* Developer Details only in Vite DEV mode */}
            {isDev && this.state.error && (
              <div className="mt-4 text-left rounded-xl bg-black/90 p-4 font-mono text-[11px] text-rose-400 overflow-x-auto max-h-60 border border-rose-500/30">
                <p className="font-bold text-rose-300 m-0">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[10px] text-zinc-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-md transition hover:opacity-95 active:scale-95 cursor-pointer"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
              onClick={this.handleReset}
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
