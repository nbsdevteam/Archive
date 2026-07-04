/**
 * Multiple file uploads: bulk upload sub-documents via single-call endpoint.
 * PRODUCTION RULE: No delete folder, no permanent delete, no batch delete from /documents.
 */

const FOLDER_ID = 100;

const adminDepartments = { result: { success: true, data: [{ id: 1, name: 'Finance', code: 'FIN' }] } };
const adminDocumentTypes = { result: { success: true, data: [{ id: 1, name: 'Invoice', code: 'INV' }] } };
const foldersList = { result: { folders: [{ id: FOLDER_ID, name: 'Test Folder', code: 'TF', department_id: 1 }] } };

describe('Multiple file uploads (bulk)', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.name === 'ZodError' || (err.message && err.message.includes('ZodError'))) return false;
      return true;
    });
    cy.intercept('POST', '**/api/departments', adminDepartments);
    cy.intercept('POST', '**/api/tags', { result: { success: true, data: [] } });
    cy.intercept('POST', '**/api/document-types', adminDocumentTypes);
    cy.intercept('POST', (req) => {
      const u = req.url;
      if (!u.includes('/api/folders')) return;
      if (u.includes('/create') || u.includes('/update') || /\/api\/folders\/\d+/.test(u)) return;
      req.reply({ statusCode: 200, body: foldersList });
    });
  });

  it('multiple file uploads: selects sub-doc, adds multiple files, submits via per-file upload/single (NBS v2)', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const title = `Bulk title ${suffix}`;

    let uploadIndex = 0;
    cy.intercept('POST', '**/api/documents/upload/single', (req) => {
      // Raw binary: Content-Type is the file MIME (e.g. application/pdf)
      expect(req.headers['content-type']).to.exist;
      uploadIndex += 1;
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          document_id: 100 + uploadIndex,
          document_name: uploadIndex === 1 ? 'bulk1' : 'bulk2',
          barcode: `NBS00010${uploadIndex}`,
          folder_id: FOLDER_ID,
          folder_name: 'Test Folder',
          ocr_queued: true,
        },
      });
    }).as('singleUpload');

    cy.loginByToken('/documents/upload');
    cy.get('[data-testid="upload-document-open-btn"]').click();

    cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click();
    cy.get('.react-select__option').contains('Sub Document').click();
    cy.get('[data-testid="department-select"]').find('.react-select__control').click();
    cy.get('.react-select__option').contains('Finance (FIN)').click();
    cy.get('[data-testid="document-type-select"]').find('.react-select__control').click();
    cy.get('.react-select__option').contains('Invoice (INV)').click();
    cy.get('[data-testid="folder-select"]').find('.react-select__control').click();
    cy.get('.react-select__option').contains('Test Folder').click();
    cy.get('[data-testid="upload-multiple-sub-checkbox"]').check({ force: true });
    cy.get('input[name="title"]').clear().type(title);
    cy.get('input[type="file"]').selectFile(
      [
        { contents: Cypress.Buffer.from('file1'), fileName: 'bulk1.pdf' },
        { contents: Cypress.Buffer.from('file2'), fileName: 'bulk2.pdf' },
      ],
      { force: true }
    );

    cy.get('[data-testid="upload-document-submit"]').click();

    cy.wait('@singleUpload');
    cy.wait('@singleUpload');
    cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
  });
});
