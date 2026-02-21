/**
 * Slow, production-safe smoke: one sequential run of all key flows (no delete, no permanent delete).
 * PRODUCTION RULE: No delete folder, no batch delete from /documents, no permanent delete.
 * Do not visit: edit-requests, signatures, notifications, permissions (E2E for those later).
 * Run with: npm run e2e:slow:open (with dev server already running). Uses stubbed APIs only.
 */

const STEP_DELAY = 800;
const DOC_ID_EDIT = 999;
const DOC_ID_ATTACH = 888;
const ATTACHMENT_ID = 101;
const FOLDER_ID_TRANSFER = 777;
const TARGET_FOLDER_ID = 778;
const FOLDER_ID_BULK = 100;
const JOB_ID = 'slow-smoke-job-1';
const TRASH_DOC_ID_1 = 901;
const TRASH_DOC_ID_2 = 902;

function waitStep() {
  cy.wait(STEP_DELAY);
}

const adminDepartments = { result: { success: true, data: [{ id: 1, name: 'Finance', code: 'FIN' }] } };
const adminDocumentTypes = { result: { success: true, data: [{ id: 1, name: 'Invoice', code: 'INV' }] } };
const adminTags = { result: { success: true, data: [] } };
/** Companies fetched via jsonRpcRequest; response must be JSON-RPC envelope with result. */
const adminCompanies = { jsonrpc: '2.0', result: { success: true, data: [{ id: 1, name: 'E2E Company' }] }, id: 1 };
const foldersListBulk = { result: { folders: [{ id: FOLDER_ID_BULK, name: 'Test Folder', code: 'TF', department_id: 1 }] } };
const foldersListEmpty = { result: { folders: [] } };

const folderDetailResponse = {
  result: {
    folder: { id: FOLDER_ID_TRANSFER, name: 'Source Folder', code: 'SRC', department_id: 1, state: 'active', document_count: 2 },
    data: [
      { id: 888, title: 'Sub Doc 1', barcode: 'SUB-1', department_id: 1, folder_id: FOLDER_ID_TRANSFER, folder_role: 'sub' },
      { id: 889, title: 'Sub Doc 2', barcode: 'SUB-2', department_id: 1, folder_id: FOLDER_ID_TRANSFER, folder_role: 'sub' },
    ],
    documents: [
      { id: 888, title: 'Sub Doc 1', barcode: 'SUB-1', department_id: 1, folder_id: FOLDER_ID_TRANSFER, folder_role: 'sub' },
      { id: 889, title: 'Sub Doc 2', barcode: 'SUB-2', department_id: 1, folder_id: FOLDER_ID_TRANSFER, folder_role: 'sub' },
    ],
  },
};
const foldersListTransfer = {
  result: {
    folders: [
      { id: FOLDER_ID_TRANSFER, name: 'Source', code: 'SRC', department_id: 1 },
      { id: TARGET_FOLDER_ID, name: 'Target Folder', code: 'TGT', department_id: 1 },
    ],
  },
};

const documentDetailEdit = {
  result: {
    success: true,
    data: {
      id: DOC_ID_EDIT,
      title: 'E2E Test Document',
      name: 'E2E Test Document',
      barcode: 'E2E-001',
      department_id: 1,
      department_name: 'Finance',
      document_type_id: 1,
      document_type_name: 'Invoice',
      uploader_id: 1,
      uploader_name: 'Test User',
      upload_date: '2025-01-01T00:00:00',
      status: 'active',
      confidentiality_level: 'internal',
      file_name: 'test.pdf',
      file_size: 1024,
      is_locked: false,
      tags: [],
      versions: [{ id: 1, version_number: 1, file_name: 'test.pdf', file_size: 1024, uploaded_by: 'Test', upload_date: '2025-01-01', change_description: '' }],
      folder_id: null,
    },
  },
};

const documentDetailWithAttachments = {
  result: {
    success: true,
    data: {
      id: DOC_ID_ATTACH,
      title: 'Doc With Attachments',
      name: 'Doc With Attachments',
      barcode: 'E2E-ATT',
      department_id: 1,
      department_name: 'Finance',
      document_type_id: 1,
      document_type_name: 'Invoice',
      uploader_id: 1,
      uploader_name: 'Test',
      upload_date: '2025-01-01T00:00:00',
      status: 'active',
      confidentiality_level: 'internal',
      file_name: 'doc.pdf',
      file_size: 1024,
      is_locked: false,
      tags: [],
      versions: [],
      folder_id: null,
      attachments: [{ id: ATTACHMENT_ID, name: 'Original Name', file_name: 'orig.pdf', description: 'Original desc' }],
    },
  },
};

const trashListResponse = {
  result: {
    success: true,
    data: [
      { id: TRASH_DOC_ID_1, title: 'Trashed Doc 1', barcode: 'TRASH-1', status: 'trashed' },
      { id: TRASH_DOC_ID_2, title: 'Trashed Doc 2', barcode: 'TRASH-2', status: 'trashed' },
    ],
    pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
  },
};

