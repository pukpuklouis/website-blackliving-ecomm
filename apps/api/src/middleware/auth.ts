import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

/**
 * Middleware to require authentication
 */
export const requireAuth = () => {
  return createMiddleware(async (c, next) => {
    // Get user from context (this should be set by auth middleware earlier in the chain)
    const user = c.get('user');
    
    if (!user) {
      throw new HTTPException(401, {
        message: 'Authentication required',
      });
    }
    
    await next();
  });
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = () => {
  return createMiddleware(async (c, next) => {
    // Get user from context
    const user = c.get('user');
    
    if (!user) {
      throw new HTTPException(401, {
        message: 'Authentication required',
      });
    }
    
    if (user.role !== 'admin') {
      throw new HTTPException(403, {
        message: 'Admin access required',
      });
    }
    
    await next();
  });
};

/**
 * Middleware to require customer role (or admin)
 */
export const requireCustomer = () => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      throw new HTTPException(401, {
        message: 'Authentication required',
      });
    }
    
    if (user.role !== 'customer' && user.role !== 'admin') {
      throw new HTTPException(403, {
        message: 'Customer access required',
      });
    }
    
    await next();
  });
};