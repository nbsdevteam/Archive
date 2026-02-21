# NBS Component Library: Remove antd Dependency

This app no longer imports `antd` directly. The only remaining source of `antd` in the install is **`@nbs/component-library`** (source: `github:syednaqvi98nibras/StoryBook`). To eliminate `antd` entirely, the following work must be done **in the StoryBook repo**.

## 1. Clone / open the NBS repo

```bash
git clone git@github.com:syednaqvi98nibras/StoryBook.git
cd StoryBook
```

## 2. Inventory antd usage

In the StoryBook repo, run:

```bash
grep -r "from ['\"]antd" --include="*.ts" --include="*.tsx" .
grep -r "antd/es/" --include="*.ts" --include="*.tsx" .
```

Note every component and type imported from `antd` (e.g. `ConfigProvider`, `Tabs`, `Checkbox`, `Input`, `DatePicker`, etc.).

## 3. Add an internal compat layer

- Create a folder, e.g. `src/shared/compat/antd/` (or next to the components that use antd).
- For each antd component in use, add a small replacement that matches the **API** NBS currently uses (same props, same behavior where possible):
  - Use native HTML + React for simple controls (e.g. `<input type="checkbox">` for Checkbox).
  - Use existing NBS primitives or MUI/Bootstrap only if the library already depends on them.
- Export from a single entry, e.g. `src/shared/compat/antd/index.ts`, so NBS code can do:
  - `import { X } from "../shared/compat/antd"` instead of `import { X } from "antd"`.

## 4. Replace imports in NBS

- Replace every `import { X } from "antd"` (and deep `antd/es/...` imports) with imports from the new compat layer.
- Adjust relative paths per file.

## 5. Remove antd from NBS package.json

- Remove `"antd"` from `dependencies` (or `devDependencies`).
- If `@ant-design/icons` is only used for antd components, remove it too; otherwise keep it.

## 6. Build and test the NBS library

- Run the library’s build and tests.
- Publish or push to a branch and note the **commit SHA**.

## 7. Point this app to the new NBS commit

In **this** repo (`direct-apply-archiving-system`), update `package.json`:

```json
"@nbs/component-library": "github:syednaqvi98nibras/StoryBook#<COMMIT_SHA>"
```

Replace `<COMMIT_SHA>` with the full SHA of the commit that removes antd. Then run `npm install` and verify `npm ls antd` shows no antd in the tree.
