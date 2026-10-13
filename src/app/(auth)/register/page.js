"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { PinInput } from "@/components/PinInput";
import { registerUser, setAccountPin } from "@/lib/auth";
import { useToast } from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Info, 2: PIN, 3: Confirm PIN

  // Step 1 Form
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    phoneNumber: "",
    age: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 2 & 3 Data
  const [registeredAccount, setRegisteredAccount] = useState(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");

  const validateStep1 = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.surname.trim()) errors.surname = "Surname is required";

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\d{11}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = "Must be exactly 11 digits (e.g. 08123456789)";
    }

    if (!formData.age) {
      errors.age = "Age is required";
    } else if (Number(formData.age) < 18) {
      errors.age = "You must be at least 18 years old to register";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    if (!validateStep1()) return;

    setIsLoading(true);
    try {
      const res = await registerUser(formData);
      setRegisteredAccount(res.data);
      setStep(2);
      showToast({ message: "Profile created. Now set your 4-digit PIN.", type: "success" });
    } catch (err) {
      setGeneralError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinComplete = (enteredPin) => {
    setPin(enteredPin);
    setPinError("");
    setStep(3); // Move to confirm PIN
  };

  const handleConfirmPinComplete = async (enteredConfirmPin) => {
    setConfirmPin(enteredConfirmPin);
    setPinError("");

    if (enteredConfirmPin !== pin) {
      setPinError("PINs do not match. Please try again.");
      setConfirmPin("");
      return;
    }

    setIsLoading(true);
    try {
      await setAccountPin({
        accountNumber: registeredAccount.accountNumber,
        pin,
        confirmPin: enteredConfirmPin,
      });

      showToast({ message: "PIN set successfully. Please log in.", type: "success" });
      router.push("/login");
    } catch (err) {
      setPinError(err.message || "Failed to set PIN");
      setConfirmPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium tracking-tight">Open an Account</h1>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            Step {step === 1 ? "1 of 2" : "2 of 2"}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {step === 1
            ? "Enter your details to generate your phone-derived account number."
            : step === 2
            ? "Choose a 4-digit transaction PIN."
            : "Confirm your 4-digit transaction PIN."}
        </p>
      </div>

      {generalError && (
        <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
          <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
          <span>{generalError}</span>
        </div>
      )}

      {/* Step 1: User Profile Form */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              error={formErrors.firstName}
              placeholder="e.g. David"
              required
            />
            <Input
              label="Surname"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              error={formErrors.surname}
              placeholder="e.g. Okafor"
              required
            />
          </div>

          <Input
            label="Phone Number"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, "") })}
            error={formErrors.phoneNumber}
            placeholder="08123456789"
            helperText="Your 10-digit account number will be derived from this."
            maxLength={11}
            required
          />

          <Input
            label="Age"
            type="number"
            min={18}
            max={120}
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            error={formErrors.age}
            placeholder="24"
            required
          />

          <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2">
            Continue to PIN Setup
          </Button>

          <p className="text-xs text-center text-[var(--text-muted)] mt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--text)] underline underline-offset-4">
              Log in
            </Link>
          </p>
        </form>
      )}

      {/* Step 2: Set PIN */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div className="p-3 squircle bg-[var(--bg)] border border-[var(--border)] text-xs flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Generated Account:</span>
            <span className="font-medium tabular-nums">{registeredAccount?.accountNumber}</span>
          </div>

          <PinInput
            value={pin}
            onChange={setPin}
            onComplete={handlePinComplete}
            error={pinError}
            disabled={isLoading}
            label="Create your 4-digit PIN"
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep(1);
              setPin("");
              setPinError("");
            }}
          >
            Back to Profile
          </Button>
        </div>
      )}

      {/* Step 3: Confirm PIN */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <PinInput
            value={confirmPin}
            onChange={setConfirmPin}
            onComplete={handleConfirmPinComplete}
            error={pinError}
            disabled={isLoading}
            label="Confirm your 4-digit PIN"
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep(2);
              setConfirmPin("");
              setPin("");
              setPinError("");
            }}
          >
            Re-enter PIN
          </Button>
        </div>
      )}
    </Card>
  );
}
