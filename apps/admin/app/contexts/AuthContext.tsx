import {
  authClient,
  checkSession,
  signInWithGoogleAdmin,
  signOut,
} from "@blackliving/auth/client";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useApiUrl } from "./EnvironmentContext";

type User = {
  id: string;
  email: string;
  role: "admin" | "customer";
  name?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<{
    data?: unknown;
    error: { status: number; message?: string; statusText?: string } | null;
  }>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{
    data?: unknown;
    error: { status: number; message?: string } | null;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = useApiUrl();

  const checkAuth = useCallback(async () => {
    try {
      const data = await checkSession();

      if (data.user && data.user.role === "admin") {
        setUser(data.user as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
        body: JSON.stringify({ email, password }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (response.ok) {
        await checkAuth();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithGoogleAdmin();

      if (!result.success) {
        console.error("Google login failed:", result.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Google login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onError: (error) => {
            console.warn("Better Auth logout error:", error);
          },
          onSuccess: () => {
            console.log("Better Auth logout successful");
          },
        },
      });

      if (typeof Storage !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // biome-ignore lint/suspicious/noDocumentCookie: Fallback cookie cleanup - Cookie Store API has limited browser support
      document.cookie =
        "better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: {
    name?: string;
    email?: string;
  }): Promise<{
    data?: unknown;
    error: { status: number; message?: string; statusText?: string } | null;
  }> => {
    try {
      const response = await authClient.updateUser(data);

      if (!response.error) {
        await checkAuth();
      }

      return response;
    } catch (error) {
      console.error("Profile update failed:", error);
      return {
        data: undefined,
        error: {
          message: "更新失敗，請重試",
          status: 500,
          statusText: "Internal Error",
        },
      };
    }
  };

  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{
    data?: unknown;
    error: { status: number; message?: string } | null;
  }> => {
    try {
      const response = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      return response;
    } catch (error) {
      console.error("Password change failed:", error);
      return {
        data: undefined,
        error: {
          message: "密碼更改失敗，請重試",
          status: 500,
        },
      };
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    changePassword,
    checkAuth,
    login,
    loginWithGoogle,
    logout,
    updateProfile,
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
