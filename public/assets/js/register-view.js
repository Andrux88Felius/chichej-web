export async function mountRegistration(getRegistration, getSession) {
  const form = document.querySelector('[data-registration-form]');
  const fields = form.querySelector('fieldset');
  const status = document.querySelector('[data-registration-status]');
  const submit = form.querySelector('[type="submit"]');
  const retry = document.querySelector('[data-registration-retry]');
  const next = document.querySelector('[data-registration-next]');
  let service;
  let busy = false;
  let terminal = false;
  let partial = false;
  let sessionAllowed = false;
  window.addEventListener('beforeunload', event => {
    if (busy || partial) { event.preventDefault(); event.returnValue = ''; }
  });
  function render() {
    form.hidden = terminal || partial || !sessionAllowed;
    fields.disabled = busy || !service || !sessionAllowed;
    form.setAttribute('aria-busy', String(busy));
    submit.textContent = busy ? 'Creando cuenta…' : 'Crear cuenta';
    retry.hidden = !partial;
    retry.disabled = busy;
    next.hidden = !terminal;
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    status.textContent = 'Preparando tu cuenta y perfil. No cierres esta página mientras se completa la operación.';
    render();
    try {
      const operation = action();
      form.elements.password.value = '';
      form.elements.confirmation.value = '';
      const result = await operation;
      if (result) {
        status.textContent = result.message;
        partial = result.status === 'partial';
        terminal = ['success', 'conflict'].includes(result.status);
      }
    } catch { status.textContent = 'No se pudo confirmar la operación. Mantén esta página abierta y comunícate con administración.'; }
    finally {
      form.elements.password.value = '';
      form.elements.confirmation.value = '';
      form.elements.password.type = 'password';
      const toggle = form.querySelector('[data-register-toggle]');
      toggle.textContent = 'Ver'; toggle.setAttribute('aria-pressed', 'false'); toggle.setAttribute('aria-label', 'Mostrar contraseña');
      busy = false;
      render();
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!service || !sessionAllowed || busy || !form.reportValidity()) return;
    const input = { nombre: form.elements.nombre.value, email: form.elements.email.value, password: form.elements.password.value, confirmation: form.elements.confirmation.value };
    void run(() => service.register(input));
  });
  retry.addEventListener('click', () => { if (service) void run(() => service.retry()); });
  form.querySelector('[data-register-toggle]').addEventListener('click', event => {
    const show = form.elements.password.type === 'password';
    form.elements.password.type = show ? 'text' : 'password';
    event.currentTarget.textContent = show ? 'Ocultar' : 'Ver';
    event.currentTarget.setAttribute('aria-pressed', String(show));
    event.currentTarget.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
  try {
    const [registration, session] = await Promise.all([getRegistration(), getSession()]);
    service = registration;
    await session.ready;
    session.subscribe(state => {
      sessionAllowed = ['anonymous', 'error'].includes(state.status);
      if (!busy && !terminal && !partial) status.textContent = state.status === 'authenticated' ? 'Ya tienes una sesión abierta. Puedes continuar navegando.' : '';
      render();
    });
  } catch { status.textContent = 'No se pudo cargar el registro. Revisa tu conexión y recarga la página.'; }
}
