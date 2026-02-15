/**
 * Slow smoke against REAL API: CRUD only on test-created data.
 * Flow option menu: run Upload, Transfer, or Update separately from the Cypress test list.
 * - Upload: main doc, secondary (sub) doc, attachment to main, attachment to sub.
 * - Transfer: base + target folders, secondary in base, transfer to target, verify.
 * - Update: create one doc + attachment, then update document and update attachment.
 * Blocks delete/permanent-delete/batch trash. Run with: npm run e2e:slow:open (dev server + real backend).
 */

const STEP_DELAY = 800;

function waitStep() {
  cy.wait(STEP_DELAY);
}

/** Shared login as admin, then optional flash. */
function loginAndFlash(flowName: string) {
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
  cy.flash(flowName);
}

/** Fill department and document type (Finance, Invoice). */
function selectDepartmentAndType() {
  cy.get('[data-testid="department-select"]').find('.react-select__control').click();
  waitStep();
  cy.get('.react-select__option').contains('Finance (FIN)').click();
  waitStep();
  cy.get('[data-testid="document-type-select"]').find('.react-select__control').click();
  waitStep();
  cy.get('.react-select__option').contains('Invoice (INV)').click();
  waitStep();
}

/** Capture last upload response and alias as createdDocId. */
function captureUploadDocId() {
  cy.wait('@uploadDocument', { timeout: 20000 })
    .its('response.body')
    .then((body: { success?: boolean; data?: { id: number }; result?: { success?: boolean; data?: { id: number } } }) => {
      const data = body?.data ?? body?.result?.data;
      const ok = body?.success === true || body?.result?.success === true;
      expect(ok).to.eq(true);
      expect(data?.id).to.be.a('number');
      cy.wrap(data!.id).as('createdDocId');
    });
}

