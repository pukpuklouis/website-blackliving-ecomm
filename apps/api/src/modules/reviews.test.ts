import { describe, it, expect, beforeEach } from 'vitest';
import { useTestEnvironment, AuthMocks, ResponseAsserts, generateTestId } from '../lib/test-utils';

describe('Reviews API', () => {
  const { getEnv, resetAll } = useTestEnvironment();

  beforeEach(async () => {
    await resetAll();
  });

  describe('Caching', () => {
    it('should cache review listings', async () => {
      const testEnv = getEnv();
      
      // First request
      const response1 = await testEnv.fetch('http://localhost:8787/api/reviews');
      const data1 = await ResponseAsserts.expectSuccess(response1, 200);
      
      // Second request should be cached
      const response2 = await testEnv.fetch('http://localhost:8787/api/reviews');
      const data2 = await ResponseAsserts.expectSuccess(response2, 200);
      
      expect(data2.cached).toBe(true);
    });

    it('should cache review stats', async () => {
      const testEnv = getEnv();
      
      // First request
      const response1 = await testEnv.fetch('http://localhost:8787/api/reviews/stats');
      const data1 = await ResponseAsserts.expectSuccess(response1, 200);
      
      // Second request should be cached
      const response2 = await testEnv.fetch('http://localhost:8787/api/reviews/stats');
      const data2 = await ResponseAsserts.expectSuccess(response2, 200);
      
      expect(data2.cached).toBe(true);
    });
  });
});