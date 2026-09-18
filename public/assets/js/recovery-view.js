export async function mountRecovery(getRecovery) {
  const form = document.querySelector('[data-recovery-form]');
  const fields = form.querySelector('fieldset');
  const status = form.querySelector('[data-recovery-status]');
  let recover;
  let busy = false;
  let sent = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!recover || busy || sent || !form.reportValidity()) return;
    busy = true; fields.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Solicitando instrucciones de recuperación…';
    try {
      const result = await recover(form.elements.recovery_email.value);
      if (result) { status.textContent = result.message; sent = result.ok; }
    } catch { status.textContent = 'No se pudo solicitar el enlace. Inténtalo nuevamente más tarde.'; }
    finally { busy = false; fields.disabled = sent; form.setAttribute('aria-busy', 'false'); }
  });
  try { recover = await getRecovery(); fields.disabled = false; }
  catch { status.textContent = 'No se pudo cargar la recuperación. Revisa tu conexión y recarga la página.'; }
}
