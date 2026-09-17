import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';

const configElement = document.querySelector('#firebase-public-config');
let runtimeConfig = null;

try {
  runtimeConfig = configElement ? JSON.parse(configElement.textContent) : null;
} catch (_) {
  runtimeConfig = null;
}

const loginForm = document.querySelector('[data-auth-form]');
const registrationForm = document.querySelector('[data-registration-form]');
const logoutForms = document.querySelectorAll('[data-firebase-logout]');

if (!runtimeConfig?.enabled || !runtimeConfig.client) {
  logoutForms.forEach((form) => form.removeAttribute('data-firebase-logout'));
} else {
  const app = initializeApp(runtimeConfig.client);
  const auth = getAuth(app);

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = loginForm.elements.email?.value.trim();
    const password = loginForm.elements.password?.value;
    const remember = loginForm.elements.remember?.checked === true;
    const endpoint = loginForm.dataset.sessionEndpoint;
    const submit = loginForm.querySelector('[data-auth-submit]');
    const submitLabel = loginForm.querySelector('[data-auth-submit-label]');
    const status = loginForm.querySelector('#auth-status');

    if (!email || !password || !endpoint || !submit || !status) return;

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    if (submitLabel) submitLabel.textContent = 'Verificando…';
    status.className = 'form-status';
    status.textContent = 'Validando tu cuenta de forma segura…';

    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload.success !== true || typeof payload.redirect !== 'string') {
        await signOut(auth).catch(() => {});
        if (payload.code === 'account_blocked') {
          throw new Error('blocked');
        }
        if (response.status === 401) throw new Error('invalid_credentials');
        throw new Error('server');
      }

      status.textContent = 'Acceso verificado. Redirigiendo…';
      window.location.assign(payload.redirect);
    } catch (error) {
      const code = error?.code || error?.message || '';
      status.className = 'form-status form-status--error';
      if (code === 'blocked') {
        status.textContent = 'Tu cuenta no está disponible para acceder en este momento.';
      } else if (code === 'invalid_credentials' || code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        status.textContent = 'El correo o la contraseña no son válidos.';
      } else if (code === 'auth/network-request-failed') {
        status.textContent = 'No pudimos conectar con Firebase. Revisa tu conexión e inténtalo nuevamente.';
      } else {
        status.textContent = 'No fue posible iniciar sesión en este momento. Inténtalo nuevamente.';
      }
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      if (submitLabel) submitLabel.textContent = 'Ingresar';
    }
  });

  registrationForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = registrationForm.elements.nombre?.value.trim();
    const email = registrationForm.elements.email?.value.trim();
    const password = registrationForm.elements.password?.value;
    const confirmation = registrationForm.elements.confirmation?.value;
    const csrfToken = registrationForm.elements.csrf_token?.value;
    const endpoint = registrationForm.dataset.profileEndpoint;
    const submit = registrationForm.querySelector('[data-registration-submit]');
    const status = registrationForm.querySelector('[data-registration-status]');
    if (!name || !email || !password || !csrfToken || !endpoint || !submit || !status) return;
    if (password !== confirmation) { status.className = 'form-status form-status--error'; status.textContent = 'Las contraseñas no coinciden.'; return; }
    submit.disabled = true; status.className = 'form-status'; status.textContent = 'Creando tu identidad CHICHEJ…';
    try {
      let credential;
      try { credential = await createUserWithEmailAndPassword(auth, email, password); }
      catch (error) {
        if (error?.code !== 'auth/email-already-in-use') throw error;
        credential = await signInWithEmailAndPassword(auth, email, password);
        status.textContent = 'Cuenta encontrada. Completando el perfil pendiente…';
      }
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch(endpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ csrf_token: csrfToken, idToken, nombre: name }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true || typeof payload.redirect !== 'string') {
        if (payload.code === 'profile_pending') throw new Error('profile_pending');
        throw new Error('server');
      }
      status.textContent = 'Cuenta preparada. Redirigiendo…'; window.location.assign(payload.redirect);
    } catch (error) {
      const code = error?.code || error?.message || '';
      status.className = 'form-status form-status--error';
      if (code === 'auth/invalid-email') status.textContent = 'El correo electrónico no es válido.';
      else if (code === 'auth/weak-password') status.textContent = 'La contraseña no cumple los requisitos de seguridad.';
      else if (code === 'auth/invalid-credential') status.textContent = 'La cuenta ya existe y la contraseña no coincide.';
      else if (code === 'profile_pending') status.textContent = 'La cuenta fue creada, pero el perfil no pudo completarse. Conserva estos datos y pulsa nuevamente para reintentar sin crear otra cuenta.';
      else if (code === 'auth/network-request-failed') status.textContent = 'No hay conexión con Firebase. Inténtalo nuevamente.';
      else status.textContent = 'No fue posible completar el registro en este momento.';
      submit.disabled = false;
    }
  });

  document.querySelectorAll('[data-password-recovery-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); const email = form.elements.recovery_email?.value.trim(); const status = form.querySelector('[data-password-recovery-status]'); const button = form.querySelector('button[type="submit"]');
      if (!email || !status || !button) return; button.disabled = true; status.className = 'form-status'; status.textContent = 'Solicitando enlace seguro…';
      try { await sendPasswordResetEmail(auth, email); status.textContent = 'Si el correo corresponde a una cuenta CHICHEJ, recibirás un enlace de recuperación.'; }
      catch (error) { status.className = 'form-status form-status--error'; status.textContent = error?.code === 'auth/invalid-email' ? 'El correo electrónico no es válido.' : error?.code === 'auth/network-request-failed' ? 'No hay conexión con Firebase. Inténtalo nuevamente.' : 'No fue posible solicitar el enlace en este momento.'; button.disabled = false; }
    });
  });

  logoutForms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      if (form.dataset.firebaseSubmitting === 'true') return;
      event.preventDefault();
      form.dataset.firebaseSubmitting = 'true';
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;

      // El cierre de la sesión PHP no debe quedar bloqueado si Firebase tarda
      // o la red se interrumpe. El endpoint conserva su validación CSRF.
      await Promise.race([
        signOut(auth).catch(() => {}),
        new Promise((resolve) => window.setTimeout(resolve, 2500)),
      ]);
      HTMLFormElement.prototype.submit.call(form);
    });
  });

  document.querySelectorAll('[data-password-reset]').forEach((button) => {
    button.addEventListener('click', async () => {
      const email = button.dataset.passwordResetEmail?.trim();
      const status = document.querySelector('[data-password-reset-status]');
      if (!email || !status || button.disabled) return;
      button.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Solicitando el enlace seguro…';
      try {
        await sendPasswordResetEmail(auth, email);
        status.textContent = 'Firebase envió el enlace de restablecimiento al correo de tu cuenta.';
      } catch (_) {
        status.className = 'form-status form-status--error';
        status.textContent = 'No fue posible enviar el enlace en este momento. Inténtalo nuevamente.';
        button.disabled = false;
      }
    });
  });
}
