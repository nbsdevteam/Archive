/**
 * Folder detail: transfer document(s) to another folder only.
 * PRODUCTION RULE: Tests must not delete folders or existing files; only operate on test-created data or read-only flows.
 */

const FOLDER_ID = 777;
const DOC_ID_1 = 888;
const DOC_ID_2 = 889;
const TARGET_FOLDER_ID = 778;

const folderDetailResponse = {
  result: {
    folder: { id: FOLDER_ID, name: 'Source Folder', code: 'SRC', department_id: 1, state: 'active', document_count: 2 },
    data: [
      { id: DOC_ID_1, title: 'Sub Doc 1', barcode: 'SUB-1', department_id: 1, folder_id: FOLDER_ID, folder_role: 'sub' },
      { id: DOC_ID_2, title: 'Sub Doc 2', barcode: 'SUB-2', department_id: 1, folder_id: FOLDER_ID, folder_role: 'sub' },
    ],
    documents: [
      { id: DOC_ID_1, title: 'Sub Doc 1', barcode: 'SUB-1', department_id: 1, folder_id: FOLDER_ID, folder_role: 'sub' },
      { id: DOC_ID_2, title: 'Sub Doc 2', barcode: 'SUB-2', department_id: 1, folder_id: FOLDER_ID, folder_role: 'sub' },
    ],
  },
};

const foldersList = {
  result: { folders: [{ id: FOLDER_ID, name: 'Source', code: 'SRC', department_id: 1 }, { id: TARGET_FOLDER_ID, name: 'Target Folder', code: 'TGT', department_id: 1 }] },
};

describe('Transfer documents', () => {
  beforeEach(() => {
    cy.intercept('POST', `**/api/folders/${FOLDER_ID}`, (req) => {
      if (req.url.includes('/documents')) {
        req.reply({ statusCode: 200, body: folderDetailResponse });
        return;
      }
      req.reply({ statusCode: 200, body: { result: folderDetailResponse.result.folder } });
    });
    cy.intercept('POST', `**/api/folders/${FOLDER_ID}/documents`, {
      statusCode: 200,
      body: { result: { folder: folderDetailResponse.result.folder, data: folderDetailResponse.result.data } },
    });
    cy.intercept('POST', (req) => {
      const u = req.url;
      if (!u.includes('/api/folders') || u.includes('/create') || u.includes('/update') || /\/api\/folders\/\d+(\/documents)?$/.test(u)) return;
      if (u.endsWith('/api/folders')) {
        req.reply({ statusCode: 200, body: foldersList });
        return;
      }
    });
  });

  it('transfer file(s): selects sub-doc, clicks Transfer, picks destination folder, confirms', () => {
    cy.intercept('POST', '**/api/documents/batch/move-folder', (req) => {
      const params = (req.body as { params?: { document_ids?: number[]; target_folder_id?: number } })?.params;
      expect(params?.document_ids).to.include(DOC_ID_1);
      expect(params?.target_folder_id).to.eq(TARGET_FOLDER_ID);
      req.reply({ statusCode: 200, body: { result: { success: true } } });
    }).as('transferDocuments');

    cy.loginByToken(`/folders/${FOLDER_ID}`);
    cy.url().should('include', `/folders/${FOLDER_ID}`);

    cy.contains('Sub Doc 1').closest('tr').within(() => {
      cy.contains('button', 'Transfer').click();
    });

    cy.get('[data-testid="transfer-folder-select"]').select(String(TARGET_FOLDER_ID));
    cy.get('[data-testid="transfer-confirm-btn"]').click();

    cy.wait('@transferDocuments');
  });
});
