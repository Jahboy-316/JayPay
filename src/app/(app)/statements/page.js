"use client";

import { useState } from "react";
import { FileSpreadsheet, Download, CircleAlert, Calendar } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { downloadStatement } from "@/lib/transactions";

export default function StatementsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async (e) => {
    e.preventDefault();
    setError("");

    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError("Start date cannot be after end date");
      return;
    }

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays > 90) {
      setError("Statement range cannot exceed 90 days");
      return;
    }

    setIsLoading(true);
    try {
      const blob = await downloadStatement({ startDate, endDate });

      // Trigger browser file download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `JayPay_Statement_${user?.accountNumber}_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast({ message: "Statement downloaded successfully", type: "success" });
    } catch (err) {
      setError(err.message || "Failed to download statement");
    } finally {
      setIsLoading(false);
    }
  };

  const setPreset = (days) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);
    setError("");
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Account Statements</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Download authenticated CSV statements for accounting and reconciliation.
        </p>
      </div>

      <Card className="flex flex-col gap-6">
        <CardHeader
          title="Select Date Range"
          subtitle="Maximum window: 90 calendar days."
        />

        {error && (
          <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
            <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}

        {/* Preset quick buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPreset(7)}
            className="px-3 py-1.5 squircle bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95"
          >
            Last 7 days
          </button>
          <button
            type="button"
            onClick={() => setPreset(30)}
            className="px-3 py-1.5 squircle bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95"
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => setPreset(90)}
            className="px-3 py-1.5 squircle bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95"
          >
            Last 90 days
          </button>
        </div>

        <form onSubmit={handleDownload} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              max={today}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="p-3 squircle bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-muted)] flex items-start gap-2">
            <Calendar className="w-4 h-4 shrink-0 text-[var(--text)] mt-0.5" strokeWidth={1.5} />
            <div className="space-y-1">
              <p>Format: CSV (Comma-Separated Values).</p>
              <p>Includes date, reference, category, debit/credit flag, description, and running balance.</p>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="gap-2 mt-2"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            <span>Download CSV Statement</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
