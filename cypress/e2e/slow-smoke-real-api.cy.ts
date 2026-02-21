/// <reference types="cypress" />
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

/** Folder options in UI are "Name — Code". Open folder select, wait for option in the open menu, then click. */
function selectFolderByName(folderName: string, folderCode: string, timeout = 20000) {
  cy.get('[data-testid="folder-select"]').find('.react-select__control').click({ force: true });
  waitStep();
  // Use the last-open menu (folder dropdown); match any element containing folder name (option may be option or child).
  const fullLabel = `${folderName} — ${folderCode}`;
  cy.get('.react-select__menu').should('be.visible').last().within(() => {
    cy.contains(fullLabel, { timeout }).click();
  });
}

/** Fill department and document type (Finance, Invoice). Skips when selects are disabled (e.g. folder-context upload). */
function selectDepartmentAndType() {
  const menuTimeout = 12000;
  cy.get('[data-testid="department-select"]').then(($dept) => {
    const control = $dept.find('.react-select__control');
    const isDisabled = control.hasClass('react-select__control--is-disabled') || control.attr('aria-disabled') === 'true';
    if (isDisabled) return;
    cy.wrap($dept).find('.react-select__control').click({ force: true });
    cy.get('.react-select__menu', { timeout: menuTimeout }).should('be.visible').last().within(() => {
      cy.contains('Finance (FIN)', { timeout: menuTimeout }).click();
    });
    waitStep();
    cy.get('[data-testid="document-type-select"]').then(($type) => {
      const typeControl = $type.find('.react-select__control');
      if (typeControl.hasClass('react-select__control--is-disabled') || typeControl.attr('aria-disabled') === 'true') return;
      cy.wrap($type).find('.react-select__control').click({ force: true });
      cy.get('.react-select__menu', { timeout: menuTimeout }).should('be.visible').last().within(() => {
        cy.contains('Invoice (INV)', { timeout: menuTimeout }).click();
      });
      waitStep();
    });
  });
}

/** Select Folder Company/Brand for main-document upload (required before submit is enabled). */
function selectFolderCompany() {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="folder-company-select"]').length === 0) return;
    cy.get('[data-testid="folder-company-select"]').find('.react-select__control').click({ force: true });
    waitStep();
    cy.get('.react-select__menu').should('be.visible').last().within(() => {
      cy.get('.react-select__option').first().click();
    });
    waitStep();
  });
}

/** Capture last upload response: alias createdDocId and createdFolderId (if backend returns folder_id). */
function captureUploadDocId() {
  cy.wait('@uploadDocument', { timeout: 30000 })
    .its('response.body')
    .then((body: { success?: boolean; data?: { id: number; folder_id?: number }; result?: { success?: boolean; data?: { id: number; folder_id?: number } } }) => {
      const data = body?.data ?? body?.result?.data;
      const ok = body?.success === true || body?.result?.success === true;
      expect(ok).to.eq(true);
      expect(data?.id).to.be.a('number');
      cy.wrap(data!.id).as('createdDocId');
      const folderId = data?.folder_id ?? (body?.result as { data?: { folder_id?: number } } | undefined)?.data?.folder_id;
      cy.wrap(folderId != null && folderId > 0 ? folderId : null).as('createdFolderId');
    });
}

