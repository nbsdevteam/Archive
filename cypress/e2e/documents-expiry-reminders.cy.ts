/**
 * Document expiry reminders: bulk set API, persistent grouped toast.
 * PRODUCTION RULE: read-only / stubbed flows only; no destructive actions on existing data.
 */

const DOC_ID = 1001;

function formatDdMmYyyy(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

const expiryInTwoDays = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 2);
  return formatDdMmYyyy(d);
})();

const adminDepartments = { result: { success: true, data: [{ id: 1, name: 'Finance', code: 'FIN' }] } };
const adminDocumentTypes = { result: { success: true, data: [{ id: 1, name: 'Invoice', code: 'INV' }] } };
const adminCompanies = { jsonrpc: '2.0', result: { success: true, data: [{ id: 1, name: 'E2E Company' }] }, id: 1 };
const adminTags = { result: { success: true, data: [] } };

const dueDocumentList = {
  result: {
    success: true,
    data: [
      {
        id: DOC_ID,
        title: 'E2E Expiring Doc',
        department_id: 1,
        department_name: 'Finance',
        document_type_id: 1,
        document_type_name: 'Invoice',
        uploader_id: 1,
        uploader_name: 'Test User',
        upload_date: '2025-01-01T00:00:00',
        status: 'active',
        confidentiality_level: 'internal',
        barcode: 'E2E-EXP',
        file_name: 'test.pdf',
        file_size: 1024,
        expiry_date: expiryInTwoDays,
        reminder_days: 7,
      },
    ],
    pagination: { total: 1, page: 1, per_page: 200, total_pages: 1 },
  },
};

describe('Document expiry reminders', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.on('uncaught:exception', (err) => {
      if (err.name === 'ZodError' || (err.message && err.message.includes('ZodError'))) return false;
      return true;
    });
    cy.intercept('POST', '**/api/departments', adminDepartments);
    cy.intercept('POST', '**/api/document-types', adminDocumentTypes);
    cy.intercept('POST', '**/api/companies', adminCompanies);
    cy.intercept('POST', '**/api/tags', adminTags);
    cy.intercept('POST', (req) => {
      const u = req.url;
      if (!u.includes('/api/documents')) return false;
      if (u.includes('/set-reminders') || u.includes('/upload') || /\/api\/documents\/\d+/.test(u)) return false;
      req.reply(dueDocumentList);
    }).as('listDocuments');
  });

  it('opens set reminders modal for all active documents and submits API payload', () => {
    let payload: Record<string, unknown> = {};
    cy.intercept('POST', '**/api/documents/set-reminders', (req) => {
      payload = req.body as Record<string, unknown>;
      req.reply({ statusCode: 200, body: { success: true, updated: 823, reminder_days: 14, expiry_date: null } });
    }).as('setReminders');

    cy.loginByToken('/documents');
    cy.get('[data-testid="set-reminders-all-btn"]').click();
    cy.get('[data-testid="set-document-reminders-modal"]').should('be.visible');
    cy.get('[data-testid="set-reminders-days-input"]').clear().type('14');
    cy.get('[data-testid="set-reminders-submit"]').click();

    cy.wait('@setReminders').then(() => {
      expect(payload).to.deep.equal({ reminder_days: 14 });
    });
  });

  it('shows grouped persistent expiry reminder toast until closed', () => {
    cy.loginByToken('/documents');
    cy.wait('@listDocuments');
    cy.get('.Toastify__toast', { timeout: 10000 }).should('be.visible');
    cy.contains('Document expiry reminders').should('be.visible');
    cy.reload();
    cy.get('.Toastify__toast', { timeout: 10000 }).should('be.visible');
    cy.get('.Toastify__close-button').first().click();
    cy.get('.Toastify__toast').should('not.exist');
    cy.reload();
    cy.get('.Toastify__toast').should('not.exist');
  });
});
