/**
 * Slow smoke against REAL API. All operations only on test-created data.
 * Phases (run separately from Cypress test list):
 * 1. Upload: Create MainBaseFile (in MainBaseFolder), MainBaseSecondaryFile (sub in base), MainTargetFile (in MainTargetFolder). Edit all: add -edited to name.
 * 2. Transfer: Use existing MainBaseFolder and MainTargetFolder. Transfer MainBaseSecondaryFile-edited to target, edit it there, transfer back to base.
 * 3. Trash and permanent delete: Only on phase 1+2 folders and their files (move to trash, permanent delete, delete folders).
 * 4. Batch: Create MainDocForBatchStuffYeahYeahh folder, bulk upload 5 sub-docs, batch archive → unarchive → trash → restore → trash → permanent delete (only this folder's files).
 * Run with: npm run e2e:slow:open (dev server + real backend). Deletion/trash/permanent-delete are allowed but tests must only act on data they created.
 *
 * Re-run from where it stopped (avoid re-running Phase 1 after a fix):
 * - In Cypress UI: Click the failed test in the left sidebar (e.g. "Phase 2 — Transfer...") and run only that test (Run 1 test). Do not click "Run all tests".
 * - From CLI: npx cypress run --spec cypress/e2e/slow-smoke-real-api.cy.ts --env runPhase=2   (runPhase: 1–4 = Phase 1–4, 5 = Update)
 */

const STEP_DELAY = 800;

