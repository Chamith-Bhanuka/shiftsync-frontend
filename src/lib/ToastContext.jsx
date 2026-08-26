import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, timestamp: new Date() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, clearAllToasts }}>
      {children}
      <div className="fixed bottom-5 right-5 flex flex-col items-end gap-2.5 z-50 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.length > 2 && (
          <button
            onClick={clearAllToasts}
            className="pointer-events-auto text-xs bg-slate-900/80 hover:bg-slate-900 text-white px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm transition-all mb-1 font-medium flex items-center gap-1"
          >
            Clear all ({toasts.length})
          </button>
        )}
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isInfo = !isSuccess && !isError;

          return (
            <div
              key={t.id}
              role="alert"
              className={`toast ${
                isSuccess ? 'toast-success' : isError ? 'toast-error' : 'toast-info'
              } pointer-events-auto shadow-elevated`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {isError && (
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {isInfo && (
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 pr-1 font-medium text-xs sm:text-sm leading-snug break-words">
                {t.message}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded focus:outline-none"
                aria-label="Dismiss notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider');
  return ctx;
}
