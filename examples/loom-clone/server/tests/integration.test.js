// API integration tests for the core loop's save-and-manage half.
// Needs the server running on http://localhost:3001 and the seed already run.
// Run from server/ with: node tests/integration.test.js
// Creates two throwaway accounts (printed at the end) and deletes every recording it uploads.
const fs = require('fs');
const path = require('path');

const BASE = process.env.API_URL || 'http://localhost:3001';
const RECORDINGS_DIR = path.join(__dirname, '..', 'recordings');
const FIXTURE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'demo.webm'));
const DEMO = { email: 'dana.okafor@brightlane.io', password: 'walkthrough-2026' };
const SEEDED_TITLES = [
  'Onboarding walkthrough v2',
  'Bug report — invoice export times out',
  'Q4 roadmap review for design',
];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const RECORDING_KEYS = 'created_at,duration_seconds,id,mime_type,mode,size_bytes,title,updated_at';

let passed = 0;
const failures = [];
const bodiesSeen = [];
let last = null; // the most recent request/response, printed when a check fails

function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    const info = `${detail ? `${detail} | ` : ''}${last ? `${last.method} ${last.url} -> ${last.status} ${last.text.slice(0, 300)}` : ''}`;
    failures.push(`${name} :: ${info}`);
    console.log(`FAIL  ${name} :: ${info}`);
  }
}

