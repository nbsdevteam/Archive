# Accessibility: NBS Sidebar Touch Targets

**Status:** Flagged for fix in StoryBook (NBS component library) project.

Lighthouse reports that NBS sidebar section toggle buttons are too small for WCAG touch target guidelines.

- **Selector:** `nbs__sidebar-module__sectionToggle`
- **Requirement:** Minimum 44×44px touch targets (WCAG 2.5.5).
- **Suggested fix (in StoryBook repo):** Add `min-height: 44px` and `min-width: 44px` to the section toggle button in the NBS sidebar component.

This cannot be fixed from this app; the component lives in `@nbs/component-library` (StoryBook project).