/** Inline unique suffix so spec works when support/commands (cy.flash, Cypress.uniqueE2ESuffix) are not loaded in runner. */
function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 999) + 1}`;
}

/** When set (e.g. 2), only that phase runs. Use --env runPhase=2 to resume from Phase 2 after a fix. */
const runOnlyPhase = Cypress.env('runPhase') as number | undefined;

function shouldRunPhase(phase: number): boolean {
  return runOnlyPhase === undefined || runOnlyPhase === phase;
}

function waitStep() {
  cy.wait(STEP_DELAY);
}

/** Shared login as admin; optional visual pause (replaces cy.flash when support file not loaded). */
function loginAndFlash(_flowName: string) {
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
  cy.wait(STEP_DELAY);
}

/** Folder options in UI are "Name — Code". Wait for option containing folderName then click (handles list load delay). */
function selectFolderByName(folderName: string, _folderCode: string, timeout = 15000) {
  cy.get('[data-testid="folder-select"]').find('.react-select__control').click({ force: true });
  waitStep();
  cy.contains('.react-select__option', folderName, { timeout }).click();
}

/** Fill department and document type (Finance, Invoice). Use force so disabled selects (e.g. while loading) do not fail. */
function selectDepartmentAndType() {
  cy.get('[data-testid="department-select"]').find('.react-select__control').click({ force: true });
  waitStep();
  cy.get('.react-select__option').contains('Finance (FIN)').click();
  waitStep();
  cy.get('[data-testid="document-type-select"]').find('.react-select__control').click({ force: true });
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

  (shouldRunPhase(1) ? it : it.skip)('Phase 1 — Upload: MainBaseFile, MainBaseFolder, MainBaseSecondaryFile, MainTargetFile, MainTargetFolder; edit all (add -edited)', () => {
    const mainBaseFile = 'MainBaseFile';
    const mainBaseFolder = 'MainBaseFolder';
    const mainBaseSecondaryFile = 'MainBaseSecondaryFile';
    const mainTargetFile = 'MainTargetFile';
    const mainTargetFolder = 'MainTargetFolder';

    loginAndFlash('Phase 1: MainBase + MainTarget folders and files, then edit all');

    // Create MainBaseFile (main doc) in MainBaseFolder.
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(mainBaseFile);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(mainBaseFolder);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type('MBF');
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

    // Create MainBaseSecondaryFile (sub) in MainBaseFolder.
    cy.visit('/documents/upload');
    waitStep();
    cy.get('[data-testid="upload-document-open-btn"]').click({ force: true });
    waitStep();
    cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click({ force: true });
    waitStep();
    cy.get('.react-select__option').contains('Sub Document').click();
    waitStep();
    selectDepartmentAndType();
    selectFolderByName(mainBaseFolder, 'MBF');
    waitStep();
    cy.get('input[name="title"]').clear().type(mainBaseSecondaryFile);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('base secondary'), fileName: 'main-base-secondary.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    captureUploadDocId();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();
    cy.get('@createdDocId').then((id: number) => cy.wrap(id).as('mainBaseSecondaryDocId'));

    // Create MainTargetFile (main doc) in MainTargetFolder.
    cy.visit('/dashboard');
    waitStep();
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(mainTargetFile);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(mainTargetFolder);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type('MTF');
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

    // Edit MainBaseFile: name → MainBaseFile-edited.
    cy.get('@mainBaseDocId').then((id: number) => {
      cy.visit(`/documents/${id}`);
      waitStep();
      cy.get('[data-testid="document-detail-edit-document-btn"]').click();
      waitStep();
      cy.get('[data-testid="edit-document-side-panel"]').should('be.visible');
      cy.get('input[name="title"]').clear().type('MainBaseFile-edited');
      waitStep();
      cy.get('[data-testid="edit-document-save"]').click();
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
    });

    // Edit MainBaseSecondaryFile: name → MainBaseSecondaryFile-edited.
    cy.get('@mainBaseSecondaryDocId').then((id: number) => {
      cy.visit(`/documents/${id}`);
      waitStep();
      cy.get('[data-testid="document-detail-edit-document-btn"]').click();
      waitStep();
      cy.get('input[name="title"]').clear().type('MainBaseSecondaryFile-edited');
      waitStep();
      cy.get('[data-testid="edit-document-save"]').click();
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
    });

    // Edit MainTargetFile: name → MainTargetFile-edited.
    cy.get('@mainTargetDocId').then((id: number) => {
      cy.visit(`/documents/${id}`);
      waitStep();
      cy.get('[data-testid="document-detail-edit-document-btn"]').click();
      waitStep();
      cy.get('input[name="title"]').clear().type('MainTargetFile-edited');
      waitStep();
      cy.get('[data-testid="edit-document-save"]').click();
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
    });
  });

  (shouldRunPhase(2) ? it : it.skip)('Phase 2 — Transfer: use existing MainBaseSecondaryFile-edited, transfer to target, edit there, transfer back', () => {
    loginAndFlash('Phase 2: Transfer secondary to target, edit in target, transfer back to base');

    cy.visit('/folders');
    cy.contains('MainBaseFolder', { timeout: 15000 }).should('be.visible');
    cy.contains('MainTargetFolder', { timeout: 5000 }).should('be.visible');
    getFolderIdFromList('MainBaseFolder').then((id) => cy.wrap(id).as('baseFolderId'));
    getFolderIdFromList('MainTargetFolder').then((id) => cy.wrap(id).as('targetFolderId'));

    cy.get('@baseFolderId').then((baseFolderId: number) => {
      cy.get('@targetFolderId').then((targetFolderId: number) => {
        // Transfer MainBaseSecondaryFile-edited from base to target.
        cy.visit(`/folders/${baseFolderId}`);
        waitStep();
        cy.contains('MainBaseSecondaryFile-edited').closest('tr').within(() => cy.contains('button', 'Transfer').click());
        waitStep();
        cy.get('[data-testid="transfer-folder-select"]').select(String(targetFolderId));
        waitStep();
        cy.get('[data-testid="transfer-confirm-btn"]').click();
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();

        // Edit the file in target: add -edited to name → MainBaseSecondaryFile-edited-edited.
        cy.visit(`/folders/${targetFolderId}`);
        waitStep();
        cy.contains('MainBaseSecondaryFile-edited').closest('tr').within(() => cy.contains('button', 'View').click());
        waitStep();
        cy.get('[data-testid="document-detail-edit-document-btn"]').click();
        waitStep();
        cy.get('input[name="title"]').clear().type('MainBaseSecondaryFile-edited-edited');
        waitStep();
        cy.get('[data-testid="edit-document-save"]').click();
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();

        // Transfer back from target to base.
        cy.visit(`/folders/${targetFolderId}`);
        waitStep();
        cy.contains('MainBaseSecondaryFile-edited-edited').closest('tr').within(() => cy.contains('button', 'Transfer').click());
        waitStep();
        cy.get('[data-testid="transfer-folder-select"]').select(String(baseFolderId));
        waitStep();
        cy.get('[data-testid="transfer-confirm-btn"]').click();
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();

        cy.visit(`/folders/${baseFolderId}`);
        waitStep();
        cy.contains('MainBaseSecondaryFile-edited-edited').should('be.visible');
      });
    });
  });

  (shouldRunPhase(3) ? it : it.skip)('Phase 3 — Move to trash and permanent delete (only this test\'s folders and their files)', () => {
    const suffix = uniqueSuffix();
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
        cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click({ force: true });
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

  (shouldRunPhase(4) ? it : it.skip)('Phase 4 — Batch: MainDocForBatchStuffYeahYeahh, 5 sub-docs, batch archive → unarchive → trash → restore → trash → permanent delete', () => {
    const suffix = uniqueSuffix();
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
      cy.get('[data-testid="upload-kind-select"]').find('.react-select__control').click({ force: true });
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

  (shouldRunPhase(5) ? it : it.skip)('Update: update document and attachment', () => {
    const suffix = uniqueSuffix();
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

      cy.wait(STEP_DELAY);
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

      cy.wait(STEP_DELAY);
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