async function call(method, url, { token, json, form, headers = {}, raw = false } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) {
    h['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) body = form;
  const res = await fetch(BASE + url, { method, headers: h, body });
  const buffer = Buffer.from(await res.arrayBuffer());
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const text = raw && !isJson ? `<${buffer.length} bytes>` : buffer.toString('utf8');
  let data = null;
  if (isJson) {
    data = JSON.parse(text);
    bodiesSeen.push(text);
  }
  last = { method, url: url.replace(/token=[^&]+/, 'token=<token>'), status: res.status, text };
  return { status: res.status, headers: res.headers, data, buffer };
}

const isError = (r, status, code, message) =>
  r.status === status &&
  r.data &&
  r.data.error === code &&
  typeof r.data.message === 'string' &&
  (message === undefined || r.data.message === message) &&
  Object.keys(r.data).sort().join() === 'error,message';

function uploadForm({ mode = 'screen', duration = '5', title, type = 'video/webm;codecs=vp9,opus', bytes = FIXTURE, file = true } = {}) {
  const form = new FormData();
  if (file) form.append('file', new Blob([bytes], { type }), 'recording.webm');
  if (mode !== null) form.append('mode', mode);
  if (duration !== null) form.append('duration_seconds', duration);
  if (title !== undefined) form.append('title', title);
  return form;
}

const filesOnDisk = () => fs.readdirSync(RECORDINGS_DIR).sort();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const stamp = Date.now();
  const emailA = `qa-a-${stamp}@example.com`;
  const emailB = `qa-b-${stamp}@example.com`;
  const password = 'qa-password-1';
  let r;

  // ---- signup
  r = await call('POST', '/auth/signup', { json: { email: `  QA-A-${stamp}@Example.com  `, password } });
  check('signup returns 201 with access_token and user', r.status === 201 && typeof r.data.access_token === 'string' && Object.keys(r.data).sort().join() === 'access_token,user');
  check('signup user has only id, email, created_at', r.data.user && Object.keys(r.data.user).sort().join() === 'created_at,email,id');
  check('signup trims and lower-cases the email', r.data.user && r.data.user.email === emailA);
  check('signup user id is UUID v4 and created_at has no milliseconds', r.data.user && UUID.test(r.data.user.id) && ISO.test(r.data.user.created_at));
  const tokenA = r.data.access_token;
  const userA = r.data.user;

  r = await call('POST', '/auth/signup', { json: { email: emailA, password } });
  check('duplicate signup returns 409 email_taken with the contract message', isError(r, 409, 'email_taken', 'That email is already registered.'));
  r = await call('POST', '/auth/signup', { json: { email: 'not-an-email', password } });
  check('signup with malformed email returns 400 invalid_input', isError(r, 400, 'invalid_input'));
  r = await call('POST', '/auth/signup', { json: { password } });
  check('signup with missing email returns 400 invalid_input', isError(r, 400, 'invalid_input'));
  r = await call('POST', '/auth/signup', { json: { email: `qa-short-${stamp}@example.com`, password: '1234567' } });
  check('signup with 7-character password returns 400 invalid_input', isError(r, 400, 'invalid_input'));
  r = await call('POST', '/auth/signup', { headers: { 'Content-Type': 'application/json' }, form: '{not json' });
  check('signup with broken JSON returns 400 invalid_input (JSON, not HTML)', isError(r, 400, 'invalid_input'));

  r = await call('POST', '/auth/signup', { json: { email: emailB, password } });
  check('second user signup returns 201', r.status === 201);
  const tokenB = r.data.access_token;

  // ---- login
  r = await call('POST', '/auth/login', { json: { email: emailA, password } });
  check('login returns 200 with the same shape as signup', r.status === 200 && typeof r.data.access_token === 'string' && r.data.user.id === userA.id && Object.keys(r.data.user).sort().join() === 'created_at,email,id');
  const loginTokenA = r.data.access_token;
  r = await call('POST', '/auth/login', { json: { email: emailA, password: 'wrong-password' } });
  check('login with wrong password returns 401 invalid_credentials with the contract message', isError(r, 401, 'invalid_credentials', 'Email or password is incorrect.'));
  const wrongPasswordBody = JSON.stringify(r.data);
  r = await call('POST', '/auth/login', { json: { email: `nobody-${stamp}@example.com`, password } });
  check('login with unknown email returns the identical 401 body', r.status === 401 && JSON.stringify(r.data) === wrongPasswordBody);
  r = await call('POST', '/auth/login', { json: DEMO });
  check('demo user can log in with the seeded credentials', r.status === 200 && r.data.user.email === DEMO.email);
  const tokenDemo = r.data.access_token;

  // ---- /auth/me
  r = await call('GET', '/auth/me', { token: loginTokenA });
  check('GET /auth/me returns 200 { user } for a valid token', r.status === 200 && Object.keys(r.data).join() === 'user' && r.data.user.id === userA.id && r.data.user.email === emailA);
  r = await call('GET', '/auth/me');
  check('GET /auth/me without a token returns 401 unauthorized', isError(r, 401, 'unauthorized'));
  r = await call('GET', '/auth/me', { token: 'expired' });
  check('GET /auth/me with an invalid token returns 401 unauthorized', isError(r, 401, 'unauthorized'));
  r = await call('GET', '/auth/me', { token: `${tokenA.slice(0, -3)}abc` });
  check('GET /auth/me with a tampered signature returns 401 unauthorized', isError(r, 401, 'unauthorized'));

  // ---- protected routes without / with a bad header token
  for (const [method, url] of [['GET', '/recordings'], ['GET', '/recordings/x'], ['POST', '/recordings'], ['PUT', '/recordings/x'], ['DELETE', '/recordings/x'], ['GET', '/recordings/x/file']]) {
    r = await call(method, url);
    check(`${method} ${url} without a token returns 401 unauthorized`, isError(r, 401, 'unauthorized'));
  }
  r = await call('GET', '/recordings', { token: 'expired' });
  check('GET /recordings with an invalid token returns 401 unauthorized', isError(r, 401, 'unauthorized'));

  // ---- upload (what a browser sends: a codec list in the part's content type)
  const before = filesOnDisk();
  const uploadedAt = new Date();
  r = await call('POST', '/recordings', { token: tokenA, form: uploadForm({ mode: 'screen', duration: '5' }) });
  const rec = r.data && r.data.recording;
  check('upload returns 201 { recording } with exactly the contract fields', r.status === 201 && rec && Object.keys(r.data).join() === 'recording' && Object.keys(rec).sort().join() === RECORDING_KEYS);
  check('upload mime_type has codec parameters removed (video/webm)', rec && rec.mime_type === 'video/webm', rec && `mime_type=${rec.mime_type}`);
  check('upload size_bytes equals the real file size', rec && rec.size_bytes === FIXTURE.length, rec && `size_bytes=${rec.size_bytes} expected=${FIXTURE.length}`);
  check('upload stores mode and integer duration_seconds', rec && rec.mode === 'screen' && rec.duration_seconds === 5);
  check('upload id is a UUID v4', rec && UUID.test(rec.id));
  check('upload timestamps are UTC ISO 8601 without milliseconds and equal', rec && ISO.test(rec.created_at) && rec.created_at === rec.updated_at, rec && `${rec.created_at} / ${rec.updated_at}`);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const titleFor = (d) => `Recording — ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  check('upload default title is "Recording — <D MMM YYYY, HH:mm>" with an em dash, server local time', rec && [titleFor(uploadedAt), titleFor(new Date())].includes(rec.title), rec && `title=${rec.title}`);
  check('upload writes server/recordings/<id>.webm with identical bytes', rec && fs.existsSync(path.join(RECORDINGS_DIR, `${rec.id}.webm`)) && fs.readFileSync(path.join(RECORDINGS_DIR, `${rec.id}.webm`)).equals(FIXTURE));

  r = await call('POST', '/recordings', { token: tokenA, form: uploadForm({ type: 'video/webm', title: '   ' }) });
  check('upload with a plain video/webm type and blank title also gets video/webm and the default title', r.status === 201 && r.data.recording.mime_type === 'video/webm' && r.data.recording.title.startsWith('Recording — '));
  const blankTitleId = r.status === 201 ? r.data.recording.id : null;

  // ---- invalid uploads leave nothing on disk
  const afterGood = filesOnDisk();
  const badUploads = [
    ['bad mode', uploadForm({ mode: 'camera' })],
    ['missing mode', uploadForm({ mode: null })],
    ['negative duration', uploadForm({ duration: '-1' })],
    ['fractional duration', uploadForm({ duration: '1.5' })],
    ['non-numeric duration', uploadForm({ duration: 'abc' })],
    ['missing duration', uploadForm({ duration: null })],
    ['empty file', uploadForm({ bytes: Buffer.alloc(0) })],
    ['missing file', uploadForm({ file: false })],
    ['201-character title', uploadForm({ title: 'x'.repeat(201) })],
  ];
  for (const [name, form] of badUploads) {
    r = await call('POST', '/recordings', { token: tokenA, form });
    check(`upload with ${name} returns 400 invalid_input`, isError(r, 400, 'invalid_input'));
    check(`upload with ${name} leaves no file in server/recordings/`, filesOnDisk().join() === afterGood.join(), `extra files: ${filesOnDisk().filter((f) => !afterGood.includes(f)).join(', ')}`);
  }
  r = await call('POST', '/recordings', { token: tokenA, json: { mode: 'screen', duration_seconds: 5 } });
  check('upload sent as JSON (no multipart) returns 400 invalid_input', isError(r, 400, 'invalid_input'));
  r = await call('POST', '/recordings', { token: 'expired', form: uploadForm() });
  check('upload with an invalid token returns 401 and leaves no file', isError(r, 401, 'unauthorized') && filesOnDisk().join() === afterGood.join());

  // ---- list: newest first, scoped to the user
  await sleep(1100); // timestamps have one-second resolution
  r = await call('POST', '/recordings', { token: tokenA, form: uploadForm({ mode: 'screen_camera', duration: '0', title: '  Second take  ' }) });
  check('upload with a title trims it, accepts screen_camera and duration 0', r.status === 201 && r.data.recording.title === 'Second take' && r.data.recording.mode === 'screen_camera' && r.data.recording.duration_seconds === 0);
  const second = r.data.recording;

  r = await call('GET', '/recordings', { token: tokenA });
  const listA = (r.data && r.data.recordings) || [];
  check('list returns 200 { recordings: [...] } with only this user\'s three uploads', r.status === 200 && Object.keys(r.data).join() === 'recordings' && listA.length === 3 && listA.every((x) => [rec.id, blankTitleId, second.id].includes(x.id)));
  check('list is sorted by created_at, newest first', listA.length === 3 && listA[0].id === second.id && listA.every((x, i) => i === 0 || listA[i - 1].created_at >= x.created_at), listA.map((x) => x.created_at).join(' '));
  check('list items have exactly the contract fields', listA.every((x) => Object.keys(x).sort().join() === RECORDING_KEYS));
  r = await call('GET', '/recordings', { token: tokenB });
  check('list for a user with no recordings is { recordings: [] }', r.status === 200 && JSON.stringify(r.data) === '{"recordings":[]}');

  // ---- get
  r = await call('GET', `/recordings/${rec.id}`, { token: tokenA });
  check('get returns 200 { recording } equal to the created one', r.status === 200 && JSON.stringify(r.data.recording) === JSON.stringify(rec));
  r = await call('GET', '/recordings/00000000-0000-4000-8000-000000000000', { token: tokenA });
  check('get of an unknown id returns 404 not_found "Recording not found."', isError(r, 404, 'not_found', 'Recording not found.'));

  // ---- rename
  await sleep(1100);
  r = await call('PUT', `/recordings/${rec.id}`, { token: tokenA, json: { title: '  Bug report — invoice export times out  ', mode: 'screen_camera', duration_seconds: 999, id: 'hacked' } });
  const renamed = r.data && r.data.recording;
  check('rename returns 200 with the trimmed title', r.status === 200 && renamed && renamed.title === 'Bug report — invoice export times out');
  check('rename ignores every other field in the body', renamed && renamed.mode === 'screen' && renamed.duration_seconds === 5 && renamed.id === rec.id && renamed.created_at === rec.created_at);
  check('rename moves updated_at forward, still without milliseconds', renamed && ISO.test(renamed.updated_at) && renamed.updated_at > rec.updated_at);
  r = await call('GET', `/recordings/${rec.id}`, { token: tokenA });
  check('rename is persisted (get returns the new title and updated_at)', r.status === 200 && JSON.stringify(r.data.recording) === JSON.stringify(renamed));
  r = await call('PUT', `/recordings/${rec.id}`, { token: tokenA, json: { title: '' } });
  check('rename to an empty title returns 400 "Title can\'t be empty."', isError(r, 400, 'invalid_input', "Title can't be empty."));
  r = await call('PUT', `/recordings/${rec.id}`, { token: tokenA, json: { title: '    ' } });
  check('rename to a whitespace-only title returns 400 "Title can\'t be empty."', isError(r, 400, 'invalid_input', "Title can't be empty."));
  r = await call('PUT', `/recordings/${rec.id}`, { token: tokenA, json: {} });
  check('rename with no title returns 400 invalid_input', isError(r, 400, 'invalid_input'));
  r = await call('PUT', `/recordings/${rec.id}`, { token: tokenA, json: { title: 'x'.repeat(201) } });
  check('rename to 201 characters returns 400 invalid_input', isError(r, 400, 'invalid_input'));
  r = await call('PUT', `/recordings/${rec.id}`, { token: tokenA, json: { title: 'y'.repeat(200) } });
  check('rename to exactly 200 characters returns 200', r.status === 200 && r.data.recording.title.length === 200);
  r = await call('PUT', `/recordings/${rec.id}`, { token: tokenA, json: { title: renamed.title } });
  r = await call('PUT', '/recordings/00000000-0000-4000-8000-000000000000', { token: tokenA, json: { title: 'x' } });
  check('rename of an unknown id returns 404 not_found', isError(r, 404, 'not_found'));

  // ---- ?token= is accepted only by the file route
  const q = `?token=${tokenA}`;
  r = await call('GET', `/auth/me${q}`);
  check('?token= is rejected on GET /auth/me (401)', isError(r, 401, 'unauthorized'));
  r = await call('GET', `/recordings${q}`);
  check('?token= is rejected on GET /recordings (401)', isError(r, 401, 'unauthorized'));
  r = await call('GET', `/recordings/${rec.id}${q}`);
  check('?token= is rejected on GET /recordings/:id (401)', isError(r, 401, 'unauthorized'));
  const filesBeforeQueryUpload = filesOnDisk();
  r = await call('POST', `/recordings${q}`, { form: uploadForm() });
  check('?token= is rejected on POST /recordings (401) and leaves no file', isError(r, 401, 'unauthorized') && filesOnDisk().join() === filesBeforeQueryUpload.join());
  r = await call('PUT', `/recordings/${rec.id}${q}`, { json: { title: 'via query token' } });
  check('?token= is rejected on PUT /recordings/:id (401)', isError(r, 401, 'unauthorized'));
  r = await call('DELETE', `/recordings/${rec.id}${q}`);
  check('?token= is rejected on DELETE /recordings/:id (401)', isError(r, 401, 'unauthorized'));
  r = await call('GET', `/recordings/${rec.id}`, { token: tokenA });
  check('recording is untouched after the rejected ?token= write attempts', r.status === 200 && r.data.recording.title === renamed.title);

  // ---- file: playback, range, download
  r = await call('GET', `/recordings/${rec.id}/file${q}`, { raw: true });
  check('file with ?token= returns 200, the stored Content-Type and the exact bytes', r.status === 200 && r.headers.get('content-type') === 'video/webm' && r.buffer.equals(FIXTURE), `content-type=${r.headers.get('content-type')}`);
  check('playback response has no Content-Disposition and advertises byte ranges', !r.headers.get('content-disposition') && r.headers.get('accept-ranges') === 'bytes');
  r = await call('GET', `/recordings/${rec.id}/file`, { token: tokenA, raw: true });
  check('file with the Authorization header returns 200 and the exact bytes', r.status === 200 && r.buffer.equals(FIXTURE));
  r = await call('GET', `/recordings/${rec.id}/file${q}`, { headers: { Range: 'bytes=0-99' }, raw: true });
  check('Range bytes=0-99 returns 206 with the right Content-Range and 100 bytes', r.status === 206 && r.headers.get('content-range') === `bytes 0-99/${FIXTURE.length}` && r.buffer.equals(FIXTURE.subarray(0, 100)), `content-range=${r.headers.get('content-range')}`);
  r = await call('GET', `/recordings/${rec.id}/file${q}`, { headers: { Range: `bytes=${FIXTURE.length - 500}-` }, raw: true });
  check('open-ended Range near the end returns 206 with the last 500 bytes', r.status === 206 && r.buffer.equals(FIXTURE.subarray(FIXTURE.length - 500)));
  r = await call('GET', `/recordings/${rec.id}/file`);
  check('file with no token returns 401 unauthorized as JSON', isError(r, 401, 'unauthorized'));
  r = await call('GET', `/recordings/${rec.id}/file?token=expired`);
  check('file with an invalid ?token= returns 401 unauthorized', isError(r, 401, 'unauthorized'));
  r = await call('GET', `/recordings/00000000-0000-4000-8000-000000000000/file${q}`);
  check('file of an unknown id returns 404 not_found', isError(r, 404, 'not_found'));

  // download of a default-titled recording (em dash, colon and comma in the title)
  r = await call('GET', `/recordings/${blankTitleId}`, { token: tokenA });
  const defaultTitled = r.data.recording;
  r = await call('GET', `/recordings/${blankTitleId}/file${q}&download=1`, { raw: true });
  const cd = r.headers.get('content-disposition') || '';
  const safeName = `${defaultTitled.title.replace(/[/\\:*?"<>|]/g, '-')}.webm`;
  const star = /filename\*=UTF-8''([^;]+)/.exec(cd);
  const plain = /filename="([^"]*)"/.exec(cd);
  check('download=1 returns 200 with the exact bytes', r.status === 200 && r.buffer.equals(FIXTURE));
  check('download Content-Disposition is an attachment and pure ASCII', /^attachment;/.test(cd) && /^[\x20-\x7e]+$/.test(cd), `content-disposition=${cd}`);
  check('download filename*= decodes to "<title with unsafe chars as ->.webm"', star && decodeURIComponent(star[1]) === safeName, `content-disposition=${cd} expected=${safeName}`);
  check('download filename= is an ASCII fallback ending in .webm with no unsafe characters', plain && /\.webm$/.test(plain[1]) && !/[/\\:*?"<>|]/.test(plain[1]), `content-disposition=${cd}`);
  r = await call('PUT', `/recordings/${second.id}`, { token: tokenA, json: { title: 'a/b\\c:d*e?f"g<h>i|j' } });
  r = await call('GET', `/recordings/${second.id}/file${q}&download=1`, { raw: true });
  check('download replaces / \\ : * ? " < > | in the title with -', /filename="a-b-c-d-e-f-g-h-i-j\.webm"/.test(r.headers.get('content-disposition') || ''), `content-disposition=${r.headers.get('content-disposition')}`);
  r = await call('GET', `/recordings/${second.id}/file${q}&download=0`, { raw: true });
  check('download=0 does not add Content-Disposition', r.status === 200 && !r.headers.get('content-disposition'));

  // ---- ownership: user B cannot touch user A's recording
  r = await call('GET', `/recordings/${rec.id}`, { token: tokenB });
  check('user B get of user A\'s recording returns 404 "Recording not found."', isError(r, 404, 'not_found', 'Recording not found.'));
  r = await call('PUT', `/recordings/${rec.id}`, { token: tokenB, json: { title: 'stolen' } });
  check('user B rename of user A\'s recording returns 404', isError(r, 404, 'not_found'));
  r = await call('GET', `/recordings/${rec.id}/file`, { token: tokenB });
  check('user B file fetch (header) of user A\'s recording returns 404', isError(r, 404, 'not_found'));
  r = await call('GET', `/recordings/${rec.id}/file?token=${tokenB}`);
  check('user B file fetch (?token=) of user A\'s recording returns 404', isError(r, 404, 'not_found'));
  r = await call('DELETE', `/recordings/${rec.id}`, { token: tokenB });
  check('user B delete of user A\'s recording returns 404', isError(r, 404, 'not_found'));
  r = await call('GET', `/recordings/${rec.id}`, { token: tokenA });
  check('user A\'s recording and file are intact after user B\'s attempts', r.status === 200 && r.data.recording.title === renamed.title && fs.existsSync(path.join(RECORDINGS_DIR, `${rec.id}.webm`)));
  r = await call('GET', '/recordings/b3e9a6c2-58d1-4f7e-8c0a-1d2e3f4a5b6c', { token: tokenA });
  check('user A cannot get a seeded demo recording (404)', isError(r, 404, 'not_found'));
  r = await call('GET', `/recordings/b3e9a6c2-58d1-4f7e-8c0a-1d2e3f4a5b6c/file${q}`);
  check('user A cannot fetch a seeded demo recording\'s file (404)', isError(r, 404, 'not_found'));

  // ---- seeded data for the demo user
  r = await call('GET', '/recordings', { token: tokenDemo });
  const demoList = (r.data && r.data.recordings) || [];
  check('demo user lists exactly the three seeded recordings, newest first', r.status === 200 && demoList.map((x) => x.title).join('|') === SEEDED_TITLES.join('|'), demoList.map((x) => x.title).join('|'));
  check('seeded recordings have real size, 5 s duration, video/webm and clean timestamps', demoList.length === 3 && demoList.every((x) => x.size_bytes === FIXTURE.length && x.duration_seconds === 5 && x.mime_type === 'video/webm' && ISO.test(x.created_at) && ISO.test(x.updated_at) && UUID.test(x.id)));
  for (const item of demoList) {
    r = await call('GET', `/recordings/${item.id}/file?token=${tokenDemo}`, { raw: true });
    check(`seeded file "${item.title}" is fetchable (200, video/webm, EBML header, full size)`, r.status === 200 && r.headers.get('content-type') === 'video/webm' && r.buffer.length === item.size_bytes && r.buffer.readUInt32BE(0) === 0x1a45dfa3);
  }

  // ---- delete
  r = await call('DELETE', `/recordings/${rec.id}`, { token: tokenA });
  check('delete returns 204 with an empty body', r.status === 204 && r.buffer.length === 0);
  check('delete removes the file from disk', !fs.existsSync(path.join(RECORDINGS_DIR, `${rec.id}.webm`)));
  r = await call('GET', `/recordings/${rec.id}`, { token: tokenA });
  check('deleted recording is gone (get 404)', isError(r, 404, 'not_found'));
  r = await call('GET', `/recordings/${rec.id}/file${q}`);
  check('deleted recording\'s file is gone (file 404)', isError(r, 404, 'not_found'));
  r = await call('GET', '/recordings', { token: tokenA });
  check('deleted recording no longer appears in the list', r.status === 200 && r.data.recordings.length === 2 && !r.data.recordings.some((x) => x.id === rec.id));
  r = await call('DELETE', `/recordings/${rec.id}`, { token: tokenA });
  check('deleting it again returns 404 not_found', isError(r, 404, 'not_found'));

  // file missing from disk: file route 404, delete still 204
  fs.rmSync(path.join(RECORDINGS_DIR, `${second.id}.webm`));
  r = await call('GET', `/recordings/${second.id}/file${q}`);
  check('file route returns 404 when the file is missing from disk', isError(r, 404, 'not_found'));
  r = await call('DELETE', `/recordings/${second.id}`, { token: tokenA });
  check('delete still returns 204 when the file is already missing', r.status === 204);
  r = await call('DELETE', `/recordings/${blankTitleId}`, { token: tokenA });
  check('cleanup delete of the remaining test recording returns 204', r.status === 204);
  check('server/recordings/ holds the same files as before the test uploads', filesOnDisk().join() === before.join(), `before=${before.length} after=${filesOnDisk().length}`);

  // ---- misc
  r = await call('GET', '/nope');
  check('unknown route returns 404 not_found as JSON', isError(r, 404, 'not_found'));
  r = await fetch(`${BASE}/recordings`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  check('CORS preflight allows http://localhost:5173 with Authorization and PUT', r.headers.get('access-control-allow-origin') === 'http://localhost:5173' && /PUT/.test(r.headers.get('access-control-allow-methods') || '') && /authorization/i.test(r.headers.get('access-control-allow-headers') || ''));

  // ---- nothing private in any JSON body seen during the run
  const leaks = bodiesSeen.filter((b) => /user_id|password_hash|password"|server\/recordings|\/Users\/|recordings\/[0-9a-f-]{36}\.webm|data\.db/.test(b));
  last = null;
  check(`no JSON body (${bodiesSeen.length} checked) contains user_id, password_hash, or a disk path`, leaks.length === 0, leaks.slice(0, 2).join(' || '));

  console.log(`\n${passed}/${passed + failures.length} passed`);
  if (failures.length) console.log(`\nFailures:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  console.log(`Test accounts created: ${emailA}, ${emailB}`);
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  if (last) console.error('Last request:', last);
  process.exit(2);
});
