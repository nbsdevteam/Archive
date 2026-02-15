# Cypress E2E Testing Improvements

## Summary
Comprehensive improvements to Cypress E2E testing stability by replacing fragile selectors with robust data-testid attributes.

## Changes Made

### 1. SelectField Component Enhancement
**File:** `src/shared/components/ui/Select/SelectField.tsx`

- Added `data-testid` prop support to SelectField component
- Prop is passed through to the underlying react-select component
- Enables direct targeting of specific dropdowns instead of relying on position-based selectors

**Before:**
```typescript
cy.get('.react-select__control').eq(1).click(); // Fragile - depends on order
```

**After:**
```typescript
cy.get('[data-testid="department-select"]').click(); // Robust - targets specific field
```

### 2. Upload Form Data-TestIDs Added
**File:** `src/features/documents/components/UploadDocument/UploadDocumentTargetSection.tsx`

Added data-testids to all SelectField components:
- `upload-kind-select` - Main/Sub/Attachment selector
- `department-select` - Department dropdown
- `document-type-select` - Document type dropdown
- `folder-select` - Folder selection (for sub documents)
- `folder-type-select` - Folder type (for main documents)
- `confidentiality-select` - Confidentiality level

**File:** `src/features/documents/components/UploadDocument/UploadDocumentFileSection.tsx`

- `upload-file-input` - File input field

### 3. Edit Document Form Data-TestIDs Added
**File:** `src/features/documents/components/EditDocument/EditDocumentFormContent.tsx`

Added data-testids to all SelectField components:
- `edit-department-select` - Department dropdown
- `edit-document-type-select` - Document type dropdown
- `edit-folder-select` - Folder selection
- `edit-confidentiality-select` - Confidentiality level

### 4. Cypress Specs Updated
Updated all E2E specs to use new data-testid selectors:

**Files Updated:**
- `cypress/e2e/walkthrough-slow.cy.ts`
- `cypress/e2e/slow-smoke-real-api.cy.ts`
- `cypress/e2e/slow-smoke-production-safe.cy.ts`
- `cypress/e2e/documents-create.cy.ts`
- `cypress/e2e/documents-bulk-upload.cy.ts`

**Migration Pattern:**
```typescript
// OLD: Position-dependent (fragile)
cy.get('.react-select__control').eq(1).click();
cy.get('.react-select__option').contains('Finance (FIN)').click();
cy.get('.react-select__control').eq(2).click();
cy.get('.react-select__option').contains('Invoice (INV)').click();

// NEW: Direct targeting (robust)
cy.get('[data-testid="department-select"]').click();
cy.get('.react-select__option').contains('Finance (FIN)').click();
cy.get('[data-testid="document-type-select"]').click();
cy.get('.react-select__option').contains('Invoice (INV)').click();
```

## Existing Data-TestIDs Verified
The following data-testids were already present and verified:

### Authentication
- `login-submit-btn` - Login form submit button

### Document Upload/Management
- `upload-document-btn` - Dashboard upload button
- `upload-documents-btn` - Documents page upload button
- `upload-document-open-btn` - Upload page open button
- `upload-document-submit` - Upload form submit button

### Document Detail
- `document-detail-edit-document-btn` - Edit document button
- `edit-document-side-panel` - Edit side panel container
- `edit-document-save` - Edit form save button
- `document-detail-attachments-tab` - Attachments tab
- `document-detail-add-attachment-btn` - Add attachment button

### Attachments
- `attachment-side-panel` - Attachment edit panel
- `attachment-edit-name` - Name input field
- `attachment-edit-description` - Description textarea
- `attachment-edit-save` - Save button
- `attachment-replace-file` - Replace file input

### Folders
- `folder-detail-attachments-section` - Attachments card
- `folder-detail-attachments-doc-select` - Document selector
- `folder-detail-attachment-edit-btn` - Edit attachment button
- `folder-detail-add-attachment-btn` - Add attachment button

### Transfer & Trash
- `transfer-folder-select` - Transfer destination selector
- `transfer-confirm-btn` - Transfer confirm button
- `documents-trash-page` - Trash page container
- `trash-restore-selected` - Batch restore button

## Benefits

### 1. **Reliability**
- Tests no longer break when form field order changes
- No dependency on CSS class structure
- Explicit targeting of specific UI elements

### 2. **Maintainability**
- Clear intent in test code (field name vs position)
- Easier to debug failed tests
- Self-documenting test selectors

### 3. **Stability**
- Resilient to UI refactoring
- Works across different viewport sizes
- Not affected by CSS framework changes

### 4. **Developer Experience**
- Easier to write new tests
- Clear mapping between component and test selector
- Better error messages when elements not found

## Testing Recommendations

### Run E2E Tests
```bash
# Run all slow specs interactively
npm run e2e:slow:open

# Run production-safe smoke test
npm run dev  # Terminal 1
npx cypress run --spec "cypress/e2e/slow-smoke-production-safe.cy.ts"  # Terminal 2

# Run real-API smoke test (CRUD only on test-created data)
npm run dev  # Terminal 1
npx cypress run --spec "cypress/e2e/slow-smoke-real-api.cy.ts"  # Terminal 2
```

### Key Testing Principles
1. **Data Isolation:** Tests only modify data they create
2. **No Destructive Operations:** No permanent delete, no folder delete, no batch delete from /documents
3. **Unique Names:** All test data uses `Cypress.uniqueE2ESuffix()` to avoid conflicts
4. **Visible Actions:** Slow specs include `waitStep()` for visual verification

## Future Improvements

### Potential Enhancements
1. Add data-testids to DataTable row checkboxes for more robust selection testing
2. Add data-testids to modal dialogs for better modal interaction testing
3. Consider adding data-testids to all Button components with role indicators
4. Add data-testids to navigation menu items for easier navigation testing

### Pattern to Follow
When adding new UI components that will be tested in E2E:
1. Add a descriptive `data-testid` prop to the component
2. Use kebab-case naming (e.g., `upload-document-btn`)
3. Make it specific enough to identify the exact element
4. Update Cypress specs to use the new data-testid immediately

## Migration Guide

### For New Components
```tsx
// ✅ Good: Add data-testid from the start
<Button 
  onClick={handleSubmit} 
  data-testid="form-submit-btn"
>
  Submit
</Button>

// ❌ Bad: Relying on position or classes
<Button onClick={handleSubmit} className="btn-primary">
  Submit
</Button>
```

### For Cypress Tests
```typescript
// ✅ Good: Use data-testid
cy.get('[data-testid="submit-btn"]').click();

// ⚠️ Acceptable: Semantic selectors for standard HTML
cy.get('input[name="email"]').type('test@example.com');

// ❌ Bad: Position-dependent
cy.get('.btn').eq(2).click();

// ❌ Bad: CSS class-dependent
cy.get('.btn-primary.submit-button').click();
```

## Documentation

- All changes maintain backward compatibility
- No breaking changes to existing component APIs
- Optional `data-testid` props don't affect production runtime
- Follows accessibility best practices (doesn't replace aria-labels)

---

**Last Updated:** 2026-02-14
**Created By:** AI Assistant (Cursor)
**Related PRs:** TBD
