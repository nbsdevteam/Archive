/// <reference types="cypress" />

const FLASH_DURATION_MS = 2200;
const FLASH_Z_INDEX = 99999;

/**
 * Injects a centered full-screen overlay with the given message, waits, then removes it.
 * Use before each major flow so the viewer sees what is being tested.
 */
Cypress.Commands.add('flash', (message: string, durationMs: number = FLASH_DURATION_MS) => {
  cy.document().then((doc) => {
    const existing = doc.querySelector('[data-cy-flash]');
    if (existing) existing.remove();
    const el = doc.createElement('div');
    el.setAttribute('data-cy-flash', 'true');
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:' + FLASH_Z_INDEX,
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(0,0,0,0.75)',
      'color:#fff',
      'font-size:clamp(1.5rem,4vw,2.5rem)',
      'font-weight:700',
      'text-align:center',
      'padding:2rem',
      'pointer-events:none',
      'font-family:system-ui,sans-serif',
    ].join(';');
    el.textContent = message;
    doc.body.appendChild(el);
  });
  cy.wait(durationMs);
  cy.document().then((doc) => {
    const el = doc.querySelector('[data-cy-flash]');
    if (el) el.remove();
  });
});

/**
 * Returns a short unique suffix (timestamp + random 1–999) to avoid "name already exists" in E2E.
 * Use for document titles, folder names, attachment names, etc.
 */
function uniqueE2ESuffix(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 999) + 1}`;
}
/** Expose for specs that call Cypress.uniqueE2ESuffix() (legacy). */
(Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix = uniqueE2ESuffix;

/**
 * Command that yields a unique E2E suffix. Prefer this over Cypress.uniqueE2ESuffix() for Cypress 15+.
 * Usage: cy.getUniqueE2ESuffix().then((suffix) => { ... });
 */
Cypress.Commands.add('getUniqueE2ESuffix', () => cy.wrap(uniqueE2ESuffix()));

/**
 * Logs in via the UI as admin (username/password), then optionally visits a path.
 * Uses real login so the session persists and the app does not log out on refresh.
 * Credentials default to admin/admin; override with CYPRESS_LOGIN_USER / CYPRESS_LOGIN_PASSWORD or options.
 */
Cypress.Commands.add(
  'loginAsAdmin',
  (pathAfterLogin?: string, options?: { username?: string; password?: string }) => {
    const username = options?.username ?? Cypress.env('LOGIN_USER') ?? 'admin';
    const password = options?.password ?? Cypress.env('LOGIN_PASSWORD') ?? 'admin';

    cy.visit('/login');
    cy.get('#login-role-admin').check({ force: true });
    cy.get('#login-username').clear().type(username);
    cy.get('#login-password').clear().type(password);
    cy.get('form').submit();
    cy.url({ timeout: 15000 }).should('include', '/dashboard');

    if (pathAfterLogin && pathAfterLogin !== '/dashboard') {
      cy.visit(pathAfterLogin);
    }
  }
);

/**
 * Seeds access_token (and optional refresh_token) in localStorage via onBeforeLoad,
 * then visits the given path. Use when backend is stubbed and real login is not needed.
 */
Cypress.Commands.add(
  'loginByToken',
  (
    path: string = '/',
    options?: {
      accessToken?: string;
      refreshToken?: string;
    }
  ) => {
    const accessToken =
      options?.accessToken ?? Cypress.env('ACCESS_TOKEN') ?? 'e2e-test-access-token';
    const refreshToken = options?.refreshToken ?? Cypress.env('REFRESH_TOKEN');

    cy.visit(path, {
      onBeforeLoad(win: Window) {
        win.localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          win.localStorage.setItem('refresh_token', refreshToken);
        }
      },
    });
  }
);

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Log in via UI as admin (default admin/admin), then optionally visit path.
       * Use so the session is real and the app does not log out on refresh.
       */
      loginAsAdmin(pathAfterLogin?: string, options?: { username?: string; password?: string }): Chainable<void>;
      /**
       * Visit app with access_token set in localStorage (no UI login). Use when APIs are stubbed.
       */
      loginByToken(
        path?: string,
        options?: { accessToken?: string; refreshToken?: string }
      ): Chainable<void>;
      /**
       * Show a centered full-screen flash message for a short duration (default 2.2s), then remove it.
       */
      flash(message: string, durationMs?: number): Chainable<void>;
      /**
       * Yields a unique suffix string for E2E names (documents, folders, attachments). Use in .then((suffix) => { ... }).
       */
      getUniqueE2ESuffix(): Chainable<string>;
    }
  }
}

export {};
