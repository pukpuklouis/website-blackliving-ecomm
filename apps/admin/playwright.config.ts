import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: 'html',
  
  use: {
    // Base URL for API tests
    baseURL: 'http://localhost:8787',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Global test timeout
    actionTimeout: 30000,
    
    // Specify Chromium execution path if needed
    launchOptions: {
      executablePath: '/Users/pukpuk/Library/Caches/ms-playwright/chromium_headless_shell-1182/chrome-mac/headless_shell',
    },
  },

  // Configure projects for major browsers (for UI tests)
  projects: [
    // API tests (no browser needed)
    {
      name: 'api-tests',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        // API tests don't need a browser
        headless: true,
      },
    },
    
    // UI tests with Chromium
    {
      name: 'chromium',
      dependencies: ['api-tests'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173', // Admin app URL for UI tests
      },
      testMatch: /.*\.ui\.spec\.ts/, // Separate UI tests from API tests
    },
  ],

  // Run setup files before other tests
  globalSetup: './tests/setup.ts',
  
  // Web Server for testing (optional - can be started manually)
  webServer: [
    {
      command: 'pnpm dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      cwd: '../admin', // Admin app
    },
    {
      command: 'pnpm dev',
      port: 8787,
      reuseExistingServer: !process.env.CI,
      cwd: '../api', // API server
    },
  ],
});