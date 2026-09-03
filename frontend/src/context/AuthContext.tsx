"use client";

import * as React from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { hydrateSession, logout as logoutAction, sessionExpired } from "@/store/slices/authSlice";
import { isSessionValid, getSession } from "@/lib/auth";
import { setUnauthorizedHandler } from "@/lib/api";
import { User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/**
 * Thin wrapper around authSlice so components can import a single
 * `useAuth()` hook from context/ instead of reaching into Redux
 * directly. Actual session state, persistence, and expiry logic
 * still live in store/slices/authSlice.ts and lib/auth.ts.
 */
export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, status } = useAppSelector((s) => s.auth);

  React.useEffect(() => {
    const session = getSession();
    dispatch(hydrateSession(isSessionValid(session) ? session : null));
  }, [dispatch]);

  // Any 401 from the api client (a revoked or server-side-expired token) drops
  // the session here, so Redux and localStorage never disagree.
  React.useEffect(() => {
    setUnauthorizedHandler(() => dispatch(sessionExpired()));
    return () => setUnauthorizedHandler(null);
  }, [dispatch]);

  const isSessionExpired = React.useMemo(() => {
    const session = getSession();
    return !!session && !isSessionValid(session);
  }, []);

  const logout = React.useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  const value = React.useMemo(
    () => ({
      user,
      isAuthenticated: status === "authenticated",
      isSessionExpired,
      logout
    }),
    [user, status, isSessionExpired, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContextProvider");
  return ctx;
}
