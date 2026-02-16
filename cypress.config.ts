import * as fs from 'fs';
import * as path from 'path';
import { defineConfig } from 'cypress';
import cypressFailFast from 'cypress-fail-fast/plugin';

/**
 * Task: read Phase 1 folder IDs from disk. Returns { baseFolderId, targetFolderId } or null if file missing.
 * Uses projectRoot so the path is correct regardless of cwd.
 */
function readPhase1Ids(projectRoot: string): { baseFolderId: number; targetFolderId: number } | null {
  const filePath = path.join(projectRoot, 'cypress', '.phase1-ids.json');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
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
      const projectRoot = config.projectRoot ?? process.cwd();
      on('task', {
        readPhase1Ids: () => readPhase1Ids(projectRoot),
      });
      cypressFailFast(on, config);
      return config;
    },
  },
});
