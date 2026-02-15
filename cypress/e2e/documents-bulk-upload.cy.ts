/**
 * Multiple file uploads: bulk upload sub-documents (start job, upload files, progress).
 * PRODUCTION RULE: No delete folder, no permanent delete, no batch delete from /documents.
 */

const FOLDER_ID = 100;
const JOB_ID = 'e2e-job-1';

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

  it('multiple file uploads: selects sub-doc, adds multiple files, submits and asserts bulk start + upload', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const title = `Bulk title ${suffix}`;
    let startPayload: Record<string, unknown> = {};
    let uploadPayload: { files?: unknown[] } = {};
    cy.intercept('POST', '**/api/documents/bulk-upload/start', (req) => {
      startPayload = (req.body as { params?: Record<string, unknown> })?.params ?? {};
      req.reply({ statusCode: 200, body: { result: { success: true, data: { job_id: JOB_ID } } } });
    }).as('bulkStart');
    cy.intercept('POST', /\/api\/documents\/bulk-upload\/[^/]+\/upload/, (req) => {
      const body = req.body as { params?: { files?: unknown[] } };
      if (body?.params?.files) uploadPayload = { files: body.params.files };
      req.reply({ statusCode: 200, body: { result: { success: true } } });
    }).as('bulkUpload');
    cy.intercept('POST', /\/api\/documents\/bulk-upload\/[^/]+\/progress/, {
      statusCode: 200,
      body: { result: { success: true, data: { status: 'completed', total: 2, processed: 2, failed: 0 } } },
    }).as('bulkProgress');

    cy.loginByToken('/documents/upload');
    cy.get('[data-testid="upload-document-open-btn"]').click();

    cy.get('.react-select__control').eq(0).click();
    cy.get('.react-select__option').contains('Sub Document').click();
    cy.get('.react-select__control').eq(1).click();
    cy.get('.react-select__option').contains('Finance (FIN)').click();
    cy.get('.react-select__control').eq(2).click();
    cy.get('.react-select__option').contains('Invoice (INV)').click();
    cy.get('.react-select__control').eq(3).click();
    cy.get('.react-select__option').contains('Test Folder').click();
    cy.get('input[name="title"]').clear().type(title);
    cy.get('input[type="file"]').selectFile(
      [
        { contents: Cypress.Buffer.from('file1'), fileName: 'bulk1.pdf' },
        { contents: Cypress.Buffer.from('file2'), fileName: 'bulk2.pdf' },
      ],
      { force: true }
    );

    cy.get('[data-testid="upload-document-submit"]').click();

    cy.wait('@bulkStart').then(() => {
      expect(startPayload).to.have.property('folder_id', FOLDER_ID);
      expect(startPayload).to.have.property('department_id', 1);
    });
    cy.wait('@bulkUpload').then(() => {
      expect(uploadPayload.files).to.be.an('array').with.length(2);
    });
  });
});
