"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Coins,
} from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Dialog } from "@/components/Dialog";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import {
  getAdminUsers,
  restrictUserAccount,
  reactivateUserAccount,
} from "@/lib/admin";
import { formatCurrency, formatDate } from "@/lib/format";

export default function AdminUsersPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Restrict / Reactivate modal state
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "restrict", // "restrict" or "reactivate"
    user: null,
    reason: "",
    isSubmitting: false,
    error: "",
  });

  const loadUsers = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      setError("");
      try {
        const res = await getAdminUsers({
          page: pageToLoad,
          limit: pagination.limit,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
        });

        setUsers(res?.data?.users || []);
        if (res?.data?.pagination) {
          setPagination(res.data.pagination);
        }
      } catch (err) {
        setError(err.message || "Failed to load users");
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit, search, statusFilter]
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(1);
  };

  const handleOpenAction = (user, type) => {
    setActionModal({
      isOpen: true,
      type,
      user,
      reason: "",
      isSubmitting: false,
      error: "",
    });
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal.reason.trim() || actionModal.reason.trim().length < 5) {
      setActionModal((prev) => ({
        ...prev,
        error: "Reason must be at least 5 characters for the audit log",
      }));
      return;
    }

    setActionModal((prev) => ({ ...prev, isSubmitting: true, error: "" }));
    try {
      if (actionModal.type === "restrict") {
        await restrictUserAccount(actionModal.user.accountNumber, actionModal.reason.trim());
        showToast({ message: "Account restricted", type: "info" });
      } else {
        await reactivateUserAccount(actionModal.user.accountNumber, actionModal.reason.trim());
        showToast({ message: "Account reactivated", type: "success" });
      }

      setActionModal((prev) => ({ ...prev, isOpen: false }));
      loadUsers(pagination.page);
    } catch (err) {
      setActionModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err.message || "Action failed",
      }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Customer Accounts</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Search users, monitor ledger balances, and enforce account restrictions.
          </p>
        </div>

        <Link href="/admin/adjustments">
          <Button variant="primary" size="sm" className="gap-2 self-start sm:self-auto">
            <Coins className="w-4 h-4" strokeWidth={1.5} />
            <span>Manual Adjustment</span>
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search by name, phone, or account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 text-xs sm:col-span-2"
          />

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] squircle flex-1"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="restricted">Restricted</option>
              <option value="deactivated">Deactivated</option>
            </select>

            <Button type="submit" variant="secondary" size="sm" className="h-10 px-4">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Users Table / List */}
      <Card>
        <CardHeader
          title="Account Directory"
          subtitle={`Total: ${pagination.total} registered users`}
        />

        {error && (
          <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] mb-4">
            <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            No customer accounts found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-3 px-2 font-medium">Customer</th>
                  <th className="py-3 px-2 font-medium">Account No.</th>
                  <th className="py-3 px-2 font-medium">Phone</th>
                  <th className="py-3 px-2 font-medium text-right">Balance</th>
                  <th className="py-3 px-2 font-medium text-center">Status</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--surface)] transition-colors">
                    <td className="py-3 px-2">
                      <Link
                        href={`/admin/users/${u.accountNumber}`}
                        className="font-medium text-[var(--text)] hover:underline"
                      >
                        {u.firstName} {u.surname}
                      </Link>
                    </td>
                    <td className="py-3 px-2 font-mono tabular-nums">{u.accountNumber}</td>
                    <td className="py-3 px-2 tabular-nums text-[var(--text-muted)]">{u.phoneNumber}</td>
                    <td className="py-3 px-2 text-right tabular-nums font-medium">
                      {formatCurrency(u.balance)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-block px-2 py-0.5 squircle border border-[var(--border)] text-[11px] capitalize font-medium">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/users/${u.accountNumber}`}>
                          <Button variant="secondary" size="sm" className="h-8 px-2.5 text-xs">
                            Inspect
                          </Button>
                        </Link>

                        {u.status === "active" ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleOpenAction(u, "restrict")}
                            className="h-8 px-2.5 text-xs"
                          >
                            Restrict
                          </Button>
                        ) : u.status === "restricted" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenAction(u, "reactivate")}
                            className="h-8 px-2.5 text-xs"
                          >
                            Reactivate
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
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
                onClick={() => loadUsers(pagination.page - 1)}
                className="h-8 px-3"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => loadUsers(pagination.page + 1)}
                className="h-8 px-3"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Action Dialog (Restrict or Reactivate) */}
      <Dialog
        isOpen={actionModal.isOpen}
        onClose={() => {
          if (!actionModal.isSubmitting) {
            setActionModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        title={
          actionModal.type === "restrict"
            ? `Restrict Account: ${actionModal.user?.firstName} ${actionModal.user?.surname}`
            : `Reactivate Account: ${actionModal.user?.firstName} ${actionModal.user?.surname}`
        }
        description="Mandatory audit justification required by policy."
      >
        <form onSubmit={handleActionSubmit} className="flex flex-col gap-4 py-2">
          {actionModal.error && (
            <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
              <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
              <span>{actionModal.error}</span>
            </div>
          )}

          <div className="p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs">
            <span className="text-[var(--text-muted)] block">Target Account</span>
            <span className="font-mono tabular-nums font-medium text-[var(--text)]">
              {actionModal.user?.accountNumber} ({actionModal.user?.phoneNumber})
            </span>
          </div>

          <Input
            label="Audit Reason"
            placeholder="e.g. Unusual login velocity, suspected compromise"
            value={actionModal.reason}
            onChange={(e) =>
              setActionModal((prev) => ({ ...prev, reason: e.target.value }))
            }
            required
            helperText="Minimum 5 characters. Written permanently to audit_logs."
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={actionModal.type === "restrict" ? "danger" : "primary"}
              isLoading={actionModal.isSubmitting}
              className="flex-1"
            >
              Confirm {actionModal.type === "restrict" ? "Restriction" : "Reactivation"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
