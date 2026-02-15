/**
 * Slow, visible walkthrough: login as admin (admin/admin), then click main Upload Document
 * button (dashboard or documents page), fill form, submit. Uses data-testid throughout.
 * Run with: npm run e2e:slow or npm run e2e:slow:open (dev server already running).
 * PRODUCTION RULE: No delete folder, no permanent delete, no batch delete from /documents.
 */

const STEP_DELAY = 800;

function waitStep() {
  cy.wait(STEP_DELAY);
}

const adminDepartments = { result: { success: true, data: [{ id: 1, name: 'Finance', code: 'FIN' }] } };
const adminDocumentTypes = { result: { success: true, data: [{ id: 1, name: 'Invoice', code: 'INV' }] } };
const adminTags = { result: { success: true, data: [] } };

describe('Walkthrough: login and upload (slow)', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.name === 'ZodError' || (err.message && err.message.includes('ZodError'))) return false;
      return true;
    });
  });

  it('logs in as admin then opens Upload Document from dashboard and fills form', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const title = `E2E Walkthrough Document ${suffix}`;
    const folderName = `E2E Walkthrough Folder ${suffix}`;
    const folderCode = `E2E-WALK-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;

    cy.intercept('POST', '**/api/departments', adminDepartments);
    cy.intercept('POST', '**/api/document-types', adminDocumentTypes);
    cy.intercept('POST', '**/api/tags', adminTags);
    cy.intercept('POST', '**/api/folders/create', {
      statusCode: 200,
      body: { result: { success: true, data: { id: 1, name: folderName, code: folderCode } } },
    });
    cy.intercept('POST', (req) => {
      if (!req.url.includes('/api/folders') || req.url.includes('/create') || req.url.includes('/update') || /\/api\/folders\/\d+/.test(req.url)) return;
      req.reply({ statusCode: 200, body: { result: { folders: [] } } });
    });
    cy.intercept('POST', '**/api/documents/upload', { statusCode: 200, body: { success: true, data: { id: 1 } } }).as('upload');

    cy.visit('/login');
    waitStep();

    cy.get('#login-role-admin').check({ force: true });
    waitStep();
    cy.get('#login-username').clear().type('admin');
    waitStep();
    cy.get('#login-password').clear().type('admin');
    waitStep();
    cy.get('[data-testid="login-submit-btn"]').click();

    cy.url({ timeout: 15000 }).should('include', '/dashboard');
    waitStep();

    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();

    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    cy.get('.react-select__control').eq(1).click();
    waitStep();
    cy.get('.react-select__option').contains('Finance (FIN)').click();
    waitStep();
    cy.get('.react-select__control').eq(2).click();
    waitStep();
    cy.get('.react-select__option').contains('Invoice (INV)').click();
    waitStep();
    cy.get('input[name="title"]').clear().type(title);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(folderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(folderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('walkthrough pdf'), fileName: 'walkthrough.pdf' },
      { force: true }
    );
    waitStep();

    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
  });

  it('logs in as admin then opens Upload Documents from documents page', () => {
    cy.loginAsAdmin('/documents');
    waitStep();

    cy.get('[data-testid="upload-documents-btn"]').should('be.visible').click();
    waitStep();

    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
  });
});
