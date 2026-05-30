'use client';

import React from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} onGoHome={this.handleGoHome} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({
  error,
  onReset,
  onGoHome,
}: {
  error: Error | null;
  onReset: () => void;
  onGoHome: () => void;
}) {
  const { t, dir } = useI18n();

  return (
    <div
      dir={dir()}
      className="flex items-center justify-center min-h-[50vh] p-6"
    >
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error illustration */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="size-24 rounded-full bg-gradient-to-br from-red-100 to-amber-100 dark:from-red-950/30 dark:to-amber-950/30 flex items-center justify-center">
              <AlertTriangle className="size-10 text-amber-500 dark:text-amber-400" />
            </div>
            {/* Decorative circles */}
            <div className="absolute -top-1 -right-1 size-5 rounded-full bg-red-200 dark:bg-red-900/40 animate-pulse" />
            <div className="absolute -bottom-2 -left-2 size-4 rounded-full bg-amber-200 dark:bg-amber-900/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            {t('somethingWentWrong')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('errorDescription')}
          </p>
        </div>

        {/* Error details (collapsible in dev) */}
        {error && (
          <details className="text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Error details
            </summary>
            <pre className="mt-2 p-3 rounded-lg bg-muted text-[11px] text-muted-foreground overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onGoHome}
            className="gap-2"
          >
            <Home className="size-4" />
            {t('goHome')}
          </Button>
          <Button
            onClick={onReset}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20"
          >
            <RotateCcw className="size-4" />
            {t('tryAgain')}
          </Button>
        </div>
      </div>
    </div>
  );
}
