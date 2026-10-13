"use client";

import { useState } from "react";
import {
  User,
  Shield,
  KeyRound,
  LogOut,
  CircleAlert,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { PinInput } from "@/components/PinInput";
import { Dialog } from "@/components/Dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { updateProfile, deactivateAccount } from "@/lib/accounts";
import { changeUserPin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();

  // Profile Form
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [surname, setSurname] = useState(user?.surname || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Change PIN modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinStep, setPinStep] = useState(1); // 1: current, 2: new, 3: confirm
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Deactivate modal state
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivatePin, setDeactivatePin] = useState("");
  const [deactivateError, setDeactivateError] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    if (!firstName.trim() || !surname.trim()) {
      showToast({ message: "First name and surname cannot be empty", type: "error" });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile({ firstName, surname });
      await refreshUser();
      showToast({ message: "Profile updated successfully", type: "success" });
    } catch (err) {
      showToast({ message: err.message || "Failed to update profile", type: "error" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleOpenPinChange = () => {
    setPinStep(1);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    setIsPinModalOpen(true);
  };

  const handleConfirmPinChange = async (enteredConfirmPin) => {
    setConfirmPin(enteredConfirmPin);
    setPinError("");

    if (enteredConfirmPin !== newPin) {
      setPinError("New PINs do not match");
      return;
    }

    setIsChangingPin(true);
    try {
      await changeUserPin({
        currentPin,
        newPin,
        confirmPin: enteredConfirmPin,
      });

      showToast({ message: "PIN changed successfully", type: "success" });
      setIsPinModalOpen(false);
    } catch (err) {
      setPinError(err.message || "Failed to change PIN");
      setConfirmPin("");
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleDeactivate = async (enteredPin) => {
    setDeactivateError("");
    setIsDeactivating(true);
    try {
      await deactivateAccount({ pin: enteredPin });
      showToast({ message: "Account deactivated", type: "info" });
      setIsDeactivateOpen(false);
      logout();
    } catch (err) {
      setDeactivateError(err.message || "Failed to deactivate account");
      setDeactivatePin("");
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Account & Security</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Manage your profile identity, security credentials, and account status.
        </p>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader
          title="Account Overview"
          subtitle="Non-editable identity parameters"
        />

        <div className="divide-y divide-[var(--border)] text-xs">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-muted)]">Account Number</span>
            <span className="font-mono font-medium text-[var(--text)] tabular-nums">
              {user?.accountNumber}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-muted)]">Phone Number</span>
            <span className="font-medium text-[var(--text)] tabular-nums">
              {user?.phoneNumber}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-muted)]">Account Status</span>
            <span className="capitalize font-medium text-[var(--text)]">
              {user?.status || "Active"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-muted)]">Member Since</span>
            <span className="text-[var(--text)]">{formatDate(user?.memberSince)}</span>
          </div>
        </div>
      </Card>

      {/* Edit Profile Card */}
      <Card>
        <CardHeader
          title="Profile Information"
          subtitle="Update your display first name and surname."
        />

        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isUpdatingProfile}
            className="self-start"
          >
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Security & PIN Card */}
      <Card>
        <CardHeader
          title="Security Credentials"
          subtitle="Keep your transaction credentials updated."
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <h3 className="text-base font-medium text-[var(--text)]">Transaction PIN</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              4-digit secret required for authorization of all outward transfers and withdrawals.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenPinChange}
            className="shrink-0"
          >
            Change PIN
          </Button>
        </div>
      </Card>

      {/* Danger Zone: Deactivate & Logout */}
      <Card className="border-[var(--border)]">
        <CardHeader
          title="Session & Danger Zone"
          subtitle="Sign out or permanently close your account."
        />

        <div className="flex flex-col gap-4 pt-1">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-base font-medium text-[var(--text)]">Sign Out</p>
              <p className="text-xs text-[var(--text-muted)]">Terminate your local session on this device.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              <span>Log out</span>
            </Button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[var(--border)]">
            <div>
              <p className="text-base font-medium text-[var(--text)]">Deactivate Account</p>
              <p className="text-xs text-[var(--text-muted)]">
                Prevent any new incoming or outgoing movements. Requires PIN verification.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setDeactivatePin("");
                setDeactivateError("");
                setIsDeactivateOpen(true);
              }}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Card>

      {/* Change PIN Dialog */}
      <Dialog
        isOpen={isPinModalOpen}
        onClose={() => {
          if (!isChangingPin) setIsPinModalOpen(false);
        }}
        title="Change Transaction PIN"
        description={
          pinStep === 1
            ? "Enter your current 4-digit PIN."
            : pinStep === 2
            ? "Enter your new 4-digit PIN."
            : "Confirm your new 4-digit PIN."
        }
      >
        <div className="py-4">
          {pinStep === 1 && (
            <PinInput
              value={currentPin}
              onChange={setCurrentPin}
              onComplete={(entered) => {
                setCurrentPin(entered);
                setPinStep(2);
              }}
              error={pinError}
              label="Current 4-digit PIN"
            />
          )}

          {pinStep === 2 && (
            <PinInput
              value={newPin}
              onChange={setNewPin}
              onComplete={(entered) => {
                setNewPin(entered);
                setPinStep(3);
              }}
              error={pinError}
              label="New 4-digit PIN"
            />
          )}

          {pinStep === 3 && (
            <PinInput
              value={confirmPin}
              onChange={setConfirmPin}
              onComplete={handleConfirmPinChange}
              error={pinError}
              disabled={isChangingPin}
              label="Confirm New 4-digit PIN"
            />
          )}
        </div>
      </Dialog>

      {/* Deactivate Account Dialog */}
      <Dialog
        isOpen={isDeactivateOpen}
        onClose={() => {
          if (!isDeactivating) setIsDeactivateOpen(false);
        }}
        title="Confirm Account Deactivation"
        description="This will lock your account and revoke active sessions. Enter your PIN to confirm."
      >
        <div className="py-4">
          <PinInput
            value={deactivatePin}
            onChange={setDeactivatePin}
            onComplete={handleDeactivate}
            error={deactivateError}
            disabled={isDeactivating}
            label="Enter PIN to Deactivate"
          />
        </div>
      </Dialog>
    </div>
  );
}
