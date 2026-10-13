"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Users, Send, CircleAlert, UserCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Dialog } from "@/components/Dialog";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import {
  getBeneficiaries,
  addBeneficiary,
  removeBeneficiary,
} from "@/lib/beneficiaries";
import { validateRecipient } from "@/lib/transactions";
import { formatDate } from "@/lib/format";

export default function BeneficiariesPage() {
  const { showToast } = useToast();

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [validatedRecipient, setValidatedRecipient] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);

  const loadBeneficiaries = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getBeneficiaries();
      setBeneficiaries(res?.data?.beneficiaries || []);
    } catch (err) {
      setError(err.message || "Failed to load beneficiaries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const handleValidateAccount = async () => {
    if (accountNumber.trim().length !== 10) {
      setModalError("Account number must be 10 digits");
      return;
    }

    setIsValidating(true);
    setModalError("");
    try {
      const res = await validateRecipient(accountNumber.trim());
      setValidatedRecipient(res.data);
    } catch (err) {
      setValidatedRecipient(null);
      setModalError(err.message || "Account not found");
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validatedRecipient) {
      await handleValidateAccount();
      return;
    }

    setIsSubmitting(true);
    setModalError("");
    try {
      await addBeneficiary({
        accountNumber: validatedRecipient.accountNumber,
        nickname: nickname.trim() || undefined,
      });

      showToast({ message: "Beneficiary saved", type: "success" });
      setIsAddOpen(false);
      setAccountNumber("");
      setNickname("");
      setValidatedRecipient(null);
      loadBeneficiaries();
    } catch (err) {
      setModalError(err.message || "Failed to add beneficiary");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    setDeletingId(id);
    try {
      await removeBeneficiary(id);
      showToast({ message: "Beneficiary removed", type: "success" });
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      showToast({ message: err.message || "Failed to remove", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Beneficiaries</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Manage your saved recipient accounts for fast transfers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setModalError("");
            setAccountNumber("");
            setNickname("");
            setValidatedRecipient(null);
            setIsAddOpen(true);
          }}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          <span>Add Beneficiary</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
          <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader
          title="Saved Accounts"
          subtitle={`Total: ${beneficiaries.length} recipients`}
        />

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-3">
            <Users className="w-8 h-8 text-[var(--text-muted)]" strokeWidth={1.5} />
            <p>You have no saved beneficiaries yet.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {beneficiaries.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-3.5 px-2 hover:bg-[var(--surface)] transition-colors rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 squircle bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] shrink-0 font-medium text-xs">
                    {(b.nickname || b.recipientName || "B").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-medium text-[var(--text)] truncate">
                      {b.nickname || b.recipientName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="tabular-nums font-mono">{b.accountNumber}</span>
                      {b.nickname && (
                        <span>• {b.recipientName}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/transfer?account=${b.accountNumber}`}>
                    <Button variant="secondary" size="sm" className="h-9 px-3 gap-1.5 text-xs">
                      <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="hidden sm:inline">Send</span>
                    </Button>
                  </Link>

                  <button
                    onClick={() => handleRemove(b.id)}
                    disabled={deletingId === b.id}
                    title="Remove beneficiary"
                    aria-label="Remove beneficiary"
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--danger-muted)] transition-colors rounded-lg disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Beneficiary Dialog */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Beneficiary"
        description="Verify account and save for quick transfers."
      >
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 py-2">
          {modalError && (
            <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
              <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
              <span>{modalError}</span>
            </div>
          )}

          <div className="flex items-end gap-2">
            <Input
              label="Account Number"
              placeholder="10-digit number"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, "");
                setAccountNumber(clean);
                if (clean.length === 10) {
                  setValidatedRecipient(null);
                }
              }}
              required
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleValidateAccount}
              isLoading={isValidating}
              disabled={accountNumber.length !== 10}
              className="shrink-0"
            >
              Verify
            </Button>
          </div>

          {validatedRecipient && (
            <div className="p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[var(--text)] shrink-0" strokeWidth={1.5} />
              <span>
                Found: <strong>{validatedRecipient.recipientName}</strong>
              </span>
            </div>
          )}

          <Input
            label="Nickname (Optional)"
            placeholder="e.g. Landlord, Sis"
            maxLength={50}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!validatedRecipient}
            className="mt-2"
          >
            Save Beneficiary
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
