"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Dialog({ isOpen, onClose, title, description, children, maxWidth = "max-w-[420px]" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={`relative z-10 w-full ${maxWidth} bg-[var(--bg)] border border-[var(--border)] squircle-dialog p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto sm:rounded-[24px] rounded-b-none`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 id="dialog-title" className="text-lg font-medium text-[var(--text)] tracking-[-0.01em]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
