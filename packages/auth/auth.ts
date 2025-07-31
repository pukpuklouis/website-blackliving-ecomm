declare const process: any;
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// This is a configuration file for the CLI tool
// The actual auth instance is created in index.ts with runtime dependencies
export const auth = betterAuth({
  database: drizzleAdapter({} as any, {
    provider: "sqlite",
    usePlural: true,
  }),
  
  secret: process.env.SECRET_KEY || "dev-secret-key",
  
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // For development
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "customer",
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

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});
if (!process.env.SECRET_KEY) {
  console.warn("警告：正在使用預設的開發密鑰。這不適用於生產環境！請設定 SECRET_KEY 環境變數。");
}