import { apiRequest } from "./apiClient";

export async function adminLogin({ username, pin }) {
  return await apiRequest("/admin/login", {
    method: "POST",
    body: { username, pin },
  });
}

export async function getAdminUsers(params = {}) {
  return await apiRequest("/admin/users", {
    isAdmin: true,
    params,
  });
}

export async function getAdminUserByAccount(accountNumber) {
  return await apiRequest(`/admin/users/${accountNumber}`, {
    isAdmin: true,
  });
}

export async function restrictUserAccount(accountNumber, reason) {
  return await apiRequest(`/admin/users/${accountNumber}/restrict`, {
    method: "PUT",
    isAdmin: true,
    body: { reason },
  });
}

export async function reactivateUserAccount(accountNumber, reason) {
  return await apiRequest(`/admin/users/${accountNumber}/reactivate`, {
    method: "PUT",
    isAdmin: true,
    body: { reason },
  });
}

export async function adminDepositFunds({ accountNumber, amount, reason, reference }) {
  return await apiRequest("/admin/deposit", {
    method: "POST",
    isAdmin: true,
    body: {
      accountNumber,
      amount: Number(amount),
      reason,
      reference: reference || undefined,
    },
  });
}

export async function adminWithdrawFunds({ accountNumber, amount, reason, reference }) {
  return await apiRequest("/admin/withdraw", {
    method: "POST",
    isAdmin: true,
    body: {
      accountNumber,
      amount: Number(amount),
      reason,
      reference: reference || undefined,
    },
  });
}

export async function getAdminTransactions(params = {}) {
  return await apiRequest("/admin/transactions", {
    isAdmin: true,
    params,
  });
}

export async function getAdminAuditLogs(params = {}) {
  return await apiRequest("/admin/audit-logs", {
    isAdmin: true,
    params,
  });
}
