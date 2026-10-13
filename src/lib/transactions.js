import { apiRequest } from "./apiClient";

export async function validateRecipient(accountNumber) {
  return await apiRequest("/account/validate-recipient", {
    params: { accountNumber },
  });
}

export async function sendTransfer({
  accountNumber,
  amount,
  pin,
  narration,
  idempotencyKey,
}) {
  return await apiRequest("/account/transfer", {
    method: "POST",
    body: {
      accountNumber,
      amount: Number(amount),
      pin,
      narration: narration || undefined,
      idempotencyKey: idempotencyKey || undefined,
    },
  });
}

export async function getTransactions(params = {}) {
  return await apiRequest("/account/transactions", {
    params,
  });
}

export async function getTransactionById(id) {
  return await apiRequest(`/account/transactions/${id}`);
}

export async function downloadStatement({ startDate, endDate }) {
  return await apiRequest("/account/statement", {
    params: { startDate, endDate },
    responseType: "blob",
  });
}
