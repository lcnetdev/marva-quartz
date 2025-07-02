// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests-playwright',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  // firefox tests seem to timeout when tests run in parallel, event with a 90s timeout
  // removing parallel tests gets rid of the timeouts, but increases the time it takes for the tests.
  // Event max 2 workers could cause firefox to timeout.
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  timeout: 45 * 1000,  // set timeout to 45s, less 30 can lead to a timeout before the MARC refreshes

  /* Configure projects for major browsers */
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.js/ }, // Setup project


    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'],
           storageState: 'tests-playwright/.auth/user.json', // Use prepared auth state
       },
       dependencies: ['setup'], // setup as a dependency project

    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'],
        storageState: 'tests-playwright/.auth/user.json', // Use prepared auth state
      },
      dependencies: ['setup'], // setup as a dependency project

    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev-e2e',
    url: 'http://localhost:5555',
    reuseExistingServer: !process.env.CI,
  },
});

