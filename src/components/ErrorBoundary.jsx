import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151821] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
            <div className="text-6xl mb-6 animate-bounce">🙈</div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Oops! Something went wrong.</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              We encountered an unexpected glitch. Our engineers have been notified. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-slate-900 dark:text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/25"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
