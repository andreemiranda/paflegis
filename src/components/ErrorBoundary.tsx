import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: React.ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Erro inesperado.' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Algo deu errado</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Ocorreu um erro inesperado nesta seção. Tente recarregar a página.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return <>{(this as any).props.children}</>;
  }
}
