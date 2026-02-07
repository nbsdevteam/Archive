# App styling

## Theme color

- **Source:** CSS custom properties `--primary-rgb` and `--primary-rgb-picr` on `<html>`, set at app bootstrap by `themeColorStore` (`src/shared/stores/themeColorStore.ts`).
- **Design tokens:** `src/shared/design-tokens/theme.ts` defines primary RGB values and opacity tokens. The store reads from there; do not hardcode primary colors in the store or in new styles.
- Use theme in CSS/SCSS as `rgb(var(--primary-rgb))` or `rgba(var(--primary-rgb), <opacity>)`. Use `--app-placeholder-color` and other vars from `utils/_tokens.scss` where defined.

## Where to put styles

| Kind | Location |
|------|----------|
| **Global base / layout / components** | `main.scss` and its `@use` partials (utils, base, components, layout, vendors, pages). |
| **App-specific overrides** | `custom.scss` → split by domain into `overrides/`: `_overrides-tables.scss`, `_overrides-forms.scss`, `_overrides-sidebar.scss`, `_overrides-pagination.scss`, `_overrides-misc.scss`. Add new overrides to the appropriate file. |
| **Layout and theme-dependent globals** | `layout/theme/` (`_theme-vars.scss`, `_theme-layout.scss`, `_theme-rest.scss`). |
| **Feature-specific styles** | In the feature folder, e.g. `src/features/<name>/styles/`. Prefer **CSS modules** (`*.module.css` / `*.module.scss`) for new feature UI; use theme tokens (`var(--primary-rgb)`, `var(--app-*)`) and BEM-like prefixes (e.g. `folders__*`) to avoid clashes. |

## Adding a new theme-dependent style

1. Use `var(--primary-rgb)` or existing token vars; avoid hardcoded hex for primary/creamy.
2. Prefer CSS modules for new feature-level UI.
3. Avoid `!important` unless overriding a third-party library; if you keep it, add a short comment.

## SCSS variables vs CSS variables

- **Theme color** comes from CSS vars (`--primary-rgb`). See `utils/_tokens.scss` and `utils/_variables.scss` header comments.
- Use **SCSS variables** (`_variables.scss`) only for non-theme values (e.g. success, danger, spacing, typography).
