import { authError } from './auth-state.js';

export function validateRegistration({ nombre, email, password, confirmation }) {
  const name = typeof nombre === 'string' ? nombre.trim() : '';
  const mail = typeof email === 'string' ? email.trim() : '';
  if ([...name].length < 2 || [...name].length > 80) throw authError('registration/name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw authError('auth/invalid-email');
  // Compatible con los requisitos actuales de Flutter; Firebase puede exigir más.
  if (typeof password !== 'string' || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) throw authError('auth/weak-password');
  if (password !== confirmation) throw authError('registration/confirmation');
  return { nombre: name, email: mail };
}

export function newCustomerProfile(nombre, email, timestamp) {
  return Object.freeze({ nombre, email, rol: 'cliente', avatarPath: 'assets/avatares/invitado.png', bloqueado: false, fechaRegistro: timestamp });
}

// Reejecutable por Firebase ante conflicto: nunca reemplaza datos existentes.
export function createOnly(current, profile) {
  return current === null ? profile : undefined;
}

export function matchesCreatedProfile(stored, expected) {
  return stored !== null && typeof stored === 'object' && !Array.isArray(stored)
    && Object.keys(stored).length === 6
    && ['nombre', 'email', 'rol', 'avatarPath', 'bloqueado'].every(key => stored[key] === expected[key])
    && Number.isFinite(stored.fechaRegistro) && stored.fechaRegistro > 0;
}

export function registrationMessage(error) {
  switch (error?.code) {
    case 'registration/name': return 'Introduce tu nombre completo, entre 2 y 80 caracteres.';
    case 'registration/confirmation': return 'Las contraseñas no coinciden.';
    case 'auth/invalid-email': return 'Introduce un correo electrónico válido.';
    case 'auth/email-already-in-use': return 'Ese correo ya está registrado. Inicia sesión o recupera tu contraseña.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements': return 'Usa al menos 8 caracteres con mayúscula, minúscula, número y símbolo. La contraseña debe cumplir también los requisitos de Firebase.';
    case 'auth/network-request-failed': return 'No se pudo confirmar la creación. Revisa tu conexión; si el correo ya quedó registrado, utiliza Iniciar sesión o comunícate con administración.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
    case 'registration/session-active': return 'Ya hay una sesión abierta. Ciérrala antes de registrar otra cuenta.';
    default: return 'No se pudo completar el registro. Inténtalo nuevamente más tarde.';
  }
}

export function createRegistration(adapter) {
  let busy = false;
  let pending = null; // Solo el usuario devuelto por createUser en esta ejecución; sin contraseña.
  let completed = false;
  const result = (status, message) => ({ status, message });

  async function finish(password) {
    const attempt = pending;
    let stored;
    try { stored = await adapter.createProfile(attempt.user, attempt.profile); }
    catch (error) {
      // Solo un rechazo definitivo permite rollback. Una caída de red puede ocultar un commit.
      const denied = String(error?.code).toLowerCase().replaceAll('_', '-').split('/').pop() === 'permission-denied';
      if (denied && !attempt.uncertain) {
        try {
          await adapter.deleteNewUser(attempt.user);
          pending = null;
          return result('error', 'No se pudo crear el perfil por falta de permisos. Se anuló la cuenta recién creada. Comunícate con administración antes de reintentar.');
        } catch { /* La eliminación también puede tener un resultado incierto. */ }
      }
      attempt.uncertain = true; // Un reintento posterior nunca debe borrar una cuenta con un posible perfil confirmado.
      return result('partial', 'La cuenta se creó, pero no se pudo confirmar su perfil. Mantén esta página abierta y pulsa Reintentar perfil cuando tengas conexión. Si cierras la página o el problema continúa, comunícate con administración; no crees otra cuenta.');
    }
    if (!matchesCreatedProfile(stored, attempt.profile)) {
      pending = null;
      completed = true;
      await adapter.release(attempt.user).catch(() => {});
      return result('conflict', 'Existe un perfil diferente y no se modificó. No pudimos completar este registro. Comunícate con administración.');
    }
    pending = null;
    completed = true;
    let active = false;
    try { if (password !== undefined) active = await adapter.activate(attempt.user, password); }
    catch { /* Auth y perfil ya existen; nunca se revierten por un fallo posterior de acceso. */ }
    finally { await adapter.release(attempt.user).catch(() => {}); }
    return result('success', active ? 'Cuenta creada. Tu sesión de cliente está activa.' : 'Cuenta y perfil creados. Puedes iniciar sesión con tu correo y contraseña.');
  }

  return {
    async register(input) {
      if (busy || pending || completed) return null;
      busy = true;
      try {
        const data = validateRegistration(input);
        if (!await adapter.canRegister()) throw authError('registration/session-active');
        const user = await adapter.createUser(data.email, input.password);
        // El adaptador nunca permite escribir con un UID elegido por el formulario.
        pending = { user, profile: newCustomerProfile(data.nombre, user.email, adapter.timestamp()), uncertain: false };
        return await finish(input.password);
      } catch (error) { return result('error', registrationMessage(error)); }
      finally { busy = false; }
    },
    async retry() {
      if (busy || !pending) return null;
      busy = true;
      try { return await finish(); }
      finally { busy = false; }
    },
  };
}
