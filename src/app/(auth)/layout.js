import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="h-16 px-4 sm:px-8 border-b border-[var(--border)] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-xl font-medium tracking-tight">
          <span>JayPay</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--steel)]" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered Auth Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
        &copy; 2026 JayPay Banking. All rights reserved.
      </footer>
    </div>
  );
}
