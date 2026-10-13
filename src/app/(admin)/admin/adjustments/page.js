"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Coins, CheckCircle2, CircleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { adminDepositFunds, adminWithdrawFunds, getAdminUserByAccount } from "@/lib/admin";
import { formatCurrency } from "@/lib/format";

function AdjustmentsForm({ initialAccount }) {
  const { showToast } = useToast();

  const [accountNumber, setAccountNumber] = useState(initialAccount);
  const [recipient, setRecipient] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("deposit"); // "deposit" or "withdraw"
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const handleFindRecipient = async () => {
    const normalizedAccountNumber = accountNumber.trim();
    setError("");
    setRecipient(null);

    if (!/^\d{10}$/.test(normalizedAccountNumber)) {
      setError("Please enter a valid 10-digit account number");
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await getAdminUserByAccount(normalizedAccountNumber);
      setRecipient(res.data);
    } catch (err) {
      setError(err.message || "Account lookup failed");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(accountNumber.trim())) {
      setError("Please enter a valid 10-digit account number");
      return;
    }

    if (recipient?.accountNumber !== accountNumber.trim()) {
      setError("Find and confirm the account holder before posting an adjustment");
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      setError("Amount must be at least ₦100.00");
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      setError("Reason must be at least 5 characters for compliance audit");
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (adjustmentType === "deposit") {
        res = await adminDepositFunds({
          accountNumber: accountNumber.trim(),
          amount: numAmount,
          reason: reason.trim(),
        });
        showToast({ message: "Admin credit executed", type: "success" });
      } else {
        res = await adminWithdrawFunds({
          accountNumber: accountNumber.trim(),
          amount: numAmount,
          reason: reason.trim(),
        });
        showToast({ message: "Admin debit executed", type: "success" });
      }

      setReceipt(res.data);
    } catch (err) {
      setError(err.message || "Adjustment failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium tracking-tight">Manual Ledger Adjustment</h1>
          <span className="text-[11px] font-medium border border-[var(--border)] px-2 py-0.5 rounded uppercase tracking-wider text-[var(--text-muted)]">
            [SIMULATED]
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Execute reason-coded adjustments strictly through the immutable ledger.
        </p>
      </div>

      <div className="p-3.5 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] leading-relaxed">
        <strong>Compliance Notice:</strong> Direct balance changes are forbidden. All adjustments generate ledger transaction entries and permanent audit log records under your staff ID.
      </div>

      {!receipt ? (
        <Card className="flex flex-col gap-6">
          <CardHeader
            title="Adjustment Parameters"
            subtitle="Select credit or debit direction."
          />

          {error && (
            <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
              <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Direction Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--surface)] border border-[var(--border)] squircle">
              <button
                type="button"
                onClick={() => setAdjustmentType("deposit")}
                className={`h-9 squircle text-xs font-medium transition-colors ${
                  adjustmentType === "deposit"
                    ? "bg-[var(--text)] text-[var(--bg)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                Manual Credit (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("withdraw")}
                className={`h-9 squircle text-xs font-medium transition-colors ${
                  adjustmentType === "withdraw"
                    ? "bg-[var(--text)] text-[var(--bg)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                Manual Debit (-)
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Input
                label="Target Account Number"
                placeholder="10-digit number"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value.replace(/\D/g, ""));
                  setRecipient(null);
                  setError("");
                }}
                required
              />
              <Button
                type="button"
                variant="secondary"
                isLoading={isLookingUp}
                disabled={accountNumber.length !== 10 || isLoading}
                onClick={handleFindRecipient}
              >
                Find Account
              </Button>
              {recipient?.accountNumber === accountNumber.trim() && (
                <div className="p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs">
                  <p className="text-[var(--text-muted)]">Account holder</p>
                  <p className="font-medium text-[var(--text)] mt-1">
                    {recipient.firstName} {recipient.surname}
                  </p>
                  <p className="font-mono text-[var(--text-muted)] mt-1">
                    {recipient.accountNumber}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Adjustment Amount (NGN)"
              type="number"
              min={100}
              max={10000000}
              step="any"
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              helperText="Min: ₦100.00 — Max: ₦10,000,000.00"
              required
            />

            <Input
              label="Mandatory Audit Reason"
              placeholder="e.g. Test wallet seeding, reconciliation correction"
              maxLength={250}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              helperText="Minimum 5 characters. Written to ledger and audit_logs."
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={
                !accountNumber ||
                recipient?.accountNumber !== accountNumber.trim() ||
                !amount ||
                reason.length < 5
              }
              className="mt-2"
            >
              Post Adjustment to Ledger
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="flex flex-col gap-6">
          <div className="text-center py-4 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
              <CheckCircle2 className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-medium tracking-tight">Adjustment Committed</h2>
            <p className="text-2xl font-medium tabular-nums text-[var(--text)]">
              {adjustmentType === "deposit" ? "+" : "-"}
              {formatCurrency(receipt.amount || amount)}
            </p>
          </div>

          <div className="divide-y divide-[var(--border)] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Account Holder</span>
              <span className="font-medium text-[var(--text)]">
                {recipient?.firstName} {recipient?.surname}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Target Account</span>
              <span className="font-mono font-medium text-[var(--text)] tabular-nums">
                {receipt.accountNumber}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">New Balance</span>
              <span className="font-medium text-[var(--text)] tabular-nums">
                {formatCurrency(receipt.balance)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Reference</span>
              <span className="font-mono text-[var(--text)]">{receipt.reference}</span>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              setReceipt(null);
              setAmount("");
              setReason("");
            }}
          >
            Post Another Adjustment
          </Button>
        </Card>
      )}
    </div>
  );
}

function AdjustmentsContent() {
  const searchParams = useSearchParams();
  const initialAccount = searchParams.get("account") || "";

  return <AdjustmentsForm key={initialAccount} initialAccount={initialAccount} />;
}

export default function AdminAdjustmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading adjustments...</div>}>
      <AdjustmentsContent />
    </Suspense>
  );
}
