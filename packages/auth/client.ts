import type { User as BetterAuthUser, Session } from "better-auth";
import { createAuthClient } from "better-auth/react";

// Regex for trailing slash removal
const TRAILING_SLASH_REGEX = /\/$/;

// Extended User type with role for this application
type User = BetterAuthUser & {
  role?: string;
};

// Get base URL with enhanced security validation
// Get base URL with enhanced security validation
const getBaseURL = () => {
  // Priority 1: Use environment variable if available (most flexible)
  if (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_API_URL) {
    return import.meta.env.PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    // Browser environment with security checks
    const hostname = window.location.hostname;

    // Validate hostname to prevent subdomain attacks
    const allowedHosts = [
      "localhost",
      "blackliving-web.pages.dev",
      "staging.blackliving-web.pages.dev",
      "blackliving-admin-staging.pukpuk-tw.workers.dev",
      "blackliving.com",
      "admin.blackliving.com",
    ];

    const isValidHost = allowedHosts.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );

    if (!isValidHost) {
      console.error("Invalid hostname detected:", hostname);
      throw new Error("Unauthorized domain access");
    }

    // Environment detection based on hostname (fallback)
    if (hostname === "localhost") {
      return "http://localhost:8787"; // Local API server
    }

    if (hostname.includes("staging")) {
      return "https://blackliving-api-staging.pukpuk-tw.workers.dev"; // Staging API
    }

    if (
      hostname.includes("pages.dev") ||
      hostname.includes("blackliving.com")
    ) {
      return "https://blackliving-api.pukpuk-tw.workers.dev"; // Production API
    }

    // Fallback to production for custom domains
    return "https://blackliving-api.pukpuk-tw.workers.dev";
  }

  // Server-side environment
  return process.env.NODE_ENV === "production"
    ? "https://blackliving-api.pukpuk-tw.workers.dev"
    : "http://localhost:8787";
};

// Production-ready Better Auth React client with enhanced security
export const authClient = createAuthClient({
  baseURL: getBaseURL(),

  // Enhanced fetch options for security
  fetchOptions: {
    credentials: "include" as const,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest", // CSRF protection
    },
  },

  // Session configuration with security
  session: {
    // Automatically refresh session when it's about to expire
    autoRefresh: true,
    // Refresh 5 minutes before expiry
    refreshThreshold: 5 * 60 * 1000,
  },

  // Enable debug logging in development only
  logger:
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? console
      : undefined,
});

// Export the main auth methods
export const { signIn, signOut, signUp, useSession } = authClient;

// Helper functions for OAuth flows

/**
 * Initiate Google OAuth for admin users
 */
export const signInWithGoogleAdmin = async () => {
  try {
    const baseURL = getBaseURL();

    const getAdminCallbackURL = () => {
      if (typeof window !== "undefined") {
        return new URL("/auth/callback", window.location.origin).toString();
      }

      if (typeof process !== "undefined" && process.env.PUBLIC_SITE_URL) {
        return `${process.env.PUBLIC_SITE_URL.replace(TRAILING_SLASH_REGEX, "")}/auth/callback`;
      }

      return "https://blackliving-admin-staging.pukpuk-tw.workers.dev/auth/callback";
    };

    const adminCallbackURL = getAdminCallbackURL();

    // Use the same direct API approach that works for customers
    const response = await fetch(`${baseURL}/api/auth/sign-in/social`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        provider: "google",
        callbackURL: adminCallbackURL,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url;
        return { success: true };
      }

      return { success: false, error: "No OAuth URL returned" };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.message || "OAuth request failed",
    };
  } catch (error) {
    console.error("Admin Google login error:", error);
    return { success: false, error: "Network error during admin Google login" };
  }
};

/**
 * Initiate Google OAuth for customer users
 */
export const signInWithGoogleCustomer = async () => {
  try {
    const getCustomerCallbackURL = () => {
      if (typeof window !== "undefined") {
        const hostname = window.location.hostname;

        if (hostname === "localhost") {
          return "http://localhost:4321/account/profile";
        }

        if (hostname.includes("staging")) {
          return "https://staging.blackliving-web.pages.dev/account/profile";
        }

        if (hostname.includes("blackliving-web.pages.dev")) {
          return "https://blackliving-web.pages.dev/account/profile";
        }

        // Future custom domain
        if (hostname.includes("blackliving.com")) {
          return "https://blackliving.com/account/profile";
        }
      }

      // Default fallback
      return "https://blackliving-web.pages.dev/account/profile";
    };

    // Use Better Auth's built-in social sign-in with customer callback
    const customerCallbackURL = getCustomerCallbackURL();

    await signIn.social({
      provider: "google",
      callbackURL: customerCallbackURL,
    });

    return { success: true };
  } catch (error) {
    console.error("Customer Google login error:", error);
    return {
      success: false,
      error: "Network error during customer Google login",
    };
  }
};

