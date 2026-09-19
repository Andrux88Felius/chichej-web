import { accountDetails } from './account-data.js';
// Lógica independiente del DOM: el SDK administra toda la persistencia.
export function authError(code) {
  return Object.assign(new Error('Authentication unavailable'), { code });
}

export function isBlocked(profile) {
  const value = profile.bloqueado;
  if (value === undefined || value === null || value === '' || value === false || value === 0 || value === '0') return false;
  if (typeof value === 'string' && value.trim().toLowerCase() === 'false') return false;
  return true;
}

export function profileForUser(user, profile) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(user.uid) || !profile || typeof profile !== 'object' || Array.isArray(profile)) throw authError('profile-unavailable');
  if (isBlocked(profile)) throw authError('account-blocked');
  const role = typeof profile.rol === 'string' ? profile.rol.trim() : '';
  if (!['cliente', 'admin', 'admin_principal'].includes(role)) throw authError('role-not-allowed');
  const email = user.email || (typeof profile.email === 'string' ? profile.email : '');
  const name = typeof profile.nombre === 'string' ? profile.nombre.trim() : '';
  return Object.freeze({ uid: user.uid, name: name || email || 'Usuario', email, role, details: accountDetails(profile) });
}

export function errorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-email': return 'Introduce un correo electrónico válido.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'No pudimos iniciar sesión. Revisa tu correo y contraseña.';
    case 'auth/too-many-requests': return 'Se realizaron demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
    case 'auth/network-request-failed': return 'No se pudo conectar. Revisa tu conexión e inténtalo nuevamente.';
    case 'auth/user-disabled': return 'Esta cuenta no está disponible. Comunícate con administración.';
    case 'account-blocked': return 'Tu cuenta se encuentra bloqueada. Comunícate con administración.';
    case 'profile-unavailable':
    case 'role-not-allowed': return 'Tu perfil no está disponible para acceder. Comunícate con administración.';
    case 'profile-read-failed': return 'No pudimos verificar tu perfil. Revisa tu conexión o comunícate con administración.';
    case 'logout-failed': return 'No se pudo completar el cierre de sesión. Vuelve a pulsar Cerrar sesión.';
    default: return 'No se pudo iniciar sesión. Inténtalo nuevamente más tarde.';
  }
}

export function createAuthState(adapter) {
  let state = Object.freeze({ status: 'loading', profile: null, message: '' });
  let epoch = 0;
  let busy = false;
  let denial = '';
  const listeners = new Set();
  function publish(status, profile = null, message = '') {
    state = Object.freeze({ status, profile, message });
    for (const listener of listeners) listener(state);
  }
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  async function observe(user) {
    const current = ++epoch;
    if (!user) {
      publish(denial ? 'error' : 'anonymous', null, denial);
      resolveReady();
      return;
    }
    publish('checking');
    try {
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(user.uid)) throw authError('profile-unavailable');
      let profile;
      try { profile = await adapter.readProfile(user.uid); }
      catch { throw authError('profile-read-failed'); }
      if (current !== epoch) return;
      const validated = profileForUser(user, profile);
      denial = '';
      publish('authenticated', validated);
    } catch (error) {
      if (current !== epoch) return;
      denial = errorMessage(error);
      publish('checking', null, denial);
      try { await adapter.signOut(); }
      catch { if (current === epoch) publish('logout-error', null, errorMessage(authError('logout-failed'))); }
      if (current === epoch && state.status !== 'logout-error') publish('error', null, denial);
    } finally { resolveReady(); }
  }
  adapter.onChange(observe);
  function waitForResult() {
    if (!['loading', 'checking', 'signing-in'].includes(state.status)) return Promise.resolve(state);
    return new Promise(resolve => {
      const listener = next => {
        if (['loading', 'checking', 'signing-in'].includes(next.status)) return;
        listeners.delete(listener);
        resolve(next);
      };
      listeners.add(listener);
    });
  }
  return {
    ready,
    getState: () => state,
    subscribe(listener) { listeners.add(listener); listener(state); return () => listeners.delete(listener); },
    async login(email, password, remember) {
      if (busy) return;
      busy = true;
      try {
        await ready;
        if (!['anonymous', 'error'].includes(state.status)) return;
        denial = '';
        publish('signing-in');
        await adapter.signIn(email, password, remember);
        await waitForResult();
      } catch (error) { publish('error', null, errorMessage(error)); }
      finally { busy = false; }
    },
    async logout() {
      if (busy) return false;
      busy = true;
      ++epoch; // Ignorar lecturas de perfil iniciadas antes de cerrar sesión.
      denial = '';
      publish('checking');
      try { await adapter.signOut(); publish('anonymous'); return true; }
      catch { publish('logout-error', null, errorMessage(authError('logout-failed'))); return false; }
      finally { busy = false; }
    },
  };
}
