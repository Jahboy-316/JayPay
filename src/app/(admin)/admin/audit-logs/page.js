"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, ChevronLeft, ChevronRight, CircleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { getAdminAuditLogs } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      setError("");
      try {
        const res = await getAdminAuditLogs({
          page: pageToLoad,
          limit: pagination.limit,
        });

        setLogs(res?.data?.logs || []);
        if (res?.data?.pagination) {
          setPagination(res.data.pagination);
        }
      } catch (err) {
        setError(err.message || "Failed to load audit logs");
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Security & Audit Logs</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Immutable, append-only history of staff actions, security events, and ledger adjustments.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Staff Action Audit Trail"
          subtitle={`Total audit events: ${pagination.total}`}
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
              <div key={i} className="flex justify-between py-3 border-b border-[var(--border)]">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-3 px-2 font-medium">Action</th>
                  <th className="py-3 px-2 font-medium">Target</th>
                  <th className="py-3 px-2 font-medium">Reason / Details</th>
                  <th className="py-3 px-2 font-medium">IP Address</th>
                  <th className="py-3 px-2 font-medium text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface)] transition-colors">
                    <td className="py-3 px-2">
                      <span className="font-mono font-medium text-[var(--text)]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-[var(--text-muted)] capitalize">
                      {log.targetType || "N/A"}
                    </td>
                    <td className="py-3 px-2 max-w-xs">
                      {log.reason ? (
                        <p className="font-medium text-[var(--text)] truncate">{log.reason}</p>
                      ) : null}
                      {log.details && (
                        <span className="text-[11px] text-[var(--text-muted)] font-mono block truncate">
                          {JSON.stringify(log.details)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px] text-[var(--text-muted)]">
                      {log.ipAddress || "::1"}
                    </td>
                    <td className="py-3 px-2 text-right text-[var(--text-muted)] tabular-nums">
                      {formatDateTime(log.createdAt)}
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
                onClick={() => loadLogs(pagination.page - 1)}
                className="h-8 px-3"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => loadLogs(pagination.page + 1)}
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
