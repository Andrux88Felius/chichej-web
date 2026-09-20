export const RESERVATION_FIELDS = Object.freeze(['detalle','fechaSolicitada','cantidadSolicitada','telefono','lugarEvento','direccion','referenciasLugar','observaciones']);
export const reservationError = code => Object.assign(new Error('Reservation unavailable'), {code});
export function dateBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part = type => parts.find(p=>p.type===type).value;
  const min = `${part('year')}-${part('month')}-${part('day')}`;
  const maxDate = new Date(min+'T16:00:00Z'); maxDate.setUTCFullYear(maxDate.getUTCFullYear()+2);
  return {min,max:maxDate.toISOString().slice(0,10)};
}
export function validateReservation(input, now = new Date()) {
  const result = {};
  for(const key of RESERVATION_FIELDS) {
    if(key==='cantidadSolicitada') continue;
    if(typeof input[key]!=='string') throw reservationError('invalid-reservation');
    result[key]=input[key].trim();
  }
  for(const [key,min,max] of [['detalle',3,300],['lugarEvento',3,160],['direccion',0,220],['referenciasLugar',0,300],['observaciones',0,600]]) {
    if([...result[key]].length<min || [...result[key]].length>max) throw reservationError('invalid-reservation');
  }
  const quantity=String(input.cantidadSolicitada);
  if(!/^[1-9]\d*$/.test(quantity) || Number(quantity)>10000) throw reservationError('invalid-reservation');
  result.cantidadSolicitada=Number(quantity);
  const phone=result.telefono, digits=phone.replace(/\D/g,'');
  if(!/^[0-9+().\s-]{7,30}$/.test(phone)||digits.length<7||digits.length>15) throw reservationError('invalid-reservation');
  const date=result.fechaSolicitada, parsed=new Date(date+'T16:00:00Z'),bounds=dateBounds(now);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(+parsed)||parsed.toISOString().slice(0,10)!==date||date<bounds.min||date>bounds.max) throw reservationError('invalid-reservation');
  return result;
}
export function canonicalState(value) {
  const state=typeof value==='string'?value.trim().toLowerCase():'';
  if(state==='pendiente') return state;
  if(['aceptada','aceptado','aprobada','aprobado'].includes(state)) return 'aceptada';
  if(['rechazada','rechazado'].includes(state)) return 'rechazada';
  if(['cancelada','cancelado'].includes(state)) return 'cancelada';
  return null;
}
export const canCancel = record => canonicalState(record.estado)==='pendiente';
export function reservationMillis(value) {
  const number=value?.toMillis instanceof Function?value.toMillis():typeof value==='number'?value:Date.parse(value);
  return Number.isFinite(number)?number:0;
}
export function reservationDate(value) {
  const ms=reservationMillis(value);
  return ms?new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',dateStyle:'medium'}).format(ms):'Sin fecha';
}
export function reservationMessage(error) {
  switch(error?.code) {
    case 'invalid-reservation': return 'Revisa detalle, fecha, cantidad, teléfono y lugar; comprueba las longitudes indicadas.';
    case 'permission-denied': return 'Firebase no permite esta operación de reservas. Comunícate con administración; no cambies las reglas.';
    case 'reservation-session': return 'La sesión cambió o terminó. Vuelve a iniciar sesión.';
    case 'not-owner': case 'not-found': return 'La reserva no está disponible para tu cuenta. Actualiza el listado.';
    case 'invalid-transition': return 'La reserva ya no está pendiente y no se puede cancelar. Actualiza el listado.';
    case 'uncertain-create': return 'Hay una creación sin confirmar. Reintenta con los mismos datos o revisa el listado antes de recargar y crear otra.';
    default: return 'No se pudo confirmar la operación. Revisa tu conexión y actualiza el listado antes de repetirla.';
  }
}
