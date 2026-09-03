"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { sessionExpired } from "@/store/slices/authSlice";
import { isSessionValid, getSession } from "@/lib/auth";

/**
 * Guards dashboard routes: redirects to /login if there's no session
 * or the session has expired. Also syncs an externally-expired
 * session (e.g. token TTL passed while tab was open) back into Redux.
 */
export function useAuthGuard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status, hydrated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!hydrated) return;
    const session = getSession();
    const valid = isSessionValid(session);

    if (!valid && status === "authenticated") {
      dispatch(sessionExpired());
    }

    if (!valid) {
      router.replace("/login");
    }
  }, [hydrated, status, dispatch, router]);

  return { isAuthenticated: status === "authenticated", hydrated };
}
