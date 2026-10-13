"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={`w-12 h-12 squircle bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center hover:bg-[color-mix(in_srgb,var(--mist)_12%,var(--ink))] transition-all active:scale-95 shrink-0 ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-[var(--text)]" strokeWidth={1.5} />
      ) : (
        <Moon className="w-5 h-5 text-[var(--text)]" strokeWidth={1.5} />
      )}
    </button>
  );
}
