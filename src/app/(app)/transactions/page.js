"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, ChevronLeft, ChevronRight, FileSpreadsheet, CircleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { TransactionRow } from "@/components/TransactionRow";
import { TransactionListSkeleton } from "@/components/Skeleton";
import { getTransactions } from "@/lib/transactions";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [searchRef, setSearchRef] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      setError("");
      try {
        const res = await getTransactions({
          page: pageToLoad,
          limit: pagination.limit,
          reference: searchRef || undefined,
          type: filterType || undefined,
          category: filterCategory || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
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
    [pagination.limit, searchRef, filterType, filterCategory, startDate, endDate]
  );

  useEffect(() => {
    loadTransactions(1);
  }, [loadTransactions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTransactions(1);
  };

  const handleResetFilters = () => {
    setSearchRef("");
    setFilterType("");
    setFilterCategory("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Transactions</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Immutable ledger records with chronological audit points.
          </p>
        </div>

        <Link href="/statements">
          <Button variant="secondary" size="sm" className="gap-2 self-start sm:self-auto">
            <FileSpreadsheet className="w-4 h-4" strokeWidth={1.5} />
            <span>Export CSV</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="flex flex-col gap-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            placeholder="Search by reference..."
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            className="h-10 text-xs"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 text-xs bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] squircle"
          >
            <option value="">All Types</option>
            <option value="credit">Credit (+)</option>
            <option value="debit">Debit (-)</option>
            <option value="admin_credit">Admin Credit</option>
            <option value="admin_debit">Admin Debit</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 px-3 text-xs bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] squircle"
          >
            <option value="">All Categories</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="admin_adjustment">Admin Adjustment</option>
          </select>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" className="flex-1 h-10">
              Apply
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
              className="h-10"
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader
          title="Ledger Entries"
          subtitle={`Showing ${transactions.length} of ${pagination.total} entries`}
        />

        {error && (
          <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] mb-4">
            <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <TransactionListSkeleton count={6} />
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            No transactions match the selected filters.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                href={`/transactions/${tx.id}`}
              />
            ))}
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
                disabled={!pagination.hasPrevPage || isLoading}
                onClick={() => loadTransactions(pagination.page - 1)}
                className="h-9 px-3 gap-1"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                <span>Prev</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!pagination.hasNextPage || isLoading}
                onClick={() => loadTransactions(pagination.page + 1)}
                className="h-9 px-3 gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
