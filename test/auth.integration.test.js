const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

const root = path.resolve(__dirname, '..');
let privateDir; let child; let base; let setupToken;
function listenOnFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(error => error ? reject(error) : resolve(port)); });
  });
}
async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try { const response = await fetch(`${base}/api/status`); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('El servidor de integración no inició a tiempo.');
}
async function post(route, body, cookie) {
  const response = await fetch(`${base}${route}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  return { response, body: await response.json() };
}
function cookieFrom(response) { return response.headers.get('set-cookie')?.split(';')[0]; }

before(async () => {
  privateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ensenar-c-test-'));
  const port = await listenOnFreePort(); base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port), APP_PRIVATE_DIR: privateDir, APP_DISABLE_MAIL: '1', MAIL_NOTIFY_TO: '' }, stdio: 'ignore' });
  await waitForServer();
  setupToken = fs.readFileSync(path.join(privateDir, 'bootstrap-token'), 'utf8').trim();
});
after(() => {
  if (child && child.exitCode === null) child.kill('SIGTERM');
  if (privateDir) fs.rmSync(privateDir, { recursive: true, force: true });
});

test('el curso no se descarga sin sesión', async () => {
  const response = await fetch(`${base}/app.js`);
  assert.equal(response.status, 401);
});

test('configuración inicial admite una sola administración y revoca usuarios', async () => {
  const payload = token => ({ token, name: 'Admin de prueba', email: 'admin@example.test', password: 'clave-de-prueba-larga-2026' });
  const attempts = await Promise.all([post('/api/auth/setup-admin', payload(setupToken)), post('/api/auth/setup-admin', payload(setupToken))]);
  assert.deepEqual(attempts.map(result => result.response.status).sort(), [201, 409]);
  const adminResult = attempts.find(result => result.response.status === 201);
  const adminCookie = cookieFrom(adminResult.response);
  assert.ok(adminCookie);
  assert.equal(adminResult.body.user.role, 'admin');
  assert.equal(JSON.stringify(adminResult.body.user).includes('password'), false);

  const signup = await post('/api/auth/register', { name: 'Aprendiz', email: 'aprendiz@example.test', password: 'otra-clave-segura-2026' });
  assert.equal(signup.response.status, 201);
  const userCookie = cookieFrom(signup.response);
  const duplicate = await post('/api/auth/register', { name: 'Otra persona', email: 'aprendiz@example.test', password: 'otra-clave-segura-2026' });
  assert.equal(duplicate.response.status, 409);

  const course = await fetch(`${base}/app.js`, { headers: { cookie: userCookie } });
  assert.equal(course.status, 200);
  assert.match(await course.text(), /const chapters=/);

  const accountsResponse = await fetch(`${base}/api/admin/users`, { headers: { cookie: adminCookie } });
  const accounts = await accountsResponse.json();
  const learner = accounts.users.find(user => user.email === 'aprendiz@example.test');
  assert.ok(learner);
  const removed = await post('/api/admin/users/delete', { id: learner.id }, adminCookie);
  assert.equal(removed.response.status, 200);
  const revoked = await fetch(`${base}/api/me`, { headers: { cookie: userCookie } });
  assert.equal(revoked.status, 401);
});
