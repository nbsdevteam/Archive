import { defineConfig } from 'cypress';

/**
 * Cypress E2E config for local dev (Vite on port 3003).
 * Use npm run e2e:headed for visible runs; e2e:ci for headless.
 */
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3003',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    /** Optional: set commandDelay (ms) to slow down click/type so you can watch the UI (e.g. e2e:slow script). */
    env: { commandDelay: 0 },
  },
});
