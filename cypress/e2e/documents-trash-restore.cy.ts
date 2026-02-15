/**
 * Trash: restore single document, restore multiple documents (read-only / stubbed list).
 * PRODUCTION RULE: Tests must only delete or modify data that the test itself created; never delete existing folders/files.
 */

const TRASH_DOC_ID_1 = 901;
const TRASH_DOC_ID_2 = 902;

const trashListResponse = {
  result: {
    success: true,
    data: [
      { id: TRASH_DOC_ID_1, title: 'Trashed Doc 1', barcode: 'TRASH-1', status: 'trashed' },
      { id: TRASH_DOC_ID_2, title: 'Trashed Doc 2', barcode: 'TRASH-2', status: 'trashed' },
    ],
    pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
  },
};

describe('Documents trash and restore', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/documents/trash', (req) => {
      if (req.body?.params?.page !== undefined) {
        req.reply({ statusCode: 200, body: trashListResponse });
        return;
      }
      req.reply({ statusCode: 200, body: trashListResponse });
    }).as('getTrash');
  });

  it('restore single document: from trash list clicks Restore on row, asserts restore API', () => {
    cy.intercept('POST', '**/api/documents/restore', (req) => {
      expect(req.body?.ids).to.include(TRASH_DOC_ID_1);
      req.reply({ statusCode: 200, body: { result: { success: true } } });
    }).as('restoreDocument');

    cy.loginByToken('/documents/trash');
    cy.url().should('include', '/documents/trash');
    cy.get('[data-testid="documents-trash-page"]').should('be.visible');

    cy.contains('Trashed Doc 1').closest('tr').within(() => {
      cy.contains('button', 'Restore').click();
    });

    cy.wait('@restoreDocument').then((interception) => {
      const ids = (interception.request?.body as { ids?: number[] })?.ids ?? [];
      expect(ids).to.include(TRASH_DOC_ID_1);
    });
  });

  it('restore multiple documents: selects rows and Restore selected, asserts batch restore', () => {
    cy.intercept('POST', '**/api/documents/restore', (req) => {
      const ids = (req.body as { ids?: number[] })?.ids ?? [];
      expect(ids.length).to.be.greaterThan(1);
      req.reply({ statusCode: 200, body: { result: { success: true } } });
    }).as('restoreDocument');

    cy.loginByToken('/documents/trash');
    cy.get('[data-testid="documents-trash-page"]').should('be.visible');

    cy.get('tbody input[type="checkbox"]').first().click();
    cy.get('tbody input[type="checkbox"]').eq(1).click();
    cy.get('[data-testid="trash-restore-selected"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', 'Restore').click();
    });

    cy.wait('@restoreDocument').then((interception) => {
      const ids = (interception.request?.body as { ids?: number[] })?.ids ?? [];
      expect(ids).to.include(TRASH_DOC_ID_1);
      expect(ids).to.include(TRASH_DOC_ID_2);
    });
  });
});