describe('Slow smoke (production-safe, no delete)', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.name === 'ZodError' || (err.message && err.message.includes('ZodError'))) return false;
      return true;
    });

    cy.intercept('POST', '**/api/departments', adminDepartments);
    cy.intercept('POST', '**/api/document-types', adminDocumentTypes);
    cy.intercept('POST', '**/api/tags', adminTags);
    cy.intercept('POST', '**/api/companies', adminCompanies);
    cy.intercept('POST', '**/api/documents/upload', { statusCode: 200, body: { success: true, data: { id: 1 } } });
    cy.intercept('POST', '**/api/folders/create', (req) => {
      req.reply({ statusCode: 200, body: { result: { success: true, data: { id: 1, name: 'Folder', code: 'FLD' } } } });
    });
    cy.intercept('POST', (req) => {
      const u = req.url;
      if (!u.includes('/api/folders')) return;
      if (u.includes('/create') || u.includes('/update')) return;
      if (new RegExp(`/api/folders/${FOLDER_ID_TRANSFER}(/documents)?$`).test(u)) return;
      if (u.endsWith('/api/folders')) {
        req.reply({ statusCode: 200, body: foldersListTransfer });
        return;
      }
      req.reply({ statusCode: 200, body: foldersListEmpty });
    });
    cy.intercept('POST', `**/api/folders/${FOLDER_ID_TRANSFER}`, (req) => {
      if (req.url.includes('/documents')) {
        req.reply({ statusCode: 200, body: folderDetailResponse });
        return;
      }
      req.reply({ statusCode: 200, body: { result: folderDetailResponse.result.folder } });
    });
    cy.intercept('POST', `**/api/folders/${FOLDER_ID_TRANSFER}/documents`, {
      statusCode: 200,
      body: { result: { folder: folderDetailResponse.result.folder, data: folderDetailResponse.result.data } },
    });
    cy.intercept('POST', `**/api/documents/${DOC_ID_EDIT}`, (req) => {
      if (req.url.includes('/update')) return;
      req.reply({ statusCode: 200, body: documentDetailEdit });
    });
    cy.intercept('POST', `**/api/documents/${DOC_ID_EDIT}/update`, { statusCode: 200, body: { result: { success: true }, id: 1 } });
    cy.intercept('POST', `**/api/documents/${DOC_ID_ATTACH}`, (req) => {
      if (req.url.includes('/update') || req.url.includes('/attachments/')) return;
      req.reply({ statusCode: 200, body: documentDetailWithAttachments });
    });
    cy.intercept('POST', (req) => {
      if (!req.url.includes(`/api/documents/${DOC_ID_ATTACH}/attachments`)) return;
      if (req.url.includes(`/attachments/${ATTACHMENT_ID}/update`)) return;
      if (req.url.includes('/attachments/multiple')) {
        req.reply({ statusCode: 200, body: { result: { success: true } } });
        return;
      }
      req.reply({
        statusCode: 200,
        body: { result: { success: true, data: [{ id: ATTACHMENT_ID, name: 'Att', file_name: 'a.pdf', description: '' }] } },
      });
    });
    cy.intercept('POST', `**/api/documents/${DOC_ID_ATTACH}/attachments/${ATTACHMENT_ID}/update`, { statusCode: 200, body: { result: { success: true } } });
    cy.intercept('POST', '**/api/documents/batch/move-folder', { statusCode: 200, body: { result: { success: true } } });
    cy.intercept('POST', '**/api/documents/trash', (req) => {
      req.reply({ statusCode: 200, body: trashListResponse });
    });
    cy.intercept('POST', '**/api/documents/restore', { statusCode: 200, body: { result: { success: true } } });
  });

  it('runs all key flows in sequence: login, upload main, upload sub, bulk upload, edit doc, attachments, transfer, trash restore', () => {
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const titleMain = `E2E Main ${suffix}`;
    const folderName = `E2E Folder ${suffix}`;
    const folderCode = `E2E-${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
    const titleSub = `E2E Sub ${suffix}`;
    const titleBulk = `Bulk ${suffix}`;
    const updatedTitle = `E2E Updated ${suffix}`;
    const attachmentName = `Attachment ${suffix}`;

    // --- 1. Login and dashboard ---
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
    cy.get('body').should('be.visible');

    // --- 2. Upload main document from dashboard ---
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
    cy.get('[data-testid="folder-company-select"]').find('.react-select__control').click();
    waitStep();
    cy.get('.react-select__option').contains('E2E Company').click();
    waitStep();
    cy.get('input[name="title"]').clear().type(titleMain);
    waitStep();
    cy.get('input[name="folder_name"]').clear().type(folderName);
    waitStep();
    cy.get('input[name="folder_code"]').clear().type(folderCode);
    waitStep();
    cy.get('input[type="file"]').selectFile({ contents: Cypress.Buffer.from('main pdf'), fileName: 'main.pdf' }, { force: true });
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    // --- 3. Upload sub document from upload page ---
    cy.flash('Testing sub-document upload flow');
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
    cy.get('.react-select__option').contains('Test Folder').click();
    waitStep();
    cy.get('input[name="title"]').clear().type(titleSub);
    waitStep();
    cy.get('input[type="file"]').selectFile({ contents: Cypress.Buffer.from('sub'), fileName: 'sub.pdf' }, { force: true });
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 15000 }).should('be.visible');
    waitStep();

    // --- 4. Bulk upload sub ---
    cy.flash('Testing bulk upload flow');
    cy.intercept('POST', (req) => {
      if (!req.url.includes('/api/folders')) return;
      if (req.url.includes('/create') || req.url.includes('/update') || /\/api\/folders\/\d+/.test(req.url)) return;
      req.reply({ statusCode: 200, body: foldersListBulk });
    });
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
    cy.get('.react-select__option').contains('Test Folder').click();
    waitStep();
    cy.get('input[name="title"]').clear().type(titleBulk);
    cy.intercept('POST', '**/api/documents/bulk-upload/start', { statusCode: 200, body: { result: { success: true, data: { job_id: JOB_ID } } } });
    cy.intercept('POST', /\/api\/documents\/bulk-upload\/[^/]+\/upload/, { statusCode: 200, body: { result: { success: true } } });
    cy.intercept('POST', /\/api\/documents\/bulk-upload\/[^/]+\/progress/, {
      statusCode: 200,
      body: { result: { success: true, data: { status: 'completed', total: 2, processed: 2, failed: 0 } } },
    });
    cy.get('input[type="file"]').selectFile(
      [
        { contents: Cypress.Buffer.from('f1'), fileName: 'b1.pdf' },
        { contents: Cypress.Buffer.from('f2'), fileName: 'b2.pdf' },
      ],
      { force: true }
    );
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    cy.get('.Toastify__toast--success', { timeout: 20000 }).should('be.visible');
    waitStep();

    // --- 5. Document detail: edit document ---
    cy.flash('Testing edit document flow');
    cy.visit(`/documents/${DOC_ID_EDIT}`);
    waitStep();
    cy.get('[data-testid="document-detail-edit-document-btn"]').click();
    waitStep();
    cy.get('[data-testid="edit-document-side-panel"]').should('be.visible');
    cy.get('input[name="title"]').clear().type(updatedTitle);
    waitStep();
    cy.get('[data-testid="edit-document-save"]').click();
    waitStep();
    cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
    waitStep();

    // --- 6. Document detail: attachments add + edit ---
    cy.flash('Testing attachments add and edit flow');
    cy.visit(`/documents/${DOC_ID_ATTACH}`);
    waitStep();
    cy.contains('button', 'Attachments').click();
    waitStep();
    cy.get('[data-testid="document-detail-attachments-tab"]').should('be.visible');
    cy.get('[data-testid="document-detail-add-attachment-btn"]').click();
    waitStep();
    cy.get('input[type="file"]').first().selectFile({ contents: Cypress.Buffer.from('attach'), fileName: 'e2e-attach.pdf' }, { force: true });
    waitStep();
    cy.get('[data-testid="upload-document-submit"]').click();
    waitStep();
    cy.get('[data-testid="document-detail-attachments-tab"]').find('[aria-label^="Actions for row"]').first().click();
    waitStep();
    cy.get('[data-testid="row-action-edit"]').first().click();
    waitStep();
    cy.get('[data-testid="attachment-side-panel"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="attachment-edit-name"]').clear().type(attachmentName);
    waitStep();
    cy.get('[data-testid="attachment-edit-save"]').click();
    waitStep();

    // --- 7. Folder detail: transfer ---
    cy.flash('Testing transfer flow');
    cy.visit(`/folders/${FOLDER_ID_TRANSFER}`);
    waitStep();
    cy.contains('Sub Doc 1').closest('tr').within(() => cy.contains('button', 'Transfer').click());
    waitStep();
    cy.get('[data-testid="transfer-folder-select"]').select(String(TARGET_FOLDER_ID));
    waitStep();
    cy.get('[data-testid="transfer-confirm-btn"]').click();
    waitStep();
    cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
    waitStep();

    // --- 8. Trash: restore single ---
    cy.flash('Testing trash restore flow');
    cy.visit('/documents/trash');
    waitStep();
    cy.get('[data-testid="documents-trash-page"]').should('be.visible');
    cy.contains('Trashed Doc 1').closest('tr').within(() => cy.contains('button', 'Restore').click());
    waitStep();
    cy.get('.Toastify__toast--success', { timeout: 10000 }).should('be.visible');
  });
});
