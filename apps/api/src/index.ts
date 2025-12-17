import { createAuth } from "@blackliving/auth";
import { createDB } from "@blackliving/db";
import { users } from "@blackliving/db/schema";
import type { Session, User } from "@blackliving/types";
import type {
  D1Database,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createCacheManager } from "./lib/cache";
import { createStorageManager } from "./lib/storage";

import { createEnhancedAuthMiddleware } from "./middleware/auth";
import admin from "./modules/admin";
import appointments from "./modules/appointments";
import authRouter from "./modules/auth";
import businessCooperation from "./modules/business-cooperation";
import contact from "./modules/contact";
import customers from "./modules/customers";
import newsletter from "./modules/newsletter";
import orders from "./modules/orders";
import pages from "./modules/pages";
import { postsRouter } from "./modules/posts";
// Import API modules
import products from "./modules/products";
import reservationsRouter from "./modules/reservations";
import reviews from "./modules/reviews";
import { SearchModule } from "./modules/search";
import settings from "./modules/settings";
import user from "./modules/user";
import analytics from "./routes/analytics";
import media from "./routes/media";
import searchRouter from "./routes/search";
import searchConfig from "./routes/search-config";
import searchKeys from "./routes/search-keys";
import searchReindex from "./routes/search-reindex";
import { LineNotificationService } from "./utils/line";

export type Env = {
  DB: D1Database;
  R2: R2Bucket;
  CACHE: KVNamespace;
  NODE_ENV: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALLOWED_ORIGINS: string;
  API_BASE_URL: string;
  WEB_BASE_URL: string;
  ADMIN_BASE_URL: string;
  R2_PUBLIC_URL: string;
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  JWT_SECRET: string;
};

const app = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof createDB>;
    cache: ReturnType<typeof createCacheManager>;
    storage: ReturnType<typeof createStorageManager>;
    auth: ReturnType<typeof createAuth>;
    search: SearchModule;
    line: LineNotificationService;
    user: User | null;
    session: Session | null;
  };
}>();

// Security Layer 1: Basic logging only (temporarily disable security)
app.use("*", logger());

// Security Layer 3: Enhanced CORS with production security
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      // Get allowed origins from environment variable
      const allowedOrigins = c.env.ALLOWED_ORIGINS
        ? c.env.ALLOWED_ORIGINS.split(",").map((o: string) => o.trim())
        : [];

      // Add common allowed origins as fallback
      const fallbackOrigins = [
        // Development origins
        "http://localhost:4321", // Web app
        "http://localhost:5173", // Admin app
        "http://localhost:8787", // API server
        // Production origins
        "https://blackliving.com",
        "https://www.blackliving.com",
        "https://admin.blackliving.com",
        "https://api.blackliving.com",
        // Staging origins
        "https://staging.blackliving-web.pages.dev",
        "https://staging.blackliving-admin.pages.dev",
        "https://blackliving-admin-staging.pukpuk-tw.workers.dev",
      ];

      const allAllowedOrigins = [...allowedOrigins, ...fallbackOrigins];

      if (!origin || allAllowedOrigins.includes(origin)) {
        return origin;
      }

      // Log suspicious origin attempts
      console.warn(
        `Blocked CORS request from unauthorized origin: ${origin}. Allowed: ${allAllowedOrigins.join(", ")}`
      );
      return;
    },
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "X-CSRF-Token",
      "X-API-Key",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
    maxAge: 86_400, // 24 hours
  })
);

// Security Layer 4: Disabled temporarily

// Initialize services middleware
app.use("*", async (c, next) => {
  const db = createDB(c.env.DB);
  const cache = createCacheManager(c.env.CACHE);
  const storage = createStorageManager(c.env.R2, c.env.R2_PUBLIC_URL);
  const auth = createAuth(db, {
    GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
    NODE_ENV: c.env.NODE_ENV,
    BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
    API_BASE_URL: c.env.API_BASE_URL,
    WEB_BASE_URL: c.env.WEB_BASE_URL,
    ADMIN_BASE_URL: c.env.ADMIN_BASE_URL,
  });

  c.set("db", db);
  c.set("cache", cache);
  c.set("storage", storage);
  c.set("auth", auth);
  c.set("search", new SearchModule(c));
  c.set("line", new LineNotificationService(c.env, db));

  await next();
});

// Security Layer 5: Enhanced Better Auth session handling
app.use("*", (c, next) => {
  const auth = c.get("auth");
  const enhancedAuthMiddleware = createEnhancedAuthMiddleware(auth);
  return enhancedAuthMiddleware(c, next);
});

