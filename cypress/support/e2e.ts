// Cypress E2E support: custom commands and global config
// Production rules: only delete what the test created; no batch delete from /documents; deletion step must be last. See support/production-test-rules.md
// Fail-fast: stop entire run on first failure so you can debug (disable with env FAIL_FAST_PLUGIN=false).
import 'cypress-fail-fast';
import './commands';
