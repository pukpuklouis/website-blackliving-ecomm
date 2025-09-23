import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { signOut, signInWithGoogleAdmin, checkSession } from '@blackliving/auth/client';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  const checkAuth = useCallback(async () => {
    try {
      const data = await checkSession();

      if (data.user && data.user.role === 'admin') {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        await checkAuth();
        // After checkAuth updates state, route protection will gate access.
        // Return success here to avoid a race on stale `user` state.
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithGoogleAdmin();

      if (!result.success) {
        console.error('Google login failed:', result.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Google login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Use Better Auth's proper signOut method
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            console.log('Better Auth logout successful');
          },
          onError: error => {
            console.warn('Better Auth logout error:', error);
          },
        },
      });

      // Clear any local storage
      if (typeof Storage !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: clear session cookies manually
      document.cookie =
        'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    } finally {
      // Always clear user state locally
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
