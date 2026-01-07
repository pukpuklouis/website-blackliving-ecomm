import type { createDB } from "@blackliving/db";
import { accounts, sessions, users, verifications } from "@blackliving/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Context, Next } from "hono";

/**
 * Creates Better Auth instance with proper Cloudflare Workers integration
 * Follows Better Auth's recommended patterns for session-based authentication
 */
export const createAuth = (
  db: ReturnType<typeof createDB>,
  env: {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    NODE_ENV?: string;
    BETTER_AUTH_SECRET?: string;
    API_BASE_URL?: string;
    WEB_BASE_URL?: string;
    ADMIN_BASE_URL?: string;
  }
): ReturnType<typeof betterAuth> => {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite", // Cloudflare D1 uses SQLite
      usePlural: true,
      schema: {
        users,
        sessions,
        accounts,
        verifications,
      },
    }),

    secret: env.BETTER_AUTH_SECRET || "dev-secret-key-change-in-production",

    // API base URL where Better Auth endpoints are mounted
    baseURL:
      env.API_BASE_URL ||
      (() => {
        switch (env.NODE_ENV) {
          case "development":
            return "http://localhost:8787";
          case "staging":
            return "https://blackliving-api-staging.pukpuk-tw.workers.dev";
          default:
            return "https://blackliving-api.pukpuk-tw.workers.dev";
        }
      })(),

    trustedOrigins: [
      // Development
      "http://localhost:4321", // Web app
      "http://localhost:5173", // Admin app
      "http://localhost:8787", // API server

      // Staging
      "https://staging.blackliving-web.pages.dev",
      "https://staging.blackliving-admin.pages.dev",
      "https://blackliving-admin-staging.pukpuk-tw.workers.dev",
      "https://blackliving-api-staging.pukpuk-tw.workers.dev",

      // Production (current deployment URLs)
      "https://blackliving-web.pages.dev",
      "https://blackliving-admin.pages.dev",
      "https://blackliving-api.pukpuk-tw.workers.dev",

      // Custom domains (.tw)
      "https://blackliving.tw",
      "https://www.blackliving.tw",
      "https://admin.blackliving.tw",
      "https://api.blackliving.tw",
    ],

    // Use Better Auth's built-in Google provider
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CLIENT_SECRET || "",
        // Use correct 'scope' instead of 'scopes'
        scope: ["openid", "email", "profile"],
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },

    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "customer",
          required: false,
        },
        phone: {
          type: "string",
          required: false,
        },
        preferences: {
          type: "string", // Changed from "object" to "string" to store JSON
          defaultValue: "{}",
        },
      },
    },

    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Disable for development
      sendResetPassword: async ({ user, url, token }) => {
        // TODO: Implement email sending logic with Cloudflare Email Workers or Resend
        console.log(
          `Send password reset email to ${user.email}: ${url} (token: ${token})`
        );
        // Placeholder for async email sending - remove when implemented
        await Promise.resolve();
      },
      // Remove sendVerificationEmail as it's not supported in this version
    },

    // Better Auth uses server-side sessions, not JWT - remove JWT callbacks
    // Role-based access control handled through user.role field

    advanced: {
      // CRITICAL: Cross-origin cookie configuration for .pages.dev <-> .workers.dev
      // BetterAuth requires defaultCookieAttributes inside advanced, not top-level cookieOptions
      defaultCookieAttributes: {
        // CRITICAL: sameSite must be 'none' for cross-origin cookies
        // pages.dev -> workers.dev is cross-origin, so Lax/Strict won't work
        sameSite: env.NODE_ENV === "development" ? "lax" : "none",
        // CRITICAL: secure must be true for SameSite=None (production/staging)
        secure: env.NODE_ENV !== "development",
        httpOnly: true,
        path: "/",
        // Do NOT set domain - let browser handle it (workers.dev is on PSL)
      },
      // Disable cross-subdomain cookies (PSL prevents .workers.dev domain)
      crossSubDomainCookies: {
        enabled: false,
      },
    },

    logger: {
      level: env.NODE_ENV === "development" ? "debug" : "error",
    },
  });
};

// Export types
export type AuthInstance = ReturnType<typeof createAuth>;

/**
 * Better Auth Session Middleware for Hono
 * Uses Better Auth's built-in session validation
 */
export function createBetterAuthMiddleware(auth: AuthInstance) {
  return async (c: Context, next: Next) => {
    try {
      // Use Better Auth's built-in session validation
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      // Set user and session in Hono context
      c.set("user", session?.user || null);
      c.set("session", session?.session || null);
    } catch (error) {
      console.error("Better Auth middleware error:", error);
      c.set("user", null);
      c.set("session", null);
    }

    await next();
  };
}

/**
 * Admin role guard middleware
 * Uses user.role from Better Auth session
 */
export function requireAdmin() {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user || user.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    await next();
  };
}

/**
 * Authentication guard middleware
 * Requires valid session
 */
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    await next();
  };
}

/**
 * Utility to get current session from Better Auth
 * For use in API routes that need session info
 */
export async function getSessionFromRequest(
  auth: AuthInstance,
  request: Request
) {
  try {
    return await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error("Failed to get session:", error);
    return { user: null, session: null };
  }
}
