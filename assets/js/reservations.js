(() => {
  const messages = {
    invalid_reservation: 'Revisa la fecha, cantidad, teléfono, detalle y lugar.',
    invalid_transition: 'La reserva cambió de estado. Recarga la página.',
    not_owner: 'No tienes permiso para modificar esta reserva.',
    admin_not_authorized: 'Tu sesión administrativa cambió. Vuelve a iniciar sesión para continuar.',
    not_found: 'La reserva ya no existe.',
    reservation_unavailable: 'El servicio de reservas no está disponible en este momento.'
  };

  async function send(endpoint, payload) {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({ success: false, code: 'reservation_unavailable' }));
    if (!response.ok || !data.success) throw new Error(messages[data.code] || 'No fue posible completar la acción.');
    return data;
  }

  const actionLabels = { aceptar: 'Aceptar', rechazar: 'Rechazar', cancelar: 'Cancelar' };
  const stateLabels = { aceptada: 'Aceptada', rechazada: 'Rechazada', cancelada: 'Cancelada' };
  let lastFocused = null;
  const modal = document.createElement('dialog');
  modal.className = 'reservation-modal';
  modal.setAttribute('aria-labelledby', 'reservation-modal-title');
  modal.innerHTML = '<form method="dialog"><div class="reservation-modal__mark" aria-hidden="true">◇</div><h2 id="reservation-modal-title"></h2><p data-modal-copy></p><p class="form-status" data-modal-status role="status" aria-live="polite"></p><div class="reservation-modal__actions"><button class="button button--ghost" value="cancel" data-modal-cancel>Cancelar</button><button class="button button--primary" value="confirm" data-modal-confirm>Confirmar</button></div></form>';
  document.body.append(modal);
  modal.addEventListener('close', () => { lastFocused?.focus(); });
  modal.addEventListener('cancel', (event) => { event.preventDefault(); modal.close('cancel'); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.open) { event.preventDefault(); modal.close('cancel'); } });

  function confirmAction(action, operation) {
    const label = actionLabels[action] || 'Confirmar';
    lastFocused = document.activeElement;
    modal.querySelector('h2').textContent = `${label} reserva`;
    modal.querySelector('[data-modal-copy]').textContent = `¿Confirmas que deseas ${label.toLowerCase()} esta reserva?`;
    const status = modal.querySelector('[data-modal-status]');
    const confirm = modal.querySelector('[data-modal-confirm]');
    const cancel = modal.querySelector('[data-modal-cancel]');
    confirm.textContent = label; status.textContent = ''; confirm.disabled = false; cancel.disabled = false;
    modal.returnValue = ''; modal.showModal(); cancel.focus();
    const submit = async (event) => {
      if (event.submitter?.value !== 'confirm') return;
      event.preventDefault(); confirm.disabled = true; cancel.disabled = true; status.textContent = 'Procesando solicitud…';
      try { await operation(); modal.removeEventListener('submit', submit); modal.close('success'); }
      catch (error) { status.textContent = error.message; confirm.disabled = false; cancel.disabled = false; }
    };
    modal.addEventListener('submit', submit);
    modal.addEventListener('close', () => modal.removeEventListener('submit', submit), { once: true });
  }

  const createForm = document.querySelector('[data-reservation-create]');
  createForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!createForm.reportValidity()) return;
    const button = createForm.querySelector('button[type="submit"]');
    const status = createForm.querySelector('[data-reservation-status]');
    const form = new FormData(createForm);
    button.disabled = true; status.textContent = 'Enviando solicitud…';
    try {
      await send(createForm.dataset.endpoint, { csrf_token: form.get('csrf_token'), detalle: form.get('detalle'), fechaSolicitada: form.get('fechaSolicitada'), cantidadSolicitada: Number(form.get('cantidadSolicitada')), telefono: form.get('telefono'), lugarEvento: form.get('lugarEvento'), direccion: form.get('direccion'), referenciasLugar: form.get('referenciasLugar'), observaciones: form.get('observaciones') });
      status.textContent = 'Reserva creada. Actualizando el listado…'; window.location.reload();
    } catch (error) { status.textContent = error.message; button.disabled = false; }
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-reservation-cancel]');
    if (!button) return;
    const card = button.closest('article'); const status = card.querySelector('[data-reservation-status]');
    confirmAction('cancelar', async () => {
      await send(button.dataset.endpoint, { csrf_token: button.dataset.csrf, reservationId: button.dataset.reservationId });
      card.dataset.status = 'cancelada'; card.querySelector('[data-reservation-state-label]').textContent = 'Cancelada';
      button.remove(); status.textContent = 'Reserva cancelada correctamente.';
    });
  });

  const admin = document.querySelector('[data-reservation-admin]');
  admin?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-reservation-admin-action]');
    if (!button) return;
    const action = button.dataset.reservationAdminAction;
    const article = button.closest('article'); const status = article.querySelector('[data-reservation-status]');
    confirmAction(action, async () => {
      const data = await send(admin.dataset.endpoint, { csrf_token: admin.dataset.csrf, reservationId: button.dataset.reservationId, action });
      article.dataset.status = data.state; article.querySelector('[data-reservation-state-label]').textContent = stateLabels[data.state] || data.state;
      const actions = article.querySelector('.reservation-action-buttons'); actions.replaceChildren();
      if (data.state === 'aceptada') {
        const cancelButton = document.createElement('button'); cancelButton.type = 'button'; cancelButton.className = 'button button--ghost'; cancelButton.dataset.reservationAdminAction = 'cancelar'; cancelButton.dataset.reservationId = button.dataset.reservationId; cancelButton.textContent = 'Cancelar'; actions.append(cancelButton);
      } else { const none = document.createElement('span'); none.textContent = 'Sin acciones disponibles'; actions.append(none); }
      status.textContent = `Reserva ${stateLabels[data.state]?.toLowerCase() || 'actualizada'} correctamente.`;
    });
  });
})();
