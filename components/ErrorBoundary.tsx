import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset(): void {
    this.setState({ hasError: false, error: null });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-ivory-surface border border-border rounded-[2.5rem] p-12 max-w-lg w-full text-center custom-shadow">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={36} />
            </div>
            <h2 className="text-xl font-bold text-navy-900 mb-3">
              出现了一些问题
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              应用程序遇到了意外错误。请尝试刷新页面或联系技术支持。
            </p>
            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left overflow-auto max-h-32">
                <p className="text-xs font-mono text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="bg-navy-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center justify-center gap-3 mx-auto"
            >
              <RefreshCw size={18} />
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
