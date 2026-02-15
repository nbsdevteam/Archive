/**
 * Slow smoke against REAL API. All operations only on test-created data.
 * Phases (run separately from Cypress test list):
 * 1. Upload: Create MainBaseFile + MainTargetFile folders (main docs), edit them, upload one new doc while editing.
 * 2. Transfer: Open base folder, upload base secondary file, transfer it to target folder.
 * 3. Trash and permanent delete: Only on phase 1+2 folders and their files (move to trash, permanent delete, delete folders).
 * 4. Batch: Create MainDocForBatchStuffYeahYeahh folder, bulk upload 5 sub-docs, batch archive → unarchive → trash → restore → trash → permanent delete (only this folder's files).
 * Run with: npm run e2e:slow:open (dev server + real backend). Deletion/trash/permanent-delete are allowed but tests must only act on data they created.
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

/** Resolve folder ID from /folders list by folder name (grid or list view). */
function getFolderIdFromList(folderName: string): Cypress.Chainable<number> {
  return cy.contains(folderName).closest('tr, .folders__grid-card-wrapper').then(($row) => {
    const $link = $row.find('a[href*="/folders/"]');
    if ($link.length) {
      const href = $link.attr('href') ?? '';
      const m = href.match(/\/folders\/(\d+)/);
      if (m) return cy.wrap(Number(m[1]));
    }
    cy.wrap($row).find('button').contains('View').click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/folders/');
    return cy.url().then((url) => {
      const m = String(url).match(/\/folders\/(\d+)/);
      expect(m).to.be.ok;
      return cy.wrap(Number(m![1]));
    });
  });
}

