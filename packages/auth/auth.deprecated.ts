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
  NODE_ENV: (() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost') return 'development';
      if (hostname.includes('staging')) return 'staging';
      return 'production';
    }
    return 'production';
  })(),
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
  baseURL: (() => {
    if (defaultEnv.NODE_ENV === 'production') {
      return 'https://blackliving-api.pukpuk-tw.workers.dev';
    }
    if (defaultEnv.NODE_ENV === 'staging') {
      return 'https://blackliving-api-staging.pukpuk-tw.workers.dev';
    }
    return 'http://localhost:8787'; // development
  })(),

  trustedOrigins: [
    // Development
    'http://localhost:4321', // Web app
    'http://localhost:5173', // Admin app
    'http://localhost:8787', // API server

    // Staging
    'https://staging.blackliving-web.pages.dev',
    'https://staging.blackliving-admin.pages.dev',
    'https://blackliving-api-staging.pukpuk-tw.workers.dev',

    // Production (current .pages.dev URLs)
    'https://blackliving-web.pages.dev',
    'https://blackliving-admin.pages.dev',
    'https://blackliving-api.pukpuk-tw.workers.dev',

    // Future custom domains (forward compatibility)
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
      domain: (() => {
        if (defaultEnv.NODE_ENV === 'production') return '.pages.dev';
        if (defaultEnv.NODE_ENV === 'staging') return '.pages.dev';
        return 'localhost'; // development
      })(),
    },
  },

  logger: {
    level: defaultEnv.NODE_ENV === 'development' ? 'debug' : 'error',
  },
});
