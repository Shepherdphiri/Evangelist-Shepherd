import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9F7F3] text-[#181615] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E5E0D8] p-8 space-y-4">
            <p className="text-xs uppercase tracking-widest text-[#8B5E34] font-semibold">
              Notice
            </p>
            <h1 className="font-serif text-2xl font-semibold text-[#181615]">
              Something interrupted the page
            </h1>
            <p className="text-sm text-[#57524C] leading-relaxed">
              We encountered a temporary issue loading this ministry view. Please reload the page to continue.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[#1B365D] text-white text-sm font-medium hover:bg-[#142847] transition-colors cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
