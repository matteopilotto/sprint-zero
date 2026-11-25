// Browser E2E for granola-clone: auth dance + core loop, headless Chromium.
// Run: PW_DIR=/path/with/node_modules/playwright node server/tests/e2e.mjs
// (frontend on :5173 and backend on :8000 must be running)
import { createRequire } from 'module';

const require = createRequire((process.env.PW_DIR || process.cwd()) + '/');
const { chromium } = require('playwright');

const APP = process.env.APP_URL || 'http://localhost:5173';
const API = process.env.API_URL || 'http://localhost:8000';
const email = `qa-e2e-${Date.now()}@example.com`;
const password = 'qa-e2e-pass-1';
const tid = (id) => `[data-testid="${id}"]`;
let passed = 0;
let failed = 0;

async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name}\n      ${err.message.split('\n')[0]}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const browser = await chromium.launch();
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

await step('1. / redirects a visitor to /login', async () => {
  await page.goto(APP);
  await page.waitForURL('**/login');
  assert((await page.locator('h1').textContent()) === 'Log in', 'no Log in heading');
});
await step('2. Sign up link goes to /signup', async () => {
  await page.click(tid('go-to-signup'));
  await page.waitForURL('**/signup');
});
await step('2b. Short password shows validation message', async () => {
  await page.fill(tid('email-input'), email);
  await page.fill(tid('password-input'), 'short');
  await page.click(tid('signup-button'));
  await page.getByText('Password must be at least 8 characters').waitFor();
  assert(page.url().endsWith('/signup'), 'left /signup');
});
await step('3-5. Signup lands on /notes "Your notes"', async () => {
  await page.fill(tid('name-input'), 'Morgan Blake');
  await page.fill(tid('password-input'), password);
  await page.click(tid('signup-button'));
  await page.waitForURL('**/notes');
  await page.getByRole('heading', { name: 'Your notes' }).waitFor();
});
await step('6. Session survives reload (name in header)', async () => {
  await page.reload();
  await page.getByRole('heading', { name: 'Your notes' }).waitFor();
  assert((await page.textContent(tid('user-name'))) === 'Morgan Blake', 'name missing');
});
await step('7-8. Log out lands on /login', async () => {
  await page.click(tid('logout-button'));
  await page.waitForURL('**/login');
});
await step('8b. Protected /notes redirects to /login when logged out', async () => {
  await page.goto(`${APP}/notes`);
  await page.waitForURL('**/login');
});
await step('8c. Duplicate signup shows "An account with this email already exists"', async () => {
  await page.goto(`${APP}/signup`);
  await page.fill(tid('email-input'), email);
  await page.fill(tid('password-input'), password);
  await page.click(tid('signup-button'));
  await page.getByText('An account with this email already exists').waitFor();
});
await step('9-12. Login lands on /notes again', async () => {
  await page.goto(`${APP}/login`);
  await page.fill(tid('email-input'), email);
  await page.fill(tid('password-input'), password);
  await page.click(tid('login-button'));
  await page.waitForURL('**/notes');
  await page.getByRole('heading', { name: 'Your notes' }).waitFor();
});
await step('13a. API call without token returns 401 {error,message}', async () => {
  const r = await page.evaluate(async (api) => {
    const res = await fetch(`${api}/api/notes`);
    return { status: res.status, body: await res.json() };
  }, API);
  assert(r.status === 401 && r.body.error === 'unauthorized' && r.body.message, JSON.stringify(r));
});
await step('13b. Corrupted token: reload clears session and redirects to /login', async () => {
  await page.evaluate(() => localStorage.setItem('access_token', 'expired'));
  await page.goto(`${APP}/notes`);
  await page.waitForURL('**/login');
  assert((await page.evaluate(() => localStorage.getItem('access_token'))) === null, 'token not cleared');
  await page.fill(tid('email-input'), email);
  await page.fill(tid('password-input'), password);
  await page.click(tid('login-button'));
  await page.waitForURL('**/notes');
});

