/**
 * Create new document (upload) and add secondary document (sub-document) to a folder.
 */

const DOC_ID = 999;
const FOLDER_ID = 100;

const adminDepartments = { result: { success: true, data: [{ id: 1, name: 'Finance', code: 'FIN' }] } };
const adminDocumentTypes = { result: { success: true, data: [{ id: 1, name: 'Invoice', code: 'INV' }] } };
const foldersList = { result: { folders: [{ id: FOLDER_ID, name: 'Test Folder', code: 'TF', department_id: 1 }] } };

describe('Create document and add secondary', () => {
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

  it('navigates to upload page, opens panel, fills form and submits create document request', () => {
    let uploadPayload: Record<string, unknown> = {};
    cy.intercept('POST', '**/api/documents/upload', (req) => {
      uploadPayload = req.body as Record<string, unknown>;
      req.reply({ statusCode: 200, body: { success: true, data: { id: DOC_ID } } });
    }).as('uploadDocument');

    cy.loginByToken('/documents/upload');
    cy.url().should('include', '/documents/upload');

    cy.get('[data-testid="upload-document-open-btn"]').click();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');

    cy.get('select[name="department_id"]').select('1');
    cy.get('select[name="document_type_id"]').select('1');
    cy.get('input[name="title"]').clear().type('E2E New Document');
    cy.get('input[type="file"]').selectFile({ contents: Cypress.Buffer.from('pdf content'), fileName: 'e2e-doc.pdf' }, { force: true });

    cy.get('[data-testid="upload-document-submit"]').click();

    cy.wait('@uploadDocument').then(() => {
      expect(uploadPayload).to.have.property('title', 'E2E New Document');
      expect(uploadPayload).to.have.property('file_name', 'e2e-doc.pdf');
      expect(uploadPayload).to.have.property('file_data');
    });
  });

  it('add secondary document: upload sub-document to folder (intercept upload)', () => {
    let uploadPayload: Record<string, unknown> = {};
    cy.intercept('POST', '**/api/documents/upload', (req) => {
      uploadPayload = req.body as Record<string, unknown>;
      req.reply({ statusCode: 200, body: { success: true, data: { id: DOC_ID + 1 } } });
    }).as('uploadDocument');

    cy.loginByToken('/documents/upload');
    cy.get('[data-testid="upload-document-open-btn"]').click();

    cy.get('select[name="upload_kind"]').select('sub');
    cy.get('select[name="department_id"]').select('1');
    cy.get('select[name="document_type_id"]').select('1');
    cy.get('select[name="folder_id"]').select(String(FOLDER_ID));
    cy.get('input[name="title"]').clear().type('E2E Sub Document');
    cy.get('input[type="file"]').selectFile({ contents: Cypress.Buffer.from('sub'), fileName: 'sub.pdf' }, { force: true });

    cy.get('[data-testid="upload-document-submit"]').click();

    cy.wait('@uploadDocument').then(() => {
      expect(uploadPayload).to.have.property('upload_kind', 'sub');
      expect(uploadPayload).to.have.property('title', 'E2E Sub Document');
    });
  });
});
