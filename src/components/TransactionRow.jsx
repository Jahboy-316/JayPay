"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function TransactionRow({ transaction, href }) {
  if (!transaction) return null;

  const isCredit =
    transaction.type === "credit" || transaction.type === "admin_credit";
  const sign = isCredit ? "+" : "-";

  const content = (
    <div className="flex items-center justify-between gap-4 py-3 px-2 rounded-xl hover:bg-[var(--surface)] transition-colors cursor-pointer select-none">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 squircle bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--text)]">
          {isCredit ? (
            <ArrowDownLeft className="w-5 h-5 text-[var(--text)]" strokeWidth={1.5} />
          ) : (
            <ArrowUpRight className="w-5 h-5 text-[var(--text)]" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-base font-medium text-[var(--text)] truncate">
            {transaction.description || transaction.category || "Transaction"}
          </p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
            <span>{formatDateTime(transaction.date || transaction.createdAt)}</span>
            {transaction.isSimulated && (
              <span className="border border-[var(--border)] px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider">
                Simulated
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-base font-medium text-[var(--text)] tabular-nums">
          {sign}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-[var(--text-muted)] capitalize mt-0.5">
          {transaction.status || "completed"}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
