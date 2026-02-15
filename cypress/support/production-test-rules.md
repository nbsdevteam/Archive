# Production test rules (E2E and unit tests)

**Strict rule:** Test flows must **only** delete or modify folders/files that the test itself created in that same run. Tests must **not** delete or permanently remove any existing data.

- **Do not** add test scenarios that:
  - Delete folders (no "delete folder" in tests).
  - Permanently delete files/documents (no permanent-delete tests).
  - Delete or trash existing attachments or documents that the test did not create.

- **Allowed:** Create temporary data in the test, then delete/trash only that data. Read-only flows (e.g. list, view, restore from trash with stubbed data) are fine.

See also: `.cursor/rules` for AI/test authoring guidance.
