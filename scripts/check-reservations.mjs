import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RESERVATION_FIELDS,validateReservation,dateBounds,canCancel,canonicalState,reservationError} from '../public/assets/js/reservations-data.js';
import {createReservationsStore} from '../public/assets/js/reservations-store.js';
import {profileForUser} from '../public/assets/js/auth-state.js';
const valid={detalle:'Evento de prueba',fechaSolicitada:dateBounds().min,cantidadSolicitada:'2',telefono:'+591 70012345',lugarEvento:'Salón principal',direccion:'',referenciasLugar:'',observaciones:''};
const normalized=validateReservation({...valid,usuarioId:'otro',estado:'aceptada',reservaId:'fake',rol:'admin'});
assert.deepEqual(Object.keys(normalized).sort(),[...RESERVATION_FIELDS].sort());
for(const patch of [{detalle:'a'},{cantidadSolicitada:0},{cantidadSolicitada:10001},{cantidadSolicitada:'1.5'},{telefono:'123'},{telefono:'abcdefgh'},{lugarEvento:''},{direccion:'x'.repeat(221)},{observaciones:'x'.repeat(601)},{fechaSolicitada:'2020-02-30'}])assert.throws(()=>validateReservation({...valid,...patch}));
assert.equal(dateBounds(new Date('2024-02-29T18:00:00Z')).max,'2026-03-01');
for(const state of ['aceptada','aprobado','rechazado','cancelada','desconocido',null])assert(!canCancel({estado:state}));
assert(canCancel({estado:' PENDIENTE '}));assert.equal(canonicalState('aprobado'),'aceptada');
let user={uid:'own_uid',email:'qa@example.invalid'},rawProfile={nombre:'Prueba',rol:'cliente'},records=new Map(),writes=[],counter=0,hold=null,failAfterCommit=false,profileReads=0;
const clone=value=>structuredClone(value);
const api={currentUser:()=>user,profile:async current=>{profileReads++;return profileForUser(current,rawProfile);},
 listOwn:async()=>[...records].filter(([,r])=>r.usuarioId===user.uid).map(([id,r])=>({...clone(r),id})),
 newId:()=> 'res_'+String(++counter).padStart(24,'0'),requestedDate:value=>Date.parse(value+'T16:00:00Z'),serverTime:()=>123456,
 transaction:async operation=>{if(hold)await hold;await operation({get:async id=>({exists:()=>records.has(id),data:()=>clone(records.get(id))}),create:(id,payload)=>{assert(!records.has(id));records.set(id,clone(payload));writes.push({kind:'create',id,payload});},cancel:(id,payload)=>{assert(records.has(id));records.set(id,{...records.get(id),...payload});writes.push({kind:'cancel',id,payload});}});if(failAfterCommit){failAfterCommit=false;throw reservationError('unavailable');}}};
records.set('foreign',{usuarioId:'foreign_uid',estado:'pendiente',detalle:'Ajena'});
const store=createReservationsStore(api);assert.deepEqual(await store.list(),[]);
let release;hold=new Promise(resolve=>{release=resolve;});const first=store.create({...valid,usuarioId:'foreign_uid',estado:'aceptada'});assert.equal(await store.create(valid),null);release();const id=await first;hold=null;
assert.equal(writes.length,1);assert.equal(records.get(id).usuarioId,'own_uid');assert.equal(records.get(id).estado,'pendiente');assert.equal(records.get(id).reservaId,id);assert.equal(records.get(id).cantidadSolicitada,2);assert.equal(Object.keys(records.get(id)).length,15);
assert.equal((await store.list()).length,1);
await assert.rejects(store.cancel('foreign'));assert.equal(writes.length,1);
records.get(id).estado='aceptada';await assert.rejects(store.cancel(id));assert.equal(writes.length,1);
records.get(id).estado='pendiente';await store.cancel(id);assert.equal(records.get(id).estado,'cancelada');assert.deepEqual(Object.keys(writes[1].payload).sort(),['estado','fechaActualizacion']);await assert.rejects(store.cancel(id));assert(records.has(id));
rawProfile.bloqueado=true;await assert.rejects(store.create(valid));delete rawProfile.bloqueado;
rawProfile.rol='admin_principal';const adminId=await store.create(valid);assert.equal(records.get(adminId).usuarioId,user.uid);assert.equal((await store.list()).length,2);
failAfterCommit=true;await assert.rejects(store.create(valid));const attempts=counter;await assert.rejects(store.create({...valid,detalle:'Diferente'}));await store.create(valid);assert.equal(counter,attempts);assert.equal(writes.filter(w=>w.kind==='create').length,3);
const prior=user;user={uid:'another_uid'};await assert.rejects(store.create(valid));await assert.rejects(store.cancel(id));user=prior;
let foreignQueried=false;const stranger=createReservationsStore({...api,listOwn:async()=>{foreignQueried=true;return [{id:'foreign',usuarioId:'other'}];}});await assert.rejects(stranger.list());assert(foreignQueried);
const before=writes.length;const race=createReservationsStore({...api,transaction:async op=>{user={uid:'switched'};await api.transaction(op);}});await race.list();await assert.rejects(race.create(valid));assert.equal(writes.length,before);user=prior;
assert(profileReads>0);
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const html=await read('public/usuario/reservas.html'),sdk=await read('public/assets/js/reservations-firebase.js'),view=await read('public/assets/js/reservations-view.js'),source=await read('public/assets/js/reservations-store.js');
assert.match(html,/data-reservations-content hidden/);assert.match(view,/protectAccount\(session/);assert.match(sdk,/fs.where\('usuarioId','==',auth.currentUser.uid\)/);assert.match(sdk,/getDocsFromServer/);assert.match(sdk,/tx.update\(fs.doc\(db,'reservas',id\),payload\)/);assert.match(source,/if\(!canCancel\(row\)\)/);
assert.deepEqual([...html.matchAll(/<(?:input|textarea)\b[^>]*name="([^"]+)"/g)].map(m=>m[1]),RESERVATION_FIELDS);
assert(!/name="(?:uid|usuarioId|estado|reservaId)"|\.php|data-uid|\?uid=/.test(html));assert.match(view,/dialog.showModal\(\)/);assert.match(view,/if\(busy\|\|!store\)return/);
for(const suffix of ['data','store','firebase','view','ui']){const content=await read('public/assets/js/reservations-'+suffix+'.js');assert(!/localStorage|sessionStorage|URLSearchParams|location.search|innerHTML|\.php|deleteDoc|\bremove\s*\(|uploadBytes|PRIVATE KEY|private_key|service_account|client_secret|192\.168\.|\/var\/www|[A-Z]:\\/.test(content),suffix);}
assert(!/aceptar|rechazar/.test(view));
console.log('OK: esquema PHP, validaciones, UID propio, consulta limitada, creación pendiente, doble envío, reintento idempotente, cancelación transaccional sin eliminar, cambio de cuenta/bloqueo, admin propio, guard y campos protegidos. Sin red ni reservas reales.');