/**
 * Enhanced session validation with security checks
 */

// Session storage key for additional security metadata
const SESSION_METADATA_KEY = "auth_session_metadata";

type SessionMetadata = {
  fingerprint: string;
  lastActivity: number;
  ipAddress?: string;
  userAgent: string;
};

/**
 * Generate browser fingerprint for session security
 */
function generateBrowserFingerprint(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Browser fingerprint", 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas.toDataURL(),
  ].join("|");

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = hash * 31 + char;
  }

  return Math.abs(hash).toString(36);
}

/**
 * Enhanced session validation with security checks
 */
export async function validateSession() {
  try {
    const session = await authClient.getSession();

    if (!session.data) {
      clearSessionMetadata();
      return { valid: false, reason: "no_session" };
    }

    // Check browser fingerprint consistency
    const storedMetadata = getSessionMetadata();
    const currentFingerprint = generateBrowserFingerprint();

    if (storedMetadata && storedMetadata.fingerprint !== currentFingerprint) {
      console.warn("Session fingerprint mismatch detected");
      await authClient.signOut();
      clearSessionMetadata();
      return { valid: false, reason: "fingerprint_mismatch" };
    }

    // Update last activity
    updateSessionMetadata({
      fingerprint: currentFingerprint,
      lastActivity: Date.now(),
      userAgent: navigator.userAgent,
    });

    return {
      valid: true,
      session: session.data,
      user: session.data.user,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    clearSessionMetadata();
    return { valid: false, reason: "validation_error" };
  }
}

/**
 * Check current session status (uses Better Auth client)
 */
export const checkSession = async (): Promise<{
  user: User | null;
  session: Session | null;
  authenticated: boolean;
}> => {
  try {
    const sessionData = await authClient.getSession();

    if (sessionData.data) {
      // Initialize session metadata if user is authenticated
      if (sessionData.data.user) {
        updateSessionMetadata({
          fingerprint: generateBrowserFingerprint(),
          lastActivity: Date.now(),
          userAgent: navigator.userAgent,
        });
      }

      return {
        user: sessionData.data.user,
        session: sessionData.data.session,
        authenticated: !!sessionData.data.user,
      };
    }
    clearSessionMetadata();
    return { user: null, session: null, authenticated: false };
  } catch (error) {
    console.error("Session check failed:", error);
    clearSessionMetadata();
    return { user: null, session: null, authenticated: false };
  }
};

/**
 * Secure sign-out with cleanup
 */
export async function secureSignOut() {
  try {
    await signOut();
    clearSessionMetadata();

    // Clear any additional client-side data
    if (typeof window !== "undefined") {
      // Only clear auth-related data, not all localStorage
      const authKeys = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith("auth_") ||
          key.startsWith("session_") ||
          key.includes("better-auth")
      );

      for (const key of authKeys) {
        localStorage.removeItem(key);
      }
      sessionStorage.clear();
    }

    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    clearSessionMetadata();
    return { success: true }; // Always succeed for security
  }
}

/**
 * Session metadata management
 */
function getSessionMetadata(): SessionMetadata | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(SESSION_METADATA_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function updateSessionMetadata(metadata: Partial<SessionMetadata>) {
  if (typeof window === "undefined") {
    return;
  }

  const current = getSessionMetadata() || ({} as SessionMetadata);
  const updated = { ...current, ...metadata };

  try {
    localStorage.setItem(SESSION_METADATA_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn("Failed to store session metadata:", error);
  }
}

function clearSessionMetadata() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(SESSION_METADATA_KEY);
  } catch (error) {
    console.warn("Failed to clear session metadata:", error);
  }
}

/**
 * Role-based access control utilities
 */
export function hasRole(
  user: User | null,
  requiredRole: string | string[]
): boolean {
  if (!user?.role) {
    return false;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, "admin");
}

export function isCustomer(user: User | null): boolean {
  return hasRole(user, ["customer", "admin"]);
}

/**
 * Auto-refresh session in the background
 */
export function startSessionRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  // Refresh session every 5 minutes
  const refreshInterval = 5 * 60 * 1000;

  const intervalId = setInterval(async () => {
    try {
      await validateSession();
    } catch (error) {
      console.warn("Background session refresh failed:", error);
    }
  }, refreshInterval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
