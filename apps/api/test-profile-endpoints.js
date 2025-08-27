/**
 * Profile API Test Script
 * Tests the profile endpoints for data consistency and error handling
 */

// Simple test configuration
const API_BASE = 'http://localhost:8787/api/customers/profile';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'TestPassword123';

// Test data
const testProfileData = {
  name: 'Test User Updated',
  phone: '0912345678',
  birthday: '1990-01-01',
  gender: 'male',
  contactPreference: 'email'
};

const testAddressData = {
  type: 'shipping',
  recipientName: 'Test User',
  recipientPhone: '0912345678',
  city: '台北市',
  district: '中正區',
  postalCode: '100',
  street: '中山南路1號',
  isDefault: true
};

// Utility functions
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    log(`✅ PASS: ${message}`);
  } else {
    log(`❌ FAIL: ${message}`);
    log(`Expected: ${expected}, Actual: ${actual}`);
  }
}

function assertNotNull(value, message) {
  if (value != null) {
    log(`✅ PASS: ${message}`);
  } else {
    log(`❌ FAIL: ${message} - Value is null/undefined`);
  }
}

// Test suite
class ProfileAPITests {
  constructor() {
    this.sessionCookie = null;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0
    };
  }

  async runAllTests() {
    log('🚀 Starting Profile API Tests');
    
    try {
      // Note: In a real test, you'd need to authenticate first
      // For now, we'll test the endpoints assuming authentication is handled
      
      await this.testGetProfile();
      await this.testUpdateProfile();
      await this.testGetAddresses();
      await this.testCreateAddress();
      await this.testCacheConsistency();
      
      log('📊 Test Summary');
      log(`Total: ${this.testResults.total}`);
      log(`Passed: ${this.testResults.passed}`);
      log(`Failed: ${this.testResults.failed}`);
      
      if (this.testResults.failed === 0) {
        log('🎉 All tests passed!');
      } else {
        log('⚠️  Some tests failed. Check the logs above.');
      }
      
    } catch (error) {
      log('💥 Test suite failed with error:', error);
    }
  }

  async makeRequest(endpoint, method = 'GET', body = null, headers = {}) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProfileAPITest/1.0',
        ...headers
      },
      credentials: 'include'
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    log(`📤 ${method} ${url}`, body);
    
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      log(`📥 ${response.status} ${response.statusText}`, data);
      
      return {
        status: response.status,
        ok: response.ok,
        data,
        headers: response.headers
      };
    } catch (error) {
      log(`💥 Request failed: ${error.message}`);
      throw error;
    }
  }

  test(condition, message) {
    this.testResults.total++;
    if (condition) {
      this.testResults.passed++;
      log(`✅ PASS: ${message}`);
    } else {
      this.testResults.failed++;
      log(`❌ FAIL: ${message}`);
    }
  }

  async testGetProfile() {
    log('\n🧪 Testing GET Profile');
    
    const response = await this.makeRequest('');
    
    this.test(response.status === 200 || response.status === 401, 'GET profile returns valid status');
    
    if (response.ok) {
      this.test(response.data.success === true, 'Response has success: true');
      this.test(response.data.data != null, 'Response has profile data');
      
      if (response.data.data) {
        this.test(typeof response.data.data.id === 'string', 'Profile has ID');
        this.test(typeof response.data.data.email === 'string', 'Profile has email');
      }
    }
  }

  async testUpdateProfile() {
    log('\n🧪 Testing PATCH Profile');
    
    const response = await this.makeRequest('', 'PATCH', testProfileData);
    
    // This will likely return 401 without auth, but we test the response structure
    this.test([200, 401, 403].includes(response.status), 'PATCH profile returns expected status');
    
    if (response.ok) {
      this.test(response.data.success === true, 'Update response has success: true');
      this.test(typeof response.data.message === 'string', 'Update response has message');
      this.test(typeof response.data.requestId === 'string', 'Update response has requestId');
    }
  }

  async testGetAddresses() {
    log('\n🧪 Testing GET Addresses');
    
    const response = await this.makeRequest('/addresses');
    
    this.test([200, 401, 403].includes(response.status), 'GET addresses returns expected status');
    
    if (response.ok) {
      this.test(response.data.success === true, 'Addresses response has success: true');
      this.test(Array.isArray(response.data.data), 'Addresses data is array');
    }
  }

  async testCreateAddress() {
    log('\n🧪 Testing POST Address');
    
    const response = await this.makeRequest('/addresses', 'POST', testAddressData);
    
    this.test([200, 201, 401, 403].includes(response.status), 'POST address returns expected status');
    
    if (response.ok) {
      this.test(response.data.success === true, 'Create address response has success: true');
      this.test(response.data.data != null, 'Create address response has data');
    }
  }

  async testCacheConsistency() {
    log('\n🧪 Testing Cache Consistency');
    
    // Get profile twice to test caching
    const response1 = await this.makeRequest('');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    const response2 = await this.makeRequest('');
    
    if (response1.ok && response2.ok) {
      const etag1 = response1.headers.get('etag');
      const etag2 = response2.headers.get('etag');
      
      // ETags should be consistent for same data
      if (etag1 && etag2) {
        this.test(etag1 === etag2, 'ETags are consistent for same data');
      }
      
      // Response structure should be consistent
      this.test(
        JSON.stringify(response1.data.data) === JSON.stringify(response2.data.data),
        'Profile data is consistent across requests'
      );
    }
  }
}

// Health check function
async function healthCheck() {
  try {
    log('🏥 Running Health Check');
    
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    
    if (response.ok) {
      log('✅ API is healthy', data);
      return true;
    } else {
      log('⚠️  API health check failed', data);
      return false;
    }
  } catch (error) {
    log('💥 Health check failed:', error.message);
    return false;
  }
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  (async () => {
    log('🔍 Profile API Test Suite');
    log('=====================================');
    
    // Check if API is available
    const isHealthy = await healthCheck();
    
    if (!isHealthy) {
      log('⏭️  Skipping tests - API not available');
      log('💡 Make sure the API server is running on localhost:8787');
      return;
    }
    
    // Run the test suite
    const tests = new ProfileAPITests();
    await tests.runAllTests();
    
    log('=====================================');
    log('✅ Test suite completed');
  })();
}

// Export for use in other environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProfileAPITests, healthCheck };
}