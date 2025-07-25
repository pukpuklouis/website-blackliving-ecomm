import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@blackliving/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite", // Cloudflare D1 uses SQLite
  }),
  
  providers: [
    {
      id: "email-password",
      name: "Email & Password",
    },
    {
      id: "google",
      name: "Google",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
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

  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === "production" ? ".blackliving.com" : "localhost",
    },
  },

  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "error",
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;