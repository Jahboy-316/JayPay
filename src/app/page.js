import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Send,
  Users,
  FileText,
  KeyRound,
  Eye,
  Copy,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-xl font-medium tracking-tight">
            <span>JayPay</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--steel)]" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[var(--text-muted)]">
            <a href="#features" className="hover:text-[var(--text)] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[var(--text)] transition-colors">
              How it works
            </a>
            <a href="#security" className="hover:text-[var(--text)] transition-colors">
              Security
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Open an account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 squircle border border-[var(--border)] bg-[var(--surface)] w-fit text-xs text-[var(--text-muted)] font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--steel)]" />
              <span>Modern financial architecture</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-medium leading-[1.15] tracking-[-0.01em]">
              The calm, minimal way to manage your money.
            </h1>

            <p className="text-base text-[var(--text-muted)] max-w-xl leading-relaxed">
              No clutter, no noise. Built on an immutable double-entry ledger with instant peer transfers, phone-derived account numbers, and dot-PIN security.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/register">
                <Button variant="primary" className="gap-2">
                  <span>Open an account</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary">Log in</Button>
              </Link>
            </div>
          </div>

          {/* Calm Mock Balance Card (Built in code, honest illustration) */}
          <div className="lg:col-span-5">
            <div className="bg-[var(--surface)] border border-[var(--border)] squircle-card p-6 flex flex-col gap-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="font-medium tracking-[0.02em] uppercase">Account Overview</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 squircle border border-[var(--border)] text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text)]" /> Active
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">Available balance</span>
                  <Eye className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                </div>
                <div className="text-3xl font-medium tracking-[-0.01em] tabular-nums mt-1">
                  ₦245,800.00
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block text-[11px]">Account number</span>
                  <span className="font-medium tabular-nums">812 345 6789</span>
                </div>
                <button
                  type="button"
                  aria-label="Copy mock account number"
                  className="w-8 h-8 squircle bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <Copy className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="text-[11px] text-[var(--steel)] pt-1 text-center">
                * Illustrative preview. Actual balances reflect verified ledger history.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Row (4 items) */}
      <section id="features" className="py-16 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 squircle-card bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3">
              <div className="w-12 h-12 squircle bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
                <Send className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-[var(--text)]">Instant transfers</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Direct debit and credit executed atomically in a single database transaction with row-level locking.
              </p>
            </div>

            <div className="p-6 squircle-card bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3">
              <div className="w-12 h-12 squircle bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
                <Users className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-[var(--text)]">Saved beneficiaries</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Save frequent recipients securely. Pre-validates account names before funds move.
              </p>
            </div>

            <div className="p-6 squircle-card bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3">
              <div className="w-12 h-12 squircle bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
                <FileText className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-[var(--text)]">Clear statements</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Download structured CSV statements spanning up to 90 days with balance audit points.
              </p>
            </div>

            <div className="p-6 squircle-card bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3">
              <div className="w-12 h-12 squircle bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
                <KeyRound className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-[var(--text)]">Secure PIN</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Hashed with bcrypt at cost factor 12. Rate-limited with attempt lockouts to prevent brute force.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (3 steps) */}
      <section id="how-it-works" className="py-16 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-medium tracking-[-0.01em]">How it works</h2>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Three deliberate steps to full financial control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3 p-6 squircle-card bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-xs text-[var(--steel)] font-medium">01</span>
              <h3 className="text-base font-medium">Register with your phone</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your 10-digit account number is derived directly from your phone number for simple sharing.
              </p>
            </div>

            <div className="flex flex-col gap-3 p-6 squircle-card bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-xs text-[var(--steel)] font-medium">02</span>
              <h3 className="text-base font-medium">Set your 4-digit PIN</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Configure your transaction PIN using our dot-based keypad. Never stored in plaintext.
              </p>
            </div>

            <div className="flex flex-col gap-3 p-6 squircle-card bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-xs text-[var(--steel)] font-medium">03</span>
              <h3 className="text-base font-medium">Send and receive</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Perform atomic transfers with automatic idempotency protection and instant receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-16 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-[var(--steel)] font-medium">
                <ShieldCheck className="w-4 h-4 text-[var(--text)]" strokeWidth={1.5} />
                <span>Zero Compromises</span>
              </div>
              <h2 className="text-2xl font-medium tracking-[-0.01em]">
                Engineered for integrity.
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                JayPay maintains an immutable double-entry ledger where money cannot appear or disappear. Every transfer debits the sender and credits the recipient within an isolated database transaction.
              </p>
              <div className="p-4 squircle bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--steel)]">
                <strong>Honest Note:</strong> Deposits, withdrawals, and admin adjustments in this environment are simulated. Account numbers are phone-derived and not real bank-issued numbers.
              </div>
            </div>

            {/* PIN Dots Illustration */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-8 squircle bg-[var(--bg)] border border-[var(--border)]">
              <span className="text-xs text-[var(--text-muted)] mb-4">Dot PIN Security</span>
              <div className="flex items-center gap-4 py-3">
                <div className="w-4 h-4 rounded-full bg-[var(--text)] border border-[var(--text)]" />
                <div className="w-4 h-4 rounded-full bg-[var(--text)] border border-[var(--text)]" />
                <div className="w-4 h-4 rounded-full bg-[var(--text)] border border-[var(--text)]" />
                <div className="w-4 h-4 rounded-full bg-transparent border border-[var(--text-muted)]" />
              </div>
              <span className="text-[11px] text-[var(--steel)] mt-3">3 of 4 digits entered</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--text)]">JayPay</span>
            <span>&copy; 2026 JayPay. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[var(--text)] transition-colors">
              Customer Portal
            </Link>
            <Link href="/admin/login" className="hover:text-[var(--text)] transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
