#!/usr/bin/env node
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');

const ROOT = __dirname;
const PRIVATE = process.env.APP_PRIVATE_DIR || path.join(ROOT, '.private');
const DB_FILE = path.join(PRIVATE, 'users.json');
const SETUP_FILE = path.join(PRIVATE, 'bootstrap-token');
const SETTINGS_FILE = path.join(PRIVATE, 'settings.json');
const OUTBOX_FILE = path.join(PRIVATE, 'signup-notifications.jsonl');
const PORT = Number(process.env.PORT || 4173);
const SESSION_MS = 12 * 60 * 60 * 1000;
const sessions = new Map();
const attempts = new Map();
fs.mkdirSync(PRIVATE, { recursive: true, mode: 0o700 });
try { fs.chmodSync(PRIVATE, 0o700); } catch {}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function readDb() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db || !Array.isArray(db.users)) throw new Error('Formato de base de usuarios inválido.');
    return db;
  } catch (error) {
    if (error.code === 'ENOENT') return { users: [] };
    throw new Error('No se pudo leer la base local de cuentas; no se modificó para proteger los datos.');
  }
}
function saveDb(db) {
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.chmodSync(tmp, 0o600);
  fs.renameSync(tmp, DB_FILE);
}
function settings() { return readJson(SETTINGS_FILE, { notifyTo: process.env.MAIL_NOTIFY_TO ?? '' }); }
function ensureSetupToken() {
  const db = readDb();
  if (!db.users.some(user => user.role === 'admin') && !fs.existsSync(SETUP_FILE)) {
    fs.writeFileSync(SETUP_FILE, crypto.randomBytes(24).toString('base64url'), { mode: 0o600 });
  }
}
ensureSetupToken();
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ notifyTo: process.env.MAIL_NOTIFY_TO ?? '' }, null, 2), { mode: 0o600 });
  try { fs.chmodSync(SETTINGS_FILE, 0o600); } catch {}
}

