/**
 * Central API Client for JayPay backend
 * - Base URL: process.env.NEXT_PUBLIC_API_BASE_URL (defaults to http://localhost:5000/api)
 * - Automatic Bearer token header from localStorage
 * - Auto-refresh token on 401 once via POST /api/auth/refresh
 * - Central error normalization
 * - Blob handling for statements
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const TOKEN_KEY = "jaypay_access_token";
const REFRESH_TOKEN_KEY = "jaypay_refresh_token";
const USER_KEY = "jaypay_user";

const ADMIN_TOKEN_KEY = "jaypay_admin_token";
const ADMIN_KEY = "jaypay_admin";

export function getTokens() {
  if (typeof window === "undefined") return { token: null, refreshToken: null };
  return {
    token: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    user: JSON.parse(localStorage.getItem(USER_KEY) || "null"),
  };
}

export function setTokens({ token, refreshToken, user }) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAdminTokens() {
  if (typeof window === "undefined") return { token: null, admin: null };
  return {
    token: localStorage.getItem(ADMIN_TOKEN_KEY),
    admin: JSON.parse(localStorage.getItem(ADMIN_KEY) || "null"),
  };
}

export function setAdminTokens({ token, admin }) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function clearAdminTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) throw new Error("No refresh token available");

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    clearTokens();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("jaypay_logout"));
    }
    throw new Error(data.message || "Session expired");
  }

  const newToken = data.data.token;
  setTokens({ token: newToken });
  return newToken;
}

export async function apiRequest(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    params,
    isAdmin = false,
    responseType = "json",
    ...rest
  } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const reqHeaders = { ...headers };

  // Set auth header
  const authHeader = isAdmin ? getAdminTokens().token : getTokens().token;
  if (authHeader && !reqHeaders.Authorization) {
    reqHeaders.Authorization = `Bearer ${authHeader}`;
  }

  if (body && !(body instanceof FormData) && !reqHeaders["Content-Type"]) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const fetchOptions = {
    method,
    headers: reqHeaders,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
    ...rest,
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (netErr) {
    throw new Error("Unable to reach the JayPay server. Please check your connection.");
  }

  // Handle 401 and auto-refresh for customer sessions
  if (response.status === 401 && !isAdmin && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newToken);
        // Retry original request with new token
        reqHeaders.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, { ...fetchOptions, headers: reqHeaders });
      } catch (refreshErr) {
        isRefreshing = false;
        refreshSubscribers = [];
        clearTokens();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("jaypay_logout"));
        }
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      // Queue until refresh finishes
      const retryOriginal = new Promise((resolve) => {
        subscribeTokenRefresh(async (newToken) => {
          reqHeaders.Authorization = `Bearer ${newToken}`;
          const res = await fetch(url, { ...fetchOptions, headers: reqHeaders });
          resolve(res);
        });
      });
      response = await retryOriginal;
    }
  }

  if (responseType === "blob") {
    if (!response.ok) {
      let errText = "Download failed";
      try {
        const errJson = await response.json();
        errText = errJson.message || errText;
      } catch {}
      throw new Error(errText);
    }
    return await response.blob();
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Server returned status ${response.status}`);
  }

  if (!response.ok || result.success === false) {
    const error = new Error(result.message || "An unexpected error occurred");
    error.status = response.status;
    error.data = result.data;
    throw error;
  }

  return result;
}
