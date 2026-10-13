"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/Button";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log unexpected client-side error cleanly
    console.error("Unhandled client error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[var(--bg)] text-[var(--text)]">
      <div className="w-12 h-12 squircle bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--text)]">
        <CircleAlert className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-medium tracking-tight mb-2">Something went wrong</h1>
      <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6">
        {error?.message || "An unexpected application error occurred."}
      </p>

      <Button variant="primary" size="sm" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  );
}
