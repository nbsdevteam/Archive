/**
 * Slow smoke against REAL API: CRUD only on test-created data.
 * - Uses real login and real API (no response stubbing); only captures upload response to get created document id.
 * - Blocks delete folder, permanent delete, and batch trash at network level (403) so no delete can succeed.
 * - Flow: Create main document (unique names) → Read (navigate to doc) → Update document → Add attachment → Edit attachment.
 * - No delete, no permanent delete, no batch delete from /documents, no delete folder.
 * - Do not visit: edit-requests, signatures, notifications, permissions (E2E for those later).
 * Run with: npm run e2e:slow:open (dev server + real backend running). Ensure backend is available at baseUrl.
 */

const STEP_DELAY = 800;

function waitStep() {
  cy.wait(STEP_DELAY);
}

describe('Slow smoke (real API, CRUD on test-created only)', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.name === 'ZodError' || (err.message && err.message.includes('ZodError'))) return false;
      return true;
    });

    // Block all delete/permanent-delete/trash so no test or UI can actually delete
    cy.intercept('DELETE', '**/api/folders/*', { statusCode: 403, body: { error: 'E2E: delete folder disabled' } });
    cy.intercept('POST', '**/api/documents/permanent-delete', { statusCode: 403, body: { error: 'E2E: permanent delete disabled' } });
    cy.intercept('POST', '**/api/documents/batch/trash', { statusCode: 403, body: { error: 'E2E: batch trash disabled' } });

    // Capture upload response only (let request go through to real API)
    cy.intercept('POST', '**/api/documents/upload', (req) => req.continue()).as('uploadDocument');
    // Let folder create go through to real API
    cy.intercept('POST', '**/api/folders/create', (req) => req.continue());
  });

  it('creates one main document via real API, then reads, updates, adds attachment, edits attachment (no delete)', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const titleMain = `E2E Real API Main ${suffix}`;
    const folderName = `E2E Real Folder ${suffix}`;
    const folderCode = `E2E-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
    const updatedTitle = `E2E Real Updated ${suffix}`;
    const attachmentName = `E2E Real Attachment ${suffix}`;

    // --- 1. Real login ---
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

    // --- 2. Create: upload main document (real API) ---
    cy.flash('Testing upload flow');
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    cy.get('[data-testid="department-select"]').find('.react-select__control').click();
    waitStep();
    cy.get('.react-select__option').contains('Finance (FIN)').click();
    waitStep();
    cy.get('[data-testid="document-type-select"]').find('.react-select__control').click();
    waitStep();
    cy.get('.react-select__option').contains('Invoice (INV)').click();
    waitStep();
    cy.get('input[name="title"]').clear().type(titleMain);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(folderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(folderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('E2E real API main document content'), fileName: 'e2e-real-main.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();

    // Wait for real API upload and capture created document id (CRUD only on this doc)
    cy.wait('@uploadDocument', { timeout: 20000 })
      .its('response.body')
      .then((body: { success?: boolean; data?: { id: number }; result?: { success?: boolean; data?: { id: number } } }) => {
        const data = body?.data ?? body?.result?.data;
        const ok = body?.success === true || body?.result?.success === true;
        expect(ok).to.eq(true);
        expect(data?.id).to.be.a('number');
        cy.wrap(data!.id).as('createdDocId');
      });
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    // --- 3. Read: navigate to the document we just created ---
    cy.flash('Testing read flow — navigating to document');
    cy.get('@createdDocId').then((id: number) => {
      cy.visit(`/documents/${id}`);
    });
    waitStep();
    cy.get('body').should('be.visible');
    cy.contains(titleMain).should('be.visible');

    // --- 4. Update: edit document title (only on test-created doc) ---
    cy.flash('Testing update flow — editing document');
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

    // --- 5. Create: add attachment (only on test-created doc) ---
    cy.flash('Testing add attachment flow');
    cy.contains('button', 'Attachments').click();
    waitStep();
    cy.get('[data-testid="document-detail-attachments-tab"]').should('be.visible');
    cy.get('[data-testid="document-detail-add-attachment-btn"]').click();
    waitStep();
    cy.get('input[type="file"]')
      .first()
      .selectFile(
        { contents: Cypress.Buffer.from('E2E real API attachment content'), fileName: 'e2e-real-attach.pdf' },
        { force: true }
      );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    waitStep();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    // --- 6. Update: edit attachment (only the attachment we added) ---
    cy.flash('Testing edit attachment flow');
    cy.get('[data-testid="document-detail-attachments-tab"]').contains('e2e-real-attach.pdf', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="document-detail-attachments-tab"]').find('[aria-label^="Actions for row"]').first().click();
    waitStep();
    cy.get('[data-testid="row-action-edit"]').first().click();
    waitStep();
    cy.get('[data-testid="attachment-side-panel"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="attachment-edit-name"]').clear().type(attachmentName);
    waitStep();
    cy.get('[data-testid="attachment-edit-description"]').clear().type('E2E real API attachment description');
    waitStep();
    cy.get('[data-testid="attachment-edit-save"]').click();
    waitStep();
    cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
    cy.contains(attachmentName).should('be.visible');

    // --- 7. Transfer flow: Base main+folder, Target main+folder, Base secondary, transfer to target, verify ---
    cy.flash('Testing transfer flow — creating Base and Target folders, then transferring');
    const baseMainTitle = `BaseMainForTransfer ${suffix}`;
    const baseFolderName = `BaseFolderForTransfer ${suffix}`;
    const baseFolderCode = `BASE-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const targetMainTitle = `TargetMainForTransfer ${suffix}`;
    const targetFolderName = `TargetFolderForTransfer ${suffix}`;
    const targetFolderCode = `TGT-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const baseSecondaryTitle = `BaseSecondaryFileForTransfer ${suffix}`;

    cy.intercept('POST', (req) => {
      if (!req.url?.includes('/api/folders') || req.url.includes('/create') || req.url.includes('/update') || /\/api\/folders\/\d+/.test(req.url)) return;
      req.continue();
    }).as('listFolders');

    cy.visit('/dashboard');
    waitStep();
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    cy.get('[data-testid="department-select"]').find('.react-select__control').click();
    waitStep();
    cy.get('.react-select__option').contains('Finance (FIN)').click();
    waitStep();
    cy.get('[data-testid="document-type-select"]').find('.react-select__control').click();
    waitStep();
    cy.get('.react-select__option').contains('Invoice (INV)').click();
    waitStep();
    cy.get('input[name="title"]').clear().type(baseMainTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(baseFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(baseFolderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('base main for transfer'), fileName: 'base-main.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="department-select"]').find('.react-select__control').click();
    waitStep();
    cy.get('.react-select__option').contains('Finance (FIN)').click();
    waitStep();
    cy.get('[data-testid="document-type-select"]').find('.react-select__control').click();
    waitStep();
    cy.get('.react-select__option').contains('Invoice (INV)').click();
    waitStep();
    cy.get('input[name="title"]').clear().type(targetMainTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(targetFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(targetFolderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('target main for transfer'), fileName: 'target-main.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    cy.visit('/folders');
    cy.wait('@listFolders', { timeout: 10000 });
    cy.get('@listFolders').then((interception: { response?: { body?: unknown } }) => {
      const body = interception.response?.body as Record<string, unknown> | undefined;
      const result = body?.result as Record<string, unknown> | undefined;
      const data = body?.data as { id: number; name: string }[] | undefined;
      const folders = (result?.folders ?? result?.data ?? body?.folders ?? data ?? []) as { id: number; name: string }[];
      const list = Array.isArray(folders) ? folders : [];
      const baseFolder = list.find((f) => String(f.name ?? '').includes('BaseFolderForTransfer'));
      const targetFolder = list.find((f) => String(f.name ?? '').includes('TargetFolderForTransfer'));
      if (baseFolder && targetFolder) {
        cy.wrap(baseFolder.id).as('baseFolderId');
        cy.wrap(targetFolder.id).as('targetFolderId');
      }
    });
    cy.get('@baseFolderId').then((baseFolderId: number) => {
      cy.get('@targetFolderId').then((targetFolderId: number) => {
        cy.visit('/documents/upload');
        waitStep();
        cy.get('[data-testid="upload-document-open-btn"]').click();
        waitStep();
        cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click();
        waitStep();
        cy.get('.react-select__option').contains('Sub Document').click();
        waitStep();
        cy.get('[data-testid="department-select"]').find('.react-select__control').click();
        waitStep();
        cy.get('.react-select__option').contains('Finance (FIN)').click();
        waitStep();
        cy.get('[data-testid="document-type-select"]').find('.react-select__control').click();
        waitStep();
        cy.get('.react-select__option').contains('Invoice (INV)').click();
        waitStep();
        cy.get('[data-testid="folder-select"]').find('.react-select__control').click();
        waitStep();
        cy.get('.react-select__option').contains(baseFolderName).click();
        waitStep();
        cy.get('input[name="title"]').clear().type(baseSecondaryTitle);
        waitStep();
        cy.get('input[type="file"]').selectFile(
          { contents: Cypress.Buffer.from('base secondary for transfer'), fileName: 'base-secondary.pdf' },
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

    // No delete, no permanent delete, no batch trash, no delete folder — CRUD on test-created file only
  });
});
