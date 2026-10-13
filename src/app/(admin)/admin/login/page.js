"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, ShieldAlert } from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { PinInput } from "@/components/PinInput";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (currentPin = pin) => {
    setError("");
    if (!username.trim()) {
      setError("Please enter your admin username");
      return;
    }

    if (!currentPin || currentPin.length !== 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    setIsLoading(true);
    try {
      await adminLogin({ username: username.trim(), pin: currentPin });
      showToast({ message: "Admin authenticated", type: "success" });
      router.push("/admin");
    } catch (err) {
      setError(err.message || "Invalid admin credentials");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinComplete = (enteredPin) => {
    setPin(enteredPin);
    if (username.trim()) {
      handleLogin(enteredPin);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 bg-[var(--bg)]">
      <header className="flex items-center justify-between max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 text-base font-medium">
          <span className="w-2 h-2 rounded-full bg-[var(--text)]" />
          <span>JayPay</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="w-full max-w-md mx-auto my-auto">
        <Card className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 squircle bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
              <ShieldAlert className="w-5 h-5 text-[var(--text)]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-medium tracking-tight">Staff Portal</h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Restricted administrative operations & oversight.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
              <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Input
              label="Admin Username"
              placeholder="e.g. jason_admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
                label="Admin 4-digit PIN"
              />
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => handleLogin()}
              isLoading={isLoading}
              disabled={!username.trim() || pin.length !== 4}
              className="mt-2"
            >
              Authenticate Staff
            </Button>
          </div>

          <div className="pt-2 border-t border-[var(--border)] text-xs text-center text-[var(--text-muted)]">
            <Link href="/login" className="hover:text-[var(--text)]">
              &larr; Return to Customer Sign In
            </Link>
          </div>
        </Card>
      </div>

      <footer className="text-center text-xs text-[var(--text-muted)]">
        JayPay Administrative Gateway
      </footer>
    </div>
  );
}