function sendJson(res, status, value, headers = {}) {
  const body = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(body);
}
function cookieOptions(req, maxAge = SESSION_MS / 1000) {
  const secure = req.headers['x-forwarded-proto'] === 'https';
  return `HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
function sessionUser(req) {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)c_school_session=([A-Za-z0-9_-]+)/);
  if (!match) return null;
  const key = crypto.createHash('sha256').update(match[1]).digest('hex');
  const session = sessions.get(key);
  if (!session || session.expires < Date.now()) { sessions.delete(key); return null; }
  const user = readDb().users.find(item => item.id === session.userId);
  return user || null;
}
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }; }
function makeSession(res, req, user) {
  const token = crypto.randomBytes(32).toString('base64url');
  const key = crypto.createHash('sha256').update(token).digest('hex');
  sessions.set(key, { userId: user.id, expires: Date.now() + SESSION_MS });
  res.setHeader('set-cookie', `c_school_session=${token}; ${cookieOptions(req)}`);
}
function revokeUserSessions(userId) {
  for (const [key, session] of sessions) if (session.userId === userId) sessions.delete(key);
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) => err ? reject(err) : resolve({ salt, hash: key.toString('hex') })));
}
async function checkPassword(password, user) {
  const actual = await hashPassword(password, user.salt);
  const a = Buffer.from(actual.hash, 'hex'); const b = Buffer.from(user.passwordHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function safeEqual(left, right) {
  const a = crypto.createHash('sha256').update(String(left)).digest();
  const b = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(a, b);
}
function rateLimited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now(); const prior = attempts.get(ip);
  if (!prior || now - prior.since > 15 * 60 * 1000) { attempts.set(ip, { since: now, count: 1 }); return false; }
  prior.count += 1;
  if (attempts.size > 1000) for (const [key, value] of attempts) if (now - value.since > 15 * 60 * 1000) attempts.delete(key);
  return prior.count > 12;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''; let length = 0;
    req.on('data', chunk => { length += chunk.length; if (length > 16384) { reject(Object.assign(new Error('Solicitud demasiado grande'), { status: 413 })); req.destroy(); return; } data += chunk.toString('utf8'); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(Object.assign(new Error('JSON inválido'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function emailValid(email) { return /^[^\s@]{1,80}@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email); }
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers.host;
  return origin === `https://${host}` || origin === `http://${host}`;
}
function escapedAppleScript(value) { return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n'); }
function mailNotification(user) {
  const to = settings().notifyTo;
  const event = { id: crypto.randomUUID(), createdAt: user.createdAt, name: user.name, email: user.email, status: to ? 'pending' : 'needs-recipient' };
  fs.appendFileSync(OUTBOX_FILE, JSON.stringify(event) + '\n', { mode: 0o600 });
  if (process.env.APP_DISABLE_MAIL === '1' || !to || !emailValid(to)) return Promise.resolve(false);
  const subject = escapedAppleScript('Nueva cuenta en C / escuela');
  const content = escapedAppleScript(`Se creó una cuenta.\n\nNombre: ${user.name}\nCorreo: ${user.email}\nFecha: ${user.createdAt}\n\nLa contraseña no se incluye en este aviso.`);
  const recipient = escapedAppleScript(to);
  const script = `tell application "Mail"\nset m to make new outgoing message with properties {subject:"${subject}", content:"${content}", visible:false}\ntell m to make new to recipient at end of to recipients with properties {address:"${recipient}"}\nsend m\nend tell`;
  return new Promise(resolve => execFile('/usr/bin/osascript', ['-e', script], { timeout: 20000 }, error => {
    try {
      const lines = fs.readFileSync(OUTBOX_FILE, 'utf8').trimEnd().split('\n');
      const index = lines.findIndex(line => JSON.parse(line).id === event.id);
      if (index >= 0) {
        const updated = JSON.parse(lines[index]); updated.status = error ? 'failed' : 'submitted-to-mail'; lines[index] = JSON.stringify(updated);
        fs.writeFileSync(OUTBOX_FILE, lines.join('\n') + '\n', { mode: 0o600 }); fs.chmodSync(OUTBOX_FILE, 0o600);
      }
    } catch {}
    resolve(!error);
  }));
}
function protectedStatic(req, res, pathname) {
  if (pathname === '/app.js' && !sessionUser(req)) return sendJson(res, 401, { error: 'Inicia sesión para acceder al curso.' });
  const allowed = new Set(['/','/index.html','/style.css','/auth.js','/app.js','/icon.svg','/manifest.webmanifest']);
  if (!allowed.has(pathname)) return sendJson(res, 404, { error: 'No encontrado.' });
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  const content = fs.readFileSync(path.join(ROOT, file));
  const type = file.endsWith('.css') ? 'text/css; charset=utf-8' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.webmanifest') ? 'application/manifest+json' : 'text/html; charset=utf-8';
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'" });
  if (req.method === 'HEAD') res.end(); else res.end(content);
}

const server = http.createServer(async (req, res) => {
  let url; let pathname;
  try { url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); pathname = decodeURIComponent(url.pathname); }
  catch { return sendJson(res, 400, { error: 'Ruta inválida.' }); }
  if (req.method === 'GET' && pathname.startsWith('/api/')) {
    if (pathname === '/api/status') {
      const db = readDb(); return sendJson(res, 200, { setupPending: !db.users.some(user => user.role === 'admin'), notificationConfigured: Boolean(settings().notifyTo) });
    }
    if (pathname === '/api/me') {
      const user = sessionUser(req); return user ? sendJson(res, 200, { user: publicUser(user) }) : sendJson(res, 401, { error: 'Inicia sesión.' });
    }
    const user = sessionUser(req);
    if (!user) return sendJson(res, 401, { error: 'Inicia sesión.' });
    if (pathname === '/api/admin/users' || pathname === '/api/admin/notifications') {
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Solo la administración puede ver esta información.' });
      if (pathname === '/api/admin/users') return sendJson(res, 200, { users: readDb().users.map(publicUser) });
      const events = fs.existsSync(OUTBOX_FILE) ? fs.readFileSync(OUTBOX_FILE, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)).reverse() : [];
      return sendJson(res, 200, { configured: Boolean(settings().notifyTo), notifications: events.slice(0,100) });
    }
    return sendJson(res, 404, { error: 'No encontrado.' });
  }
  if (req.method === 'POST' && pathname.startsWith('/api/')) {
    if (!sameOrigin(req)) return sendJson(res, 403, { error: 'Origen no permitido.' });
    if (['/api/auth/login','/api/auth/register','/api/auth/setup-admin'].includes(pathname) && rateLimited(req)) return sendJson(res, 429, { error: 'Demasiados intentos. Espera 15 minutos.' });
    try {
      if (pathname === '/api/auth/logout') {
        const user = sessionUser(req);
        if (user) revokeUserSessions(user.id);
        res.setHeader('set-cookie', `c_school_session=; ${cookieOptions(req, 0)}`);
        return sendJson(res, 200, { ok: true });
      }
      if (pathname === '/api/auth/login') {
        const body = await readBody(req); const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
        const user = readDb().users.find(item => item.email.toLowerCase() === email);
        if (password.length > 200 || !user || !(await checkPassword(password, user))) return sendJson(res, 401, { error: 'Correo o contraseña incorrectos.' });
        makeSession(res, req, user); return sendJson(res, 200, { user: publicUser(user) });
      }
      if (pathname === '/api/auth/setup-admin' || pathname === '/api/auth/register') {
        const body = await readBody(req); const db = readDb(); const hasAdmin = db.users.some(user => user.role === 'admin');
        const setup = pathname.endsWith('setup-admin');
        if (setup) {
          if (hasAdmin || !fs.existsSync(SETUP_FILE)) return sendJson(res, 409, { error: 'La configuración inicial ya terminó.' });
          const expected = fs.readFileSync(SETUP_FILE, 'utf8').trim();
          if (!safeEqual(body.token || '', expected)) return sendJson(res, 403, { error: 'La clave inicial no es válida.' });
        } else if (!hasAdmin) return sendJson(res, 403, { error: 'Primero configura la cuenta administradora.' });
        const name = String(body.name || '').trim(); const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
        if (name.length < 2 || name.length > 40) return sendJson(res, 400, { error: 'El nombre debe tener entre 2 y 40 caracteres.' });
        if (!emailValid(email) || email.length > 254) return sendJson(res, 400, { error: 'Escribe un correo válido.' });
        if (password.length < 12 || password.length > 200) return sendJson(res, 400, { error: 'Usa una contraseña de 12 a 200 caracteres.' });
        const credentials = await hashPassword(password);
        const latest = readDb();
        if (setup) {
          if (latest.users.some(user => user.role === 'admin') || !fs.existsSync(SETUP_FILE) || !safeEqual(body.token || '', fs.readFileSync(SETUP_FILE, 'utf8').trim())) return sendJson(res, 409, { error: 'La configuración inicial ya terminó o la clave ya se usó.' });
        } else if (!latest.users.some(user => user.role === 'admin')) return sendJson(res, 403, { error: 'Primero configura la cuenta administradora.' });
        if (latest.users.some(item => item.email.toLowerCase() === email)) return sendJson(res, 409, { error: 'Ya existe una cuenta con ese correo.' });
        const user = { id: crypto.randomUUID(), name, email, salt: credentials.salt, passwordHash: credentials.hash, role: setup ? 'admin' : 'user', createdAt: new Date().toISOString() };
        latest.users.push(user); saveDb(latest);
        let notificationSent = null;
        if (setup) {
          try { fs.unlinkSync(SETUP_FILE); } catch {}
          const config = settings(); if (!config.notifyTo) config.notifyTo = email;
          fs.writeFileSync(SETTINGS_FILE, JSON.stringify(config, null, 2), { mode: 0o600 }); fs.chmodSync(SETTINGS_FILE, 0o600);
        }
        else notificationSent = await mailNotification(user);
        makeSession(res, req, user); return sendJson(res, 201, { user: publicUser(user), notificationConfigured: Boolean(settings().notifyTo), notificationSent });
      }
      if (pathname === '/api/admin/users/delete') {
        const admin = sessionUser(req); if (!admin) return sendJson(res, 401, { error: 'Inicia sesión.' });
        if (admin.role !== 'admin') return sendJson(res, 403, { error: 'Solo la administración puede borrar cuentas.' });
        const body = await readBody(req); const db = readDb(); const target = db.users.find(item => item.id === body.id);
        if (!target) return sendJson(res, 404, { error: 'La cuenta ya no existe.' });
        if (target.id === admin.id) return sendJson(res, 400, { error: 'No puedes borrar la cuenta con la que administras el sitio.' });
        if (target.role === 'admin' && db.users.filter(item => item.role === 'admin').length <= 1) return sendJson(res, 400, { error: 'El sitio debe conservar una cuenta administradora.' });
        db.users = db.users.filter(item => item.id !== target.id); saveDb(db); revokeUserSessions(target.id);
        return sendJson(res, 200, { ok: true });
      }
      return sendJson(res, 404, { error: 'No encontrado.' });
    } catch (error) {
      return sendJson(res, error.status || 500, { error: error.status ? error.message : 'Ocurrió un error en el servidor.' });
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Método no permitido.' });
  try { protectedStatic(req, res, pathname); } catch { sendJson(res, 500, { error: 'No se pudo servir la página.' }); }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`C / escuela escuchando en http://localhost:${PORT}`);
});
