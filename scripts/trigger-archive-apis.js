/**
 * Trigger NBS Archive APIs: login (admin/admin), upload document, create folder.
 * Run from project root: node scripts/trigger-archive-apis.js
 * Optional: API_BASE_URL or VITE_API_BASE_URL (default: http://localhost:8070)
 *
 * Reports success or error for each step per NBS_ARCHIVE_API_REFERENCE_FRONTEND.md.
 */

import axios from 'axios';

const BASE_URL = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8070';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
});

function log(name, res, body) {
  const status = res.status;
  const ok = status >= 200 && status < 300;
  console.log(`[${name}] HTTP ${status} ${ok ? 'OK' : 'ERROR'}`);
  if (body && (body.error || body.success === false)) {
    console.log(`  → success: ${body.success}, error: ${body.error || '(none)'}`);
  }
  if (body && body.data && body.data.id) {
    console.log(`  → data.id: ${body.data.id}`);
  }
  return { ok, status, body };
}

async function main() {
  console.log('Base URL:', BASE_URL);
  console.log('');

  let accessToken = null;

  // --- 1. Login ---
  console.log('1. Login (admin / admin)');
  const loginRes = await api.post('/api/auth/login', { username: 'admin', password: 'admin' });
  const loginBody = loginRes.data;
  const loginResult = log('Login', loginRes, loginBody);

  if (!loginResult.ok || !loginBody.access_token) {
    console.log('  FAILED: No access_token. Check credentials and backend.');
    if (loginBody.error) console.log('  Error:', loginBody.error);
    process.exit(1);
  }
  accessToken = loginBody.access_token;
  console.log('  access_token: present');
  if (loginBody.expires_in != null) console.log('  expires_in:', loginBody.expires_in);
  console.log('');

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // --- 2. Get first department and document type (for upload) ---
  let departmentId = 1;
  let documentTypeId = 1;

  const departmentsRes = await api.post(
    '/api/departments',
    { jsonrpc: '2.0', method: 'call', params: {}, id: 1 },
    { headers: authHeader }
  );
  const depResult = departmentsRes.data?.result || departmentsRes.data;
  const depList = depResult?.data ?? (Array.isArray(depResult) ? depResult : []);
  if (depList.length > 0 && depList[0].id != null) {
    departmentId = depList[0].id;
    console.log('2. Departments: using first department_id =', departmentId);
  } else {
    console.log('2. Departments: no list returned, using department_id = 1');
  }

  const docTypesRes = await api.post(
    '/api/document-types',
    { jsonrpc: '2.0', method: 'call', params: {}, id: 2 },
    { headers: authHeader }
  );
  const dtResult = docTypesRes.data?.result || docTypesRes.data;
  const dtList = dtResult?.data ?? (Array.isArray(dtResult) ? dtResult : []);
  if (dtList.length > 0 && dtList[0].id != null) {
    documentTypeId = dtList[0].id;
    console.log('   Document types: using first document_type_id =', documentTypeId);
  } else {
    console.log('   Document types: using document_type_id = 1');
  }
  console.log('');

  // --- 3. Upload document ---
  console.log('3. Upload document');
  const fileContent = 'Test content for NBS Archive API trigger script.';
  const fileData = Buffer.from(fileContent, 'utf8').toString('base64');
  const uploadPayload = {
    department_id: departmentId,
    document_type_id: documentTypeId,
    title: 'API Trigger Test Document',
    file_name: 'api-trigger-test.txt',
    file_data: fileData,
  };
  const uploadRes = await api.post('/api/documents/upload', uploadPayload, {
    headers: authHeader,
  });
  const uploadBody = uploadRes.data;
  const uploadResult = log('Upload document', uploadRes, uploadBody);

  if (!uploadResult.ok || !uploadBody.success) {
    console.log('  FAILED:', uploadBody?.error || uploadRes.statusText);
  } else if (uploadBody.data?.id) {
    console.log('  SUCCESS: document id =', uploadBody.data.id);
  }
  console.log('');

  // --- 4. Create folder ---
  console.log('4. Create folder (JSON-RPC)');
  const folderPayload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      name: 'API Trigger Test Folder',
      code: 'TF-API-1',
      department_id: departmentId,
    },
    id: 3,
  };
  const folderRes = await api.post('/api/folders/create', folderPayload, {
    headers: authHeader,
  });
  const folderRaw = folderRes.data;
  const folderBody = folderRaw?.result ?? folderRaw;
  const folderResult = log('Create folder', folderRes, folderBody);

  if (!folderResult.ok || !folderBody?.success) {
    console.log('  FAILED:', folderBody?.error || folderRaw?.error || folderRes.statusText);
  } else if (folderBody?.data?.id) {
    console.log('  SUCCESS: folder id =', folderBody.data.id);
  }
  console.log('');

  console.log('Done. Login: token obtained. Upload and Create folder: see above for success/errors.');
}

main().catch((err) => {
  const code = err.code || err.cause?.code;
  const msg = err.response?.data?.error || err.message || err.cause?.message || String(err);
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
    console.error(`Script error: Cannot reach backend at ${BASE_URL}. Start the backend or set API_BASE_URL.`);
  } else {
    console.error('Script error:', code ? `${code}: ${msg}` : msg);
  }
  if (err.response?.data && !err.response.data.error) {
    console.error('Response:', JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
