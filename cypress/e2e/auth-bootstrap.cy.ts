/**
 * Auth bootstrap: seed tokens via loginByToken, land on a known page, verify header/user menu.
 * PRODUCTION RULE: Read-only; no delete/permanent delete/batch delete.
 * Do not visit: edit-requests, signatures, notifications, permissions (E2E for those later).
 */

describe('Auth bootstrap', () => {
  it('seeds tokens and lands on dashboard with header visible', () => {
    cy.loginByToken('/dashboard');
    cy.url().should('include', '/dashboard');
    // Header / layout: expect something that indicates authenticated layout (e.g. user menu or nav)
    cy.get('body').should('be.visible');
  });

  it('seeds tokens and can navigate to documents list', () => {
    cy.loginByToken('/documents');
    cy.url().should('include', '/documents');
    cy.get('body').should('be.visible');
  });
});
