import { EDITABLE_PROFILE_FIELDS, editMessage } from './profile-edit-state.js';

export async function mountProfileEdit(getEditor, getSession) {
  const form = document.querySelector('[data-profile-edit]');
  const open = document.querySelector('[data-edit-open]');
  const cancel = form.querySelector('[data-edit-cancel]');
  const status = document.querySelector('[data-edit-status]');
  const fields = form.querySelector('fieldset');
  let editor, session, baseline, busy = false, owner = null;
  function close() { form.hidden = true; form.reset(); baseline = null; open.hidden = false; }
  function lock(value) { busy = value; fields.disabled = value; open.disabled = value || !editor || session?.getState().status !== 'authenticated'; form.setAttribute('aria-busy', String(value)); }
  open.addEventListener('click', async () => {
    if (!editor || busy) return;
    owner = session.getState().profile?.uid;
    lock(true); status.textContent = 'Cargando datos actuales…';
    try {
      const values = await editor.load();
      if (!owner || owner !== session.getState().profile?.uid) return;
      baseline = values;
      for (const field of EDITABLE_PROFILE_FIELDS) form.elements[field].value = values[field];
      form.hidden = false;
      open.hidden = true;
      status.textContent = '';
      fields.disabled = false;
      form.elements.nombre.focus();
    } catch (error) { status.textContent = editMessage(error); }
    finally { lock(false); }
  });
  cancel.addEventListener('click', async () => {
    if (busy) return;
    close(); lock(true); status.textContent = '';
    try { await session.refresh(); } finally { lock(false); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !baseline || !form.reportValidity()) return;
    const submittedOwner = owner;
    if (!submittedOwner || submittedOwner !== session.getState().profile?.uid) { close(); return; }
    const changes = {};
    for (const field of EDITABLE_PROFILE_FIELDS) if (form.elements[field].value !== baseline[field]) changes[field] = form.elements[field].value;
    lock(true); status.textContent = 'Guardando…';
    try {
      const result = await editor.save(changes);
      if (submittedOwner !== session.getState().profile?.uid) return;
      close();
      await session.refresh();
      if (submittedOwner === session.getState().profile?.uid) status.textContent = result?.changed ? 'Perfil actualizado correctamente.' : 'No había cambios para guardar.';
    } catch (error) { if (submittedOwner === session.getState().profile?.uid) status.textContent = editMessage(error); }
    finally { lock(false); }
  });
  window.addEventListener('pagehide', () => { close(); status.textContent = ''; });
  try {
    [editor, session] = await Promise.all([getEditor(), getSession()]);
    session.subscribe(state => {
      if (state.status !== 'authenticated' || (owner && owner !== state.profile.uid)) { close(); status.textContent = ''; owner = null; }
      open.disabled = busy || state.status !== 'authenticated';
    });
  } catch { status.textContent = 'No se pudo cargar la edición. Revisa tu conexión y recarga la página.'; }
}
