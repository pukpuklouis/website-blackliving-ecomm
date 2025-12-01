import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { setCookie } from 'hono/cookie';
import { SignJWT, jwtVerify } from 'jose';
import { and, eq, isNull } from 'drizzle-orm';
import { authTokens, users } from '@blackliving/db/schema';
import { createId } from '@paralleldrive/cuid2';
import type { Env } from '../index';
import { verifyTurnstile } from '../utils/turnstile';

const MAGIC_LINK_TTL_MINUTES = 15;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RATE_LIMIT_WINDOW_SECONDS = 60 * 15; // 15 minutes
const RATE_LIMIT_ATTEMPTS = 5;

const authRouter = new Hono<{
  Bindings: Env;
  Variables: {
    db: any;
    cache: any;
  };
}>();

const initiateSchema = z.object({
  email: z.string().email('請輸入有效的Email地址'),
  turnstileToken: z.string().min(1, '請完成驗證'),
  redirectTo: z.string().url().optional(),
});

const callbackSchema = z.object({
  token: z.string().min(10, '缺少驗證資訊'),
});

const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

const TOKEN_COOKIE_OPTIONS = (secure: boolean, maxAge: number) => ({
  httpOnly: true,
  secure,
  sameSite: secure ? 'none' : 'lax',
  path: '/',
  maxAge,
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashToken(token: string) {
  const encoded = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}



async function checkRateLimit(cache: any, key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const existing = (await cache.get(key)) || null;

  if (existing && existing.count >= limit && now - existing.firstAttempt < windowSeconds * 1000) {
    return false;
  }

  const updated =
    existing && now - existing.firstAttempt < windowSeconds * 1000
      ? { count: existing.count + 1, firstAttempt: existing.firstAttempt }
      : { count: 1, firstAttempt: now };

  await cache.set(key, updated, windowSeconds);
  return true;
}

async function sendMagicLinkEmail(c: any, email: string, link: string) {
  const apiKey = c.env.RESEND_API_KEY;
  const fromEmail = c.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error('Resend configuration missing');
  }

  const subject = 'Black Living - 登入您的預約帳戶';
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Black Living 預約驗證</h2>
      <p>請點擊以下按鈕完成登入，連結將在15分鐘後失效：</p>
      <p style="text-align: center;">
        <a href="${link}" style="display: inline-block; padding: 12px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">登入並完成預約</a>
      </p>
      <p>若按鈕無法使用，請將以下連結貼到瀏覽器網址列：</p>
      <p style="word-break: break-all; color: #555;">${link}</p>
      <p style="color: #999; font-size: 12px;">此連結僅能使用一次。</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to send magic link email:', errorText);
    throw new Error('Failed to send verification email');
  }
}

async function issueTokens(env: Env, user: { id: string; email: string }) {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret missing');
  }

  const key = new TextEncoder().encode(secret);

  const accessToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS)
    .sign(key);

  const refreshToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SECONDS)
    .sign(key);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000,
    refreshTokenExpiresAt: Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  };
}

