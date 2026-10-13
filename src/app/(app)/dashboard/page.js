"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  ArrowUpFromLine,
  FileSpreadsheet,
  ArrowRight,
  Bell,
  RefreshCw,
  CircleAlert,
} from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { TransactionRow } from "@/components/TransactionRow";
import { BalanceCardSkeleton, TransactionListSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getTransactions } from "@/lib/transactions";
import { getNotifications } from "@/lib/notifications";
import { useToast } from "@/components/Toast";

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    setError("");
    try {
      await refreshUser();
      const [txRes, notifRes] = await Promise.all([
        getTransactions({ limit: 5 }),
        getNotifications({ limit: 3 }),
      ]);
      setRecentTransactions(txRes?.data?.transactions || []);
      setRecentNotifications(notifRes?.data?.notifications || []);
    } catch (err) {
      setError(err.message || "Failed to load latest activity");
    } finally {
      setIsLoadingData(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCopyAccountNumber = () => {
    if (user?.accountNumber) {
      navigator.clipboard.writeText(user.accountNumber);
      setCopied(true);
      showToast({ message: "Account number copied", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickActions = [
    { label: "Send", href: "/transfer", icon: Send },
    { label: "Withdraw", href: "/withdraw", icon: ArrowUpFromLine },
    { label: "Statements", href: "/statements", icon: FileSpreadsheet },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium tracking-tight">
            Welcome back, {user?.firstName}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Overview of your accounts and live transaction activity.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={isLoadingData}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin" : ""}`} strokeWidth={1.5} />
          <span>Sync</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
          <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      {/* Balance Card */}
      {isLoadingData && !user ? (
        <BalanceCardSkeleton />
      ) : (
        <Card className="flex flex-col gap-6 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="font-medium tracking-[0.02em] uppercase">Available Balance</span>
              <button
                type="button"
                onClick={() => setHideBalance(!hideBalance)}
                aria-label={hideBalance ? "Show balance" : "Hide balance"}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                {hideBalance ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
              </button>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 squircle border border-[var(--border)] text-[11px] font-medium capitalize">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text)]" />
              {user?.status || "active"}
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-[-0.01em] tabular-nums">
              {hideBalance ? "••••••••" : formatCurrency(user?.balance)}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Account Holder: {user?.firstName} {user?.surname}
            </p>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Account Number:</span>
              <span className="font-medium tabular-nums">{user?.accountNumber}</span>
              <button
                onClick={handleCopyAccountNumber}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                title="Copy account number"
                aria-label="Copy account number"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[var(--text)]" strokeWidth={1.5} />
                ) : (
                  <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
              </button>
            </div>

            <div className="text-[11px] text-[var(--steel)]">
              Currency: NGN (Nigerian Naira)
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions (4 squircle icon buttons) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <div className="squircle bg-[var(--surface)] border border-[var(--border)] p-4 flex flex-col items-center justify-center gap-2.5 hover:bg-[color-mix(in_srgb,var(--mist)_12%,var(--ink))] transition-all active:scale-[0.98] text-center">
                <div className="w-10 h-10 squircle bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
                  <Icon className="w-5 h-5 text-[var(--text)]" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-[var(--text)]">{action.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Grid: Recent Transactions (5) & Recent Notifications (3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader
              title="Recent Transactions"
              subtitle="Latest movements posted to your ledger."
              action={
                <Link href="/transactions" className="text-xs text-[var(--text)] hover:underline inline-flex items-center gap-1 font-medium">
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              }
            />

            {isLoadingData ? (
              <TransactionListSkeleton count={4} />
            ) : recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                No recent transactions. Your transaction ledger is empty.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[var(--border)]">
                {recentTransactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    href={`/transactions/${tx.id}`}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Notifications */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader
              title="Activity Alerts"
              subtitle="Recent system notices."
              action={
                <Link href="/notifications" className="text-xs text-[var(--text)] hover:underline font-medium">
                  All
                </Link>
              }
            />

            {isLoadingData ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="h-12 bg-[var(--surface)] squircle animate-pulse" />
                <div className="h-12 bg-[var(--surface)] squircle animate-pulse" />
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                No new notifications.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 squircle bg-[var(--bg)] border border-[var(--border)] flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--text)]">{n.title}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
