"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

const ToastContext = createContext({
  showToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = "info", duration = 4000 }) => {
      const id = Date.now() + Math.random().toString(36).substring(2);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container (bottom centre) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-[90vw] sm:max-w-[380px] w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 squircle bg-[var(--surface)] border ${
              toast.type === "error"
                ? "border-[var(--danger-muted)] text-[var(--danger-muted)]"
                : "border-[var(--border)] text-[var(--text)]"
            } shadow-lg transition-all text-xs font-medium`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "error" ? (
                <CircleAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              ) : toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss toast"
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
