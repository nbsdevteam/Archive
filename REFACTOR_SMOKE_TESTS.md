# Refactor Smoke Test Checklist

## Document Detail Page Tests

### Critical Paths
- [ ] Navigate to document detail page from documents list
- [ ] Page loads without errors, shows document title and metadata
- [ ] All 9 tabs are visible and clickable

### Tab Functionality
- [ ] **Preview Tab**: Document preview renders correctly (PDF/image)
- [ ] **Download Tab**: Current version download button works
- [ ] **Download Tab**: Version-specific download buttons work
- [ ] **Versions Tab**: Version history displays correctly
- [ ] **Versions Tab**: Upload new version button opens modal
- [ ] **Attachments Tab**: Attachments list displays
- [ ] **Attachments Tab**: Add attachment button opens panel
- [ ] **Attachments Tab**: Edit attachment works (name/description)
- [ ] **Attachments Tab**: Delete attachment works with confirmation
- [ ] **Attachments Tab**: Selection + batch delete works
- [ ] **Notes Tab**: Notes list displays
- [ ] **Notes Tab**: Create note button opens editor
- [ ] **Notes Tab**: Edit note opens editor with pre-filled data
- [ ] **Notes Tab**: Delete note works with confirmation
- [ ] **OCR Tab**: OCR status displays correctly
- [ ] **OCR Tab**: Run OCR button works
- [ ] **Signatures Tab**: Signature requests list displays
- [ ] **Signatures Tab**: Request signature modal works
- [ ] **Relations Tab**: Parent/related documents display
- [ ] **Relations Tab**: Add relation modal works
- [ ] **Audit Tab**: Activity timeline/table displays

### Modal Interactions
- [ ] Upload version modal: opens, accepts file, submits successfully
- [ ] Upload version modal: clears on submit/cancel
- [ ] Request signature modal: opens, selects signer, submits
- [ ] Upload signed document modal: opens, accepts file, submits
- [ ] Add relation modal: opens, selects document, submits
- [ ] Edit attachment panel: opens, pre-fills data, saves changes
- [ ] Edit attachment panel: replace file option works
- [ ] Note editor modal: opens, saves new note
- [ ] Note editor modal: opens with existing note data, saves changes

### Actions & State Management
- [ ] Edit document button opens edit panel
- [ ] Edit document panel saves changes and refreshes data
- [ ] Archive button works, updates document status
- [ ] Unarchive button works (if archived)
- [ ] Restore button works (if trashed)
- [ ] Tab selection persists when switching between tabs
- [ ] Attachment selection persists when switching tabs
- [ ] Document refreshes after version upload (latestVersionId updates)
- [ ] Preview shows latest version after upload

### Error States
- [ ] Invalid document ID shows "Not found" message
- [ ] Network errors show appropriate toasts
- [ ] Loading states display correctly during async operations

## Folder Detail Page Tests

### Critical Paths
- [ ] Navigate to folder detail page from folders list
- [ ] Page loads without errors, shows folder name and metadata
- [ ] All sections are visible (info, preview, main doc, sub-docs, attachments, notes, activity)

### Section Functionality
- [ ] **Info Section**: Folder metadata displays correctly
- [ ] **Info Section**: Edit folder button works
- [ ] **Info Section**: Delete folder button works with confirmation
- [ ] **Preview Section**: Preview switches between main/sub documents
- [ ] **Preview Section**: Document preview renders correctly
- [ ] **Main Doc Section**: Main document displays with metadata
- [ ] **Main Doc Section**: Download button works
- [ ] **Main Doc Section**: View button navigates to document detail
- [ ] **Sub-Docs Section**: Sub-documents list displays
- [ ] **Sub-Docs Section**: Upload button opens upload panel for sub-doc
- [ ] **Sub-Docs Section**: Selection + batch operations work
- [ ] **Sub-Docs Section**: Transfer documents modal works
- [ ] **Sub-Docs Section**: Archive/unarchive buttons work
- [ ] **Sub-Docs Section**: Trash button works with confirmation
- [ ] **Attachments Section**: Dropdown selects document
- [ ] **Attachments Section**: Attachments list displays for selected doc
- [ ] **Attachments Section**: Add attachment button works
- [ ] **Attachments Section**: Edit attachment panel works
- [ ] **Attachments Section**: Delete attachment works
- [ ] **Attachments Section**: Transfer attachments modal works
- [ ] **Notes Section**: Notes list displays
- [ ] **Notes Section**: Create/edit/delete note works
- [ ] **Activity Section**: Activity timeline/table displays
- [ ] **Activity Section**: View mode toggle (timeline/table) works

### Modal Interactions
- [ ] Upload panel: opens for sub-doc with folder context locked
- [ ] Upload panel: opens for attachment with target doc set
- [ ] Transfer modal: opens for sub-docs, submits successfully
- [ ] Transfer modal: opens for attachments, submits successfully
- [ ] Transfer modal: prevents transferring main document (shows error)
- [ ] Edit folder panel: opens, saves changes
- [ ] Note editor: opens, saves new/existing note

### Actions & State Management
- [ ] Attachments dropdown changes update attachments list
- [ ] Selection persists when navigating sections
- [ ] Folder refreshes after sub-doc operations
- [ ] Preview updates when selecting different document

### Error States
- [ ] Invalid folder ID shows "Not found" message
- [ ] Network errors show appropriate toasts
- [ ] Loading states display correctly

## Preview & Cache Behavior
- [ ] Document preview loads on first visit
- [ ] Preview persists on page reload (Cache API)
- [ ] Preview updates after version upload (cache invalidation)
- [ ] Attachment preview works correctly
- [ ] Tab switches don't reload preview unnecessarily
- [ ] No console errors related to cache/preview

## Performance Checks
- [ ] No lag when switching tabs
- [ ] No excessive re-renders (React DevTools)
- [ ] Network requests are not duplicated
- [ ] Memory usage stays reasonable (no leaks)

## Regression Points (Pay Special Attention)
- [ ] Tab state synchronization (activeTab persists)
- [ ] Attachment selection state across tab switches
- [ ] Modal state resets after close/submit
- [ ] Attachment edit panel state management
- [ ] Notes auto-load on tab switch (document detail)
- [ ] Relations/audit lazy loading on tab switch
- [ ] Document refresh after mutations (versions, attachments, etc.)

## Test After Each Phase
Mark completed items after each major refactor phase. Re-run failed tests before proceeding to next phase.

**Phase 1 Complete**: ___________
**Phase 2 Complete**: ___________
**Phase 3 Complete**: ___________
**Phase 4 Complete**: ___________
**Phase 5 Complete**: ___________
**Phase 6 Complete**: ___________
**Phase 7 Complete**: ___________
