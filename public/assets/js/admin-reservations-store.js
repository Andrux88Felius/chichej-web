import {isAdminRole} from './admin-guard.js';
import {canonicalState,reservationMillis,reservationError,reservationMessage} from './reservations-data.js';
export function adminTarget(action) {
  if(action==='aceptar')return 'aceptada';
  if(action==='rechazar')return 'rechazada';
  throw reservationError('invalid-action');
}
export function adminMessage(error) {
  if(error?.code==='admin-denied')return 'Tu cuenta ya no tiene acceso administrativo. Vuelve a iniciar sesión.';
  if(error?.code==='invalid-transition')return 'La reserva cambió de estado; solo se puede aceptar o rechazar si sigue pendiente. Actualiza el listado.';
  if(error?.code==='invalid-action')return 'Esta acción no está permitida.';
  return reservationMessage(error);
}
export function filterAdminReservations(rows,search,state) {
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const term=normalize(search).trim();
  return rows.filter(row=>(!state||canonicalState(row.estado)===state) && normalize([row.id,row.reservaId,row.nombreCliente,row.correoCliente??row.email,row.usuarioId,row.telefono,row.detalle,row.lugarEvento,row.direccion,row.referenciasLugar,row.observaciones,row.estado].join(' ')).includes(term));
}
export function createAdminReservationsStore(api) {
  let owner=null,known=new Set(),busy=false;
  function same(user) {if(api.currentUser()!==user)throw reservationError('reservation-session');}
  async function fresh() {
    const user=api.currentUser();
    if(!user||!/^[A-Za-z0-9_-]{1,128}$/.test(user.uid)||(owner&&owner!==user))throw reservationError('reservation-session');
    const profile=await api.profile(user);same(user);
    if(!isAdminRole(profile.role))throw reservationError('admin-denied');
    return user;
  }
  return {
    async list() {
      const user=await fresh();owner=user;
      const rows=await api.listAll();same(user);await fresh();
      known=new Set(rows.map(row=>row.id));
      return rows.sort((a,b)=>reservationMillis(b.fechaCreacion??b.fechaSolicitada)-reservationMillis(a.fechaCreacion??a.fechaSolicitada));
    },
    async change(id,action) {
      if(busy)return null;
      busy=true;
      try {
        const next=adminTarget(action),user=await fresh();
        if(!owner||!known.has(id))throw reservationError('not-found');
        await api.transaction(async tx=>{
          // Se revalida también en cada reintento de la transacción.
          await fresh();same(user);
          const snapshot=await tx.get(id);same(user);
          if(!snapshot.exists())throw reservationError('not-found');
          if(canonicalState(snapshot.data().estado)!=='pendiente')throw reservationError('invalid-transition');
          tx.updateState(id,{estado:next,fechaActualizacion:api.serverTime()});
        });
        same(user);return next;
      } finally {busy=false;}
    },
  };
}