// Health check
app.get("/", (c) =>
  c.json({
    message: "Black Living API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
);

app.route("/media", media);

app.route("/api/auth", authRouter);
app.route("/api/reservations", reservationsRouter);

app.get("/api/auth/test", (c) => c.json({ message: "Test route works" }));

// Note: Better Auth handles OAuth endpoints automatically via the /api/auth/* handler below
// Custom role assignment logic will be handled via middleware or callback hooks

// Role assignment endpoint - for upgrading users to admin after OAuth
app.post("/api/auth/assign-admin-role", async (c) => {
  try {
    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const db = c.get("db");

    // Update user role to admin
    const [updatedUser] = await db
      .update(users)
      .set({
        role: "admin",
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id))
      .returning();

    return c.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Role assignment error:", error);
    return c.json({ error: "Failed to assign admin role" }, 500);
  }
});

// Debug and Development Endpoints

// Session endpoint removed - Better Auth handler provides this automatically

// Debug endpoint to check environment variables
app.get("/api/auth/debug/env", (c) => {
  if (c.env.NODE_ENV !== "development") {
    return c.json({ error: "Only available in development" }, 403);
  }

  return c.json({
    NODE_ENV: c.env.NODE_ENV,
    hasGoogleClientId: !!c.env.GOOGLE_CLIENT_ID,
    googleClientIdLength: c.env.GOOGLE_CLIENT_ID?.length || 0,
    hasGoogleClientSecret: !!c.env.GOOGLE_CLIENT_SECRET,
    googleClientSecretLength: c.env.GOOGLE_CLIENT_SECRET?.length || 0,
    hasBetterAuthSecret: !!c.env.BETTER_AUTH_SECRET,
    betterAuthSecretLength: c.env.BETTER_AUTH_SECRET?.length || 0,
  });
});

// Debug endpoint to test Better Auth configuration
app.get("/api/auth/debug/config", (c) => {
  if (c.env.NODE_ENV !== "development") {
    return c.json({ error: "Only available in development" }, 403);
  }

  try {
    const auth = c.get("auth");

    if (!auth) {
      return c.json({ error: "Auth instance not found" }, 500);
    }

    // Get auth configuration (safely extract what we can)
    const baseURL =
      typeof auth.options?.baseURL === "string"
        ? auth.options.baseURL
        : "unknown";
    const hasGoogleProvider = !!auth.options?.socialProviders?.google;
    const googleClientId = auth.options?.socialProviders?.google?.clientId;

    return c.json({
      success: true,
      baseURL,
      hasGoogleProvider,
      googleClientIdPresent: !!googleClientId,
      googleClientIdLength: googleClientId?.length || 0,
    });
  } catch (error) {
    return c.json(
      {
        error: "Better Auth config check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Debug endpoint to test database connection
app.get("/api/auth/debug/db", async (c) => {
  if (c.env.NODE_ENV !== "development") {
    return c.json({ error: "Only available in development" }, 403);
  }

  try {
    const db = c.get("db");

    if (!db) {
      return c.json({ error: "Database instance not found" }, 500);
    }

    // Test raw database connection
    const rawQuery =
      "SELECT name FROM sqlite_master WHERE type='table' LIMIT 5";
    const rawResult = await c.env.DB.prepare(rawQuery).all();

    // Test Drizzle ORM query
    let drizzleResult: unknown[] | { error: string } | undefined;
    try {
      const { products: productsTable } = await import(
        "@blackliving/db/schema"
      );
      drizzleResult = await db.select().from(productsTable).limit(1);
    } catch (drizzleError) {
      drizzleResult = {
        error:
          drizzleError instanceof Error
            ? drizzleError.message
            : String(drizzleError),
      };
    }

    return c.json({
      success: true,
      hasDB: !!c.env.DB,
      hasDbInstance: !!db,
      rawQuery: {
        query: rawQuery,
        results: rawResult,
      },
      drizzleQuery: {
        results: drizzleResult,
      },
    });
  } catch (error) {
    return c.json(
      {
        error: "Database test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/api/auth/debug/sessions", async (c) => {
  if (c.env.NODE_ENV !== "development") {
    return c.json({ error: "Only available in development" }, 403);
  }

  try {
    const db = c.get("db");
    const { sessions } = await import("@blackliving/db/schema");
    const allSessions = await db.select().from(sessions);
    return c.json({ success: true, sessions: allSessions });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch sessions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Debug endpoint for development - force admin login
app.post("/api/auth/debug/force-admin-login", async (c) => {
  if (c.env.NODE_ENV !== "development") {
    return c.json({ error: "Only available in development" }, 403);
  }

  try {
    const { email = "pukpuk.tw@gmail.com" } = await c.req
      .json()
      .catch(() => ({}));
    const db = c.get("db");
    const auth = c.get("auth");

    // Ensure user exists and is admin
    let targetUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((r) => r[0]);

    if (targetUser) {
      // Update to admin
      const [updatedUser] = await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.id, targetUser.id))
        .returning();
      targetUser = updatedUser;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name: "Admin User",
          role: "admin",
          emailVerified: true,
        })
        .returning();
      targetUser = newUser;
    }

    // Use Better Auth to create session
    const signInRequest = new Request(
      `${c.req.url.replace("/debug/force-admin-login", "/sign-in/email")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetUser.email,
          password: "dev-login",
        }),
      }
    );

    const authResponse = await auth.handler(signInRequest);

    // Copy session cookies
    // The `getSetCookie` method is not available in all environments (e.g. older CF Workers).
    // A more compatible way is to iterate over the headers.
    authResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        c.header("Set-Cookie", value);
      }
    });

    return c.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Force admin login error:", error);
    return c.json({ error: "Failed to force admin login" }, 500);
  }
});

// Enhanced OAuth debugging endpoint
app.get("/api/auth/debug/oauth-flow", async (c) => {
  if (c.env.NODE_ENV !== "development") {
    return c.json({ error: "Only available in development" }, 403);
  }

  try {
    const auth = c.get("auth");
    const db = c.get("db");
    const {
      sessions: sessionsTable,
      users: usersTable,
      accounts: accountsTable,
    } = await import("@blackliving/db/schema");

    // Get current session info
    const currentSession = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    // Get recent database entries
    const recentSessions = await db
      .select()
      .from(sessionsTable)
      .orderBy(sessionsTable.createdAt)
      .limit(10);
    const recentUsers = await db
      .select()
      .from(usersTable)
      .orderBy(usersTable.createdAt)
      .limit(10);
    const recentAccounts = await db
      .select()
      .from(accountsTable)
      .orderBy(accountsTable.createdAt)
      .limit(10);

    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      currentSession: {
        hasSession: !!currentSession?.session,
        hasUser: !!currentSession?.user,
        sessionId: currentSession?.session?.id,
        userId: currentSession?.user?.id,
        userEmail: currentSession?.user?.email,
      },
      authConfig: {
        baseURL: auth.options?.baseURL,
        hasGoogleProvider: !!auth.options?.socialProviders?.google,
        googleClientId:
          auth.options?.socialProviders?.google?.clientId?.substring(0, 10) +
          "...",
        trustedOrigins: auth.options?.trustedOrigins,
      },
      database: {
        sessionsCount: recentSessions.length,
        usersCount: recentUsers.length,
        accountsCount: recentAccounts.length,
        recentSessions: recentSessions.map((s) => ({
          id: s.id,
          userId: s.userId,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          createdAt: s.createdAt,
        })),
        recentUsers: recentUsers.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          createdAt: u.createdAt,
        })),
        recentAccounts: recentAccounts.map((a) => ({
          id: a.id,
          userId: a.userId,
          providerId: a.providerId,
          accountId: a.accountId,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("OAuth debug error:", error);
    return c.json(
      {
        error: "OAuth debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Security Layer 6: Disabled temporarily

// Better Auth integration - handles all remaining /api/auth/* routes
// MUST be placed AFTER custom auth routes to avoid intercepting them
app.all("/api/auth/*", async (c) => {
  try {
    const auth = c.get("auth");

    console.log("🔄 Better Auth Handler Called:", {
      method: c.req.method,
      path: c.req.path,
      url: c.req.url,
      headers: {
        cookie: c.req.header("cookie"),
        origin: c.req.header("origin"),
        referer: c.req.header("referer"),
        userAgent: `${c.req.header("user-agent")?.substring(0, 50)}...`,
      },
      timestamp: new Date().toISOString(),
    });

    // Better Auth expects a standard Request object
    const response = await auth.handler(c.req.raw);

    // Log response details for debugging
    console.log("📤 Better Auth Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(
        Array.from(response.headers as unknown as Iterable<[string, string]>)
      ),
      hasCookies: response.headers.has("set-cookie"),
      cookies: response.headers.get("set-cookie"),
    });

    return response;
  } catch (error) {
    console.error("Better Auth handler error:", error);
    return c.json(
      {
        error: "Authentication service error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});
// Security Layer 7: Disabled temporarily

// API Routes
app.route("/api/products", products);
app.route("/api/orders", orders);
app.route("/api/appointments", appointments);
app.route("/api/customers", customers);
app.route("/api/admin", admin);
app.route("/api/reviews", reviews);
app.route("/api/newsletter", newsletter);
app.route("/api/contact", contact);
app.route("/api/user", user);
app.route("/api/posts", postsRouter);
app.route("/api/pages", pages);
app.route("/api/settings", settings);
app.route("/api/business-cooperation", businessCooperation);
app.route("/api/search", searchRouter);
app.route("/api/search", searchConfig);
app.route("/api/search", searchReindex);
app.route("/api/search/keys", searchKeys);
app.route("/api/analytics", analytics);

// 404 handler
app.notFound((c) =>
  c.json(
    { error: "Not Found", message: "The requested endpoint does not exist" },
    404
  )
);

// Error handler
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message:
        c.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    },
    500
  );
});

export default app;
