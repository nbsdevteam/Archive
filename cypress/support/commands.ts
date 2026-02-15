/// <reference types="cypress" />

/**
 * Seeds access_token (and optional refresh_token) in localStorage via onBeforeLoad,
 * then visits the given path. Use for token-based auth in E2E (no UI login).
 * Token can be set via CYPRESS_ACCESS_TOKEN / CYPRESS_REFRESH_TOKEN env or passed in options.
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
       * Visit app with access_token (and optional refresh_token) set in localStorage before load.
       * @param path - Path to visit (default '/')
       * @param options - Optional { accessToken, refreshToken } (otherwise from Cypress.env)
       */
      loginByToken(
        path?: string,
        options?: { accessToken?: string; refreshToken?: string }
      ): Chainable<void>;
    }
  }
}

export {};
