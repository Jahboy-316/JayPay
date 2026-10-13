"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getTokens,
  setTokens,
  clearTokens,
  getAdminTokens,
  setAdminTokens,
  clearAdminTokens,
} from "@/lib/apiClient";
import { loginUser as apiLogin } from "@/lib/auth";
import { adminLogin as apiAdminLogin } from "@/lib/admin";
import { getProfile } from "@/lib/accounts";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  admin: null,
  isAdminAuthenticated: false,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  adminLogin: async () => {},
  adminLogout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getProfile();
      if (res && res.data) {
        setUser(res.data);
        setTokens({ user: res.data });
      }
    } catch {
      // If fetching profile fails (e.g. 401 or network), user state remains or clears on 401
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const adminLogout = useCallback(() => {
    clearAdminTokens();
    setAdmin(null);
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
  }, []);

  useEffect(() => {
    // Initialize customer auth
    const { token, user: cachedUser } = getTokens();
    if (token) {
      if (cachedUser) setUser(cachedUser);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    // Initialize admin auth
    const { token: adminToken, admin: cachedAdmin } = getAdminTokens();
    if (adminToken && cachedAdmin) {
      setAdmin(cachedAdmin);
    }

    const handleAutoLogout = () => {
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    };

    window.addEventListener("jaypay_logout", handleAutoLogout);
    return () => window.removeEventListener("jaypay_logout", handleAutoLogout);
  }, [refreshUser]);

  const login = async ({ phoneNumber, pin }) => {
    const res = await apiLogin({ phoneNumber, pin });
    const { token, refreshToken, user: loggedUser } = res.data;
    setTokens({ token, refreshToken, user: loggedUser });
    setUser(loggedUser);
    // Fetch complete profile in background
    refreshUser();
    return res;
  };

  const handleAdminLogin = async ({ username, pin }) => {
    const res = await apiAdminLogin({ username, pin });
    const { token, admin: loggedAdmin } = res.data;
    setAdminTokens({ token, admin: loggedAdmin });
    setAdmin(loggedAdmin);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        admin,
        isAdminAuthenticated: !!admin,
        login,
        logout,
        refreshUser,
        adminLogin: handleAdminLogin,
        adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
