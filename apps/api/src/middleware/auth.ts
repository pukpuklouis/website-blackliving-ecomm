import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { Context, Next } from 'hono';
import { AuthInstance } from '@blackliving/auth';

/**
 * Enhanced Better Auth middleware with security logging
 */
export function createEnhancedAuthMiddleware(auth: AuthInstance) {
  return async (c: Context, next: Next) => {
    try {
      // Get session using Better Auth's built-in method
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      // Set user and session in context
      c.set('user', session?.user || null);
      c.set('session', session?.session || null);

      // Log authentication events for security monitoring
      if (session?.user) {
        const ip =
          c.req.header('cf-connecting-ip') ||
          c.req.header('x-forwarded-for')?.split(',')[0] ||
          'unknown';

        console.log(`Authenticated request: user=${session.user.id}, ip=${ip}, path=${c.req.path}`);
      }
    } catch (error) {
      console.error('Enhanced auth middleware error:', error);
      c.set('user', null);
      c.set('session', null);
    }

    await next();
  };
}

/**
 * Middleware to require authentication with enhanced security logging
 */
export const requireAuth = () => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    if (!user) {
      console.warn(`Unauthorized access attempt from IP: ${ip}, path: ${c.req.path}`);
      throw new HTTPException(401, {
        message: 'Authentication required',
      });
    }

    await next();
  });
};

/**
 * Enhanced admin role guard with security logging
 */
export const requireAdmin = () => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    if (!user) {
      console.warn(`Unauthorized admin access attempt from IP: ${ip}, path: ${c.req.path}`);
      throw new HTTPException(401, {
        message: 'Authentication required',
      });
    }

    if (user.role !== 'admin') {
      console.warn(
        `Forbidden admin access attempt: user=${user.id}, role=${user.role}, ip=${ip}, path=${c.req.path}`
      );
      throw new HTTPException(403, {
        message: 'Admin access required',
      });
    }

    console.log(`Admin access granted: user=${user.id}, ip=${ip}, path=${c.req.path}`);
    await next();
  });
};

/**
 * Middleware to require customer role (or admin) with security logging
 */
export const requireCustomer = () => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    if (!user) {
      console.warn(`Unauthorized customer access attempt from IP: ${ip}, path: ${c.req.path}`);
      throw new HTTPException(401, {
        message: 'Authentication required',
      });
    }

    if (user.role !== 'customer' && user.role !== 'admin') {
      console.warn(
        `Forbidden customer access attempt: user=${user.id}, role=${user.role}, ip=${ip}, path=${c.req.path}`
      );
      throw new HTTPException(403, {
        message: 'Customer access required',
      });
    }

    await next();
  });
};

/**
 * Role-based access control middleware
 */
export function requireRole(requiredRole: string | string[]) {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    // Debug logging
    console.log('DEBUG requireRole - user object:', JSON.stringify(user, null, 2));
    console.log('DEBUG requireRole - required roles:', requiredRole);

    if (!user) {
      console.warn(`Unauthorized role access attempt from IP: ${ip}, path: ${c.req.path}`);
      throw new HTTPException(401, {
        message: 'Authentication required',
      });
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    console.log('DEBUG requireRole - user.role:', user.role, 'required:', roles);

    if (!roles.includes(user.role)) {
      console.warn(
        `Insufficient role access attempt: user=${user.id}, role=${user.role}, required=${roles.join('|')}, ip=${ip}, path=${c.req.path}`
      );
      throw new HTTPException(403, {
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    await next();
  });
}

/**
 * User ownership guard - ensures user can only access their own resources
 */
export function requireOwnership(userIdParam: string = 'userId') {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');
    const resourceUserId = c.req.param(userIdParam);
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    if (!user) {
      throw new HTTPException(401, {
        message: 'Authentication required',
      });
    }

    // Admin users can access any resource
    if (user.role === 'admin') {
      await next();
      return;
    }

    // Users can only access their own resources
    if (user.id !== resourceUserId) {
      console.warn(
        `Ownership violation attempt: user=${user.id}, attempted_access=${resourceUserId}, ip=${ip}, path=${c.req.path}`
      );
      throw new HTTPException(403, {
        message: 'Access denied. You can only access your own resources.',
      });
    }

    await next();
  });
}

/**
 * Session freshness guard - requires recent authentication for sensitive operations
 */
export function requireFreshSession(maxAgeMinutes: number = 30) {
  return createMiddleware(async (c, next) => {
    const session = c.get('session');
    const user = c.get('user');

    if (!user || !session) {
      throw new HTTPException(401, {
        message: 'Authentication required',
      });
    }

    // Check if session is fresh enough
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    const maxAge = maxAgeMinutes * 60 * 1000;

    if (sessionAge > maxAge) {
      console.warn(
        `Stale session access attempt: user=${user.id}, session_age=${Math.round(sessionAge / 60000)}min`
      );
      throw new HTTPException(403, {
        message: 'Session too old. Please re-authenticate for this operation.',
      });
    }

    await next();
  });
}

/**
 * Development-only middleware for testing purposes
 */
export function developmentOnly() {
  return createMiddleware(async (c, next) => {
    if (c.env.NODE_ENV !== 'development') {
      throw new HTTPException(404, {
        message: 'Not found',
      });
    }

    await next();
  });
}

/**
 * Audit logging middleware for sensitive operations
 */
export function auditLog(operation: string) {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    const auditData = {
      operation,
      userId: user?.id || 'anonymous',
      userRole: user?.role || 'none',
      ip,
      path: c.req.path,
      method: c.req.method,
      timestamp: new Date().toISOString(),
      userAgent: c.req.header('user-agent'),
    };

    console.log('AUDIT:', JSON.stringify(auditData));

    // TODO: Store audit logs in database or external service
    // await storeAuditLog(auditData);

    await next();
  });
}
