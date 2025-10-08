import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from 'hono-rate-limiter';
import { z } from 'zod';

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    limit: number;
    keyGenerator?: (c: Context) => string;
    skip?: (c: Context) => boolean;
  };
  requestSizeLimit: number; // bytes
  allowedOrigins: string[];
  csrfProtection: boolean;
  suspiciousActivityThreshold: number;
}

export const defaultSecurityConfig: SecurityConfig = {
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // requests per window
  },
  requestSizeLimit: 10 * 1024 * 1024, // 10MB
  allowedOrigins: [], // Will be populated from environment variables
  csrfProtection: true,
  suspiciousActivityThreshold: 50,
};

/**
 * Get allowed origins from environment variables
 */
function getAllowedOrigins(c: Context): string[] {
  const allowedOrigins = c.env.ALLOWED_ORIGINS;

  if (!allowedOrigins) {
    // Fallback for development - include all common dev ports
    console.warn('ALLOWED_ORIGINS not set, using development fallback');
    return [
      'http://localhost:4321', // Astro web app
      'http://localhost:5173', // React admin app
      'http://localhost:8787', // API worker
    ];
  }

  return allowedOrigins
    .split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);
}

/**
 * Comprehensive security middleware for API routes
 */
export function createSecurityMiddleware(config: Partial<SecurityConfig> = {}) {
  const securityConfig = { ...defaultSecurityConfig, ...config };

  return async (c: Context, next: Next) => {
    // Get environment-specific allowed origins
    const allowedOrigins = getAllowedOrigins(c);
    securityConfig.allowedOrigins = allowedOrigins;
    const isDevelopment = c.env.NODE_ENV === 'development';

    // Define CSP based on environment
    const csp = isDevelopment
      ? {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:', 'http://localhost:*'],
          scriptSrc: ["'self'", "'unsafe-eval'", 'http://localhost:*'],
          connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        }
      : {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          scriptSrc: ["'self'", "'unsafe-eval'"], // unsafe-eval needed for development
          connectSrc: ["'self'", 'https://api.blackliving.com'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        };

    // Apply security headers
    await secureHeaders({
      contentSecurityPolicy: csp,
      crossOriginEmbedderPolicy: false, // Disable for Cloudflare compatibility
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'cross-origin',
      originAgentCluster: '?1',
      referrerPolicy: 'strict-origin-when-cross-origin',
      strictTransportSecurity: 'max-age=31536000; includeSubDomains',
      xContentTypeOptions: 'nosniff',
      xDnsPrefetchControl: 'off',
      xDownloadOptions: 'noopen',
      xFrameOptions: 'DENY',
      xPermittedCrossDomainPolicies: 'none',
      xXssProtection: '1; mode=block',
      // Explicitly configure Permissions-Policy to avoid unsupported features
      permissionsPolicy: {
        accelerometer: [],
        'ambient-light-sensor': [],
        autoplay: [],
        battery: [],
        camera: [],
        'display-capture': [],
        'document-domain': [],
        'encrypted-media': [],
        'execution-while-not-rendered': [],
        'execution-while-out-of-viewport': [],
        fullscreen: ['self'],
        geolocation: [],
        gyroscope: [],
        'layout-animations': [],
        'legacy-image-formats': [],
        magnetometer: [],
        microphone: [],
        midi: [],
        'navigation-override': [],
        'oversized-images': [],
        payment: [],
        'picture-in-picture': [],
        'publickey-credentials-get': [],
        'sync-xhr': [],
        usb: [],
        'wake-lock': [],
        xr: [],
        // Explicitly exclude 'browsing-topics' to avoid browser warnings
      },
    })(c, next);

    // Request size validation
    const contentLength = c.req.header('content-length');
    if (contentLength && parseInt(contentLength) > securityConfig.requestSizeLimit) {
      throw new HTTPException(413, {
        message: `Request size exceeds limit of ${securityConfig.requestSizeLimit / 1024 / 1024}MB`,
      });
    }

    // Validate request headers for suspicious patterns
    const userAgent = c.req.header('user-agent');
    const suspiciousPatterns = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /masscan/i,
      /acunetix/i,
      /burp/i,
      /\bbot\b/i,
      /crawler/i,
      /spider/i,
    ];

    if (userAgent && suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
      console.warn(`Suspicious user agent detected: ${userAgent}`);
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Block common attack patterns in URL
    const url = c.req.url;
    const attackPatterns = [
      /\.\./, // Directory traversal
      /\/etc\/passwd/, // File access attempts
      /\/proc\//, // Process info access
      /\bscript\b/i, // Script injection
      /\bunion\b.*\bselect\b/i, // SQL injection
      /\bdrop\b.*\btable\b/i, // SQL injection
      /\binsert\b.*\binto\b/i, // SQL injection
      /<script[^>]*>/i, // XSS attempts
      /javascript:/i, // XSS attempts
    ];

    if (attackPatterns.some((pattern) => pattern.test(url))) {
      console.warn(`Malicious URL pattern detected: ${url}`);
      throw new HTTPException(403, { message: 'Access denied' });
    }

    await next();
  };
}

/**
 * Rate limiting middleware with IP-based tracking
 */
export function createRateLimitMiddleware(config: Partial<SecurityConfig['rateLimiting']> = {}) {
  const rateLimitConfig = { ...defaultSecurityConfig.rateLimiting, ...config };

  return async (c: Context, next: Next) => {
    const isDevelopment = c.env.NODE_ENV === 'development';

    if (isDevelopment) {
      return next();
    }

    return rateLimiter({
      windowMs: rateLimitConfig.windowMs,
      limit: rateLimitConfig.limit,
      standardHeaders: 'draft-6' as const,
      keyGenerator: (c: Context) => {
        // Use CF-Connecting-IP for Cloudflare, fallback to x-forwarded-for
        return (
          c.req.header('cf-connecting-ip') ||
          c.req.header('x-forwarded-for')?.split(',')[0] ||
          c.req.header('x-real-ip') ||
          'unknown'
        );
      },
      skip: (c: Context) => {
        // Skip rate limiting for health checks
        return c.req.path === '/' || c.req.path === '/health';
      },
      // Remove onLimitReached as it might not be supported
      // Rate limit errors will be handled by default behavior
    })(c, next);
  };
}

/**
 * Admin-specific rate limiting (stricter)
 */
export function createAdminRateLimitMiddleware() {
  return createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // Stricter limit for admin routes
  });
}

