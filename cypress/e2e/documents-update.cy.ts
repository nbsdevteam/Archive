/**
 * Documents: navigate list → document detail → open edit document side panel → submit update.
 * Intercepts document list, detail, and update; asserts update request payload.
 */

const DOC_ID = 999;

const documentListResponse = {
  result: {
    success: true,
    data: [
      {
        id: DOC_ID,
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
      },
    ],
    pagination: { total: 1, page: 1, per_page: 20, total_pages: 1 },
  },
};

const documentDetailResponse = {
  result: {
    success: true,
    data: {
      id: DOC_ID,
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

const adminDepartments = { result: { success: true, data: [{ id: 1, name: 'Finance', code: 'FIN' }] } };
const adminTags = { result: { success: true, data: [] } };
const adminDocumentTypes = { result: { success: true, data: [{ id: 1, name: 'Invoice', code: 'INV' }] } };
const foldersList = { result: { folders: [] } };

describe('Document update', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/departments', adminDepartments);
    cy.intercept('POST', '**/api/tags', adminTags);
    cy.intercept('POST', '**/api/document-types', adminDocumentTypes);
    cy.intercept('POST', (req) => {
      const u = req.url;
      if (!u.includes('/api/folders')) return;
      if (u.includes('/create') || u.includes('/update') || /\/api\/folders\/\d+/.test(u)) return;
      req.reply({ statusCode: 200, body: foldersList });
    });
    cy.intercept('POST', `**/api/documents/${DOC_ID}`, (req) => {
      if (req.url.includes('/update')) return;
      if (req.url.includes('/attachments')) return;
      req.reply({ statusCode: 200, body: documentDetailResponse });
    }).as('getDocument');
    cy.intercept('POST', `**/api/documents/${DOC_ID}/update`, (req) => {
      req.reply({ statusCode: 200, body: { result: { success: true }, id: 1 } });
    }).as('updateDocument');
  });

  it('opens document detail, edit panel, submits update and asserts request payload', () => {
    let updatePayload: Record<string, unknown> = {};
    cy.intercept('POST', `**/api/documents/${DOC_ID}/update`, (req) => {
      const body = req.body;
      if (body?.params) updatePayload = body.params as Record<string, unknown>;
      req.reply({ statusCode: 200, body: { result: { success: true }, id: 1 } });
    }).as('updateDocument');

    cy.loginByToken(`/documents/${DOC_ID}`);
    cy.url().should('include', `/documents/${DOC_ID}`);

    cy.get('[data-testid="document-detail-edit-document-btn"]').click();
    cy.get('[data-testid="edit-document-side-panel"]').should('be.visible');

    cy.get('input[name="title"]').clear().type('E2E Updated Title');
    cy.get('[data-testid="edit-document-save"]').click();

    cy.wait('@updateDocument').then(() => {
      expect(updatePayload).to.have.property('title', 'E2E Updated Title');
    });
  });
});
