import { validateReservation, canCancel, reservationMillis, reservationError } from './reservations-data.js';
// Adaptador probado sin red; las dependencias de producción usan exclusivamente el SDK oficial.
export function createReservationsStore(api) {
  let owner=null, known=new Map(), busy=false, pending=null;
  function identity() {
    const user=api.currentUser();
    if(!user || !/^[A-Za-z0-9_-]{1,128}$/.test(user.uid) || (owner && owner!==user)) throw reservationError('reservation-session');
    return user;
  }
  function same(user) { if(api.currentUser()!==user) throw reservationError('reservation-session'); }
  async function fresh() { const user=identity(); const profile=await api.profile(user); same(user); return {user,profile}; }
  async function exclusive(operation) {
    if(busy) return null;
    busy=true; try {return await operation();} finally {busy=false;}
  }
  return {
    async list() {
      const {user}=await fresh(); owner=user;
      const rows=await api.listOwn(); same(user);
      if(rows.some(row=>row.usuarioId!==user.uid)) throw reservationError('not-owner');
      known=new Map(rows.map(row=>[row.id,row]));
      return rows.sort((a,b)=>reservationMillis(b.fechaCreacion??b.fechaSolicitada)-reservationMillis(a.fechaCreacion??a.fechaSolicitada));
    },
    create(input) { return exclusive(async()=>{
      if(!owner) throw reservationError('reservation-session');
      const values=validateReservation(input);
      const {user,profile}=await fresh();
      const signature=JSON.stringify(values);
      if(pending && (pending.user!==user||pending.signature!==signature)) throw reservationError('uncertain-create');
      if(!pending) {
        const id=api.newId();
        pending={id,user,signature,payload:{...values,reservaId:id,usuarioId:user.uid,nombreCliente:profile.name,correoCliente:profile.email,
          fechaSolicitada:api.requestedDate(values.fechaSolicitada),estado:'pendiente',fechaCreacion:api.serverTime(),fechaActualizacion:api.serverTime()}};
      }
      const draft=pending;
      await api.transaction(async tx=>{
        same(user);
        const snapshot=await tx.get(draft.id); same(user);
        if(snapshot.exists()) {
          const existing=snapshot.data();
          if(existing.usuarioId!==user.uid || existing.reservaId!==draft.id || Object.keys(values).some(key=>key!=='fechaSolicitada' && existing[key]!==values[key]) || reservationMillis(existing.fechaSolicitada)!==reservationMillis(draft.payload.fechaSolicitada)) throw reservationError('not-owner');
          return; // Reintento de la misma creación ya confirmada: no sobrescribir.
        }
        tx.create(draft.id,draft.payload);
      });
      same(user); pending=null; return draft.id;
    }); },
    cancel(id) { return exclusive(async()=>{
      const {user}=await fresh();
      if(!known.has(id)||known.get(id).usuarioId!==user.uid) throw reservationError('not-owner');
      await api.transaction(async tx=>{
        same(user); const snapshot=await tx.get(id); same(user);
        if(!snapshot.exists()) throw reservationError('not-found');
        const row=snapshot.data();
        if(row.usuarioId!==user.uid) throw reservationError('not-owner');
        if(!canCancel(row)) throw reservationError('invalid-transition');
        tx.cancel(id,{estado:'cancelada',fechaActualizacion:api.serverTime()});
      });
      same(user); return true;
    }); },
  };
}
