import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";

export default function AppLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--text)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
