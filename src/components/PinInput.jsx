"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Delete } from "lucide-react";

export function PinInput({
  value = "",
  onChange,
  onComplete,
  error,
  disabled = false,
  autoFocus = true,
  label = "Enter 4-digit PIN",
}) {
  const [shaking, setShaking] = useState(false);
  const hiddenInputRef = useRef(null);

  // Trigger shake on error
  useEffect(() => {
    if (error) {
      setShaking(true);
      const timer = setTimeout(() => {
        setShaking(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (autoFocus && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [autoFocus]);

  const handleDigitPress = (digit) => {
    if (disabled) return;
    if (value.length < 4) {
      const nextVal = value + digit;
      onChange?.(nextVal);
      if (nextVal.length === 4) {
        onComplete?.(nextVal);
      }
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    if (value.length > 0) {
      const nextVal = value.slice(0, -1);
      onChange?.(nextVal);
    }
  };

  const handleHiddenInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    onChange?.(raw);
    if (raw.length === 4) {
      onComplete?.(raw);
    }
  };

  const handleContainerClick = () => {
    if (!disabled && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[280px] mx-auto select-none" onClick={handleContainerClick}>
      {label && (
        <span className="text-xs text-[var(--text-muted)] tracking-[0.02em] font-medium mb-4 text-center">
          {label}
        </span>
      )}

      {/* Hidden input for keyboard and screen-readers */}
      <input
        ref={hiddenInputRef}
        type="password"
        inputMode="numeric"
        maxLength={4}
        autoComplete="off"
        value={value}
        onChange={handleHiddenInputChange}
        disabled={disabled}
        className="sr-only"
        aria-label={label}
      />

      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite">
        {value.length > 0 ? `${value.length} of 4 digits entered` : "No digits entered"}
      </div>

      {/* 4 PIN Dots */}
      <div
        className={`flex items-center justify-center gap-4 py-4 ${
          shaking ? "animate-pin-shake" : ""
        }`}
      >
        {[0, 1, 2, 3].map((index) => {
          const isFilled = index < value.length;
          return (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-120 ${
                isFilled
                  ? "bg-[var(--text)] border border-[var(--text)] animate-dot-pop"
                  : "bg-transparent border border-[var(--text-muted)]"
              }`}
            />
          );
        })}
      </div>

      {/* Error state with CircleAlert */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text)] mt-2 text-center">
          <CircleAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      {/* On-screen 3x4 numeric keypad with 64px squircle keys */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              handleDigitPress(String(num));
            }}
            className="w-16 h-16 squircle bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xl font-medium flex items-center justify-center transition-all duration-150 active:scale-95 hover:bg-[color-mix(in_srgb,var(--mist)_12%,var(--ink))] disabled:opacity-40"
          >
            {num}
          </button>
        ))}

        {/* Empty placeholder slot to preserve 3x4 grid */}
        <div className="w-16 h-16" />

        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleDigitPress("0");
          }}
          className="w-16 h-16 squircle bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xl font-medium flex items-center justify-center transition-all duration-150 active:scale-95 hover:bg-[color-mix(in_srgb,var(--mist)_12%,var(--ink))] disabled:opacity-40"
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={(e) => {
            e.stopPropagation();
            handleBackspace();
          }}
          aria-label="Backspace"
          className="w-16 h-16 squircle bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center transition-all duration-150 active:scale-95 hover:bg-[color-mix(in_srgb,var(--mist)_12%,var(--ink))] disabled:opacity-40"
        >
          <Delete className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
