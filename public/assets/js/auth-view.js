export async function mountAuthUI(getSession, navigate = url => window.location.assign(url)) {
  const form = document.querySelector('[data-login-form]');
  const status = document.querySelector('[data-auth-status]');
  const submit = form?.querySelector('[type="submit"]');
  let session;
  let submitting = false;

  function render(state) {
    const authenticated = state.status === 'authenticated';
    const pending = ['loading', 'checking', 'signing-in'].includes(state.status);
    const canLogout = authenticated || state.status === 'logout-error';
    document.querySelectorAll('[data-auth-login]').forEach(element => { element.hidden = canLogout; });
    document.querySelectorAll('[data-auth-account]').forEach(element => { element.hidden = !canLogout; });
    document.querySelectorAll('[data-auth-session-only]').forEach(element => { element.hidden = !authenticated; });
    document.querySelectorAll('[data-account-link]').forEach(element => { element.hidden = !authenticated; });
    document.querySelectorAll('[data-auth-name]').forEach(element => { element.textContent = state.profile?.name || ''; });
    document.querySelectorAll('[data-auth-role]').forEach(element => { element.textContent = state.profile?.role || ''; });
    document.querySelectorAll('[data-auth-logout]').forEach(element => { element.disabled = pending; });
    if (form) {
      form.hidden = canLogout;
      form.setAttribute('aria-busy', String(pending));
      form.querySelector('[data-login-fields]').disabled = pending;
      submit.disabled = pending;
      submit.textContent = pending ? 'Verificando sesión…' : 'Iniciar sesión';
      if (authenticated) form.reset();
    }
    if (status) status.textContent = state.message || (form && pending ? 'Verificando sesión…' : form && authenticated ? 'Sesión iniciada. Puedes navegar por la web pública.' : '');
  }

  // Impedir un envío HTML nativo incluso si el CDN todavía no responde.
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !session || !form.reportValidity()) return;
    submitting = true;
    try { await session.login(form.elements.email.value.trim(), form.elements.password.value, form.elements.remember.checked); }
    finally {
      form.elements.password.value = '';
      form.elements.password.type = 'password';
      const toggle = form.querySelector('[data-password-toggle]');
      toggle.textContent = 'Ver';
      toggle.setAttribute('aria-label', 'Mostrar contraseña');
      toggle.setAttribute('aria-pressed', 'false');
      submitting = false;
    }
  });

  document.querySelectorAll('[data-auth-logout]').forEach(button => button.addEventListener('click', async () => {
    if (session && await session.logout()) navigate((document.body.dataset.publicRoot || '') + 'index.html');
  }));

  document.querySelector('[data-password-toggle]')?.addEventListener('click', event => {
    const input = form.elements.password;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    event.currentTarget.textContent = show ? 'Ocultar' : 'Ver';
    event.currentTarget.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    event.currentTarget.setAttribute('aria-pressed', String(show));
  });

  // Una página restaurada del historial debe volver a comprobar la sesión.
  window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
  render({ status: 'loading' });
  try { session = await getSession(); session.subscribe(render); }
  catch { render({ status: 'error', message: 'No se pudo cargar el acceso. Revisa tu conexión y recarga la página.' }); if (form) form.querySelector('[data-login-fields]').disabled = true; }

}