let noteUrl;
const rough = 'reporting is manual - takes 2 days\nwants Salesforce sync\nsend pricing by Mon';
const transcript = [
  'Morgan: Thanks for the time, Ravi. How do you build the weekly report today?',
  'Ravi: It is all manual and it takes about two days, which is painful for the team.',
  'Ravi: We really need Salesforce sync before we can roll this out.',
  'Morgan: I will send pricing by Monday and follow up with a demo.',
].join('\n');

await step('14a. New note opens editor with empty focused title + disabled Enhance', async () => {
  await page.click(tid('new-note-button'));
  await page.waitForURL(/\/notes\/[0-9a-f-]{36}$/);
  noteUrl = page.url();
  const title = page.locator(tid('title-input'));
  assert((await title.inputValue()) === '', 'title not empty');
  assert((await title.getAttribute('placeholder')) === 'Meeting title', 'placeholder');
  assert(await title.evaluate((el) => el === document.activeElement), 'title not focused');
  assert(await page.locator(tid('enhance-button')).isDisabled(), 'Enhance enabled on empty note');
});
await step('14b. Fill title, rough notes, transcript, pick Customer discovery, Save -> "Saved"', async () => {
  await page.fill(tid('title-input'), 'Umbrella Corp reporting discovery');
  await page.fill(tid('rough-notes-input'), rough);
  await page.fill(tid('transcript-input'), transcript);
  await page.selectOption(tid('template-select'), { label: 'Customer discovery' });
  await page.click(tid('save-note'));
  await page.locator(tid('save-status')).filter({ hasText: /^Saved$/ }).waitFor();
});
await step('14c. Enhance -> "Enhancing..." then Enhanced view with template headings', async () => {
  const btn = page.locator(tid('enhance-button'));
  await btn.click();
  await page.locator(tid('enhanced-mode')).waitFor({ timeout: 30000 });
  const headings = await page.locator(`${tid('enhanced-notes')} h2`).allTextContents();
  assert(headings.join('|') === 'Summary|Key points|Pain points|Quotes|Next steps', headings.join('|'));
  assert((await page.textContent(tid('enhanced-mode'))) === 'Enhanced locally', 'mode label');
  assert((await btn.textContent()) === 'Enhance', 'button label did not reset');
});
await step('14d. Toggle My notes shows unchanged rough notes; Enhanced shows output', async () => {
  await page.click(tid('tab-my-notes'));
  assert((await page.inputValue(tid('rough-notes-input'))) === rough, 'rough notes changed');
  assert((await page.locator(tid('enhanced-notes')).count()) === 0, 'enhanced still visible');
  await page.click(tid('tab-enhanced'));
  await page.locator(tid('enhanced-notes')).waitFor();
  assert((await page.inputValue(tid('transcript-input'))) === transcript, 'transcript changed');
});
await step('14e. Back to list: note at top with "Enhanced" badge', async () => {
  await page.goto(`${APP}/notes`);
  const first = page.locator(tid('note-row')).first();
  await first.waitFor();
  const text = await first.textContent();
  assert(text.includes('Umbrella Corp reporting discovery'), `top row: ${text}`);
  assert((await first.locator('.badge').textContent()) === 'Enhanced', 'badge missing');
});
await step('14f. Reopen from list: enhanced notes, rough notes, transcript persisted', async () => {
  await page.locator(tid('note-row')).first().click();
  await page.waitForURL(noteUrl);
  await page.click(tid('tab-enhanced'));
  const headings = await page.locator(`${tid('enhanced-notes')} h2`).allTextContents();
  assert(headings.length === 5, `headings: ${headings}`);
  assert((await page.inputValue(tid('template-select'))) === 'customer_discovery', 'template');
  await page.click(tid('tab-my-notes'));
  assert((await page.inputValue(tid('rough-notes-input'))) === rough, 'rough notes');
});
await step('14g. Delete note returns to list and removes it', async () => {
  page.once('dialog', (d) => d.accept());
  await page.click(tid('delete-note'));
  await page.waitForURL('**/notes');
  await page.getByText('No notes yet').waitFor();
});
await step('No uncaught page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join('; '));
});

await browser.close();
console.log(`\n${passed}/${passed + failed} passed`);
process.exit(failed ? 1 : 0);