/**
 * Auth-specific rate limiting (very strict)
 */
export function createAuthRateLimitMiddleware() {
  return createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // Very strict for auth endpoints
  });
}

/**
 * Input sanitization middleware
 */
export function createInputSanitizationMiddleware() {
  return async (c: Context, next: Next) => {
    // Get request body if present
    const contentType = c.req.header('content-type');

    if (contentType?.includes('application/json')) {
      try {
        const body = await c.req.json();

        // Recursively sanitize all string values
        const sanitizedBody = sanitizeObject(body);

        // Replace request with sanitized version
        c.req.json = () => Promise.resolve(sanitizedBody);
      } catch (error) {
        // Invalid JSON
        throw new HTTPException(400, { message: 'Invalid JSON format' });
      }
    }

    await next();
  };
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
function sanitizeString(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/\0/g, '') // Remove null bytes
    .trim();
}

/**
 * CSRF protection middleware
 */
export function createCSRFMiddleware() {
  return async (c: Context, next: Next) => {
    const isDevelopment = c.env.NODE_ENV === 'development';
    if (isDevelopment) {
      return next();
    }

    const method = c.req.method;

    // Only check CSRF for state-changing operations
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      await next();
      return;
    }

    // Skip CSRF for API endpoints with valid Bearer tokens
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      await next();
      return;
    }

    // For form submissions, check CSRF token
    const origin = c.req.header('origin');
    const referer = c.req.header('referer');

    if (!origin && !referer) {
      throw new HTTPException(403, { message: 'Missing origin/referer header' });
    }

    const allowedOrigins = getAllowedOrigins(c);
    const isValidOrigin =
      origin &&
      allowedOrigins.some(
        (allowed) => origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, ''))
      );

    if (!isValidOrigin) {
      throw new HTTPException(403, { message: 'Invalid origin' });
    }

    await next();
  };
}

/**
 * IP blocking middleware for suspicious activity
 */
export function createIPBlockingMiddleware() {
  const suspiciousIPs = new Map<string, { count: number; firstSeen: number }>();
  const MAX_VIOLATIONS = 10;
  const BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Cleanup function to be called on each request (more efficient for serverless)
  const cleanup = () => {
    const now = Date.now();
    const ipsToDelete: string[] = [];

    suspiciousIPs.forEach((data, ip) => {
      if (now - data.firstSeen > BLOCK_DURATION) {
        ipsToDelete.push(ip);
      }
    });

    ipsToDelete.forEach((ip) => suspiciousIPs.delete(ip));
  };

  return async (c: Context, next: Next) => {
    const isDevelopment = c.env.NODE_ENV === 'development';
    if (isDevelopment) {
      return next();
    }

    // Cleanup old entries occasionally (every ~100 requests)
    if (Math.random() < 0.01) {
      cleanup();
    }

    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    const suspiciousData = suspiciousIPs.get(ip);

    if (suspiciousData && suspiciousData.count >= MAX_VIOLATIONS) {
      const timeSinceFirstViolation = Date.now() - suspiciousData.firstSeen;

      if (timeSinceFirstViolation < BLOCK_DURATION) {
        console.warn(`Blocked IP due to suspicious activity: ${ip}`);
        throw new HTTPException(403, {
          message: 'Access denied due to suspicious activity',
        });
      } else {
        // Reset after block duration
        suspiciousIPs.delete(ip);
      }
    }

    try {
      await next();
    } catch (error) {
      // Track 4xx and 5xx errors as potential suspicious activity
      if (error instanceof HTTPException && error.status >= 400) {
        const current = suspiciousIPs.get(ip) || { count: 0, firstSeen: Date.now() };
        current.count += 1;

        if (current.count === 1) {
          current.firstSeen = Date.now();
        }

        suspiciousIPs.set(ip, current);

        if (current.count >= MAX_VIOLATIONS) {
          console.warn(`IP marked as suspicious: ${ip} (${current.count} violations)`);
        }
      }

      throw error;
    }
  };
}

/**
 * Schema validation middleware factory
 */
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  target: 'json' | 'query' | 'param' = 'json'
) {
  return async (c: Context, next: Next) => {
    try {
      let data: any;

      switch (target) {
        case 'json':
          data = await c.req.json();
          break;
        case 'query':
          data = c.req.query();
          break;
        case 'param':
          data = c.req.param();
          break;
      }

      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        throw new HTTPException(400, {
          message: 'Validation failed',
          cause: { errors },
        });
      }

      // Store validated data
      c.set(`validated_${target}`, result.data);
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      throw new HTTPException(400, {
        message: `Invalid ${target} format`,
      });
    }

    await next();
  };
}
