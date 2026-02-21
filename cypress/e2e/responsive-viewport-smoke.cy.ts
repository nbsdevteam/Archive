/**
 * Responsive viewport smoke: visit Documents, Folders, Search at mobile/tablet viewport
 * and assert no horizontal page overflow. Read-only; no delete or data changes.
 * PRODUCTION RULE: Read-only; no delete/permanent delete/batch delete.
 */

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };

function assertNoHorizontalOverflow() {
  cy.document().then((doc) => {
    const scrollWidth = (doc.documentElement ?? doc.body).scrollWidth;
    const clientWidth = doc.documentElement?.clientWidth ?? doc.body.clientWidth;
    expect(scrollWidth, 'page should not have horizontal overflow').to.be.lte(clientWidth + 1);
  });
}

describe('Responsive viewport smoke', () => {
  it('Documents, Folders, Search at mobile viewport have no horizontal overflow', () => {
    cy.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
    cy.loginByToken('/documents');
    cy.url().should('include', '/documents');
    cy.get('body').should('be.visible');
    assertNoHorizontalOverflow();

    cy.visit('/folders');
    cy.url().should('include', '/folders');
    assertNoHorizontalOverflow();

    cy.visit('/search');
    cy.url().should('include', '/search');
    assertNoHorizontalOverflow();
  });

  it('Documents, Folders, Search at tablet viewport have no horizontal overflow', () => {
    cy.viewport(TABLET_VIEWPORT.width, TABLET_VIEWPORT.height);
    cy.loginByToken('/documents');
    cy.url().should('include', '/documents');
    assertNoHorizontalOverflow();

    cy.visit('/folders');
    cy.url().should('include', '/folders');
    assertNoHorizontalOverflow();

    cy.visit('/search');
    cy.url().should('include', '/search');
    assertNoHorizontalOverflow();
  });
});
