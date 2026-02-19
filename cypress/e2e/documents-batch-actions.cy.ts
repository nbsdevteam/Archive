/**
 * Batch actions on Documents page: batch archive, mixed department (transfer blocked),
 * mixed status (no common action), main-files block modal. Stubbed APIs only; no real deletes.
 * PRODUCTION RULE: Only stub data; do not batch delete from /documents against production data.
 */

const DOC_ID_1 = 801;
const DOC_ID_2 = 802;
const TARGET_FOLDER_ID = 100;

/** Match POST to the documents list endpoint only (not /api/documents/123). */
function isDocumentsListRequest(url: string, body: { method?: string; params?: unknown }) {
  return body?.method === 'call' && body?.params != null && !url.includes('/api/documents/');
}

/** Two active sub-docs, same department (for batch archive and transfer). */
const documentsListSameDept = {
  result: {
    success: true,
    data: [
      { id: DOC_ID_1, title: 'Batch Sub 1', barcode: 'B1', status: 'active', department_id: 10, is_main_document: false },
      { id: DOC_ID_2, title: 'Batch Sub 2', barcode: 'B2', status: 'active', department_id: 10, is_main_document: false },
    ],
    pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
  },
};

/** Two docs, different departments (transfer should show same-department toast). */
const documentsListMixedDept = {
  result: {
    success: true,
    data: [
      { id: DOC_ID_1, title: 'Doc Dept A', barcode: 'DA', status: 'active', department_id: 10, is_main_document: false },
      { id: DOC_ID_2, title: 'Doc Dept B', barcode: 'DB', status: 'active', department_id: 20, is_main_document: false },
    ],
    pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
  },
};

/** One active, one archived (intersection: only Move to trash; Archive/Unarchive not both applicable). */
const documentsListMixedStatus = {
  result: {
    success: true,
    data: [
      { id: DOC_ID_1, title: 'Active Doc', barcode: 'AD', status: 'active', department_id: 10, is_main_document: false },
      { id: DOC_ID_2, title: 'Archived Doc', barcode: 'ARD', status: 'archived', department_id: 10, is_main_document: false },
    ],
    pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
  },
};

/** One main doc, one sub doc (trash should show main-files block modal). */
const documentsListMainAndSub = {
  result: {
    success: true,
    data: [
      { id: DOC_ID_1, title: 'Main File', barcode: 'MAIN', status: 'active', department_id: 10, is_main_document: true },
      { id: DOC_ID_2, title: 'Sub File', barcode: 'SUB', status: 'active', department_id: 10, is_main_document: false },
    ],
    pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
  },
};

describe('Documents batch actions', () => {
  it('batch archive: select two active sub-docs, Archive selected, confirm, asserts batch/archive API', () => {
    cy.intercept('POST', '**/api/documents*', (req) => {
      if (!isDocumentsListRequest(req.url, req.body || {})) {
        req.continue();
        return;
      }
      req.reply({ statusCode: 200, body: documentsListSameDept });
    }).as('getDocuments');
    cy.intercept('POST', '**/api/documents/batch/archive', (req) => {
      const params = (req.body as { params?: { document_ids?: number[] } })?.params;
      expect(params?.document_ids).to.include(DOC_ID_1);
      expect(params?.document_ids).to.include(DOC_ID_2);
      req.reply({ statusCode: 200, body: { result: { success: true } } });
    }).as('batchArchive');

    cy.loginByToken('/documents');
    cy.url().should('include', '/documents');
    cy.wait('@getDocuments');
    cy.get('tbody input[type="checkbox"]').first().click();
    cy.get('tbody input[type="checkbox"]').eq(1).click();
    cy.contains('button', 'Archive selected').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', 'Archive').click();
    });
    cy.wait('@batchArchive');
  });

  it('mixed department: select two docs from different depts, Transfer shows same-department toast', () => {
    cy.intercept('POST', '**/api/documents*', (req) => {
      if (!isDocumentsListRequest(req.url, req.body || {})) {
        req.continue();
        return;
      }
      req.reply({ statusCode: 200, body: documentsListMixedDept });
    }).as('getDocuments');
    cy.intercept('POST', '**/api/documents/batch/move-folder').as('batchMove');

    cy.loginByToken('/documents');
    cy.url().should('include', '/documents');
    cy.wait('@getDocuments');
    cy.get('tbody input[type="checkbox"]').first().click();
    cy.get('tbody input[type="checkbox"]').eq(1).click();
    cy.contains('button', 'Transfer selected').click();
    cy.contains('same department').should('be.visible');
    cy.get('@batchMove.all').then((interceptions) => {
      expect(interceptions.length).to.eq(0);
    });
  });

  it('mixed status: select active + archived, only Move selected to trash visible', () => {
    cy.intercept('POST', '**/api/documents*', (req) => {
      if (!isDocumentsListRequest(req.url, req.body || {})) {
        req.continue();
        return;
      }
      req.reply({ statusCode: 200, body: documentsListMixedStatus });
    }).as('getDocuments');

    cy.loginByToken('/documents');
    cy.url().should('include', '/documents');
    cy.wait('@getDocuments');
    cy.get('tbody input[type="checkbox"]').first().click();
    cy.get('tbody input[type="checkbox"]').eq(1).click();
    cy.contains('button', 'Move selected to trash').should('be.visible');
    cy.get('body').then(($body) => {
      const archiveBtn = $body.find('button').filter((_, el) => el.textContent?.includes('Archive selected'));
      expect(archiveBtn.length).to.eq(0);
    });
  });

  it('main-files block: select main + sub, Move selected to trash shows main-files modal', () => {
    cy.intercept('POST', '**/api/documents*', (req) => {
      if (!isDocumentsListRequest(req.url, req.body || {})) {
        req.continue();
        return;
      }
      req.reply({ statusCode: 200, body: documentsListMainAndSub });
    }).as('getDocuments');

    cy.loginByToken('/documents');
    cy.url().should('include', '/documents');
    cy.wait('@getDocuments');
    cy.get('tbody input[type="checkbox"]').first().click();
    cy.get('tbody input[type="checkbox"]').eq(1).click();
    cy.contains('button', 'Move selected to trash').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Main').should('be.visible');
    cy.contains('Main File').should('be.visible');
    cy.contains('button', 'OK').click();
  });
});