describe('Slow smoke (real API) — flow options', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.name === 'ZodError' || (err.message && err.message.includes('ZodError'))) return false;
      return true;
    });
    cy.intercept('DELETE', '**/api/folders/*', { statusCode: 403, body: { error: 'E2E: delete folder disabled' } });
    cy.intercept('POST', '**/api/documents/permanent-delete', { statusCode: 403, body: { error: 'E2E: permanent delete disabled' } });
    cy.intercept('POST', '**/api/documents/batch/trash', { statusCode: 403, body: { error: 'E2E: batch trash disabled' } });
    cy.intercept('POST', '**/api/documents/upload', (req) => req.continue()).as('uploadDocument');
    cy.intercept('POST', '**/api/folders/create', (req) => req.continue());
    // List folders: POST /api/folders only (not /create, not /api/folders/123). Regex matches path ending with /api/folders or /api/folders?
    cy.intercept(
      { method: 'POST', url: /\/api\/folders(\?|$)/ },
      (req) => req.continue()
    ).as('listFolders');
  });

  it('Upload: main, secondary, attachment to main, attachment to sub', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const mainTitle = `UploadFlow Main ${suffix}`;
    const folderName = `UploadFlow Folder ${suffix}`;
    const folderCode = `UPL-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const subTitle = `UploadFlow Sub ${suffix}`;

    loginAndFlash('Upload flow: main, secondary, attachment to main and sub');

    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(mainTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(folderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(folderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('upload flow main'), fileName: 'main.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    captureUploadDocId();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    cy.get('@createdDocId').then((mainId: number) => {
      cy.visit('/documents/upload');
      waitStep();
      cy.get('[data-testid="upload-document-open-btn"]').click();
      waitStep();
      cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click();
      waitStep();
      cy.get('.react-select__option').contains('Sub Document').click();
      waitStep();
      selectDepartmentAndType();
      cy.get('[data-testid="folder-select"]').find('.react-select__control').click();
      waitStep();
      cy.get('.react-select__option').contains(folderName).click();
      waitStep();
      cy.get('input[name="title"]').clear().type(subTitle);
      waitStep();
      cy.get('input[type="file"]').selectFile(
        { contents: Cypress.Buffer.from('upload flow sub'), fileName: 'sub.pdf' },
        { force: true }
      );
      waitStep();
      cy.get('[data-testid="upload-document-submit"]').click();
      captureUploadDocId();
      cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
      waitStep();

      cy.get('@createdDocId').then((subId: number) => {
        cy.visit(`/documents/${mainId}`);
        waitStep();
        cy.contains('button', 'Attachments').click();
        waitStep();
        cy.get('[data-testid="document-detail-add-attachment-btn"]').click();
        waitStep();
        cy.get('input[type="file"]').first().selectFile(
          { contents: Cypress.Buffer.from('attachment to main'), fileName: 'attach-main.pdf' },
          { force: true }
        );
        waitStep();
        cy.get('[data-testid="upload-document-submit"]').click();
        cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
        waitStep();

        cy.visit(`/documents/${subId}`);
        waitStep();
        cy.contains('button', 'Attachments').click();
        waitStep();
        cy.get('[data-testid="document-detail-add-attachment-btn"]').click();
        waitStep();
        cy.get('input[type="file"]').first().selectFile(
          { contents: Cypress.Buffer.from('attachment to sub'), fileName: 'attach-sub.pdf' },
          { force: true }
        );
        waitStep();
        cy.get('[data-testid="upload-document-submit"]').click();
        cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
      });
    });
  });

  it('Transfer: base + target folders, secondary in base, transfer to target', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const baseMainTitle = `BaseMainForTransfer ${suffix}`;
    const baseFolderName = `BaseFolderForTransfer ${suffix}`;
    const baseFolderCode = `BASE-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const targetMainTitle = `TargetMainForTransfer ${suffix}`;
    const targetFolderName = `TargetFolderForTransfer ${suffix}`;
    const targetFolderCode = `TGT-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const baseSecondaryTitle = `BaseSecondaryFileForTransfer ${suffix}`;

    loginAndFlash('Transfer flow: base + target, secondary in base, transfer to target');

    cy.visit('/dashboard');
    waitStep();
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(baseMainTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(baseFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(baseFolderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('base main'), fileName: 'base-main.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(targetMainTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(targetFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(targetFolderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('target main'), fileName: 'target-main.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    cy.visit('/folders');
    cy.contains(baseFolderName, { timeout: 15000 }).should('be.visible');
    cy.contains(targetFolderName, { timeout: 5000 }).should('be.visible');
    // Resolve base folder ID: grid has a[href*="/folders/"], list view has only View button → click and read URL.
    cy.contains(baseFolderName).closest('tr, .folders__grid-card-wrapper').then(($row) => {
      const $link = $row.find('a[href*="/folders/"]');
      if ($link.length) {
        const href = $link.attr('href') ?? '';
        const m = href.match(/\/folders\/(\d+)/);
        if (m) cy.wrap(Number(m[1])).as('baseFolderId');
      } else {
        cy.wrap($row).find('button').contains('View').click({ force: true });
        cy.url({ timeout: 10000 }).should('include', '/folders/');
        cy.url().then((url) => {
          const m = String(url).match(/\/folders\/(\d+)/);
          if (m) cy.wrap(Number(m[1])).as('baseFolderId');
        });
        cy.visit('/folders');
        cy.contains(baseFolderName, { timeout: 5000 }).should('be.visible');
      }
    });
    cy.contains(targetFolderName).closest('tr, .folders__grid-card-wrapper').then(($row) => {
      const $link = $row.find('a[href*="/folders/"]');
      if ($link.length) {
        const href = $link.attr('href') ?? '';
        const m = href.match(/\/folders\/(\d+)/);
        if (m) cy.wrap(Number(m[1])).as('targetFolderId');
      } else {
        cy.wrap($row).find('button').contains('View').click({ force: true });
        cy.url({ timeout: 10000 }).should('include', '/folders/');
        cy.url().then((url) => {
          const m = String(url).match(/\/folders\/(\d+)/);
          if (m) cy.wrap(Number(m[1])).as('targetFolderId');
        });
        cy.visit('/folders');
        cy.contains(targetFolderName, { timeout: 5000 }).should('be.visible');
      }
    });
    cy.get('@baseFolderId').then((baseFolderId: number) => {
      cy.get('@targetFolderId').then((targetFolderId: number) => {
        cy.visit('/documents/upload');
        waitStep();
        cy.get('[data-testid="upload-document-open-btn"]').click({ force: true });
        waitStep();
        cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click();
        waitStep();
        cy.get('.react-select__option').contains('Sub Document').click();
        waitStep();
        selectDepartmentAndType();
        cy.get('[data-testid="folder-select"]').find('.react-select__control').click();
        waitStep();
        cy.get('.react-select__option').contains(baseFolderName).click();
        waitStep();
        cy.get('input[name="title"]').clear().type(baseSecondaryTitle);
        waitStep();
        cy.get('input[type="file"]').selectFile(
          { contents: Cypress.Buffer.from('base secondary'), fileName: 'base-secondary.pdf' },
          { force: true }
        );
        waitStep();
        cy.get('[data-testid="upload-document-submit"]').click();
        cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
        waitStep();

        cy.visit(`/folders/${baseFolderId}`);
        waitStep();
        cy.contains(baseSecondaryTitle).closest('tr').within(() => cy.contains('button', 'Transfer').click());
        waitStep();
        cy.get('[data-testid="transfer-folder-select"]').select(String(targetFolderId));
        waitStep();
        cy.get('[data-testid="transfer-confirm-btn"]').click();
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();

        cy.visit(`/folders/${targetFolderId}`);
        waitStep();
        cy.contains(baseSecondaryTitle).should('be.visible');
      });
    });
  });

  it('Update: update document and attachment', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const title = `UpdateFlow Doc ${suffix}`;
    const folderName = `UpdateFlow Folder ${suffix}`;
    const folderCode = `UPD-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const updatedTitle = `UpdateFlow Updated ${suffix}`;
    const attachmentName = `UpdateFlow Attachment ${suffix}`;

    loginAndFlash('Update flow: update document and attachment');

    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(title);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(folderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(folderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('update flow doc'), fileName: 'doc.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    captureUploadDocId();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    cy.get('@createdDocId').then((id: number) => {
      cy.visit(`/documents/${id}`);
      waitStep();
      cy.contains(title).should('be.visible');

      cy.flash('Update: editing document title');
      cy.get('[data-testid="document-detail-edit-document-btn"]').click();
      waitStep();
      cy.get('[data-testid="edit-document-side-panel"]').should('be.visible');
      cy.get('input[name="title"]').clear().type(updatedTitle);
      waitStep();
      cy.get('[data-testid="edit-document-save"]').click();
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      cy.contains(updatedTitle).should('be.visible');
      waitStep();

      cy.flash('Update: adding then editing attachment');
      cy.contains('button', 'Attachments').click();
      waitStep();
      cy.get('[data-testid="document-detail-add-attachment-btn"]').click();
      waitStep();
      cy.get('input[type="file"]').first().selectFile(
        { contents: Cypress.Buffer.from('update flow attach'), fileName: 'attach.pdf' },
        { force: true }
      );
      waitStep();
      cy.get('[data-testid="upload-document-submit"]').click();
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
      waitStep();

      cy.get('[data-testid="document-detail-attachments-tab"]').contains('attach.pdf', { timeout: 15000 }).should('be.visible');
      cy.get('[data-testid="document-detail-attachments-tab"]').find('[aria-label^="Actions for row"]').first().click();
      waitStep();
      cy.get('[data-testid="row-action-edit"]').first().click();
      waitStep();
      cy.get('[data-testid="attachment-side-panel"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-testid="attachment-edit-name"]').clear().type(attachmentName);
      waitStep();
      cy.get('[data-testid="attachment-edit-description"]').clear().type('Update flow attachment description');
      waitStep();
      cy.get('[data-testid="attachment-edit-save"]').click();
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      cy.contains(attachmentName).should('be.visible');
    });
  });
});
