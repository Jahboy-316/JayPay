"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  ArrowUpFromLine,
  ReceiptText,
  Users,
  FileSpreadsheet,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getUnreadCount } from "@/lib/notifications";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transfer", href: "/transfer", icon: Send },
  { label: "Withdraw", href: "/withdraw", icon: ArrowUpFromLine },
  { label: "Transactions", href: "/transactions", icon: ReceiptText },
  { label: "Beneficiaries", href: "/beneficiaries", icon: Users },
  { label: "Statements", href: "/statements", icon: FileSpreadsheet },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

const MOBILE_NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transfer", href: "/transfer", icon: Send },
  { label: "Activity", href: "/transactions", icon: ReceiptText },
  { label: "Saved", href: "/beneficiaries", icon: Users },
  { label: "More", href: "/settings", icon: Settings },
];

export function AppShell({ children }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      getUnreadCount()
        .then((res) => {
          if (res?.data?.unreadCount !== undefined) {
            setUnreadCount(res.data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--text)] border-t-transparent animate-spin" />
          <span className="text-xs text-[var(--text-muted)] tracking-wider uppercase font-medium">
            Loading JayPay...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentPageTitle =
    NAV_ITEMS.find((item) => item.href === pathname)?.label || "Banking";

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)] pb-20 md:pb-0">
      {/* 240px Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-[var(--border)] bg-[var(--bg)] fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[var(--border)]">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-lg font-medium tracking-tight">
            <span>JayPay</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--steel)]" />
          </Link>
          <div className="text-[10px] text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono">
            v2.0
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 h-11 squircle text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[var(--text)] text-[var(--bg)] text-[10px] flex items-center justify-center font-medium tabular-nums">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout footer */}
        <div className="p-3 border-t border-[var(--border)] flex flex-col gap-2">
          <div className="flex items-center justify-between px-3 py-2 squircle bg-[var(--surface)] border border-[var(--border)]">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-[var(--text)] truncate">
                {user?.firstName} {user?.surname}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] tabular-nums truncate">
                {user?.accountNumber}
              </p>
            </div>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded-lg"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-[240px] min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
            <h1 className="text-base sm:text-lg font-medium tracking-tight text-[var(--text)]">
              {currentPageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative w-10 h-10 squircle bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center hover:bg-[color-mix(in_srgb,var(--mist)_12%,var(--ink))] transition-all shrink-0"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-[var(--text)]" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--text)] text-[var(--bg)] text-[9px] flex items-center justify-center font-medium tabular-nums">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <ThemeToggle className="w-10 h-10" />

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[var(--border)] text-xs text-[var(--text-muted)]">
              <span className="tabular-nums font-medium text-[var(--text)]">
                Acct: {user?.accountNumber}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile slide-over menu for secondary links */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 text-xs font-medium text-[var(--text)] rounded-lg hover:bg-[var(--bg)]"
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center gap-3 py-2 px-3 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] mt-2 border-t border-[var(--border)] text-left"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              <span>Log out</span>
            </button>
          </div>
        )}

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (5 items per design.md) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[var(--bg)]/95 backdrop-blur-md border-t border-[var(--border)] z-40 flex items-center justify-around px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-full text-[10px] font-medium transition-colors ${
                isActive ? "text-[var(--text)]" : "text-[var(--text-muted)]"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
