/**
 * Local ESLint plugin: hook-order rule for React hook ordering.
 */
import hookOrder from './hook-order.js';

export default {
  meta: {
    name: 'eslint-plugin-local',
    version: '1.0.0',
  },
  rules: {
    'hook-order': hookOrder,
  },
};