async function storeRefreshToken(db: any, token: string, user: { id: string; email: string }) {
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

  await db.insert(authTokens).values({
    id: createId(),
    userId: user.id,
    email: user.email,
    tokenHash,
    type: 'refresh',
    context: JSON.stringify({}),
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function setAuthCookies(
  c: any,
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
  }
) {
  const secure = c.env.NODE_ENV === 'production';
  setCookie(
    c,
    'bl_access_token',
    tokens.accessToken,
    TOKEN_COOKIE_OPTIONS(secure, ACCESS_TOKEN_TTL_SECONDS)
  );
  setCookie(
    c,
    'bl_refresh_token',
    tokens.refreshToken,
    TOKEN_COOKIE_OPTIONS(secure, REFRESH_TOKEN_TTL_SECONDS)
  );
}

authRouter.post('/initiate', zValidator('json', initiateSchema), async (c) => {
  const { email, turnstileToken, redirectTo } = c.req.valid('json');
  const normalizedEmail = normalizeEmail(email);
  const cache = c.get('cache');
  const db = c.get('db');

  const emailRateKey = `magic:initiate:${normalizedEmail}`;
  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown';
  const ipRateKey = `magic:initiate:ip:${ip}`;

  const emailAllowed = await checkRateLimit(
    cache,
    emailRateKey,
    RATE_LIMIT_ATTEMPTS,
    RATE_LIMIT_WINDOW_SECONDS
  );
  const ipAllowed = await checkRateLimit(
    cache,
    ipRateKey,
    RATE_LIMIT_ATTEMPTS,
    RATE_LIMIT_WINDOW_SECONDS
  );

  if (!emailAllowed || !ipAllowed) {
    return c.json(
      {
        success: false,
        error: '請稍後再試，您請求驗證信的頻率過高',
      },
      429
    );
  }

  let verified = false;
  try {
    verified = await verifyTurnstile(c, turnstileToken);
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return c.json({ success: false, error: '驗證服務暫時不可用，請稍後再試' }, 503);
  }
  if (!verified) {
    return c.json({ success: false, error: 'Turnstile 驗證失敗，請重新操作' }, 400);
  }

  const token = generateToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const userId = existingUser?.id ?? null;

  // Invalidate previous unused magic links for this email
  await db
    .update(authTokens)
    .set({ usedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(authTokens.email, normalizedEmail),
        eq(authTokens.type, 'magic_link'),
        isNull(authTokens.usedAt)
      )
    );

  await db.insert(authTokens).values({
    id: createId(),
    userId,
    email: normalizedEmail,
    tokenHash,
    type: 'magic_link',
    context: JSON.stringify({ redirectTo: redirectTo || null }),
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const baseUrl = redirectTo || `${c.env.WEB_BASE_URL}/auth/magic-link`;
  const magicLink = `${baseUrl}#token=${token}`;

  await sendMagicLinkEmail(c, normalizedEmail, magicLink);

  return c.json({
    success: true,
    message: '驗證信已寄出，請在15分鐘內點擊信中的連結完成登入。',
  });
});

authRouter.post('/callback', zValidator('json', callbackSchema), async (c) => {
  const { token } = c.req.valid('json');
  const db = c.get('db');
  const now = new Date();

  const tokenHash = await hashToken(token);

  const [record] = await db
    .select()
    .from(authTokens)
    .where(and(eq(authTokens.tokenHash, tokenHash), eq(authTokens.type, 'magic_link')))
    .limit(1);

  if (!record) {
    return c.json({ success: false, error: '連結已失效，請重新請求 Magic Link。' }, 400);
  }

  if (record.usedAt) {
    return c.json({ success: false, error: '此連結已被使用，請重新請求 Magic Link。' }, 400);
  }

  if (record.expiresAt && new Date(record.expiresAt) < now) {
    return c.json({ success: false, error: '連結已過期，請重新請求 Magic Link。' }, 400);
  }

  const normalizedEmail = normalizeEmail(record.email);
  let redirectTo = `${c.env.WEB_BASE_URL}/appointment`;
  try {
    if (record.context) {
      const parsed =
        typeof record.context === 'string' ? JSON.parse(record.context) : record.context;
      if (parsed?.redirectTo && typeof parsed.redirectTo === 'string') {
        redirectTo = parsed.redirectTo;
      }
    }
  } catch (error) {
    console.error('Failed to parse magic link context:', error);
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  let user = existingUser;

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        id: createId(),
        email: normalizedEmail,
        emailVerified: true,
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
        role: 'customer',
      })
      .returning();

    user = newUser;
  } else if (!existingUser.emailVerified || !existingUser.emailVerifiedAt) {
    const [updated] = await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, existingUser.id))
      .returning();

    user = updated;
  }

  await db
    .update(authTokens)
    .set({ usedAt: now, updatedAt: now, userId: user.id })
    .where(eq(authTokens.id, record.id));

  const tokens = await issueTokens(c.env, { id: user.id, email: user.email });
  await storeRefreshToken(db, tokens.refreshToken, { id: user.id, email: user.email });
  await setAuthCookies(c, tokens);

  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      emailVerified: true,
    },
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    },
    redirectTo,
  });
});

authRouter.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken: bodyToken } = c.req.valid('json');
  const cookieToken = c.req.cookie('bl_refresh_token');
  const refreshToken = bodyToken || cookieToken;

  if (!refreshToken) {
    return c.json({ success: false, error: '缺少 Refresh Token' }, 401);
  }

  try {
    const key = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(refreshToken, key);

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const db = c.get('db');
    const tokenHash = await hashToken(refreshToken);

    const [record] = await db
      .select()
      .from(authTokens)
      .where(and(eq(authTokens.tokenHash, tokenHash), eq(authTokens.type, 'refresh')))
      .limit(1);

    if (!record) {
      throw new Error('Refresh token not found');
    }

    if (record.usedAt) {
      throw new Error('Refresh token already used');
    }

    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      throw new Error('Refresh token expired');
    }

    const [user] = await db.select().from(users).where(eq(users.id, record.userId!)).limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    await db
      .update(authTokens)
      .set({ usedAt: new Date(), updatedAt: new Date() })
      .where(eq(authTokens.id, record.id));

    const tokens = await issueTokens(c.env, { id: user.id, email: user.email });
    await storeRefreshToken(db, tokens.refreshToken, { id: user.id, email: user.email });
    await setAuthCookies(c, tokens);

    return c.json({
      success: true,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return c.json({ success: false, error: 'Refresh Token 驗證失敗，請重新登入' }, 401);
  }
});

export async function verifyAccessToken(token: string, env: Env) {
  const key = new TextEncoder().encode(env.JWT_SECRET);
  const { payload } = await jwtVerify(token, key);

  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return {
    userId: payload.sub as string,
    email: payload.email as string,
    expiresAt: payload.exp ? payload.exp * 1000 : null,
  };
}

export default authRouter;
