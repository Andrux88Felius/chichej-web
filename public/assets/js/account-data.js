const text = value => typeof value === 'string' && value.trim() ? value.trim() : 'No registrado';
export function avatarFile(value) {
  const file = typeof value === 'string' ? value.split(/[\\/]/).pop() : '';
  return /^(?:avatar[1-9]|invitado)\.png$/.test(file) ? file : 'invitado.png';
}
export function accountDetails(profile) {
  const timestamp = typeof profile.fechaRegistro === 'number' || (typeof profile.fechaRegistro === 'string' && /^\d+$/.test(profile.fechaRegistro)) ? Number(profile.fechaRegistro) : NaN;
  const date = timestamp > 0 && timestamp <= 8640000000000000 ? new Date(timestamp) : null;
  const counter = value => Number.isSafeInteger(value) && value >= 0 ? String(value) : 'No registrado';
  return Object.freeze({
    nombre: text(profile.nombre), telefono: typeof profile.telefono === 'number' && Number.isFinite(profile.telefono) ? String(profile.telefono) : text(profile.telefono),
    fecha: date ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'long', timeZone: 'America/La_Paz' }).format(date) : 'No registrado',
    avatar: avatarFile(profile.avatarPath),
    disponibles: counter(profile.muestrasGratisDisponibles), utilizadas: counter(profile.muestrasGratisUtilizadas),
  });
}
