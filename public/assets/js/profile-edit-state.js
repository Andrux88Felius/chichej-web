import { authError } from './auth-state.js';
import { avatarFile } from './account-data.js';

export const EDITABLE_PROFILE_FIELDS = Object.freeze(['nombre', 'telefono', 'avatarPath']);

export function editableValues(profile) {
  return { nombre: typeof profile.nombre === 'string' ? profile.nombre : '',
    telefono: typeof profile.telefono === 'string' || (typeof profile.telefono === 'number' && Number.isFinite(profile.telefono)) ? String(profile.telefono) : '',
    avatarPath: 'assets/avatares/' + avatarFile(profile.avatarPath) };
}

export function allowedChanges(input) {
  const payload = {};
  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (!Object.hasOwn(input, field)) continue;
    if (typeof input[field] !== 'string') throw authError('edit/invalid');
    const value = input[field].trim();
    if (field === 'nombre' && ([...value].length < 2 || [...value].length > 80)) throw authError('edit/name');
    if (field === 'telefono' && ([...value].length > 20 || (value !== '' && !/^[0-9+() -]+$/.test(value)))) throw authError('edit/phone');
    if (field === 'avatarPath' && !/^assets\/avatares\/(?:avatar[1-9]|invitado)\.png$/.test(value)) throw authError('edit/avatar');
    payload[field] = value;
  }
  return payload;
}

export function editMessage(error) {
  switch (String(error?.code || '').toLowerCase().replaceAll('_', '-')) {
    case 'edit/name': return 'El nombre debe tener entre 2 y 80 caracteres.';
    case 'edit/phone': return 'El teléfono admite hasta 20 caracteres: números, +, paréntesis, espacios y guiones.';
    case 'edit/avatar': return 'Selecciona un avatar del catálogo CHICHEJ.';
    case 'permission-denied': case 'database/permission-denied': return 'No tienes permiso para guardar estos cambios. Comunícate con administración.';
    case 'account-blocked': return 'Tu cuenta está bloqueada. No se guardaron cambios.';
    case 'profile-unavailable': return 'No se encontró tu perfil. No se guardaron cambios.';
    case 'auth/user-token-expired': case 'auth/invalid-user-token': case 'auth/requires-recent-login':
    case 'edit/session': return 'La sesión cambió o terminó. Vuelve a iniciar sesión.';
    default: return 'No se pudo confirmar el guardado. Revisa tu conexión y recarga el perfil antes de reintentar; el cambio podría haberse aplicado.';
  }
}

export function createProfileEditor(adapter) {
  let busy = false;
  return {
    load: () => adapter.load(),
    async save(input) {
      if (busy) return null;
      busy = true;
      try {
        const payload = allowedChanges(input);
        if (!Object.keys(payload).length) return { changed: false };
        await adapter.save(payload);
        return { changed: true };
      } finally { busy = false; }
    },
  };
}
