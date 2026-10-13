"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Receipt,
  CircleAlert,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { getTransactionById } from "@/lib/transactions";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useToast } from "@/components/Toast";

export default function TransactionDetailPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { showToast } = useToast();

  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getTransactionById(id)
      .then((res) => {
        setTransaction(res.data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load transaction receipt");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    showToast({ message: "Copied to clipboard", type: "success" });
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const isCredit =
    transaction?.type === "credit" || transaction?.type === "admin_credit";
  const sign = isCredit ? "+" : "-";

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/transactions">
          <Button variant="ghost" size="icon" aria-label="Back to transactions">
            <ArrowLeft className="w-5 h-5 text-[var(--text)]" strokeWidth={1.5} />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-medium tracking-tight">Transaction Receipt</h1>
          <p className="text-xs text-[var(--text-muted)]">Verified immutable ledger entry</p>
        </div>
      </div>

      {error ? (
        <Card className="flex flex-col items-center gap-4 py-8 text-center">
          <CircleAlert className="w-8 h-8 text-[var(--text)]" strokeWidth={1.5} />
          <p className="text-xs text-[var(--text-muted)]">{error}</p>
          <Link href="/transactions">
            <Button variant="secondary" size="sm">
              Return to Transactions
            </Button>
          </Link>
        </Card>
      ) : isLoading ? (
        <Card className="flex flex-col gap-6 p-6">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-12 w-60 mx-auto" />
          <div className="flex flex-col gap-3 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      ) : transaction ? (
        <Card className="flex flex-col gap-6">
          <div className="text-center py-4 flex flex-col items-center gap-2 border-b border-[var(--border)]">
            <div className="w-12 h-12 squircle bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
              {isCredit ? (
                <ArrowDownLeft className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} />
              ) : (
                <ArrowUpRight className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} />
              )}
            </div>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mt-1">
              {transaction.category?.replace(/_/g, " ")}
            </span>
            <div className="text-3xl font-medium tracking-tight tabular-nums text-[var(--text)]">
              {sign}
              {formatCurrency(transaction.amount)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2.5 py-0.5 squircle border border-[var(--border)] text-[var(--text)] capitalize font-medium">
                {transaction.status || "Completed"}
              </span>
              {transaction.isSimulated && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 squircle border border-[var(--border)] text-[var(--steel)]">
                  [Simulated]
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-[var(--border)] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Reference</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span>{transaction.reference}</span>
                <button
                  onClick={() => handleCopy(transaction.reference)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                  title="Copy reference"
                  aria-label="Copy reference"
                >
                  {copiedRef ? (
                    <Check className="w-3.5 h-3.5 text-[var(--text)]" strokeWidth={1.5} />
                  ) : (
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Date & Time</span>
              <span className="font-medium text-[var(--text)]">
                {formatDateTime(transaction.date)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Description</span>
              <span className="font-medium text-[var(--text)] text-right max-w-[240px] truncate">
                {transaction.description || "N/A"}
              </span>
            </div>

            {transaction.reason && (
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)]">Adjustment Reason</span>
                <span className="font-medium text-[var(--text)]">{transaction.reason}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Balance After</span>
              <span className="font-medium text-[var(--text)] tabular-nums">
                {formatCurrency(transaction.balanceAfter)}
              </span>
            </div>

            {transaction.relatedTransactionId && (
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)]">Counterpart Entry</span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {transaction.relatedTransactionId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/transactions" className="flex-1">
              <Button variant="secondary" className="w-full">
                Back to List
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => handleCopy(transaction.reference)}
              className="flex-1 gap-2"
            >
              <Copy className="w-4 h-4" strokeWidth={1.5} />
              <span>Copy Ref</span>
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
