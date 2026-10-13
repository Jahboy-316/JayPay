"use client";

import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[var(--bg)] text-[var(--text)]">
      <div className="w-12 h-12 squircle bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--text)]">
        <CircleAlert className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-medium tracking-tight mb-2">Page Not Found</h1>
      <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6">
        The requested URL does not exist or has been relocated within JayPay.
      </p>

      <Link href="/dashboard">
        <Button variant="primary" size="sm">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
