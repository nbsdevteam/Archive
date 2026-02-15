/**
 * Folder detail attachments: navigate to folder → attachments section → select doc → Edit attachment → sidebar → update and save.
 */

const FOLDER_ID = 777;
const DOC_ID = 888;
const ATTACHMENT_ID = 101;

const folderDetailResponse = {
  result: {
    success: true,
    folder: {
      id: FOLDER_ID,
      name: 'E2E Test Folder',
      code: 'E2E-FLD',
      department_id: 1,
      state: 'active',
      document_count: 1,
    },
    data: [
      {
        id: DOC_ID,
        title: 'Doc In Folder',
        name: 'Doc In Folder',
        barcode: 'E2E-DOC',
        department_id: 1,
        document_type_id: 1,
        upload_date: '2025-01-01',
        status: 'active',
        file_name: 'doc.pdf',
        folder_id: FOLDER_ID,
      },
    ],
    documents: [
      {
        id: DOC_ID,
        title: 'Doc In Folder',
        name: 'Doc In Folder',
        barcode: 'E2E-DOC',
        department_id: 1,
        document_type_id: 1,
        upload_date: '2025-01-01',
        status: 'active',
        file_name: 'doc.pdf',
        folder_id: FOLDER_ID,
      },
    ],
  },
};

describe('Folder detail attachment edit', () => {
  beforeEach(() => {
    cy.intercept('POST', `**/api/folders/${FOLDER_ID}`, (req) => {
      if (req.url.includes('/documents')) {
        req.reply({ statusCode: 200, body: folderDetailResponse });
        return;
      }
      req.reply({
        statusCode: 200,
        body: { result: folderDetailResponse.result.folder },
      });
    });
    cy.intercept('POST', `**/api/folders/${FOLDER_ID}/documents`, {
      statusCode: 200,
      body: {
        result: {
          folder: folderDetailResponse.result.folder,
          data: folderDetailResponse.result.data,
        },
      },
    }).as('folderDocuments');
    cy.intercept('POST', (req) => {
      if (!req.url.includes(`/api/documents/${DOC_ID}/attachments`)) return;
      if (req.url.includes(`/attachments/${ATTACHMENT_ID}/update`)) return;
      req.reply({
        statusCode: 200,
        body: {
          result: {
            success: true,
            data: [
              { id: ATTACHMENT_ID, name: 'Folder Att Name', file_name: 'f.pdf', description: 'Desc' },
            ],
          },
        },
      });
    });
  });

  it('opens folder detail, selects document in attachments, clicks Edit, updates and saves', () => {
    let updatePayload: Record<string, unknown> = {};
    cy.intercept('POST', `**/api/documents/${DOC_ID}/attachments/${ATTACHMENT_ID}/update`, (req) => {
      const body = req.body;
      if (body?.params) updatePayload = body.params as Record<string, unknown>;
      req.reply({ statusCode: 200, body: { result: { success: true } } });
    }).as('updateAttachment');

    cy.loginByToken(`/folders/${FOLDER_ID}`);
    cy.url().should('include', `/folders/${FOLDER_ID}`);

    cy.get('[data-testid="folder-detail-attachments-section"]').should('be.visible');
    cy.get('[data-testid="folder-detail-attachments-doc-select"]').select('888');
    cy.get('[data-testid="folder-detail-attachment-edit-btn"]').first().click();

    cy.get('[data-testid="attachment-side-panel"]').should('be.visible');
    const suffix = (Cypress as unknown as { uniqueE2ESuffix: () => string }).uniqueE2ESuffix();
    const attachmentName = `Folder Attachment Updated ${suffix}`;
    cy.get('[data-testid="attachment-edit-name"]').clear().type(attachmentName);
    cy.get('[data-testid="attachment-edit-save"]').click();

    cy.wait('@updateAttachment').then(() => {
      expect(updatePayload).to.have.property('name', attachmentName);
    });
  });
});
