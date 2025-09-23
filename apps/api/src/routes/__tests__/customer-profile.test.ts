/**
 * Customer Profile API Tests
 * Comprehensive tests for profile management endpoints
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Hono } from 'hono';
import { customerProfileRoutes } from '../customer-profile';

// Mock environment
const mockEnv = {
  DB: {
    prepare: jest.fn(),
    batch: jest.fn()
  },
  CACHE: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
};

// Mock context
const mockContext = {
  env: mockEnv,
  get: jest.fn(),
  set: jest.fn(),
  req: {
    json: jest.fn(),
    header: jest.fn(),
    method: 'GET',
    url: 'http://localhost/api/customers/profile',
    raw: new Request('http://localhost/api/customers/profile')
  },
  res: {
    headers: new Headers()
  },
  var: {
    user: {
      id: 'user-123',
      email: 'test@example.com'
    }
  },
  json: jest.fn(),
  text: jest.fn(),
  html: jest.fn(),
  status: jest.fn(),
  header: jest.fn()
};

// Mock database responses
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '0912345678',
  image: null,
  role: 'customer',
  preferences: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockCustomerProfile = {
  user_id: 'user-123',
  birthday: '1990-01-01',
  gender: 'male',
  contact_preference: 'email',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockAddress = {
  id: 'addr-123',
  user_id: 'user-123',
  type: 'shipping',
  recipient_name: 'Test User',
  recipient_phone: '0912345678',
  city: '台北市',
  district: '中正區',
  postal_code: '100',
  street: '中山南路1號',
  is_default: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('Customer Profile API', () => {
  const app = new Hono();
  app.route('/api/customers/profile', customerProfileRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful DB preparations
    mockEnv.DB.prepare.mockReturnValue({
      first: jest.fn(),
      all: jest.fn(),
      run: jest.fn()
    });
    
    mockContext.json.mockImplementation((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers()
    }));
  });

  describe('GET /api/customers/profile', () => {
    it('should return user profile successfully', async () => {
      // Mock DB queries
      const userQuery = mockEnv.DB.prepare();
      userQuery.first.mockResolvedValue(mockUser);
      
      const profileQuery = mockEnv.DB.prepare();
      profileQuery.first.mockResolvedValue(mockCustomerProfile);
      
      mockEnv.DB.prepare
        .mockReturnValueOnce(userQuery)
        .mockReturnValueOnce(profileQuery);

      // Mock cache miss
      mockEnv.CACHE.get.mockResolvedValue(null);

      const response = await app.request('/api/customers/profile', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '0912345678',
        image: null,
        role: 'customer',
        preferences: {},
        birthday: '1990-01-01',
        gender: 'male',
        contactPreference: 'email'
      });
    });

    it('should return cached profile when available', async () => {
      const cachedProfile = {
        id: 'user-123',
        name: 'Cached User',
        email: 'test@example.com'
      };

      mockEnv.CACHE.get.mockResolvedValue(JSON.stringify(cachedProfile));

      const response = await app.request('/api/customers/profile', {
        headers: { 
          'Authorization': 'Bearer valid-token',
          'If-None-Match': '"user-123-hash"'
        }
      });

      // Should return 304 Not Modified for matching ETag
      expect(response.status).toBe(304);
    });

    it('should handle user not found', async () => {
      const userQuery = mockEnv.DB.prepare();
      userQuery.first.mockResolvedValue(null);
      
      mockEnv.DB.prepare.mockReturnValue(userQuery);
      mockEnv.CACHE.get.mockResolvedValue(null);

      const response = await app.request('/api/customers/profile', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      const userQuery = mockEnv.DB.prepare();
      userQuery.first.mockRejectedValue(new Error('Database connection failed'));
      
      mockEnv.DB.prepare.mockReturnValue(userQuery);
      mockEnv.CACHE.get.mockResolvedValue(null);

      const response = await app.request('/api/customers/profile', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PATCH /api/customers/profile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '0987654321',
        birthday: '1985-06-15',
        gender: 'female',
        contactPreference: 'phone'
      };

      // Mock successful update
      const updateQuery = mockEnv.DB.prepare();
      updateQuery.run.mockResolvedValue({ success: true, changes: 1 });
      
      mockEnv.DB.prepare.mockReturnValue(updateQuery);

      const response = await app.request('/api/customers/profile', {
        method: 'PATCH',
        headers: { 
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Profile updated successfully');
      expect(data.requestId).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        email: 'invalid-email' // Invalid email format
      };

      const response = await app.request('/api/customers/profile', {
        method: 'PATCH',
        headers: { 
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });

    it('should handle database update failures', async () => {
      const updateData = { name: 'Valid Name' };

      const updateQuery = mockEnv.DB.prepare();
      updateQuery.run.mockRejectedValue(new Error('Update failed'));
      
      mockEnv.DB.prepare.mockReturnValue(updateQuery);

      const response = await app.request('/api/customers/profile', {
        method: 'PATCH',
        headers: { 
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should clear cache after successful update', async () => {
      const updateData = { name: 'Updated Name' };

      const updateQuery = mockEnv.DB.prepare();
      updateQuery.run.mockResolvedValue({ success: true, changes: 1 });
      
      mockEnv.DB.prepare.mockReturnValue(updateQuery);

      const response = await app.request('/api/customers/profile', {
        method: 'PATCH',
        headers: { 
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      expect(mockEnv.CACHE.delete).toHaveBeenCalledWith('profile_user-123');
    });
  });

  describe('GET /api/customers/profile/addresses', () => {
    it('should return user addresses successfully', async () => {
      const addressQuery = mockEnv.DB.prepare();
      addressQuery.all.mockResolvedValue([mockAddress]);
      
      mockEnv.DB.prepare.mockReturnValue(addressQuery);
      mockEnv.CACHE.get.mockResolvedValue(null);

      const response = await app.request('/api/customers/profile/addresses', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toEqual({
        id: 'addr-123',
        type: 'shipping',
        recipientName: 'Test User',
        recipientPhone: '0912345678',
        city: '台北市',
        district: '中正區',
        postalCode: '100',
        street: '中山南路1號',
        isDefault: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });
    });

    it('should return empty array when no addresses found', async () => {
      const addressQuery = mockEnv.DB.prepare();
      addressQuery.all.mockResolvedValue([]);
      
      mockEnv.DB.prepare.mockReturnValue(addressQuery);
      mockEnv.CACHE.get.mockResolvedValue(null);

      const response = await app.request('/api/customers/profile/addresses', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe('POST /api/customers/profile/addresses', () => {
    it('should create address successfully', async () => {
      const addressData = {
        type: 'shipping',
        recipientName: 'New Recipient',
        recipientPhone: '0987654321',
        city: '台北市',
        district: '大安區',
        postalCode: '106',
        street: '忠孝東路四段1號',
        isDefault: false
      };

      const insertQuery = mockEnv.DB.prepare();
      insertQuery.run.mockResolvedValue({ success: true, changes: 1 });
      
      mockEnv.DB.prepare.mockReturnValue(insertQuery);

      const response = await app.request('/api/customers/profile/addresses', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressData)
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Address created successfully');
    });

    it('should validate address data', async () => {
      const invalidData = {
        type: 'invalid-type',
        recipientName: '',
        recipientPhone: 'invalid-phone'
      };

      const response = await app.request('/api/customers/profile/addresses', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      const response = await app.request('/api/customers/profile');
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject invalid tokens', async () => {
      const response = await app.request('/api/customers/profile', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid token');
    });
  });

  describe('Request Logging', () => {
    it('should log all requests with request ID', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const userQuery = mockEnv.DB.prepare();
      userQuery.first.mockResolvedValue(mockUser);
      
      mockEnv.DB.prepare.mockReturnValue(userQuery);
      mockEnv.CACHE.get.mockResolvedValue(null);

      await app.request('/api/customers/profile', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PROFILE_API]'),
        expect.stringContaining('GET /api/customers/profile')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await app.request('/api/customers/profile', {
        method: 'PATCH',
        headers: { 
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: 'invalid-json'
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid JSON payload');
    });

    it('should include request ID in all responses', async () => {
      const response = await app.request('/api/customers/profile', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const data = await response.json();
      expect(data.requestId).toBeDefined();
      expect(typeof data.requestId).toBe('string');
    });
  });
});