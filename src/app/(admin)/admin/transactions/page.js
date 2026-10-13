"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, CircleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { getAdminTransactions } from "@/lib/admin";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      setError("");
      try {
        const res = await getAdminTransactions({
          page: pageToLoad,
          limit: pagination.limit,
          type: filterType || undefined,
          category: filterCategory || undefined,
        });

        setTransactions(res?.data?.transactions || []);
        if (res?.data?.pagination) {
          setPagination(res.data.pagination);
        }
      } catch (err) {
        setError(err.message || "Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit, filterType, filterCategory]
  );

  useEffect(() => {
    loadTransactions(1);
  }, [loadTransactions]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">System Transaction Oversight</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Real-time double-entry ledger oversight across all platform accounts.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-9 px-3 text-xs bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] squircle"
            >
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
              <option value="admin_credit">Admin Credit</option>
              <option value="admin_debit">Admin Debit</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 px-3 text-xs bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] squircle"
            >
              <option value="">All Categories</option>
              <option value="transfer_in">Transfer In</option>
              <option value="transfer_out">Transfer Out</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="admin_adjustment">Admin Adjustment</option>
            </select>
          </div>

          <span className="text-xs text-[var(--text-muted)]">
            Total ledger events: {pagination.total}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] mb-4">
            <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between py-3 border-b border-[var(--border)]">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            No transaction records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-3 px-2 font-medium">Reference</th>
                  <th className="py-3 px-2 font-medium">User</th>
                  <th className="py-3 px-2 font-medium">Category</th>
                  <th className="py-3 px-2 font-medium text-right">Amount</th>
                  <th className="py-3 px-2 font-medium text-center">Status</th>
                  <th className="py-3 px-2 font-medium text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {transactions.map((tx) => {
                  const isCredit = tx.type?.includes("credit");
                  return (
                    <tr key={tx.id} className="hover:bg-[var(--surface)] transition-colors">
                      <td className="py-3 px-2 font-mono text-[11px]">{tx.reference}</td>
                      <td className="py-3 px-2">
                        {tx.user ? (
                          <div>
                            <span className="font-medium text-[var(--text)]">{tx.user.name}</span>
                            <span className="block text-[11px] text-[var(--text-muted)] font-mono">
                              {tx.user.accountNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">System</span>
                        )}
                      </td>
                      <td className="py-3 px-2 capitalize">{tx.category?.replace(/_/g, " ")}</td>
                      <td className="py-3 px-2 text-right font-medium tabular-nums">
                        {isCredit ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-block px-2 py-0.5 squircle border border-[var(--border)] text-[10px] capitalize">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-[var(--text-muted)]">
                        {formatDateTime(tx.date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => loadTransactions(pagination.page - 1)}
                className="h-8 px-3"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => loadTransactions(pagination.page + 1)}
                className="h-8 px-3"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
