"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  Coins,
  ReceiptText,
  FileText,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/Button";

const ADMIN_NAV = [
  { label: "User Management", href: "/admin", icon: Users },
  { label: "Manual Adjustments", href: "/admin/adjustments", icon: Coins },
  { label: "Transaction Oversight", href: "/admin/transactions", icon: ReceiptText },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
];

export function AdminShell({ children }) {
  const { admin, isAdminAuthenticated, adminLogout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoginPage && !isLoading && !isAdminAuthenticated) {
      router.push("/admin/login");
    }
  }, [isLoginPage, isLoading, isAdminAuthenticated, router]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">{children}</div>;
  }

  if (isLoading || !isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--text)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-8 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-base font-medium">
            <span className="w-2 h-2 rounded-full bg-[var(--text)]" />
            <span>JayPay Staff Ops</span>
          </Link>
          <span className="text-[11px] font-mono px-2 py-0.5 squircle border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] capitalize">
            {admin?.role || "Admin"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Customer App</span>
            </Button>
          </Link>

          <ThemeToggle className="w-10 h-10" />

          <button
            onClick={adminLogout}
            title="Sign out of admin"
            className="flex items-center gap-1.5 px-3 h-10 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Admin Subnav */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-8 overflow-x-auto">
        <nav className="flex items-center gap-2 max-w-6xl mx-auto py-2">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium squircle transition-colors shrink-0 ${
                  isActive
                    ? "bg-[var(--bg)] text-[var(--text)] border border-[var(--border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
