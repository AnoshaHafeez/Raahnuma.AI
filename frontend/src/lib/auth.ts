import { AuthSession } from "@/types/user";

const SESSION_KEY = "raahnuma_session";

/**
 * Treat a token as expired slightly early so a request started just under the
 * wire does not arrive after the server-side expiry.
 */
const EXPIRY_SKEW_MS = 30_000;

interface JwtClaims {
  sub?: string;
  email?: string;
  /** Expiry as a UNIX timestamp in seconds. */
  exp?: number;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  if (typeof atob === "function") {
    // Round-trip through percent-encoding so multi-byte UTF-8 claims survive.
    const binary = atob(padded);
    const bytes = Array.from(binary, (char) => char.charCodeAt(0));
    return decodeURIComponent(
      bytes.map((byte) => `%${byte.toString(16).padStart(2, "0")}`).join("")
    );
  }
  return Buffer.from(padded, "base64").toString("utf-8");
}

/**
 * Read the claims out of a JWT payload.
 *
 * This is *not* verification — the signature is only checkable server-side. The
 * claims are used solely to decide when to stop sending a token and prompt a
 * fresh login; every real authorisation decision stays on the backend.
 */
export function decodeJwt(token: string): JwtClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(base64UrlDecode(parts[1]));
    return typeof claims === "object" && claims !== null ? (claims as JwtClaims) : null;
  } catch {
    return null;
  }
}

/**
 * Epoch-ms expiry for a token, preferring the signed `exp` claim over the
 * server's `expires_in` hint, and falling back to it when `exp` is absent.
 */
export function resolveExpiry(token: string, expiresInSeconds?: number): number {
  const claims = decodeJwt(token);
  if (claims?.exp) return claims.exp * 1000;
  if (expiresInSeconds && expiresInSeconds > 0) return Date.now() + expiresInSeconds * 1000;
  // Unparseable token: treat it as already expired rather than trusting it.
  return 0;
}

export function saveSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Private-browsing / quota errors must not break the login flow.
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    // Guard against a truncated or hand-edited localStorage entry.
    if (!parsed?.token || !parsed?.user || typeof parsed.expiresAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isSessionValid(session: AuthSession | null): boolean {
  if (!session?.token) return false;
  return session.expiresAt - EXPIRY_SKEW_MS > Date.now();
}

/** Bearer token for the current session, or null when there is nothing usable. */
export function getAccessToken(): string | null {
  const session = getSession();
  return isSessionValid(session) ? session!.token : null;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Returns where the app should route a visitor hitting a protected page.
 * "dashboard" -> valid session, let them through
 * "login"     -> no session or expired session
 */
export function resolveEntryRoute(): "dashboard" | "login" {
  const session = getSession();
  return isSessionValid(session) ? "dashboard" : "login";
}
