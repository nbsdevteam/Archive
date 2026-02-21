/**
 * Create new document (upload) and add secondary document (sub-document) to a folder.
 * PRODUCTION RULE: No delete folder, no permanent delete, no batch delete from /documents.
 */

const DOC_ID = 999;
const FOLDER_ID = 100;

const adminDepartments = { result: { success: true, data: [{ id: 1, name: 'Finance', code: 'FIN' }] } };
const adminDocumentTypes = { result: { success: true, data: [{ id: 1, name: 'Invoice', code: 'INV' }] } };
const adminCompanies = { success: true, data: [{ id: 1, name: 'E2E Company' }] };
const foldersList = { result: { folders: [{ id: FOLDER_ID, name: 'Test Folder', code: 'TF', department_id: 1 }] } };

describe('Create document and add secondary', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.name === 'ZodError' || (err.message && err.message.includes('ZodError'))) return false;
      return true;
    });
    cy.intercept('POST', '**/api/departments', adminDepartments);
    cy.intercept('POST', '**/api/tags', { result: { success: true, data: [] } });
    cy.intercept('POST', '**/api/document-types', adminDocumentTypes);
    cy.intercept('POST', '**/api/companies', adminCompanies);
    cy.intercept('POST', (req) => {
      const u = req.url;
      if (!u.includes('/api/folders')) return;
      if (u.includes('/create') || u.includes('/update') || /\/api\/folders\/\d+/.test(u)) return;
      req.reply({ statusCode: 200, body: foldersList });
    });
  });

  it('navigates to upload page, opens panel, fills form and submits create document request', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const title = `E2E New Document ${suffix}`;
    const folderName = `E2E Folder ${suffix}`;
    const folderCode = `E2E-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    let uploadPayload: Record<string, unknown> = {};
    cy.intercept('POST', '**/api/folders/create', { statusCode: 200, body: { result: { success: true, data: { id: 1, name: folderName, code: folderCode } } } });
    cy.intercept('POST', '**/api/documents/upload', (req) => {
      uploadPayload = req.body as Record<string, unknown>;
      req.reply({ statusCode: 200, body: { success: true, data: { id: DOC_ID } } });
    }).as('uploadDocument');

    cy.loginByToken('/documents/upload');
    cy.url().should('include', '/documents/upload');

    cy.get('[data-testid="upload-document-open-btn"]').click();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');

    cy.get('[data-testid="department-select"]').find('.react-select__control').click();
    cy.get('.react-select__option').contains('Finance (FIN)').click();
    cy.get('[data-testid="document-type-select"]').find('.react-select__control').click();
    cy.get('.react-select__option').contains('Invoice (INV)').click();
    cy.get('[data-testid="folder-company-select"]').find('.react-select__control').click();
    cy.get('.react-select__option').contains('E2E Company').click();
    cy.get('input[name="title"]').clear().type(title);
    cy.get('input[name="folder_name"]').clear().type(folderName);
    cy.get('input[name="folder_code"]').clear().type(folderCode);
    cy.get('input[type="file"]').selectFile({ contents: Cypress.Buffer.from('pdf content'), fileName: 'e2e-doc.pdf' }, { force: true });

    cy.get('[data-testid="upload-document-submit"]').click();

    cy.wait('@uploadDocument').then(() => {
      expect(uploadPayload).to.have.property('title', title);
      expect(uploadPayload).to.have.property('file_name', 'e2e-doc.pdf');
      expect(uploadPayload).to.have.property('file_data');
    });
  });

  it('add secondary document: upload sub-document to folder (intercept upload)', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const title = `E2E Sub Document ${suffix}`;
    let uploadPayload: Record<string, unknown> = {};
    cy.intercept('POST', '**/api/documents/upload', (req) => {
      uploadPayload = req.body as Record<string, unknown>;
      req.reply({ statusCode: 200, body: { success: true, data: { id: DOC_ID + 1 } } });
    }).as('uploadDocument');

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
    cy.get('input[name="title"]').clear().type(title);
    cy.get('input[type="file"]').selectFile({ contents: Cypress.Buffer.from('sub'), fileName: 'sub.pdf' }, { force: true });

    cy.get('[data-testid="upload-document-submit"]').click();

    cy.wait('@uploadDocument').then(() => {
      expect(uploadPayload).to.have.property('upload_kind', 'sub');
      expect(uploadPayload).to.have.property('title', title);
    });
  });
});
