import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDB } from '@blackliving/db';
import * as schema from '@blackliving/db/schema';

/**
 * Production-ready Better Auth configuration with Google OAuth
 * This is a simplified version for client-side usage
 * The main auth instance is created in index.ts with runtime dependencies
 */

// Default environment for client-side access
const defaultEnv = {
  NODE_ENV:
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'development'
      : 'production',
  BETTER_AUTH_SECRET: 'dev-secret-key-change-in-production',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
};

export const auth = betterAuth({
  database: drizzleAdapter({} as any, {
    provider: 'sqlite',
    usePlural: true,
  }),

  secret: defaultEnv.BETTER_AUTH_SECRET,

  // API base URL where Better Auth endpoints are mounted
  baseURL:
    defaultEnv.NODE_ENV === 'production' ? 'https://api.blackliving.com' : 'http://localhost:8787',

  trustedOrigins: [
    'http://localhost:4321', // Web app
    'http://localhost:5173', // Admin app
    'http://localhost:8787', // API server
    'https://blackliving.com',
    'https://admin.blackliving.com',
    'https://api.blackliving.com',
  ],

  // Google OAuth provider
  socialProviders: {
    google: {
      clientId: defaultEnv.GOOGLE_CLIENT_ID,
      clientSecret: defaultEnv.GOOGLE_CLIENT_SECRET,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'customer',
        validate: (value: string) => {
          return ['customer', 'admin'].includes(value);
        },
      },
      phone: {
        type: 'string',
        required: false,
      },
      preferences: {
        type: 'object',
        defaultValue: {},
      },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for development
  },

  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: defaultEnv.NODE_ENV === 'production' ? '.blackliving.com' : 'localhost',
    },
  },

  logger: {
    level: defaultEnv.NODE_ENV === 'development' ? 'debug' : 'error',
  },
});
