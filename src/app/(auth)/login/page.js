"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { PinInput } from "@/components/PinInput";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (currentPin = pin) => {
    setError("");
    if (!phoneNumber.trim() || phoneNumber.trim().length !== 11) {
      setError("Please enter a valid 11-digit phone number");
      return;
    }

    if (!currentPin || currentPin.length !== 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    setIsLoading(true);
    try {
      await login({ phoneNumber: phoneNumber.trim(), pin: currentPin });
      showToast({ message: "Welcome back!", type: "success" });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid phone number or PIN");
      setPin(""); // Clear dots on wrong PIN
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinComplete = (enteredPin) => {
    setPin(enteredPin);
    if (phoneNumber.trim().length === 11) {
      handleLogin(enteredPin);
    }
  };

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Sign In</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Access your JayPay account with your phone number and PIN.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
          <CircleAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Input
          label="Phone Number"
          type="tel"
          placeholder="08123456789"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
          maxLength={11}
          disabled={isLoading}
          required
        />

        <div className="pt-2">
          <PinInput
            value={pin}
            onChange={setPin}
            onComplete={handlePinComplete}
            error={error && pin.length === 0 ? error : undefined}
            disabled={isLoading}
            label="Transaction PIN"
          />
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => handleLogin()}
          isLoading={isLoading}
          disabled={phoneNumber.length !== 11 || pin.length !== 4}
          className="mt-2"
        >
          Sign In
        </Button>
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border)] text-xs text-center text-[var(--text-muted)]">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--text)] underline underline-offset-4">
            Open an account
          </Link>
        </p>
        <p>
          Staff or support?{" "}
          <Link href="/admin/login" className="text-[var(--text)] hover:underline">
            Admin Portal
          </Link>
        </p>
      </div>
    </Card>
  );
}
