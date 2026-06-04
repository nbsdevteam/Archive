/**
 * Forgot / reset password UI (stubbed APIs). Read-only on real data.
 */

describe('Auth password recovery', () => {
  it('forgot password submits email and shows success', () => {
    cy.intercept('POST', '**/api/auth/forgot-password', {
      statusCode: 200,
      body: { success: true, message: 'ok' },
    }).as('forgotPassword');

    cy.visit('/forgot-password');
    cy.get('[data-testid="forgot-password-email"]').type('user@example.com');
    cy.get('[data-testid="forgot-password-submit"]').click();
    cy.wait('@forgotPassword');
    cy.contains(/receive reset instructions/i).should('be.visible');
  });

  it('reset password page requires token in URL', () => {
    cy.visit('/reset-password');
    cy.get('[data-testid="reset-password-submit"]').should('be.disabled');
  });

  it('reset password submits with token query param', () => {
    cy.intercept('POST', '**/api/auth/reset-password', {
      statusCode: 200,
      body: { success: true },
    }).as('resetPassword');

    cy.visit('/reset-password?token=test-token');
    cy.get('[data-testid="reset-password-new"]').type('NewPass123!');
    cy.get('[data-testid="reset-password-confirm"]').type('NewPass123!');
    cy.get('[data-testid="reset-password-submit"]').click();
    cy.wait('@resetPassword');
  });
});
