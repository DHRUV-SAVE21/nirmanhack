import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-navy to-slate-900 text-white p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="p-4 bg-red-500/20 rounded-full">
                                <AlertTriangle size={48} className="text-red-400" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">Something went wrong</h1>
                            <p className="text-slate-600 dark:text-gray-400">
                                We encountered an unexpected error. Please try refreshing the page.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left bg-gray-800/50 p-4 rounded-lg text-sm">
                                <summary className="cursor-pointer text-red-400 font-medium mb-2">
                                    Error Details (Development)
                                </summary>
                                <pre className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2 px-4 py-2 bg-organic-green hover:bg-organic-green-600 text-dark-navy font-medium rounded-lg transition-colors"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>
                            
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-slate-900 dark:text-white font-medium rounded-lg transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;