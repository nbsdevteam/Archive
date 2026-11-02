# Theme tokens

All light/dark colors come from CSS custom properties defined in one place:
`src/assets/scss/utils/_tokens.scss` (`:root` = light, `html[data-theme="dark"]` = dark).
The active theme is `html[data-theme]`, set by `ThemeProvider` from `themeModeStore`
(user toggle, falling back to the OS setting on first visit).

## Roles

| Token | Use for |
| --- | --- |
| `--app-body-bg` | Page canvas behind everything |
| `--app-surface-bg` | Header, sidebar, cards, modals, dropdowns |
| `--app-surface-muted-bg` | Subtle blocks on a surface (profile card, segmented control, table header) |
| `--app-content-bg` | Tint of the `.content` area |
| `--app-hover-bg` | Hover background for rows / menu items |
| `--app-border-color`, `--app-border-subtle-color` | Borders and dividers |
| `--app-title-color`, `--app-text-color`, `--app-muted-color` | Headings, body text, secondary text |
| `--app-text-on-primary` | Text on primary-colored backgrounds |
| `--app-link-color`, `--app-link-muted-color` | Links |
| `--app-input-*` | `bg`, `color`, `border`, `border-hover`, `placeholder`, `icon`, `disabled-bg`, `focus-ring` for every form control |
| `--app-shadow-sm`, `--app-shadow-md`, `--app-overlay-bg` | Elevation and modal backdrops |
| `--app-menu-bg`, `--app-menu-border`, `--app-menu-shadow` | Floating header menus (e.g. language menu): lifted above the surface so they stay visible in dark mode |
| `--primary-rgb` | Brand color (set by `themeColorStore`); use `rgb(var(--primary-rgb))` / `rgba(var(--primary-rgb), .12)` |

## Rules

1. Style surfaces, text, borders and inputs with these tokens, not `$white`, `#fff`, `$gray-*` or `$darkmode-*`.
2. Do not add `[data-theme="dark"] .foo { ... }` overrides for something a token already covers; change the token value instead.
3. A new color role gets added to **both** `:root` and `html[data-theme="dark"]`, and to the table above.
4. Third-party UI is bridged in `src/shared/styles/nbs-theme-bridge.css`: every `--nbs-*` token is derived from the `--app-*` tokens. The NBS component library follows the OS `prefers-color-scheme` by itself, so never rely on its defaults for theming.
