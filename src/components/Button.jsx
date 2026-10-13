"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "default",
    isLoading = false,
    disabled = false,
    className = "",
    type = "button",
    ...props
  },
  ref
) {
  let variantClasses = "";
  if (variant === "primary") {
    // Inverted monochrome per design.md: Mist on Ink (dark) / Ink on Mist (light)
    variantClasses =
      "bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-90 active:scale-[0.98]";
  } else if (variant === "secondary") {
    variantClasses =
      "bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--mist)_10%,var(--ink))] active:scale-[0.98]";
  } else if (variant === "ghost") {
    variantClasses =
      "bg-transparent text-[var(--text)] hover:bg-[var(--surface)] active:scale-[0.98]";
  } else if (variant === "danger") {
    variantClasses =
      "bg-[var(--surface)] border border-[var(--danger-muted)] text-[var(--danger-muted)] hover:opacity-90 active:scale-[0.98]";
  }

  const sizeClasses =
    size === "icon"
      ? "w-12 h-12 p-0 flex items-center justify-center squircle"
      : size === "sm"
      ? "h-10 px-4 text-xs font-medium squircle"
      : "h-12 px-6 text-base font-medium squircle";

  const disabledClasses =
    disabled || isLoading ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 select-none ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-current" strokeWidth={1.5} />
      ) : (
        children
      )}
    </button>
  );
});
