/**
 * ESLint rule: enforce hook ordering in React components and custom hooks.
 * Order: useState/useReducer → router/translation/other hooks → useRef → useMemo → useCallback → useEffect/useLayoutEffect.
 */

const BUCKET_STATE = 1;
const BUCKET_ROUTER_OTHER = 2;
const BUCKET_REF = 3;
const BUCKET_MEMO = 4;
const BUCKET_CALLBACK = 5;
const BUCKET_EFFECT = 6;

const ROUTER_HOOKS = new Set([
  'useNavigate', 'useLocation', 'useParams', 'useSearchParams', 'useOutlet', 'useMatch', 'useBlocker',
]);
const STATE_HOOKS = new Set(['useState', 'useReducer']);
const REF_HOOKS = new Set(['useRef']);
const MEMO_HOOKS = new Set(['useMemo']);
const CALLBACK_HOOKS = new Set(['useCallback']);
const EFFECT_HOOKS = new Set(['useEffect', 'useLayoutEffect']);

function getHookBucket(name) {
  if (STATE_HOOKS.has(name)) return BUCKET_STATE;
  if (ROUTER_HOOKS.has(name) || name === 'useTranslation') return BUCKET_ROUTER_OTHER;
  if (REF_HOOKS.has(name)) return BUCKET_REF;
  if (MEMO_HOOKS.has(name)) return BUCKET_MEMO;
  if (CALLBACK_HOOKS.has(name)) return BUCKET_CALLBACK;
  if (EFFECT_HOOKS.has(name)) return BUCKET_EFFECT;
  if (typeof name === 'string' && name.length >= 4 && name.startsWith('use') && name[3] === name[3].toUpperCase()) {
    return BUCKET_ROUTER_OTHER;
  }
  return null;
}

function getHookNameFromCallee(callee) {
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    return callee.property.name;
  }
  return null;
}

function collectHookCallsInNode(node, sourceCode, hooks) {
  if (!node) return;
  if (node.type === 'CallExpression') {
    const name = getHookNameFromCallee(node.callee);
    const bucket = name ? getHookBucket(name) : null;
    if (bucket != null) {
      hooks.push({ node, bucket, name });
    }
  }
  const keys = ['argument', 'arguments', 'block', 'body', 'callee', 'consequent', 'declarations', 'expression', 'init', 'left', 'right', 'test', 'alternate'];
  for (const key of keys) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) collectHookCallsInNode(c, sourceCode, hooks);
    } else if (child && typeof child === 'object') {
      collectHookCallsInNode(child, sourceCode, hooks);
    }
  }
}

function getStatementBucket(statement, sourceCode) {
  const hooks = [];
  collectHookCallsInNode(statement, sourceCode, hooks);
  if (hooks.length === 0) return null;
  return Math.min(...hooks.map((h) => h.bucket));
}

export default {
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce ordering of React hooks: useState → router/other → useRef → useMemo → useCallback → useEffect',
    },
    schema: [],
    messages: {
      order: 'Hooks must be ordered: useState/useReducer → router/translation/other → useRef → useMemo → useCallback → useEffect. "{{name}}" (bucket {{bucket}}) appears after a later hook (bucket {{prevBucket}}).',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode?.();

    return {
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
        const parent = node.parent;
        const name = (parent.type === 'VariableDeclarator' && parent.id && parent.id.name) || node.id?.name;
        const isComponent = name && name[0] === name[0].toUpperCase();
        const isHook = name && name.startsWith('use') && name.length > 3;
        if (!isComponent && !isHook) return;

        const body = node.body;
        const statements = body.type === 'BlockStatement' ? body.body : [body];
        let prevBucket = 0;
        for (const stmt of statements) {
          if (stmt.type === 'ReturnStatement') break;
          const bucket = getStatementBucket(stmt, sourceCode);
          if (bucket != null) {
            if (bucket < prevBucket) {
              context.report({
                node: stmt,
                messageId: 'order',
                data: { name: 'hook', bucket, prevBucket },
              });
            }
            prevBucket = Math.max(prevBucket, bucket);
          }
        }
      },
    };
  },
};
