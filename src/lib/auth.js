import { apiRequest } from "./apiClient";

export async function registerUser({ firstName, surname, phoneNumber, age }) {
  return await apiRequest("/auth/register", {
    method: "POST",
    body: { firstName, surname, phoneNumber, age: Number(age) },
  });
}

export async function setAccountPin({ accountNumber, pin, confirmPin }) {
  return await apiRequest("/auth/set-pin", {
    method: "POST",
    body: { accountNumber, pin, confirmPin },
  });
}

export async function loginUser({ phoneNumber, pin }) {
  return await apiRequest("/auth/login", {
    method: "POST",
    body: { phoneNumber, pin },
  });
}

export async function changeUserPin({ currentPin, newPin, confirmPin }) {
  return await apiRequest("/auth/change-pin", {
    method: "PUT",
    body: { currentPin, newPin, confirmPin },
  });
}
