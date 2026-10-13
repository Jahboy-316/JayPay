"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Send,
  UserCheck,
  CircleAlert,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { PinInput } from "@/components/PinInput";
import { Dialog } from "@/components/Dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { formatCurrency, generateIdempotencyKey } from "@/lib/format";
import { validateRecipient, sendTransfer } from "@/lib/transactions";
import { getBeneficiaries } from "@/lib/beneficiaries";

export default function TransferPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  // Step 1: Form, Step 2: Review, Step 3: Receipt
  const [step, setStep] = useState(1);

  // Form State
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");

  // Recipient Verification
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [validatedRecipient, setValidatedRecipient] = useState(null);
  const [recipientError, setRecipientError] = useState("");

  // Saved Beneficiaries
  const [beneficiaries, setBeneficiaries] = useState([]);

  // PIN modal & submission
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  // Completed transfer result (Receipt)
  const [transferResult, setTransferResult] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    getBeneficiaries()
      .then((res) => setBeneficiaries(res?.data?.beneficiaries || []))
      .catch(() => {});
  }, []);

  // Validate recipient account when 10 digits entered
  const handleValidateAccount = async (targetAccount = accountNumber) => {
    const acc = targetAccount.trim();
    if (!acc || acc.length !== 10) {
      setRecipientError("Account number must be exactly 10 digits");
      setValidatedRecipient(null);
      return;
    }

    if (acc === user?.accountNumber) {
      setRecipientError("Cannot transfer to your own account");
      setValidatedRecipient(null);
      return;
    }

    setIsValidatingRecipient(true);
    setRecipientError("");
    try {
      const res = await validateRecipient(acc);
      setValidatedRecipient(res.data);
    } catch (err) {
      setValidatedRecipient(null);
      setRecipientError(err.message || "Recipient account not found");
    } finally {
      setIsValidatingRecipient(false);
    }
  };

  const handleSelectBeneficiary = (b) => {
    setAccountNumber(b.accountNumber);
    setValidatedRecipient({
      accountNumber: b.accountNumber,
      recipientName: b.recipientName,
    });
    setRecipientError("");
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (!validatedRecipient) {
      handleValidateAccount();
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      showToast({ message: "Minimum transfer amount is ₦100", type: "error" });
      return;
    }

    if (numAmount > 1000000) {
      showToast({ message: "Maximum transfer amount is ₦1,000,000", type: "error" });
      return;
    }

    const availableNaira = Number(user?.balance?.naira || 0);
    if (numAmount > availableNaira) {
      showToast({ message: "Insufficient balance for this transfer", type: "error" });
      return;
    }

    // Prepare fresh idempotency key for this attempt
    setIdempotencyKey(generateIdempotencyKey());
    setStep(2);
  };

  const handleExecuteTransfer = async (enteredPin) => {
    setPinError("");
    setIsSubmitting(true);
    try {
      const res = await sendTransfer({
        accountNumber: validatedRecipient.accountNumber,
        amount: Number(amount),
        pin: enteredPin,
        narration,
        idempotencyKey,
      });

      setTransferResult(res.data);
      setIsPinModalOpen(false);
      setStep(3); // Receipt step
      refreshUser();
      showToast({ message: "Transfer completed successfully", type: "success" });
    } catch (err) {
      setPinError(err.message || "Transfer failed");
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    if (transferResult?.reference) {
      navigator.clipboard.writeText(transferResult.reference);
      setCopiedRef(true);
      showToast({ message: "Reference copied to clipboard", type: "success" });
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleResetTransfer = () => {
    setStep(1);
    setAccountNumber("");
    setAmount("");
    setNarration("");
    setValidatedRecipient(null);
    setRecipientError("");
    setPin("");
    setPinError("");
    setTransferResult(null);
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Send Money</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Atomic peer-to-peer transfer backed by instant row-level ledger settlement.
        </p>
      </div>

      {/* Step 1: Input Form */}
      {step === 1 && (
        <Card className="flex flex-col gap-6">
          <CardHeader
            title="Transfer Details"
            subtitle="Available balance: "
            action={
              <span className="text-sm font-medium tabular-nums text-[var(--text)]">
                {formatCurrency(user?.balance)}
              </span>
            }
          />

          {/* Quick select saved beneficiaries */}
          {beneficiaries.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Saved Beneficiaries
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {beneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBeneficiary(b)}
                    className={`shrink-0 px-3 py-2 squircle text-xs border transition-colors flex items-center gap-2 ${
                      accountNumber === b.accountNumber
                        ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] font-medium"
                        : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--mist)_12%,var(--ink))]"
                    }`}
                  >
                    <span>{b.nickname || b.recipientName}</span>
                    <span className="text-[10px] opacity-75 tabular-nums">
                      ({b.accountNumber.slice(-4)})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleProceedToReview} className="flex flex-col gap-5">
            {/* Account Number input with inline validation */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-end gap-2">
                <Input
                  label="Recipient Account Number"
                  type="text"
                  placeholder="8123456789"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setAccountNumber(clean);
                    if (clean.length === 10) {
                      handleValidateAccount(clean);
                    } else {
                      setValidatedRecipient(null);
                      setRecipientError("");
                    }
                  }}
                  error={recipientError}
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleValidateAccount()}
                  isLoading={isValidatingRecipient}
                  disabled={accountNumber.length !== 10}
                  className="shrink-0"
                >
                  Verify
                </Button>
              </div>

              {/* Recipient verified name badge */}
              {validatedRecipient && (
                <div className="flex items-center gap-2 p-3 squircle bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] mt-1">
                  <UserCheck className="w-4 h-4 text-[var(--text)] shrink-0" strokeWidth={1.5} />
                  <span>
                    Recipient: <strong>{validatedRecipient.recipientName}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Amount input */}
            <Input
              label="Amount (NGN)"
              type="number"
              min={100}
              max={1000000}
              step="any"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              helperText="Min: ₦100.00 — Max: ₦1,000,000.00"
              required
            />

            {/* Narration input */}
            <Input
              label="Narration (Optional)"
              type="text"
              placeholder="e.g. Lunch split"
              maxLength={100}
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!validatedRecipient || !amount || Number(amount) < 100}
              className="mt-2"
            >
              Continue to Review
            </Button>
          </form>
        </Card>
      )}

      {/* Step 2: Review Screen */}
      {step === 2 && (
        <Card className="flex flex-col gap-6">
          <CardHeader
            title="Review Transfer"
            subtitle="Verify transaction parameters before confirming."
          />

          <div className="divide-y divide-[var(--border)] text-xs">
            <div className="flex items-center justify-between py-3">
              <span className="text-[var(--text-muted)]">Recipient Name</span>
              <span className="font-medium text-[var(--text)]">{validatedRecipient?.recipientName}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[var(--text-muted)]">Account Number</span>
              <span className="font-medium text-[var(--text)] tabular-nums">{validatedRecipient?.accountNumber}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[var(--text-muted)]">Transfer Amount</span>
              <span className="text-base font-medium text-[var(--text)] tabular-nums">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[var(--text-muted)]">Narration</span>
              <span className="text-[var(--text)]">{narration || "None"}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[var(--text-muted)]">Fee</span>
              <span className="font-medium text-[var(--text)]">₦0.00 (Zero fee)</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setPin("");
                setPinError("");
                setIsPinModalOpen(true);
              }}
              className="flex-1"
            >
              Authorize with PIN
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Receipt View */}
      {step === 3 && transferResult && (
        <Card className="flex flex-col gap-6">
          <div className="text-center py-4 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
              <CheckCircle2 className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-medium tracking-tight">Transfer Completed</h2>
            <p className="text-2xl font-medium tabular-nums text-[var(--text)]">
              {formatCurrency(transferResult.amount || amount)}
            </p>
          </div>

          <div className="divide-y divide-[var(--border)] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Reference</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span>{transferResult.reference}</span>
                <button
                  onClick={handleCopyReference}
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
              <span className="text-[var(--text-muted)]">Recipient</span>
              <span className="font-medium text-[var(--text)]">
                {transferResult.recipient?.name || validatedRecipient?.recipientName}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Account</span>
              <span className="font-medium text-[var(--text)] tabular-nums">
                {transferResult.recipient?.accountNumber || validatedRecipient?.accountNumber}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">New Balance</span>
              <span className="font-medium text-[var(--text)] tabular-nums">
                {formatCurrency(transferResult.balance)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-muted)]">Status</span>
              <span className="capitalize font-medium text-[var(--text)]">
                {transferResult.status || "Completed"}
              </span>
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
              onClick={handleResetTransfer}
              className="flex-1 gap-2"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
              <span>Send Another</span>
            </Button>
          </div>
        </Card>
      )}

      {/* PIN Confirmation Dialog */}
      <Dialog
        isOpen={isPinModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsPinModalOpen(false);
        }}
        title="Authorize Transfer"
        description={`Enter your 4-digit PIN to transfer ${formatCurrency(amount)} to ${validatedRecipient?.recipientName}.`}
      >
        <div className="py-4">
          <PinInput
            value={pin}
            onChange={setPin}
            onComplete={handleExecuteTransfer}
            error={pinError}
            disabled={isSubmitting}
            label="4-digit Transaction PIN"
          />

          {isSubmitting && (
            <p className="text-center text-xs text-[var(--text-muted)] mt-4 animate-pulse">
              Posting transaction to double-entry ledger...
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
