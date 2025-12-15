import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  email: string;
};

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  user: AuthUser | null;
  lastEmail: string;
  isRefreshing: boolean;
  setAuth: (data: { tokens: TokenResponse; user?: AuthUser }) => void;
  setUser: (user: AuthUser) => void;
  setLastEmail: (email: string) => void;
  clearAuth: () => void;
  ensureFreshAccessToken: () => Promise<string | null>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      user: null,
      lastEmail: "",
      isRefreshing: false,
      setAuth: ({ tokens, user }) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
          user: user ?? get().user,
          isRefreshing: false,
        });
      },
      setUser: (user) => set({ user }),
      setLastEmail: (email) => set({ lastEmail: email }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          user: null,
          isRefreshing: false,
        }),
      ensureFreshAccessToken: () => {
        const { accessToken, accessTokenExpiresAt } = get();
        const now = Date.now();

        // Return existing token if still valid (with 30s buffer)
        // Note: With Better Auth, session management is handled via HTTP-only cookies
        // This function is for backwards compatibility
        if (
          accessToken &&
          accessTokenExpiresAt &&
          accessTokenExpiresAt - now > 30_000
        ) {
          return Promise.resolve(accessToken);
        }

        // No custom refresh endpoint anymore - Better Auth handles sessions via cookies
        // Return null to signal that component should rely on cookie-based auth
        return Promise.resolve(null);
      },
    }),
    {
      name: "reservation-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        refreshTokenExpiresAt: state.refreshTokenExpiresAt,
        user: state.user,
        lastEmail: state.lastEmail,
      }),
    }
  )
);
