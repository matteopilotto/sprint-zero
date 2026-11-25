// HTTP integration tests for the granola-clone API, checked against docs/api-contract.md.
// Run: node server/tests/integration.test.js   (backend must be running on :8000)
const BASE = process.env.API_URL || 'http://localhost:8000';
let passed = 0;
let failed = 0;

async function call(method, path, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined || raw !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data, text };
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name}\n      ${err.message}`);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function eq(actual, expected, label) {
  assert(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function errShape(r, status, code) {
  eq(r.status, status, 'status');
  assert(r.data && typeof r.data === 'object', `body not JSON: ${r.text}`);
  eq(r.data.error, code, 'error code');
  assert(typeof r.data.message === 'string' && r.data.message.length > 0, 'message missing');
  assert(!('detail' in r.data), 'raw FastAPI detail leaked');
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const NOTE_KEYS = ['id', 'title', 'rough_notes', 'transcript', 'template', 'enhanced_notes',
  'enhanced_mode', 'enhanced_at', 'created_at', 'updated_at'].sort();
const SUMMARY_KEYS = ['id', 'title', 'template', 'is_enhanced', 'created_at', 'updated_at'].sort();
function userShape(u) {
  eq(JSON.stringify(Object.keys(u).sort()), JSON.stringify(['created_at', 'email', 'id', 'name']), 'user keys');
  assert(UUID.test(u.id), 'user id not uuid v4');
  assert(ISO.test(u.created_at), 'user created_at not ISO');
}
function noteShape(n) {
  eq(JSON.stringify(Object.keys(n).sort()), JSON.stringify(NOTE_KEYS), 'note keys');
  assert(UUID.test(n.id), 'note id not uuid v4');
  assert(ISO.test(n.created_at) && ISO.test(n.updated_at), 'timestamps not ISO');
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stamp = Date.now();
const emailA = `qa-int-a-${stamp}@example.com`;
const emailB = `qa-int-b-${stamp}@example.com`;
let tokenA, tokenB, noteId, demoToken;

(async () => {
  await test('GET / health is public and returns {status:"ok"}', async () => {
    const r = await call('GET', '/');
    eq(r.status, 200, 'status');
    eq(r.data.status, 'ok', 'status field');
  });

  // ---- auth ----
  await test('POST /auth/signup 201 returns {access_token,user}, email lower-cased+trimmed', async () => {
    const r = await call('POST', '/auth/signup', { body: { name: 'Lena Fischer', email: `  ${emailA.toUpperCase()} `, password: 'correct-horse-1' } });
    eq(r.status, 201, 'status');
    assert(typeof r.data.access_token === 'string' && r.data.access_token.split('.').length === 3, 'no JWT');
    userShape(r.data.user);
    eq(r.data.user.email, emailA, 'email normalised');
    eq(r.data.user.name, 'Lena Fischer', 'name');
    assert(!('password_hash' in r.data.user), 'password_hash leaked');
    tokenA = r.data.access_token;
  });
  await test('POST /auth/signup without name defaults name to email local part', async () => {
    const r = await call('POST', '/auth/signup', { body: { email: emailB, password: 'another-pass-2' } });
    eq(r.status, 201, 'status');
    eq(r.data.user.name, `qa-int-b-${stamp}`, 'default name');
    tokenB = r.data.access_token;
  });
  await test('POST /auth/signup short password -> 400 invalid_input', async () => {
    const r = await call('POST', '/auth/signup', { body: { email: `x-${stamp}@example.com`, password: 'short' } });
    errShape(r, 400, 'invalid_input');
    eq(r.data.message, 'Password must be at least 8 characters', 'message');
  });
  await test('POST /auth/signup missing email -> 400 invalid_input', async () => {
    const r = await call('POST', '/auth/signup', { body: { password: 'long-enough-1' } });
    errShape(r, 400, 'invalid_input');
  });
  await test('POST /auth/signup malformed JSON -> 400 invalid_input', async () => {
    const r = await call('POST', '/auth/signup', { raw: '{not json' });
    errShape(r, 400, 'invalid_input');
  });
  await test('POST /auth/signup wrong type -> 400 invalid_input (not 422)', async () => {
    const r = await call('POST', '/auth/signup', { body: { email: 123, password: ['x'] } });
    errShape(r, 400, 'invalid_input');
  });
  await test('POST /auth/signup duplicate email -> 409 email_taken', async () => {
    const r = await call('POST', '/auth/signup', { body: { email: emailA, password: 'correct-horse-1' } });
    errShape(r, 409, 'email_taken');
    eq(r.data.message, 'An account with this email already exists', 'message');
  });
  await test('POST /auth/login 200 with seeded demo user', async () => {
    const r = await call('POST', '/auth/login', { body: { email: 'priya@northwind.io', password: 'granola-demo-1' } });
    eq(r.status, 200, 'status');
    userShape(r.data.user);
    eq(r.data.user.name, 'Priya Raman', 'name');
    demoToken = r.data.access_token;
  });
  await test('POST /auth/login wrong password -> 401 invalid_credentials', async () => {
    const r = await call('POST', '/auth/login', { body: { email: 'priya@northwind.io', password: 'nope-nope-nope' } });
    errShape(r, 401, 'invalid_credentials');
    eq(r.data.message, 'Invalid email or password', 'message');
  });
  await test('POST /auth/login unknown email -> 401 invalid_credentials', async () => {
    const r = await call('POST', '/auth/login', { body: { email: `ghost-${stamp}@example.com`, password: 'whatever-123' } });
    errShape(r, 401, 'invalid_credentials');
  });
  await test('GET /auth/me 200 {user}', async () => {
    const r = await call('GET', '/auth/me', { token: tokenA });
    eq(r.status, 200, 'status');
    userShape(r.data.user);
    eq(r.data.user.email, emailA, 'email');
  });
  await test('GET /auth/me without token -> 401 unauthorized', async () => {
    const r = await call('GET', '/auth/me');
    errShape(r, 401, 'unauthorized');
    eq(r.data.message, 'Missing or invalid token', 'message');
  });
  await test('GET /auth/me with invalid token -> 401 unauthorized', async () => {
    errShape(await call('GET', '/auth/me', { token: 'expired' }), 401, 'unauthorized');
  });

  // ---- templates ----
  await test('GET /api/templates 200 returns the 4 static templates', async () => {
    const r = await call('GET', '/api/templates', { token: tokenA });
    eq(r.status, 200, 'status');
    eq(r.data.templates.map((t) => t.id).join(','), 'general,one_on_one,customer_discovery,standup', 'ids');
    const cd = r.data.templates.find((t) => t.id === 'customer_discovery');
    eq(cd.name, 'Customer discovery', 'name');
    eq(cd.sections.join('|'), 'Summary|Key points|Pain points|Quotes|Next steps', 'sections');
  });
  await test('GET /api/templates without token -> 401', async () => {
    errShape(await call('GET', '/api/templates'), 401, 'unauthorized');
  });

  // ---- notes CRUD ----
  await test('GET /api/notes empty list for a new user', async () => {
    const r = await call('GET', '/api/notes', { token: tokenA });
    eq(r.status, 200, 'status');
    eq(JSON.stringify(r.data), '{"notes":[]}', 'body');
  });
  await test('POST /api/notes with no body -> 201, defaults applied', async () => {
    const r = await call('POST', '/api/notes', { token: tokenA });
    eq(r.status, 201, 'status');
    noteShape(r.data);
    eq(r.data.title, 'Untitled meeting', 'title');
    eq(r.data.template, 'general', 'template');
    eq(r.data.rough_notes, '', 'rough_notes');
    eq(r.data.transcript, '', 'transcript');
    eq(r.data.enhanced_notes, null, 'enhanced_notes');
    eq(r.data.enhanced_mode, null, 'enhanced_mode');
    eq(r.data.enhanced_at, null, 'enhanced_at');
  });
  await test('POST /api/notes blank title -> "Untitled meeting"', async () => {
    const r = await call('POST', '/api/notes', { token: tokenA, body: { title: '   ' } });
    eq(r.status, 201, 'status');
    eq(r.data.title, 'Untitled meeting', 'title');
  });
  await test('POST /api/notes unknown template -> 400 invalid_input "Unknown template"', async () => {
    const r = await call('POST', '/api/notes', { token: tokenA, body: { template: 'retro' } });
    errShape(r, 400, 'invalid_input');
    eq(r.data.message, 'Unknown template', 'message');
  });
  await test('POST /api/notes wrong type -> 400 invalid_input', async () => {
    errShape(await call('POST', '/api/notes', { token: tokenA, body: { title: { a: 1 } } }), 400, 'invalid_input');
  });
  await test('POST /api/notes without token -> 401', async () => {
    errShape(await call('POST', '/api/notes', { body: { title: 'x' } }), 401, 'unauthorized');
  });
  await test('POST /api/notes 201 full create', async () => {
    const r = await call('POST', '/api/notes', { token: tokenA, body: { title: 'Globex renewal call', template: 'general' } });
    eq(r.status, 201, 'status');
    noteShape(r.data);
    eq(r.data.title, 'Globex renewal call', 'title');
    noteId = r.data.id;
  });
  await test('POST /api/notes/{id}/enhance with blank notes+transcript -> 400 nothing_to_enhance', async () => {
    const r = await call('POST', `/api/notes/${noteId}/enhance`, { token: tokenA });
    errShape(r, 400, 'nothing_to_enhance');
    eq(r.data.message, 'Add rough notes or a transcript first', 'message');
  });
  const rough = 'renewal at risk - budget cut 15%\nwants usage report\nsend proposal by Tue';
  const transcript = 'Priya: Thanks for joining, Marcus.\nMarcus: Our budget was cut by fifteen percent this year, so the renewal is tight.\nMarcus: It is frustrating that we cannot see usage per team.\nPriya: I will send a revised proposal and a usage report by Tuesday.';
  let beforeUpdated;
  await test('PUT /api/notes/{id} partial update 200, bumps updated_at', async () => {
    const before = await call('GET', `/api/notes/${noteId}`, { token: tokenA });
    beforeUpdated = before.data.updated_at;
    await sleep(1100);
    const r = await call('PUT', `/api/notes/${noteId}`, { token: tokenA, body: { rough_notes: rough, transcript, template: 'customer_discovery' } });
    eq(r.status, 200, 'status');
    noteShape(r.data);
    eq(r.data.title, 'Globex renewal call', 'title untouched');
    eq(r.data.rough_notes, rough, 'rough_notes');
    eq(r.data.template, 'customer_discovery', 'template');
    assert(r.data.updated_at > beforeUpdated, 'updated_at not bumped');
  });
  await test('PUT /api/notes/{id} blank title -> "Untitled meeting", then restore', async () => {
    const r = await call('PUT', `/api/notes/${noteId}`, { token: tokenA, body: { title: '' } });
    eq(r.data.title, 'Untitled meeting', 'title');
    const r2 = await call('PUT', `/api/notes/${noteId}`, { token: tokenA, body: { title: 'Globex renewal call' } });
    eq(r2.data.title, 'Globex renewal call', 'restored');
  });
  await test('PUT /api/notes/{id} unknown template -> 400 invalid_input', async () => {
    errShape(await call('PUT', `/api/notes/${noteId}`, { token: tokenA, body: { template: 'nope' } }), 400, 'invalid_input');
  });
  await test('PUT /api/notes/{id} nonexistent id -> 404 not_found', async () => {
    errShape(await call('PUT', '/api/notes/00000000-0000-4000-8000-000000000000', { token: tokenA, body: { title: 'x' } }), 404, 'not_found');
  });
  await test('POST /api/notes/{id}/enhance 200, local mode, customer_discovery sections in order', async () => {
    const r = await call('POST', `/api/notes/${noteId}/enhance`, { token: tokenA });
    eq(r.status, 200, 'status');
    noteShape(r.data);
    eq(r.data.enhanced_mode, 'local', 'enhanced_mode');
    assert(ISO.test(r.data.enhanced_at), 'enhanced_at not ISO');
    const headings = r.data.enhanced_notes.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3));
    eq(headings.join('|'), 'Summary|Key points|Pain points|Quotes|Next steps', 'headings');
    assert(r.data.enhanced_notes.includes('\n- '), 'no bullets');
    eq(r.data.rough_notes, rough, 'rough_notes unchanged');
    eq(r.data.transcript, transcript, 'transcript unchanged');
  });
  await test('Enhance is deterministic (re-run yields same enhanced_notes)', async () => {
    const a = await call('GET', `/api/notes/${noteId}`, { token: tokenA });
    const b = await call('POST', `/api/notes/${noteId}/enhance`, { token: tokenA });
    eq(b.data.enhanced_notes, a.data.enhanced_notes, 'enhanced_notes');
  });
  await test('PUT enhanced_notes saves manual edit without changing mode/at', async () => {
    const before = await call('GET', `/api/notes/${noteId}`, { token: tokenA });
    const edited = before.data.enhanced_notes + '\n- Hand-added bullet';
    const r = await call('PUT', `/api/notes/${noteId}`, { token: tokenA, body: { enhanced_notes: edited } });
    eq(r.status, 200, 'status');
    eq(r.data.enhanced_notes, edited, 'enhanced_notes');
    eq(r.data.enhanced_mode, before.data.enhanced_mode, 'mode');
    eq(r.data.enhanced_at, before.data.enhanced_at, 'enhanced_at');
  });
  await test('GET /api/notes/{id} 200 persisted enhanced note', async () => {
    const r = await call('GET', `/api/notes/${noteId}`, { token: tokenA });
    eq(r.status, 200, 'status');
    noteShape(r.data);
    assert(r.data.enhanced_notes.startsWith('## Summary'), 'enhanced persisted');
  });
  await test('GET /api/notes summary shape, newest-updated first, is_enhanced flags', async () => {
    const r = await call('GET', '/api/notes', { token: tokenA });
    eq(r.status, 200, 'status');
    eq(r.data.notes.length, 3, 'count');
    r.data.notes.forEach((n) => eq(JSON.stringify(Object.keys(n).sort()), JSON.stringify(SUMMARY_KEYS), 'summary keys'));
    eq(r.data.notes[0].id, noteId, 'most recent first');
    eq(r.data.notes[0].is_enhanced, true, 'is_enhanced true');
    eq(r.data.notes[1].is_enhanced, false, 'is_enhanced false');
    for (let i = 1; i < r.data.notes.length; i++) assert(r.data.notes[i - 1].updated_at >= r.data.notes[i].updated_at, 'order');
  });
  await test('Responses never include user_id or password_hash', async () => {
    const r = await call('GET', `/api/notes/${noteId}`, { token: tokenA });
    assert(!r.text.includes('user_id') && !r.text.includes('password_hash'), 'leak');
  });

  // ---- ownership isolation ----
  await test("User B: GET another user's note -> 404 not_found", async () => {
    const r = await call('GET', `/api/notes/${noteId}`, { token: tokenB });
    errShape(r, 404, 'not_found');
    eq(r.data.message, 'Note not found', 'message');
  });
  await test("User B: PUT another user's note -> 404", async () => {
    errShape(await call('PUT', `/api/notes/${noteId}`, { token: tokenB, body: { title: 'hijack' } }), 404, 'not_found');
  });
  await test("User B: enhance another user's note -> 404", async () => {
    errShape(await call('POST', `/api/notes/${noteId}/enhance`, { token: tokenB }), 404, 'not_found');
  });
  await test("User B: DELETE another user's note -> 404", async () => {
    errShape(await call('DELETE', `/api/notes/${noteId}`, { token: tokenB }), 404, 'not_found');
  });
  await test("User B list does not include A's notes; demo user list unaffected", async () => {
    const r = await call('GET', '/api/notes', { token: tokenB });
    eq(r.data.notes.length, 0, 'B count');
    const d = await call('GET', '/api/notes', { token: demoToken });
    assert(d.data.notes.length >= 1 && !d.data.notes.some((n) => n.id === noteId), 'demo isolation');
  });

  // ---- 401 on every protected notes endpoint ----
  for (const [m, p] of [['GET', '/api/notes'], ['GET', `/api/notes/${'x'}`], ['PUT', '/api/notes/x'], ['POST', '/api/notes/x/enhance'], ['DELETE', '/api/notes/x']]) {
    await test(`${m} ${p} with invalid token -> 401 unauthorized`, async () => {
      errShape(await call(m, p, { token: 'not.a.jwt', body: m === 'PUT' ? {} : undefined }), 401, 'unauthorized');
    });
  }
  await test('Bearer token signed with a different secret -> 401', async () => {
    // header.payload with a bogus signature
    const forged = tokenA.split('.').slice(0, 2).join('.') + '.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    errShape(await call('GET', '/api/notes', { token: forged }), 401, 'unauthorized');
  });

  // ---- delete ----
  await test('DELETE /api/notes/{id} -> 204 empty body', async () => {
    const r = await call('DELETE', `/api/notes/${noteId}`, { token: tokenA });
    eq(r.status, 204, 'status');
    eq(r.text, '', 'empty body');
  });
  await test('GET deleted note -> 404; DELETE again -> 404', async () => {
    errShape(await call('GET', `/api/notes/${noteId}`, { token: tokenA }), 404, 'not_found');
    errShape(await call('DELETE', `/api/notes/${noteId}`, { token: tokenA }), 404, 'not_found');
  });

  console.log(`\n${passed}/${passed + failed} passed`);
  process.exit(failed ? 1 : 0);
})();
