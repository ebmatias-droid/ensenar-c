(() => {
  const $ = selector => document.querySelector(selector);
  let mode = 'login';
  let status = { setupPending: false, notificationConfigured: false };
  let loadedCourse = false;
  const fields = {
    name: $('#auth-name-wrap'), email: $('#auth-email-wrap'), password: $('#auth-password-wrap'), token: $('#auth-token-wrap')
  };
  function showMessage(text, kind = '') { const el = $('#auth-message'); el.textContent = text; el.className = `auth-message ${kind}`; }
  function setMode(next) {
    mode = next;
    const setup = mode === 'setup';
    const register = mode === 'register' || setup;
    fields.name.hidden = !register;
    fields.token.hidden = !setup;
    $('#auth-heading').innerHTML = setup ? 'Crea tu cuenta<br>administradora.' : register ? 'Tu cuenta,<br>tu avance.' : 'Tu espacio<br>para aprender.';
    $('#auth-kicker').textContent = setup ? 'CONFIGURACIÓN INICIAL' : register ? 'CREAR UNA CUENTA' : 'ACCESO PERSONAL';
    $('#auth-copy').textContent = setup ? 'Usa la clave inicial que aparece en la terminal donde iniciaste el servidor.' : register ? 'Crea una cuenta protegida para continuar tu ruta de C.' : 'Entra con tu correo y contraseña para continuar tu ruta de C.';
    $('#auth-submit').innerHTML = setup ? 'Crear administración <span>→</span>' : register ? 'Crear cuenta <span>→</span>' : 'Entrar <span>→</span>';
    $('#auth-password').autocomplete = register ? 'new-password' : 'current-password';
    $('#auth-switch').hidden = setup;
    $('#auth-switch').innerHTML = register ? '¿Ya tienes cuenta? <u>Entrar</u>' : '¿Primera vez? <u>Crear cuenta</u>';
    showMessage('');
  }
  async function request(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...options });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'No se pudo completar la solicitud.');
    return body;
  }
  function enter(user) {
    window.cSchoolUserId = user.id;
    window.cSchoolUserRole = user.role;
    $('#auth-screen').hidden = true;
    $('#app-shell').hidden = false;
    $('#signed-in-user').textContent = user.name;
    $('#admin-toggle').hidden = user.role !== 'admin';
    if (!loadedCourse) {
      loadedCourse = true;
      const script = document.createElement('script'); script.src = '/app.js'; script.onload = () => document.dispatchEvent(new Event('course-loaded')); document.body.append(script);
    }
  }
  function showMailAlert(text) {
    const alert = $('#mail-alert'); alert.textContent = text; alert.hidden = false;
  }
  async function setup() {
    status = await request('/api/status');
    if (status.setupPending) setMode('setup');
    else setMode('login');
    try { const result = await request('/api/me'); enter(result.user); } catch {}
  }
  $('#auth-switch').addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));
  $('#auth-form').addEventListener('submit', async event => {
    event.preventDefault(); const button = $('#auth-submit'); button.disabled = true; showMessage('');
    const body = { name: $('#auth-name').value, email: $('#auth-email').value, password: $('#auth-password').value, token: $('#auth-token').value };
    const endpoint = mode === 'setup' ? '/api/auth/setup-admin' : mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    try {
      const result = await request(endpoint, { method: 'POST', body: JSON.stringify(body) });
      enter(result.user);
      if (mode === 'register' && result.notificationSent === false) showMailAlert('La cuenta se creó, pero Apple Mail no pudo enviar el aviso. Revisa que Mail esté disponible.');
    } catch (error) { showMessage(error.message, 'error'); }
    finally { button.disabled = false; }
  });
  $('#logout-button').addEventListener('click', async () => { try { await request('/api/auth/logout', { method: 'POST', body: '{}' }); } catch {} location.reload(); });
  $('#admin-toggle').addEventListener('click', async () => { await loadAdmin(); $('#admin-overlay').classList.add('open'); $('#admin-overlay').setAttribute('aria-hidden', 'false'); });
  $('#close-admin').addEventListener('click', () => { $('#admin-overlay').classList.remove('open'); $('#admin-overlay').setAttribute('aria-hidden', 'true'); });
  $('#admin-overlay').addEventListener('click', event => { if (event.target.id === 'admin-overlay') $('#close-admin').click(); });
  async function loadAdmin() {
    const list = $('#admin-list'); const message = $('#admin-message'); list.innerHTML = '<div class="admin-loading">Cargando cuentas…</div>'; message.textContent = '';
    try {
      const [accounts, notices] = await Promise.all([request('/api/admin/users'), request('/api/admin/notifications')]);
      if (!notices.configured) message.textContent = 'Avisos por correo sin dirección receptora.';
      else if (notices.notifications.some(item => !['submitted-to-mail','sent'].includes(item.status))) message.textContent = 'Hay avisos que Apple Mail no pudo entregar. Revisa Mail en este equipo.';
      else message.textContent = 'Avisos de cuentas nuevos preparados por Apple Mail.';
      list.innerHTML = accounts.users.map(user => `<div class="admin-user"><div><b>${escapeText(user.name)}</b><span>${escapeText(user.email)} · ${user.role === 'admin' ? 'administración' : 'cuenta'} · ${new Date(user.createdAt).toLocaleDateString('es-MX')}</span></div>${user.role === 'admin' ? '<small class="admin-badge">ADMIN</small>' : `<button class="delete-user" data-id="${escapeText(user.id)}" data-name="${escapeText(user.name)}">Eliminar</button>`}</div>`).join('') || '<div class="admin-loading">No hay cuentas registradas.</div>';
      list.querySelectorAll('.delete-user').forEach(button => button.addEventListener('click', async () => {
        if (!confirm(`¿Eliminar la cuenta de ${button.dataset.name}? Sus sesiones se cerrarán de inmediato.`)) return;
        button.disabled = true;
        try { await request('/api/admin/users/delete', { method: 'POST', body: JSON.stringify({ id: button.dataset.id }) }); await loadAdmin(); }
        catch (error) { message.textContent = error.message; button.disabled = false; }
      }));
    } catch (error) { message.textContent = error.message; }
  }
  function escapeText(value) { const el = document.createElement('span'); el.textContent = value; return el.innerHTML; }
  setup().catch(() => showMessage('No se puede conectar con el servidor. Inicia la app con ensenamec.', 'error'));
})();
