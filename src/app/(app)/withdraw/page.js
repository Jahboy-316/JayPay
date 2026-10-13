"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpFromLine, CheckCircle2, CircleAlert, RotateCcw } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { PinInput } from "@/components/PinInput";
import { Dialog } from "@/components/Dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { formatCurrency } from "@/lib/format";
import { withdrawFunds } from "@/lib/accounts";

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const handleOpenPin = (e) => {
    e.preventDefault();
    setError("");

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      setError("Minimum withdrawal amount is ₦100.00");
      return;
    }

    if (numAmount > 1000000) {
      setError("Maximum withdrawal amount is ₦1,000,000.00");
      return;
    }

    const availableNaira = Number(user?.balance?.naira || 0);
    if (numAmount > availableNaira) {
      setError("Insufficient balance for this withdrawal");
      return;
    }

    setPin("");
    setPinError("");
    setIsPinModalOpen(true);
  };

  const handleWithdraw = async (enteredPin) => {
    setPinError("");
    setIsLoading(true);
    try {
      const res = await withdrawFunds({
        amount: Number(amount),
        pin: enteredPin,
      });

      setReceipt(res.data);
      setIsPinModalOpen(false);
      refreshUser();
      showToast({ message: "Withdrawal simulation successful", type: "success" });
    } catch (err) {
      setPinError(err.message || "Withdrawal failed");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium tracking-tight">Withdraw Funds</h1>
          <span className="text-[11px] font-medium border border-[var(--border)] px-2 py-0.5 rounded uppercase tracking-wider text-[var(--text-muted)]">
            [SIMULATED]
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Debit funds from your ledger. For simulation and testing purposes only.
        </p>
      </div>

      <div className="p-3.5 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] leading-relaxed">
        <strong>Notice:</strong> JayPay withdrawals are simulated in this sandbox environment. Requires your 4-digit transaction PIN to debit the ledger.
      </div>

      {!receipt ? (
        <Card className="flex flex-col gap-6">
          <CardHeader
            title="Withdrawal Amount"
            subtitle="Available Balance: "
            action={
              <span className="text-sm font-medium tabular-nums text-[var(--text)]">
                {formatCurrency(user?.balance)}
              </span>
            }
          />

          {error && (
            <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
              <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleOpenPin} className="flex flex-col gap-5">
            <Input
              label="Amount to Debit (NGN)"
              type="number"
              min={100}
              max={1000000}
              step="any"
              placeholder="e.g. 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              helperText="Min: ₦100.00 — Max: ₦1,000,000.00"
              required
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!amount || Number(amount) < 100}
              className="mt-2"
            >
              Continue with PIN
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="flex flex-col gap-6">
          <div className="text-center py-4 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
              <CheckCircle2 className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-medium tracking-tight">Withdrawal Processed</h2>
            <p className="text-2xl font-medium tabular-nums text-[var(--text)]">
              -{formatCurrency(receipt.amount || amount)}
            </p>
          </div>

          <div className="divide-y divide-[var(--border)] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Reference</span>
              <span className="font-mono text-[var(--text)]">{receipt.reference}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Remaining Balance</span>
              <span className="font-medium text-[var(--text)] tabular-nums">
                {formatCurrency(receipt.balance)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Type</span>
              <span className="text-[var(--text)]">[SIMULATED] Debit</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full">
                Dashboard
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => {
                setReceipt(null);
                setAmount("");
              }}
              className="flex-1 gap-2"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
              <span>Withdraw Again</span>
            </Button>
          </div>
        </Card>
      )}

      {/* PIN Confirmation Dialog */}
      <Dialog
        isOpen={isPinModalOpen}
        onClose={() => {
          if (!isLoading) setIsPinModalOpen(false);
        }}
        title="Authorize Withdrawal"
        description={`Enter your 4-digit PIN to debit ${formatCurrency(amount)} from your account.`}
      >
        <div className="py-4">
          <PinInput
            value={pin}
            onChange={setPin}
            onComplete={handleWithdraw}
            error={pinError}
            disabled={isLoading}
            label="4-digit Transaction PIN"
          />
        </div>
      </Dialog>
    </div>
  );
}
