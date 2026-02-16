import * as fs from 'fs';
import * as path from 'path';
import { defineConfig } from 'cypress';
import cypressFailFast from 'cypress-fail-fast/plugin';

/** Path to Phase 1 persisted folder IDs (used by Phase 2 to avoid /folders list). */
const PHASE1_IDS_PATH = path.join('cypress', '.phase1-ids.json');

/**
 * Task: read Phase 1 folder IDs from disk. Returns { baseFolderId, targetFolderId } or null if file missing.
 * Used by slow-smoke-real-api Phase 2 so it doesn't depend on the /folders list.
 */
function readPhase1Ids(): { baseFolderId: number; targetFolderId: number } | null {
  try {
    const raw = fs.readFileSync(PHASE1_IDS_PATH, 'utf8');
    const data = JSON.parse(raw) as { baseFolderId?: number; targetFolderId?: number };
    if (typeof data?.baseFolderId === 'number' && typeof data?.targetFolderId === 'number') {
      return { baseFolderId: data.baseFolderId, targetFolderId: data.targetFolderId };
    }
  } catch {
    // file missing or invalid
  }
  return null;
}

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
      on('task', {
        readPhase1Ids,
      });
      cypressFailFast(on, config);
      return config;
    },
  },
});
