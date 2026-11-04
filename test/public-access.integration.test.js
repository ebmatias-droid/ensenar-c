const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');

const root = require('node:path').resolve(__dirname, '..');
let child; let base;

function listenOnFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port;
      probe.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('El servidor de integración no inició a tiempo.');
}

before(async () => {
  const port = await listenOnFreePort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  await waitForServer();
});

after(() => {
  if (child && child.exitCode === null) child.kill('SIGTERM');
});

test('cualquier visitante puede abrir el curso y sus recursos sin cuenta ni cookies', async () => {
  for (const route of ['/', '/index.html', '/app.js', '/style.css', '/icon.svg', '/manifest.webmanifest']) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, `${route} debe ser público`);
    assert.equal(response.headers.get('set-cookie'), null);
  }
  const course = await fetch(`${base}/app.js`);
  assert.match(await course.text(), /const chapters=/);
});

test('las rutas de cuentas y contraseñas ya no existen', async () => {
  for (const route of ['/api/status', '/api/me', '/api/auth/login', '/api/auth/register', '/api/auth/setup-admin', '/api/admin/users']) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 404, `${route} debe estar desactivada`);
  }
  const html = await (await fetch(base)).text();
  assert.doesNotMatch(html, /auth\.js|auth-form|auth-password|auth-token|Iniciar sesión|Entrar/);
});

test('HEAD y métodos no permitidos tienen respuestas correctas', async () => {
  const head = await fetch(`${base}/app.js`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const post = await fetch(`${base}/app.js`, { method: 'POST' });
  assert.equal(post.status, 405);
});
