/**
 * Document detail attachments: add attachment, Edit (name/description), replace file only.
 * PRODUCTION RULE: Tests must not delete existing data; only add/update or use stubbed data.
 */

const DOC_ID = 888;
const ATTACHMENT_ID = 101;

const documentDetailWithAttachments = {
  result: {
    success: true,
    data: {
      id: DOC_ID,
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
      attachments: [
        { id: ATTACHMENT_ID, name: 'Original Name', file_name: 'orig.pdf', description: 'Original desc' },
      ],
    },
  },
};

describe('Document detail attachments', () => {
  beforeEach(() => {
    cy.intercept('POST', `**/api/documents/${DOC_ID}`, (req) => {
      if (req.url.includes('/update') || req.url.includes('/attachments/')) return;
      req.reply({ statusCode: 200, body: documentDetailWithAttachments });
    });
    cy.intercept('POST', (req) => {
      if (!req.url.includes(`/api/documents/${DOC_ID}/attachments`)) return;
      if (req.url.includes(`/attachments/${ATTACHMENT_ID}/update`)) return;
      if (req.url.includes('/attachments/multiple')) return;
      req.reply({
        statusCode: 200,
        body: {
          result: {
            success: true,
            data: [
              { id: ATTACHMENT_ID, name: 'Original Name', file_name: 'orig.pdf', description: 'Original desc' },
            ],
          },
        },
      });
    });
  });

  it('add attachment: opens Add attachment, selects file and submits, asserts attachments/multiple request', () => {
    let addPayload: { files?: unknown[] } = {};
    cy.intercept('POST', `**/api/documents/${DOC_ID}/attachments/multiple`, (req) => {
      const body = req.body as { params?: { files?: unknown[] } };
      if (body?.params?.files) addPayload = { files: body.params.files };
      req.reply({ statusCode: 200, body: { result: { success: true } } });
    }).as('addAttachment');

    cy.loginByToken(`/documents/${DOC_ID}`);
    cy.contains('button', 'Attachments').click();
    cy.get('[data-testid="document-detail-attachments-tab"]').should('be.visible');
    cy.get('[data-testid="document-detail-add-attachment-btn"]').click();

    cy.get('input[type="file"]').first().selectFile({ contents: Cypress.Buffer.from('e2e attachment content'), fileName: 'e2e-attach.pdf' }, { force: true });
    cy.get('[data-testid="upload-document-submit"]').click();

    cy.wait('@addAttachment').then(() => {
      expect(addPayload.files).to.be.an('array').with.length.greaterThan(0);
      const first = (addPayload.files as Record<string, unknown>[])[0];
      expect(first).to.have.property('file_name');
      expect(first).to.have.property('file_data');
    });
  });

  it('opens attachments tab, clicks Edit, sidebar opens, updates name/description and saves', () => {
    let updatePayload: Record<string, unknown> = {};
    cy.intercept('POST', `**/api/documents/${DOC_ID}/attachments/${ATTACHMENT_ID}/update`, (req) => {
      const body = req.body;
      if (body?.params) updatePayload = body.params as Record<string, unknown>;
      req.reply({ statusCode: 200, body: { result: { success: true } } });
    }).as('updateAttachment');

    cy.loginByToken(`/documents/${DOC_ID}`);
    cy.url().should('include', `/documents/${DOC_ID}`);

    cy.contains('button', 'Attachments').click();
    cy.get('[data-testid="document-detail-attachments-tab"]').should('be.visible');

    cy.get('[data-testid="document-detail-attachments-tab"]').find('[aria-label^="Actions for row"]').first().click();
    cy.get('[data-testid="row-action-edit"]').first().click();
    cy.get('[data-testid="attachment-side-panel"]', { timeout: 15000 }).should('be.visible');

    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const attachmentName = `Updated Attachment Name ${suffix}`;
    cy.get('[data-testid="attachment-edit-name"]').clear().type(attachmentName);
    cy.get('[data-testid="attachment-edit-description"]').clear().type('Updated description text');
    cy.get('[data-testid="attachment-edit-save"]').click();

    cy.wait('@updateAttachment').then(() => {
      expect(updatePayload).to.have.property('name', attachmentName);
      expect(updatePayload).to.have.property('description', 'Updated description text');
    });
  });

  it('replace file: selects file and Save sends request with file_name and file_data', () => {
    let updatePayload: Record<string, unknown> = {};
    cy.intercept('POST', `**/api/documents/${DOC_ID}/attachments/${ATTACHMENT_ID}/update`, (req) => {
      const body = req.body;
      if (body?.params) updatePayload = body.params as Record<string, unknown>;
      req.reply({ statusCode: 200, body: { result: { success: true } } });
    }).as('updateAttachment');

    cy.loginByToken(`/documents/${DOC_ID}`);
    cy.contains('button', 'Attachments').click();
    cy.get('[data-testid="document-detail-attachments-tab"]').should('be.visible');
    cy.get('[data-testid="document-detail-attachments-tab"]').find('[aria-label^="Actions for row"]').first().click();
    cy.get('[data-testid="row-action-edit"]').first().click();
    cy.get('[data-testid="attachment-side-panel"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="attachment-replace-file"]').selectFile(
      { contents: Cypress.Buffer.from('test file content'), fileName: 'replacement.txt' },
      { force: true }
    );
    cy.get('[data-testid="attachment-edit-save"]').click();

    cy.wait('@updateAttachment').then(() => {
      expect(updatePayload).to.have.property('file_name', 'replacement.txt');
      expect(updatePayload).to.have.property('file_data');
      expect(String(updatePayload.file_data)).to.have.length.greaterThan(0);
    });
  });
});
