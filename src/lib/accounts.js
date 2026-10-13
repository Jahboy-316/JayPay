import { apiRequest } from "./apiClient";

export async function getProfile() {
  return await apiRequest("/account/profile");
}

export async function updateProfile({ firstName, surname }) {
  return await apiRequest("/account/profile", {
    method: "PUT",
    body: { firstName, surname },
  });
}

export async function getBalance() {
  return await apiRequest("/account/balance");
}

export async function deactivateAccount({ pin }) {
  return await apiRequest("/account/deactivate", {
    method: "DELETE",
    body: { pin },
  });
}

export async function withdrawFunds({ amount, pin, reference }) {
  return await apiRequest("/account/withdraw", {
    method: "POST",
    body: { amount: Number(amount), pin, reference: reference || undefined },
  });
}
