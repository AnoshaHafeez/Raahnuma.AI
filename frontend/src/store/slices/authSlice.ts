import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { authApi, toErrorMessage } from "@/lib/api";
import { clearSession, isSessionValid, resolveExpiry, saveSession } from "@/lib/auth";
import { toUser } from "@/lib/adapters";
import type {
  AuthSession,
  LoginPayload,
  ProfileUpdatePayload,
  RegisterPayload,
  User
} from "@/types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  expiresAt: number | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  hydrated: boolean;
  /** Separate flag so a profile save does not blank out the dashboard. */
  savingProfile: boolean;
}

const initialState: AuthState = {
  // Keep the first server and client render identical. Browser-only session
  // storage is read by hydrateSession after React has hydrated the page.
  user: null,
  token: null,
  expiresAt: null,
  status: "loading",
  error: null,
  hydrated: false,
  savingProfile: false
};

/**
 * `POST /auth/login` returns only a token, so the profile is fetched straight
 * after with that token passed explicitly — the session is not in localStorage
 * yet at that point.
 */
async function establishSession(email: string, password: string): Promise<AuthSession> {
  const token = await authApi.login({ email: email.trim().toLowerCase(), password });
  const user = await authApi.me(token.access_token);
  return {
    user: toUser(user),
    token: token.access_token,
    // Prefer the token's own `exp` claim; `expires_in` is only a fallback.
    expiresAt: resolveExpiry(token.access_token, token.expires_in)
  };
}

export const loginUser = createAsyncThunk<AuthSession, LoginPayload, { rejectValue: string }>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      return await establishSession(payload.email, payload.password);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const registerUser = createAsyncThunk<AuthSession, RegisterPayload, { rejectValue: string }>(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      await authApi.register({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        full_name: payload.fullName.trim() || null,
        phone: payload.phone.trim() || null,
        experience_level: payload.experienceLevel,
        // The server creates the first emergency contact only when both are set.
        emergency_contact_name: payload.emergencyContactName.trim() || null,
        emergency_contact_phone: payload.emergencyContactPhone.trim() || null
      });
      // Registration does not issue a token, so log in with the same credentials.
      return await establishSession(payload.email, payload.password);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/** Re-reads `GET /auth/me` so a profile edited elsewhere shows up. */
export const refreshCurrentUser = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      return toUser(await authApi.me());
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const saveProfile = createAsyncThunk<User, ProfileUpdatePayload, { rejectValue: string }>(
  "auth/saveProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const updated = await authApi.updateMe({
        full_name: payload.fullName.trim(),
        phone: payload.phone.trim(),
        preferred_language: payload.preferredLanguage,
        experience_level: payload.experienceLevel
      });
      return toUser(updated);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/** Persist the user alongside the existing token so a reload keeps the change. */
function persist(state: AuthState) {
  if (state.user && state.token && state.expiresAt) {
    saveSession({ user: state.user, token: state.token, expiresAt: state.expiresAt });
  }
}

function authenticate(state: AuthState, session: AuthSession) {
  state.user = session.user;
  state.token = session.token;
  state.expiresAt = session.expiresAt;
  state.status = "authenticated";
  state.error = null;
  state.hydrated = true;
  saveSession(session);
}

function unauthenticate(state: AuthState) {
  state.user = null;
  state.token = null;
  state.expiresAt = null;
  state.status = "unauthenticated";
  state.hydrated = true;
  clearSession();
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateSession(state, action: PayloadAction<AuthSession | null>) {
      const session = action.payload;
      const valid = isSessionValid(session);
      state.user = valid ? session!.user : null;
      state.token = valid ? session!.token : null;
      state.expiresAt = valid ? session!.expiresAt : null;
      state.status = valid ? "authenticated" : "unauthenticated";
      state.hydrated = true;
    },
    logout(state) {
      unauthenticate(state);
      state.error = null;
    },
    /** Called by the api client's 401 handler; the token is already discarded. */
    sessionExpired(state) {
      unauthenticate(state);
    },
    clearAuthError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        authenticate(state, action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload ?? "Login failed.";
        state.hydrated = true;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        authenticate(state, action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload ?? "Could not create your account.";
        state.hydrated = true;
      })
      .addCase(refreshCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        persist(state);
      })
      .addCase(saveProfile.pending, (state) => {
        state.savingProfile = true;
        state.error = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.savingProfile = false;
        state.user = action.payload;
        persist(state);
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.savingProfile = false;
        state.error = action.payload ?? "Could not save your profile.";
      });
  }
});

export const { hydrateSession, logout, sessionExpired, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
