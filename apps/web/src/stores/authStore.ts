import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  user: AuthUser | null;
  lastEmail: string;
  isRefreshing: boolean;
  setAuth: (data: { tokens: TokenResponse; user?: AuthUser }) => void;
  setLastEmail: (email: string) => void;
  clearAuth: () => void;
  ensureFreshAccessToken: () => Promise<string | null>;
}

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8787';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      user: null,
      lastEmail: '',
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
      ensureFreshAccessToken: async () => {
        const { accessToken, accessTokenExpiresAt, refreshToken, isRefreshing } = get();
        const now = Date.now();

        if (accessToken && accessTokenExpiresAt && accessTokenExpiresAt - now > 30_000) {
          return accessToken;
        }

        if (!refreshToken || isRefreshing) {
          return null;
        }

        set({ isRefreshing: true });
        try {
          const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Refresh failed');
          }

          const result = await response.json();
          if (!result?.success) {
            throw new Error(result?.error || 'Refresh failed');
          }

          set({ isRefreshing: false });
          get().setAuth({ tokens: result.tokens });
          return result.tokens.accessToken as string;
        } catch (error) {
          console.error('Failed to refresh access token', error);
          set({ isRefreshing: false });
          get().clearAuth();
          return null;
        }
      },
    }),
    {
      name: 'reservation-auth',
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
