# Fix TypeScript JSX Runtime Errors (TS2875)

The `react/jsx-runtime` errors are **IDE cache issues only** - the build passes successfully.

## Quick Fix

**In Cursor/VS Code:**

1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type: `TypeScript: Restart TS Server`
3. Press Enter

The errors should disappear immediately.

## Alternative: Reload Window

If restarting TS Server doesn't work:

1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: `Developer: Reload Window`
3. Press Enter

## Verification

- ✅ Build passes: `npm run build` succeeds
- ✅ Type check passes: `npx tsc --noEmit` shows 0 errors
- ✅ Configuration is correct: `tsconfig.json` has `"types": ["node", "react", "react-dom"]`
- ✅ Caches cleared: `node_modules/.cache` and `.tsbuildinfo` files removed

## Why This Happens

The TypeScript language server caches type information. When types or configuration change, the cache can become stale, causing phantom errors in the IDE even though the actual build works fine.
