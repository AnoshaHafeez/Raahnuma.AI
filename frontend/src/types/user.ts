/**
 * UI-facing user models (camelCase). Every field here is backed by a real
 * column on the server — see `UserDTO` in `types/api.ts` and
 * `backend/app/models/user.py`. Convert with `toUser()` in `lib/adapters.ts`.
 */

export type LanguagePreference = "en" | "ur";
export type ExperienceLevel = "beginner" | "intermediate" | "expert";

export interface User {
  /** Stringified server id — route params and DOM keys are strings. */
  id: string;
  /** Optional on the server, so the adapter falls back to the email local part. */
  fullName: string;
  email: string;
  phone: string;
  preferredLanguage: LanguagePreference;
  experienceLevel: ExperienceLevel;
  /** Gates admin-only calls such as vendor creation. */
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  /** Epoch ms, derived from the JWT `exp` claim (see `lib/auth.ts`). */
  expiresAt: number;
}

/**
 * Emergency contacts are a separate resource on the server
 * (`GET/POST/DELETE /api/v1/sos/emergency-contacts`), not user columns.
 */
export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  experienceLevel: ExperienceLevel;
  /** Sent to /auth/register, which creates the first emergency contact. */
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ProfileUpdatePayload {
  fullName: string;
  phone: string;
  preferredLanguage: LanguagePreference;
  experienceLevel: ExperienceLevel;
}
