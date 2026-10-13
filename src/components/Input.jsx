"use client";

import { forwardRef } from "react";
import { CircleAlert } from "lucide-react";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    type = "text",
    className = "",
    containerClassName = "",
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs text-[var(--text-muted)] tracking-[0.02em] font-medium"
        >
          {label}
          {required && <span className="ml-1 text-[var(--text-muted)]">*</span>}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`h-12 w-full px-4 text-base font-normal bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] squircle transition-colors placeholder:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--text)] focus-visible:outline-offset-2 ${
          error ? "border-[var(--text)]" : ""
        } ${className}`}
        {...props}
      />

      {error ? (
        <div
          id={errorId}
          className="flex items-center gap-1.5 text-xs text-[var(--text)] pt-0.5"
        >
          <CircleAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <span className="text-xs text-[var(--text-muted)] pt-0.5">{helperText}</span>
      ) : null}
    </div>
  );
});
