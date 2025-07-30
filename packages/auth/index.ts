import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDB } from "@blackliving/db";

export const createAuth = (
  db: ReturnType<typeof createDB>,
  env: {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    NODE_ENV?: string;
    BETTER_AUTH_SECRET?: string;
  }
) => betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite", // Cloudflare D1 uses SQLite
  }),
  
  secret: env.BETTER_AUTH_SECRET || "dev-secret-key",
  
  providers: [
    {
      id: "email-password",
      name: "Email & Password",
    },
    // Only include Google provider if credentials are available
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? [{
      id: "google" as const,
      name: "Google",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }] : []),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "customer",
        validate: (value: string) => {
          return ["customer", "admin"].includes(value);
        },
      },
      phone: {
        type: "string",
        required: false,
      },
      preferences: {
        type: "object",
        defaultValue: {},
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
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Implement email sending logic
      console.log(`Send password reset email to ${user.email}: ${url}`);
    },
    sendVerificationEmail: async ({ user, url }) => {
      // Implement email sending logic
      console.log(`Send verification email to ${user.email}: ${url}`);
    },
  },

  socialProviders: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
    google: {
      enabled: true,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  } : {},

  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: true,
      domain: env.NODE_ENV === "production" ? ".blackliving.com" : "localhost",
    },
  },

  logger: {
    level: env.NODE_ENV === "development" ? "debug" : "error",
  },
});

// Export types (will be resolved when auth is created)
export type AuthInstance = ReturnType<typeof createAuth>;

// Middleware helper for Hono
export function createAuthMiddleware(auth: AuthInstance) {
  return async (c: any, next: any) => {
    const authRequest = new Request(c.req.raw.url, {
      method: c.req.raw.method,
      headers: c.req.raw.headers,
      body: c.req.raw.body,
    });

    try {
      const session = await auth.api.getSession({
        headers: authRequest.headers,
      });

      c.set('user', session?.user || null);
      c.set('session', session || null);
    } catch (error) {
      console.error('Auth middleware error:', error);
      c.set('user', null);
      c.set('session', null);
    }

    await next();
  };
}

// Admin role guard middleware
export function requireAdmin() {
  return async (c: any, next: any) => {
    const user = c.get('user');
    
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    await next();
  };
}

// Authentication guard middleware
export function requireAuth() {
  return async (c: any, next: any) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    await next();
  };
}