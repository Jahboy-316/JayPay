import { apiRequest } from "./apiClient";

export async function getBeneficiaries() {
  return await apiRequest("/account/beneficiaries");
}

export async function addBeneficiary({ accountNumber, nickname }) {
  return await apiRequest("/account/beneficiaries", {
    method: "POST",
    body: {
      accountNumber,
      nickname: nickname || undefined,
    },
  });
}

export async function removeBeneficiary(id) {
  return await apiRequest(`/account/beneficiaries/${id}`, {
    method: "DELETE",
  });
}
