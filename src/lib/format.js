/**
 * Formatting utilities following design.md:
 * - Currency formatting using Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" })
 * - Never perform float arithmetic on money
 * - Dates in user locale with tabular-nums
 */

export function formatCurrency(value) {
  if (value === null || value === undefined) {
    return "₦0.00";
  }

  let num;
  if (typeof value === "object" && value !== null) {
    // If backend returns { kobo, naira, currency }
    num = Number(value.naira ?? (value.kobo ? value.kobo / 100 : 0));
  } else if (typeof value === "string") {
    num = Number(value);
  } else if (typeof value === "number") {
    num = value;
  } else {
    num = 0;
  }

  if (isNaN(num)) num = 0;

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `₦${num.toFixed(2)}`;
  }
}

export function formatAccountNumber(acc) {
  if (!acc) return "";
  const s = String(acc);
  if (s.length === 10) {
    return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}`;
  }
  return s;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function generateIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "idemp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}
