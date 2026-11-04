#!/usr/bin/env node
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const FILES = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/icon.svg', ['icon.svg', 'image/svg+xml']],
  ['/manifest.webmanifest', ['manifest.webmanifest', 'application/manifest+json; charset=utf-8']],
]);

function sendError(res, status, message) {
  const body = JSON.stringify({ error: message });
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendError(res, 405, 'Método no permitido.');

  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { return sendError(res, 400, 'Ruta inválida.'); }

  const entry = FILES.get(pathname);
  if (!entry) return sendError(res, 404, 'No encontrado.');
  try {
    const body = fs.readFileSync(path.join(ROOT, entry[0]));
    res.writeHead(200, {
      'content-type': entry[1],
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
    });
    if (req.method === 'HEAD') res.end();
    else res.end(body);
  } catch {
    sendError(res, 500, 'No se pudo servir la página.');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Enseñar C disponible para cualquiera en http://localhost:${PORT}`);
});
