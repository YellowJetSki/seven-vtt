/* ── Error Boundary ─────────────────────────────────────────────
 * Catches unhandled render errors in React component trees.
 * Prevents the entire app from crashing and shows a graceful
 * recovery UI with retry capability.
 *
 * ── Usage ─────────────────────────────────────────────────────
 *   <ErrorBoundary fallback={<CustomFallback />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 * ─────────────────────────────────────────────────────────────── */

import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console for debugging
    console.error("[ErrorBoundary] Unhandled error:", error, errorInfo);

    // Call optional onError callback (e.g., for analytics)
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="mx-auto max-w-md rounded-xl border border-warrior-500/30 bg-surface-850 p-6 text-center">
            <span className="text-4xl">⚠️</span>
            <h3 className="mt-3 text-lg font-semibold text-surface-100">Something went wrong</h3>
            <p className="mt-1 text-sm text-surface-400">
              This section encountered an unexpected error. The rest of the app should still work.
            </p>
            {this.state.error && (
              <details className="mt-3 text-left">
                <summary className="cursor-pointer text-xs text-surface-500 hover:text-surface-300">
                  Error details
                </summary>
                <pre className="mt-2 max-h-[120px] overflow-auto rounded-lg bg-surface-900 p-2 text-[11px] text-warrior-400">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="mt-4">
              <Button size="sm" onClick={this.handleRetry}>
                🔄 Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
