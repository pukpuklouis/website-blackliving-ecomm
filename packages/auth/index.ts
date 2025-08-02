import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDB } from "@blackliving/db";
import { users, sessions, accounts, verifications } from "@blackliving/db/schema";

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
  }
) => {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite", // Cloudflare D1 uses SQLite
      usePlural: true,
      schema: {
        users: users,
        sessions: sessions,
        accounts: accounts,
        verifications: verifications,
      },
    }),
    
    secret: env.BETTER_AUTH_SECRET || "dev-secret-key-change-in-production",
    
    // API base URL where Better Auth endpoints are mounted
    baseURL: env.NODE_ENV === "production" 
      ? "https://api.blackliving.com" 
      : "http://localhost:8787",
    
    trustedOrigins: [
      "http://localhost:4321",  // Web app
      "http://localhost:5173",  // Admin app  
      "http://localhost:8787",  // API server
      "https://blackliving.com",
      "https://admin.blackliving.com",
      "https://api.blackliving.com",
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
          // Use correct 'validator' instead of 'validate'
          validator: (value: string) => {
            return ["customer", "admin"].includes(value);
          },
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
      sendResetPassword: async ({ user, url }) => {
        // TODO: Implement email sending logic with Cloudflare Email Workers or Resend
        console.log(`Send password reset email to ${user.email}: ${url}`);
      },
      // Remove sendVerificationEmail as it's not supported in this version
    },

    // Better Auth uses server-side sessions, not JWT - remove JWT callbacks
    // Role-based access control handled through user.role field
    
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: env.NODE_ENV === "production" ? ".blackliving.com" : "localhost",
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
  return async (c: any, next: any) => {
    try {
      // Use Better Auth's built-in session validation
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
      
      // Set user and session in Hono context
      c.set('user', session?.user || null);
      c.set('session', session?.session || null);
      
    } catch (error) {
      console.error('Better Auth middleware error:', error);
      c.set('user', null);
      c.set('session', null);
    }

    await next();
  };
}

/**
 * Admin role guard middleware
 * Uses user.role from Better Auth session
 */
export function requireAdmin() {
  return async (c: any, next: any) => {
    const user = c.get('user');
    
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    await next();
  };
}

/**
 * Authentication guard middleware  
 * Requires valid session
 */
export function requireAuth() {
  return async (c: any, next: any) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    await next();
  };
}

/**
 * Utility to get current session from Better Auth
 * For use in API routes that need session info
 */
export async function getSessionFromRequest(auth: AuthInstance, request: Request) {
  try {
    return await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error('Failed to get session:', error);
    return { user: null, session: null };
  }
}