/** Resolve folder ID from /folders list by folder name (grid or list view). Waits for list to load. */
function getFolderIdFromList(folderName: string, timeout = 15000): Cypress.Chainable<number> {
  cy.contains(folderName, { timeout }).should('be.visible');
  return cy.contains(folderName).closest('tr, .folders__grid-card-wrapper').then(($row) => {
    const idAttr = $row.attr('data-folder-id');
    if (idAttr) return cy.wrap(Number(idAttr));
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

/** Get folder_id for a document by requesting document detail (use when upload response has no folder_id). */
function getFolderIdFromDocument(documentId: number): Cypress.Chainable<number | null> {
  return cy.window().then((win) => win.localStorage.getItem('access_token')).then((token) => {
    if (!token) return cy.wrap(null);
    const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3003';
    return cy.request({
      method: 'POST',
      url: `${baseUrl}/api/documents/${documentId}`,
      body: { jsonrpc: '2.0', method: 'call', params: { document_id: documentId }, id: 1 },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      const raw = res.body?.result ?? res.body;
      const data = raw?.data ?? raw;
      const folderId = data?.folder_id;
      return cy.wrap(typeof folderId === 'number' && folderId > 0 ? folderId : null);
    });
  });
}

/** Result of document search: id and optional folder_id from list item. */
interface DocSearchMatch {
  id: number;
  folder_id?: number | null;
}

/**
 * Search documents by title via POST /api/documents (JSON-RPC). Returns best match (exact title, highest id) or null.
 * Requires login so access_token is in localStorage.
 */
function getDocumentIdByTitleSearch(title: string): Cypress.Chainable<DocSearchMatch | null> {
  return cy.window().then((win) => win.localStorage.getItem('access_token')).then((token) => {
    if (!token) return cy.wrap(null);
    const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3003';
    return cy.request({
      method: 'POST',
      url: `${baseUrl}/api/documents`,
      body: { jsonrpc: '2.0', method: 'call', params: { search: title, per_page: 20 }, id: 1 },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      const raw = res.body?.result ?? res.body;
      const arr = Array.isArray(raw) ? raw : raw?.data ?? [];
      const docs = arr as Array<{ id: number; title?: string; name?: string; folder_id?: number | null }>;
      const exact = docs.filter((d) => (d.title ?? d.name ?? '') === title);
      const best = exact.length ? exact.sort((a, b) => b.id - a.id)[0] : null;
      if (!best) return cy.wrap(null);
      return cy.wrap({ id: best.id, folder_id: best.folder_id ?? null });
    });
  });
}

/**
 * Resolve folder_id for a folder that contains a main document with the given title.
 * Uses document search then folder_id from list or getFolderIdFromDocument. Fails with clear message if doc not found.
 */
function getFolderIdFromDocTitle(title: string): Cypress.Chainable<number> {
  return getDocumentIdByTitleSearch(title).then((match) => {
    if (!match) {
      expect(false, `Document with title "${title}" not found. Run Phase 1 first so MainBase/MainTarget docs exist.`).to.be.true;
      return cy.wrap(0);
    }
    if (match.folder_id != null && match.folder_id > 0) {
      return cy.wrap(match.folder_id);
    }
    return getFolderIdFromDocument(match.id).then((fid) => {
      if (fid == null || fid < 1) {
        expect(false, `Document "${title}" has no folder_id. Run Phase 1 first.`).to.be.true;
        return cy.wrap(0);
      }
      return cy.wrap(fid);
    });
  });
}

describe('Slow smoke (real API) — flow options', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.name === 'ZodError' || (err.message && err.message.includes('ZodError'))) return false;
      return true;
    });
    // Stub companies so Folder Company/Brand dropdown has options. App uses jsonRpcRequest so response must be JSON-RPC envelope.
    cy.intercept('POST', '**/api/companies', { jsonrpc: '2.0', result: { success: true, data: [{ id: 1, name: 'E2E Company' }] }, id: 1 });
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
    selectFolderCompany();
    cy.get('input[name="title"]').clear().type(mainBaseFile);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(mainBaseFolder);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type('MBF');
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('main base'), fileName: `${mainBaseFile}.pdf` },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.enabled').click();
    captureUploadDocId();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();
    cy.get('@createdDocId').then((id: number) => cy.wrap(id).as('mainBaseDocId'));

    // Resolve MainBaseFolder ID: from upload response, else document detail API, else /folders list.
    cy.get('@createdFolderId').then((fid: number | null) => {
      if (fid != null && fid > 0) {
        cy.wrap(fid).as('mainBaseFolderId');
      } else {
        return cy.get('@mainBaseDocId').then((docId: number) =>
          getFolderIdFromDocument(docId).then((fid2: number | null) => {
            if (fid2 != null) {
              return cy.wrap(fid2).as('mainBaseFolderId');
            }
            cy.visit('/folders');
            cy.contains(mainBaseFolder, { timeout: 20000 }).should('be.visible');
            waitStep();
            return getFolderIdFromList(mainBaseFolder, 20000).as('mainBaseFolderId');
          })
        );
      }
    });
    cy.get('@mainBaseFolderId').then((id: number) => cy.visit(`/folders/${id}`));
    waitStep();
    cy.get('[data-testid="upload-in-folder-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    selectDepartmentAndType();
    cy.get('input[name="title"]').clear().type(mainBaseSecondaryFile);
    waitStep();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('base secondary'), fileName: 'main-base-secondary.pdf' },
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.enabled').click();
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
    selectFolderCompany();
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
    cy.get('[data-testid="upload-document-submit"]').should('be.enabled').click();
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

  (shouldRunPhase(2) ? it : it.skip)('Phase 2 — Transfer: open MainBase folder, transfer secondary to target, edit there, transfer back', () => {
    loginAndFlash('Phase 2: Transfer secondary to target, edit in target, transfer back to base');

    // Resolve folder IDs from documents (MainBaseFile-edited and MainTargetFile-edited) so we don't depend on /folders list.
    getFolderIdFromDocTitle('MainBaseFile-edited').as('baseFolderId');
    getFolderIdFromDocTitle('MainTargetFile-edited').as('targetFolderId');

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

  (shouldRunPhase(3) ? it : it.skip)('Phase 3 — Trash sub-doc only, permanent delete from trash, then delete folder (main doc is removed with folder)', () => {
    loginAndFlash('Phase 3: Trash only sub-doc, permanent delete it from trash, delete folder (main doc cannot be trashed; deleting folder removes it)');

    getFolderIdFromDocTitle('MainBaseFile-edited').as('baseFolderId');

    cy.get('@baseFolderId').then((baseId: number) => {
      cy.visit(`/folders/${baseId}`);
      waitStep();

      // Only sub/secondary documents can be moved to trash. Main document cannot; to remove it, delete the folder.
      cy.contains('tr', 'MainBaseSecondaryFile-edited')
        .invoke('attr', 'data-doc-id')
        .then((id) => cy.wrap(id).as('subDocId'));
      cy.get('@subDocId').then((subDocId: string) => {
        cy.get(`button[data-doc-id="${subDocId}"]`).contains('Move to trash').click();
      });
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Permanent delete from trash: only the sub-doc was trashed; select it and permanent delete.
      cy.visit('/documents/trash');
      waitStep();
      cy.get('[data-testid="documents-trash-page"]').should('be.visible');
      cy.get('@subDocId').then((subDocId: string) => {
        cy.get(`tr[data-row-id="${subDocId}"] input.form-check-input`).click();
      });
      waitStep();
      cy.contains('button', 'Permanent delete selected').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Delete the folder (this removes the main document; main doc cannot be trashed directly).
      cy.request('DELETE', `/api/folders/${baseId}`).then((res) => {
        expect([200, 204]).to.include(res.status);
      });
    });
  });

  (shouldRunPhase(4) ? it : it.skip)('Phase 4 — Batch: MainDocForBatchStuffYeahYeahh, 5 sub-docs, batch archive → unarchive → trash → restore → trash → permanent delete', () => {
    const suffix = uniqueSuffix();
    const shortSuffix = suffix.replace(/[^a-z0-9]/gi, '').slice(0, 8);
    const mainTitle = `MainDocForBatchStuffYeahYeahh ${suffix}`;
    const folderName = `MainDocForBatchStuffYeahYeahh Folder ${suffix}`;
    const folderCode = `BATCH-${shortSuffix}`;
    const subFileNames = [
      `BatchSub1-${shortSuffix}.pdf`,
      `BatchSub2-${shortSuffix}.pdf`,
      `BatchSub3-${shortSuffix}.pdf`,
      `BatchSub4-${shortSuffix}.pdf`,
      `BatchSub5-${shortSuffix}.pdf`,
    ];

    loginAndFlash('Phase 4: Batch folder, 5 sub-docs, batch archive/unarchive/trash/restore/permanent delete');

    // Create main doc (folder) MainDocForBatchStuffYeahYeahh.
    cy.get('[data-testid="upload-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').should('be.visible');
    selectDepartmentAndType();
    selectFolderCompany();
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

      // Capture the 5 sub-doc ids from Secondary documents table for stable selection on trash later.
      cy.visit(`/folders/${folderId}`);
      waitStep();
      cy.get('.card').contains('Secondary documents').parents('.card').find('tbody tr').should('have.length.at.least', 5);
      cy.get('.card').contains('Secondary documents').parents('.card').find('tbody tr').then(($rows) => {
        const ids = $rows.slice(0, 5).toArray().map((row) => row.getAttribute('data-doc-id'));
        cy.wrap(ids).as('batchSubDocIds');
      });

      // Batch archive: folder detail has per-row Archive only; click Archive on each sub-doc row (5 times).
      for (let i = 0; i < 5; i++) {
        cy.get('.card').contains('Secondary documents').parents('.card').find('tbody tr').first().within(() => {
          cy.contains('button', 'Archive').click();
        });
        waitStep();
        cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
        waitStep();
      }

      // Batch unarchive: go to archived documents, search by suffix to isolate our docs, select and unarchive.
      cy.visit('/archive/documents');
      waitStep();
      cy.get('[data-testid="archived-documents-page"]').should('be.visible');
      cy.get('[data-testid="archived-documents-search"] input').clear().type(shortSuffix);
      waitStep();
      cy.wait(600);
      cy.get('[data-testid="archived-documents-page"] tbody tr').should('have.length', 5);
      cy.get('[data-testid="archived-documents-page"] tbody .form-check-input').click({ multiple: true });
      cy.get('[data-testid="archived-unarchive-selected"]').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Batch move to trash: back to folder, select only our 5 sub-docs in Secondary documents card, Move selected to trash.
      cy.visit(`/folders/${folderId}`);
      waitStep();
      cy.get('.card').contains('Secondary documents').parents('.card').find('tbody .form-check-input').click({ multiple: true });
      cy.contains('button', 'Move selected to trash').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Batch restore: trash page, select only our 5 sub-docs by data-row-id, Restore selected.
      cy.visit('/documents/trash');
      waitStep();
      cy.get('[data-testid="documents-trash-page"]').should('be.visible');
      cy.get('@batchSubDocIds').each((id: string) => {
        cy.get(`tr[data-row-id="${id}"] input.form-check-input`).click();
        waitStep();
      });
      cy.get('[data-testid="trash-restore-selected"]').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Batch move to trash again (only our 5 sub-docs).
      cy.visit(`/folders/${folderId}`);
      waitStep();
      cy.get('.card').contains('Secondary documents').parents('.card').find('tbody .form-check-input').click({ multiple: true });
      cy.contains('button', 'Move selected to trash').click();
      waitStep();
      cy.get('[role="dialog"]').within(() => cy.get('[data-testid="confirm-modal-confirm"]').click());
      waitStep();
      cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
      waitStep();

      // Batch permanent delete: trash page, select only our 5 sub-docs by data-row-id (do not touch any other file).
      cy.visit('/documents/trash');
      waitStep();
      cy.get('@batchSubDocIds').each((id: string) => {
        cy.get(`tr[data-row-id="${id}"] input.form-check-input`).click();
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
    selectFolderCompany();
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
