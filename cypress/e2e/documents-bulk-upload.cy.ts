/**
 * Multiple file uploads: bulk upload sub-documents (start job, upload files, progress).
 */

const FOLDER_ID = 100;
const JOB_ID = 'e2e-job-1';

const adminDepartments = { result: { success: true, data: [{ id: 1, name: 'Finance', code: 'FIN' }] } };
const adminDocumentTypes = { result: { success: true, data: [{ id: 1, name: 'Invoice', code: 'INV' }] } };
const foldersList = { result: { folders: [{ id: FOLDER_ID, name: 'Test Folder', code: 'TF', department_id: 1 }] } };

describe('Multiple file uploads (bulk)', () => {
  beforeEach(() => {
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

    cy.get('select[name="upload_kind"]').select('sub');
    cy.get('select[name="department_id"]').select('1');
    cy.get('select[name="document_type_id"]').select('1');
    cy.get('select[name="folder_id"]').select(String(FOLDER_ID));
    cy.get('input[name="title"]').clear().type('Bulk title');
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
