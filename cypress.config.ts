import { defineConfig } from 'cypress';
import cypressFailFast from 'cypress-fail-fast/plugin';

/**
 * Cypress E2E config for local dev (Vite on port 3003).
 * Use npm run e2e:headed for visible runs; e2e:ci for headless.
 * Fail-fast: on first test failure the run stops (no further specs/tests) so you can debug. Set FAIL_FAST_PLUGIN=false to disable.
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
    setupNodeEvents(on, config) {
      cypressFailFast(on, config);
      return config;
    },
  },
});
