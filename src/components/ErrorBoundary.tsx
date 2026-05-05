import React, { ErrorInfo, ReactNode, Component } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // @ts-ignore
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 arabic-text">عفواً، حدث خطأ ما</h2>
            <p className="text-slate-500 mb-8 arabic-text">نعتذر عن هذا الخلل البرمجي. حاول تحديث الصفحة أو العودة للرئيسية.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all arabic-text"
            >
              تحديث الصفحة 🔄
            </button>
            {/* @ts-ignore */}
            {this.state.error && (
              <div className="mt-6 p-4 bg-red-50 rounded-2xl text-left overflow-auto max-h-32">
                <code className="text-xs text-red-800 break-all text-right block arabic-text">
                  {/* @ts-ignore */}
                  {this.state.error.message}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
