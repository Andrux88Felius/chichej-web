import { protectAccount } from './auth-guard.js';

export async function mountAccount(getSession, navigate = url => window.location.replace(url)) {
  const content = document.querySelector('[data-account-content]');
  const status = document.querySelector('[data-account-status]');
  const avatar = document.querySelector('[data-account-avatar]');
  const fallback = '../assets/img/avatares/invitado.png';
  const view = {
    clear() {
      content.hidden = true;
      document.querySelectorAll('[data-account-field], [data-auth-name], [data-auth-role]').forEach(element => { element.textContent = ''; });
      avatar.removeAttribute('src');
      avatar.hidden = true;
    },
    message(message) { status.textContent = message; },
    show(profile) {
      document.querySelectorAll('[data-auth-name]').forEach(element => { element.textContent = profile.name; });
      document.querySelectorAll('[data-auth-role]').forEach(element => { element.textContent = profile.role; });
      const values = { ...profile.details, email: profile.email || 'No registrado', rol: profile.role, estado: 'Activo' };
      document.querySelectorAll('[data-account-field]').forEach(element => { element.textContent = values[element.dataset.accountField] || 'No registrado'; });
      avatar.src = '../assets/img/avatares/' + profile.details.avatar;
      avatar.hidden = false;
      content.hidden = false;
      status.textContent = '';
    },
  };
  avatar.addEventListener('error', () => {
    if (avatar.getAttribute('src') !== fallback && avatar.hasAttribute('src')) avatar.src = fallback;
    else avatar.hidden = true;
  });
  window.addEventListener('pagehide', view.clear);
  window.addEventListener('pageshow', event => { if (event.persisted) { view.clear(); window.location.reload(); } });
  view.clear();
  try { protectAccount(await getSession(), view, navigate); }
  catch { view.message('No se pudo comprobar la sesión. Revisa tu conexión y recarga la página.'); }
}
