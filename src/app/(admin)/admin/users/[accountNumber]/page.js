"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, User, Coins, CircleAlert, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { Dialog } from "@/components/Dialog";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import {
  getAdminUserByAccount,
  restrictUserAccount,
  reactivateUserAccount,
} from "@/lib/admin";
import { formatCurrency, formatDate } from "@/lib/format";

export default function AdminUserDetailPage({ params }) {
  const resolvedParams = use(params);
  const accountNumber = resolvedParams.accountNumber;
  const { showToast } = useToast();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Action modal
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState("restrict");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadUser = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getAdminUserByAccount(accountNumber);
      setUser(res.data);
    } catch (err) {
      setError(err.message || "Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountNumber) loadUser();
  }, [accountNumber]);

  const handleAction = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setActionError("Audit reason must be at least 5 characters");
      return;
    }

    setIsSubmitting(true);
    setActionError("");
    try {
      if (actionType === "restrict") {
        await restrictUserAccount(accountNumber, reason.trim());
        showToast({ message: "Account restricted", type: "info" });
      } else {
        await reactivateUserAccount(accountNumber, reason.trim());
        showToast({ message: "Account reactivated", type: "success" });
      }
      setActionOpen(false);
      setReason("");
      loadUser();
    } catch (err) {
      setActionError(err.message || "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon" aria-label="Back to users">
            <ArrowLeft className="w-5 h-5 text-[var(--text)]" strokeWidth={1.5} />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-medium tracking-tight">User Inspector</h1>
          <p className="text-xs text-[var(--text-muted)]">Administrative account profile view</p>
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-3">
          <CircleAlert className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} />
          <span>{error}</span>
        </Card>
      ) : isLoading ? (
        <Card className="p-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </Card>
      ) : user ? (
        <Card className="flex flex-col gap-6">
          <CardHeader
            title={`${user.firstName} ${user.surname}`}
            subtitle={`Account Number: ${user.accountNumber}`}
            action={
              <span className="px-2.5 py-0.5 squircle border border-[var(--border)] text-xs capitalize font-medium">
                {user.status}
              </span>
            }
          />

          <div className="divide-y divide-[var(--border)] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Current Balance</span>
              <span className="text-base font-medium text-[var(--text)] tabular-nums">
                {formatCurrency(user.balance)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Phone Number</span>
              <span className="font-medium text-[var(--text)] tabular-nums">{user.phoneNumber}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Age</span>
              <span className="font-medium text-[var(--text)]">{user.age} years old</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Registration Date</span>
              <span className="text-[var(--text)]">{formatDate(user.memberSince)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
            <Link href={`/admin/adjustments?account=${user.accountNumber}`} className="flex-1">
              <Button variant="primary" size="sm" className="w-full gap-2">
                <Coins className="w-4 h-4" strokeWidth={1.5} />
                <span>Adjust Balance</span>
              </Button>
            </Link>

            {user.status === "active" ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setActionType("restrict");
                  setReason("");
                  setActionError("");
                  setActionOpen(true);
                }}
              >
                Restrict User
              </Button>
            ) : user.status === "restricted" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActionType("reactivate");
                  setReason("");
                  setActionError("");
                  setActionOpen(true);
                }}
              >
                Reactivate User
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Dialog
        isOpen={actionOpen}
        onClose={() => setActionOpen(false)}
        title={actionType === "restrict" ? "Restrict Account" : "Reactivate Account"}
        description="Reason is required and recorded in audit_logs."
      >
        <form onSubmit={handleAction} className="flex flex-col gap-4 py-2">
          {actionError && (
            <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
              <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
              <span>{actionError}</span>
            </div>
          )}

          <Input
            label="Audit Justification"
            placeholder="Reason for restriction or reactivation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            helperText="Minimum 5 characters"
            required
          />

          <Button
            type="submit"
            variant={actionType === "restrict" ? "danger" : "primary"}
            isLoading={isSubmitting}
          >
            Confirm
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