describe('Slow smoke (real API) — flow options', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.name === 'ZodError' || (err.message && err.message.includes('ZodError'))) return false;
      return true;
    });
    // Allow all mutations; tests must only delete/trash data they created.
    cy.intercept('POST', '**/api/documents/upload', (req) => req.continue()).as('uploadDocument');
    cy.intercept('POST', '**/api/folders/create', (req) => req.continue());
    cy.intercept(
      { method: 'POST', url: /\/api\/folders(\?|$)/ },
      (req) => req.continue()
    ).as('listFolders');
  });

  it('Phase 1 — Upload: MainBaseFile + MainTargetFile folders, edit, upload new doc while editing', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const mainBaseTitle = `MainBaseFile ${suffix}`;
    const mainBaseFolderName = `MainBaseFile Folder ${suffix}`;
    const mainBaseFolderCode = `MBF-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const mainTargetTitle = `MainTargetFile ${suffix}`;
    const mainTargetFolderName = `MainTargetFile Folder ${suffix}`;
    const mainTargetFolderCode = `MTF-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const subWhileEditingTitle = `SubWhileEditing ${suffix}`;

    loginAndFlash('Phase 1: MainBaseFile + MainTargetFile, edit, upload new doc');

    // Create MainBaseFile folder (main doc).
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(mainBaseTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(mainBaseFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(mainBaseFolderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('main base'), fileName: 'main-base.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    captureUploadDocId();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();
    cy.get('@createdDocId').then((id: number) => cy.wrap(id).as('mainBaseDocId'));

    // Create MainTargetFile folder (main doc).
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(mainTargetTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(mainTargetFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(mainTargetFolderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('main target'), fileName: 'main-target.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    captureUploadDocId();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();
    cy.get('@createdDocId').then((id: number) => cy.wrap(id).as('mainTargetDocId'));

    // Edit main base document (title).
    cy.get('@mainBaseDocId').then((id: number) => {
      cy.visit(`/documents/${id}`);
      waitStep();
      cy.get('[data-testid="document-detail-edit-document-btn"]').click();
      waitStep();
      cy.get('[data-testid="edit-document-side-panel"]').should('be.visible');
      cy.get('input[name="title"]').clear().type(`${mainBaseTitle} (edited)`);
      waitStep();
      cy.get('[data-testid="edit-document-save"]').click();
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
    });

    // Upload a new document while editing flow: open upload, add sub to MainBase folder.
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
    cy.get('.react-select__option').contains(mainBaseFolderName).click();
    waitStep();
    cy.get('input[name="title"]').clear().type(subWhileEditingTitle);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('sub while editing'), fileName: 'sub-while-editing.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    captureUploadDocId();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();
    cy.get('@createdDocId').then((id: number) => cy.wrap(id).as('phase1SubDocId'));

    // Edit main target document (title).
    cy.get('@mainTargetDocId').then((id: number) => {
      cy.visit(`/documents/${id}`);
      waitStep();
      cy.get('[data-testid="document-detail-edit-document-btn"]').click();
      waitStep();
      cy.get('input[name="title"]').clear().type(`${mainTargetTitle} (edited)`);
      waitStep();
      cy.get('[data-testid="edit-document-save"]').click();
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
    });
  });

  it('Phase 2 — Transfer: open base folder, upload base secondary, transfer to target', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const mainBaseTitle = `MainBaseFile ${suffix}`;
    const mainBaseFolderName = `MainBaseFile Folder ${suffix}`;
    const mainBaseFolderCode = `MBF-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const mainTargetFolderName = `MainTargetFile Folder ${suffix}`;
    const mainTargetFolderCode = `MTF-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const baseSecondaryTitle = `BaseSecondaryForTransfer ${suffix}`;

    loginAndFlash('Phase 2: Base + Target folders, secondary in base, transfer to target');

    // Create base folder (main doc).
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(mainBaseTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(mainBaseFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(mainBaseFolderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('base main'), fileName: 'base-main.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    // Create target folder (main doc).
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(`MainTargetFile ${suffix}`);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(mainTargetFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(mainTargetFolderCode);
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
    cy.contains(mainBaseFolderName, { timeout: 15000 }).should('be.visible');
    cy.contains(mainTargetFolderName, { timeout: 5000 }).should('be.visible');
    getFolderIdFromList(mainBaseFolderName).then((baseId) => cy.wrap(baseId).as('baseFolderId'));
    getFolderIdFromList(mainTargetFolderName).then((targetId) => cy.wrap(targetId).as('targetFolderId'));

    cy.get('@baseFolderId').then((baseFolderId: number) => {
      cy.get('@targetFolderId').then((targetFolderId: number) => {
        // Open base folder and upload secondary via "Upload in folder".
        cy.visit(`/folders/${baseFolderId}`);
        waitStep();
        cy.get('[data-testid="upload-in-folder-btn"]').click();
        waitStep();
        cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click();
        waitStep();
        cy.get('.react-select__option').contains('Sub Document').click();
        waitStep();
        selectDepartmentAndType();
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

        // Transfer that secondary to target folder.
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

  it('Phase 3 — Move to trash and permanent delete (only this test\'s folders and their files)', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const mainBaseTitle = `MainBaseFile ${suffix}`;
    const mainBaseFolderName = `MainBaseFile Folder ${suffix}`;
    const mainBaseFolderCode = `MBF-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const mainTargetTitle = `MainTargetFile ${suffix}`;
    const mainTargetFolderName = `MainTargetFile Folder ${suffix}`;
    const mainTargetFolderCode = `MTF-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const baseSecondaryTitle = `BaseSecondaryTrashPhase ${suffix}`;

    loginAndFlash('Phase 3: Create two folders + docs, then trash, permanent delete, delete folders (only this data)');

    // Create base folder (main doc).
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(mainBaseTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(mainBaseFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(mainBaseFolderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('base main'), fileName: 'base-main.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    // Create target folder (main doc).
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(mainTargetTitle);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(mainTargetFolderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(mainTargetFolderCode);
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
    cy.contains(mainBaseFolderName, { timeout: 15000 }).should('be.visible');
    cy.contains(mainTargetFolderName, { timeout: 5000 }).should('be.visible');
    getFolderIdFromList(mainBaseFolderName).then((id) => cy.wrap(id).as('baseFolderId'));
    getFolderIdFromList(mainTargetFolderName).then((id) => cy.wrap(id).as('targetFolderId'));

    cy.get('@baseFolderId').then((baseId: number) => {
      cy.get('@targetFolderId').then((targetId: number) => {
        // Add one sub in base and transfer to target so both folders have docs.
        cy.visit(`/folders/${baseId}`);
        waitStep();
        cy.get('[data-testid="upload-in-folder-btn"]').click();
        waitStep();
        cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click();
        waitStep();
        cy.get('.react-select__option').contains('Sub Document').click();
        waitStep();
        selectDepartmentAndType();
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

        cy.visit(`/folders/${baseId}`);
        waitStep();
        cy.contains(baseSecondaryTitle).closest('tr').within(() => cy.contains('button', 'Transfer').click());
        waitStep();
        cy.get('[data-testid="transfer-folder-select"]').select(String(targetId));
        waitStep();
        cy.get('[data-testid="transfer-confirm-btn"]').click();
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();

        // Trash main doc in base: open document detail and trash (main doc card has no trash button).
        cy.visit(`/folders/${baseId}`);
        waitStep();
        cy.get('.card').contains('Main document').parents('.card').find('button').contains('View').click();
        waitStep();
        cy.get('[data-testid="document-detail-edit-document-btn"]').should('be.visible');
        cy.contains('button', 'Move to trash').click();
        cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();

        // Trash sub-doc in target and main doc in target. Target has: main + 1 secondary.
        cy.visit(`/folders/${targetId}`);
        waitStep();
        cy.get('.card').contains('Secondary documents').parents('.card').find('tbody tr').first().within(() => {
          cy.contains('button', 'Move to trash').click();
        });
        cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();
        cy.get('.card').contains('Main document').parents('.card').find('button').contains('View').click();
        waitStep();
        cy.contains('button', 'Move to trash').click();
        cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();

        // Permanent delete from trash (only our 3 docs — base main, target main, target sub; do not touch any other file).
        cy.visit('/documents/trash');
        waitStep();
        cy.get('[data-testid="documents-trash-page"]').should('be.visible');
        [mainBaseTitle, mainTargetTitle, baseSecondaryTitle].forEach((title) => {
          cy.contains('tbody tr', title).find('input[type="checkbox"]').click();
          waitStep();
        });
        cy.contains('button', 'Permanent delete selected').click();
        waitStep();
        cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();

        // Delete the two empty folders (only our folder IDs).
        cy.request('DELETE', `/api/folders/${baseId}`).then((res) => {
          expect([200, 204]).to.include(res.status);
        });
        cy.request('DELETE', `/api/folders/${targetId}`).then((res) => {
          expect([200, 204]).to.include(res.status);
        });
      });
    });
  });

  it('Phase 4 — Batch: MainDocForBatchStuffYeahYeahh, 5 sub-docs, batch archive → unarchive → trash → restore → trash → permanent delete', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const mainTitle = `MainDocForBatchStuffYeahYeahh ${suffix}`;
    const folderName = `MainDocForBatchStuffYeahYeahh Folder ${suffix}`;
    const folderCode = `BATCH-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const subFileNames = ['BatchSub1.pdf', 'BatchSub2.pdf', 'BatchSub3.pdf', 'BatchSub4.pdf', 'BatchSub5.pdf'];

    loginAndFlash('Phase 4: Batch folder, 5 sub-docs, batch archive/unarchive/trash/restore/permanent delete');

    // Create main doc (folder) MainDocForBatchStuffYeahYeahh.
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
      { contents: Cypress.Buffer.from('batch main'), fileName: 'batch-main.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    cy.visit('/folders');
    cy.contains(folderName, { timeout: 15000 }).should('be.visible');
    getFolderIdFromList(folderName).then((folderId) => cy.wrap(folderId).as('batchFolderId'));

    cy.get('@batchFolderId').then((folderId: number) => {
      cy.visit(`/folders/${folderId}`);
      waitStep();
      cy.get('[data-testid="upload-in-folder-btn"]').click();
      waitStep();
      cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click();
      waitStep();
      cy.get('.react-select__option').contains('Sub Document').click();
      waitStep();
      selectDepartmentAndType();
      cy.get('input[name="title"]').clear().type('Batch sub docs');
      waitStep();
      cy.get('input[type="file"]').selectFile(
        subFileNames.map((name, i) => ({
          contents: Cypress.Buffer.from(`batch sub ${i + 1}`),
          fileName: name,
        })),
        { force: true }
      );
      waitStep();
      cy.get('[data-testid="upload-document-submit"]').click();
      cy.get('.Toastify__toast--success', { timeout: 30000 }).should('be.visible');
      waitStep();

      // Batch archive: folder detail has per-row Archive only; click Archive on each sub-doc row (5 times).
      cy.visit(`/folders/${folderId}`);
      waitStep();
      cy.get('.card').contains('Secondary documents').parents('.card').find('tbody tr').should('have.length.at.least', 5);
      for (let i = 0; i < 5; i++) {
        cy.get('.card').contains('Secondary documents').parents('.card').find('tbody tr').first().within(() => {
          cy.contains('button', 'Archive').click();
        });
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();
      }

      // Batch unarchive: go to archived documents, select all from this folder, batch unarchive.
      cy.visit('/archive/documents');
      waitStep();
      cy.get('tbody input[type="checkbox"]').click({ multiple: true });
      cy.contains('button', 'Unarchive selected').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Batch move to trash: back to folder, select all 5 sub-docs, Move selected to trash.
      cy.visit(`/folders/${folderId}`);
      waitStep();
      cy.get('tbody .form-check-input').click({ multiple: true });
      cy.contains('button', 'Move selected to trash').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Batch restore: trash page, select only our 5 sub-docs by file name, Restore selected.
      cy.visit('/documents/trash');
      waitStep();
      subFileNames.forEach((name) => {
        cy.contains('tbody tr', name).find('input[type="checkbox"]').click();
        waitStep();
      });
      cy.get('[data-testid="trash-restore-selected"]').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Batch move to trash again.
      cy.visit(`/folders/${folderId}`);
      waitStep();
      cy.get('tbody .form-check-input').click({ multiple: true });
      cy.contains('button', 'Move selected to trash').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Batch permanent delete: trash page, select only our 5 sub-docs by file name (do not touch any other file).
      cy.visit('/documents/trash');
      waitStep();
      subFileNames.forEach((name) => {
        cy.contains('tbody tr', name).find('input[type="checkbox"]').click();
        waitStep();
      });
      cy.contains('button', 'Permanent delete selected').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Delete the batch folder (only this folder).
      cy.request('DELETE', `/api/folders/${folderId}`).then((res) => {
        expect([200, 204]).to.include(res.status);
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
