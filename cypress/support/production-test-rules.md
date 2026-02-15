# Production test rules (E2E and unit tests)

**Strict rule:** Test flows must **only** delete or modify folders/files that the test itself created in that same run. Tests must **not** delete or permanently remove any existing data.

- **Do not** add test scenarios that:
  - Delete folders (no "delete folder" in tests).
  - Permanently delete files/documents (no permanent-delete tests).
  - Delete or trash existing attachments or documents that the test did not create.
  - **Batch delete from the /documents page** (no batch delete/trash from the main documents list).

- **Allowed deletion:** The **only** deletion a test may perform is deleting (or trashing) **the file(s) that the same test created**. No other deletion flows.

- **Order:** When a test includes a deletion step, the **deletion flow must come last**—after every other operation in that test (e.g. create → edit → then delete the created file).

- **Allowed (no deletion):** Read-only flows (e.g. list, view, restore from trash with stubbed data) are fine.

- **Unique names:** When creating or updating documents, folders, or attachment names in E2E, use a unique suffix (e.g. `Cypress.uniqueE2ESuffix()`) so "name already exists" never fails the run. Add a 1–2 suffix or timestamp if needed.

- **Real-API specs:** When running against the real API (e.g. `slow-smoke-real-api.cy.ts`), CRUD must be **only on test-created data**. Create with unique names, capture created ids from responses, then only Read/Update the documents/folders/attachments created in that test. Exclude delete folder, permanent delete, and batch delete; block those endpoints (403) in the spec so no delete can succeed.

- **Excluded routes (do not visit in E2E):** Do **not** add test steps that visit or assert on:
  - `/edit-requests` (edit requests)
  - `/signatures` (signatures)
  - `/notifications` (notifications)
  - `/admin/permissions` (permissions)
  These areas will be covered by E2E tests later; current specs must not navigate to or depend on them.

See also: `.cursor/rules` for AI/test authoring guidance.
