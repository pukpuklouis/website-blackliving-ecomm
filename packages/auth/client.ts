import { createAuthClient } from "better-auth/react";

// Production-ready Better Auth React client
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? "http://localhost:8787" 
    : "https://api.blackliving.com",
  
  // Better Auth React client options
  fetchOptions: {
    credentials: 'include' as const,
    headers: {
      'Content-Type': 'application/json',
    },
  },
  
  // Enable debug logging in development
  logger: typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? console 
    : undefined,
});

// Export the main auth methods
export const { 
  signIn, 
  signOut, 
  signUp, 
  useSession,
  // Additional useful hooks
  useUser,
  useActiveSession
} = authClient;

// Helper functions for OAuth flows

/**
 * Initiate Google OAuth for admin users
 */
export const signInWithGoogleAdmin = async () => {
  try {
    const baseURL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? "http://localhost:8787" 
      : "https://api.blackliving.com";
    
    const adminCallbackURL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? "http://localhost:5173/auth/callback"
      : "https://admin.blackliving.com/auth/callback";
    
    // Use the same direct API approach that works for customers
    const response = await fetch(`${baseURL}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        provider: 'google',
        callbackURL: adminCallbackURL,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url;
        return { success: true };
      } else {
        return { success: false, error: 'No OAuth URL returned' };
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'OAuth request failed' };
    }
  } catch (error) {
    console.error('Admin Google login error:', error);
    return { success: false, error: 'Network error during admin Google login' };
  }
};

/**
 * Initiate Google OAuth for customer users  
 */
export const signInWithGoogleCustomer = async () => {
  try {
    // Use Better Auth's built-in social sign-in with customer callback
    const customerCallbackURL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? "http://localhost:4321/account/profile"
      : "https://blackliving.com/account/profile";
    
    await signIn.social({
      provider: "google",
      callbackURL: customerCallbackURL,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Customer Google login error:', error);
    return { success: false, error: 'Network error during customer Google login' };
  }
};

/**
 * Check current session status
 */
export const checkSession = async (): Promise<{ user: any; session: any; authenticated: boolean }> => {
  try {
    const baseURL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? "http://localhost:8787" 
      : "https://api.blackliving.com";
    
    const response = await fetch(`${baseURL}/api/auth/session`, {
      credentials: 'include',
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      return { user: null, session: null, authenticated: false };
    }
  } catch (error) {
    console.error('Session check failed:', error);
    return { user: null, session: null, authenticated: false };
  }
};