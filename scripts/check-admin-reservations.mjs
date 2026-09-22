import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {requireAdminProfile,protectAdmin,ADMIN_ROLES} from '../public/assets/js/admin-guard.js';
import {createAdminReservationsStore,adminTarget,filterAdminReservations} from '../public/assets/js/admin-reservations-store.js';
const identity={uid:'admin_self',email:'admin@example.invalid'};
assert.deepEqual(ADMIN_ROLES,['admin','admin_principal']);
for(const rol of ADMIN_ROLES)assert.equal(requireAdminProfile(identity,{rol}).role,rol);
for(const raw of [{rol:'cliente'},{rol:'superadmin'},{rol:'admin_principal',bloqueado:true},null])assert.throws(()=>requireAdminProfile(identity,raw));
let callback,shown=null,destination='',clears=0;
const session={subscribe:fn=>{callback=fn;fn({status:'loading'});}};
protectAdmin(session,{clear:()=>{shown=null;clears++;},message:()=>{},show:p=>{shown=p;}},url=>{destination=url;});
callback({status:'authenticated',profile:{role:'cliente'}});assert.equal(shown,null);assert.equal(destination,'../usuario/index.html');
callback({status:'anonymous'});assert.equal(destination,'../login.html');
callback({status:'authenticated',profile:{role:'admin_principal'}});assert.equal(shown.role,'admin_principal');callback({status:'checking'});assert.equal(shown,null);assert(clears>=5);
assert.equal(adminTarget('aceptar'),'aceptada');assert.equal(adminTarget('rechazar'),'rechazada');for(const action of ['cancelar','pendiente','eliminar','aceptada','__proto__'])assert.throws(()=>adminTarget(action));
let user=identity,raw={rol:'admin_principal'},reads=0,writes=[],afterRead=null,hold=null;
const records=new Map([['one',{usuarioId:'cliente_1',estado:'pendiente',nombreCliente:'José Pérez',correoCliente:'jose@example.invalid',telefono:'70012345',direccion:'Calle Luna',fechaCreacion:200}],['two',{usuarioId:'cliente_2',estado:'cancelada',fechaCreacion:100}]]);
const api={currentUser:()=>user,profile:async current=>requireAdminProfile(current,raw),listAll:async()=>{reads++;return [...records].map(([id,data])=>({...data,id}));},serverTime:()=>1234,
 transaction:async op=>{if(hold)await hold;const transaction={get:async id=>{if(afterRead)afterRead();return {exists:()=>records.has(id),data:()=>({...records.get(id)})};},updateState:(id,payload)=>{records.set(id,{...records.get(id),...payload});writes.push({id,payload});}};await op(transaction);}};
raw={rol:'cliente'};const client=createAdminReservationsStore(api);await assert.rejects(client.list());await assert.rejects(client.change('one','aceptar'));assert.equal(reads,0);assert.equal(writes.length,0);
raw={rol:'admin_principal'};const store=createAdminReservationsStore(api);const rows=await store.list();assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.id),['one','two']);
assert.equal(filterAdminReservations(rows,'jose','pendiente').length,1);for(const term of ['Pérez','jose@example.invalid','70012345','Luna','one','cliente_1'])assert.equal(filterAdminReservations(rows,term,'').length,1);assert.equal(filterAdminReservations(rows,'','cancelada').length,1);
await assert.rejects(store.change('unknown','aceptar'));await assert.rejects(store.change('two','aceptar'));await assert.rejects(store.change('one','cancelar'));
let release;hold=new Promise(resolve=>{release=resolve;});const first=store.change('one','aceptar');assert.equal(await store.change('one','rechazar'),null);release();await first;hold=null;
assert.deepEqual(writes,[{id:'one',payload:{estado:'aceptada',fechaActualizacion:1234}}]);assert.equal(records.get('one').usuarioId,'cliente_1');assert.equal(records.get('one').nombreCliente,'José Pérez');
await assert.rejects(store.change('one','rechazar'));
for(const estado of ['cancelada','rechazada','aceptada','cancelado','aprobado','desconocido']){records.get('one').estado=estado;await assert.rejects(store.change('one','aceptar'));await assert.rejects(store.change('one','rechazar'));}assert.equal(writes.length,1);
records.get('one').estado='pendiente';await store.list();afterRead=()=>{records.get('one').estado='cancelada';};await assert.rejects(store.change('one','aceptar'));assert.equal(writes.length,1);afterRead=null;
records.get('one').estado='pendiente';raw={rol:'cliente'};await assert.rejects(store.change('one','aceptar'));raw={rol:'admin_principal',bloqueado:true};await assert.rejects(store.change('one','aceptar'));raw={rol:'admin'};
await store.change('one','rechazar');assert.equal(records.get('one').estado,'rechazada');assert.equal(records.size,2);
user={uid:'different'};await assert.rejects(store.list());await assert.rejects(store.change('one','aceptar'));user=identity;
records.get('one').estado='pendiente';afterRead=()=>{user={uid:'switched_while_reading'};};await assert.rejects(store.change('one','aceptar'));assert.equal(writes.length,2);user=identity;afterRead=null;
// Simular reintento de Firestore: primer intento abortado por cambio concurrente, segundo ve cancelada.
const race=createAdminReservationsStore({...api,transaction:async op=>{let staged=0;await op({get:async()=>({exists:()=>true,data:()=>({estado:'pendiente'})}),updateState:()=>{staged++;}});assert.equal(staged,1);await op({get:async()=>({exists:()=>true,data:()=>({estado:'cancelada'})}),updateState:()=>assert.fail('No puede escribir el reintento')});}});await race.list();await assert.rejects(race.change('one','aceptar'));
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const html=await read('public/admin/reservas.html'),view=await read('public/assets/js/admin-reservations-view.js'),sdk=await read('public/assets/js/admin-reservations-firebase.js');
assert.match(html,/data-admin-reservations hidden/);assert.match(view,/protectAdmin\(session/);assert.match(sdk,/requireAdminProfile\(user,snapshot.val\(\)\)/);assert.match(sdk,/getDocsFromServer\(fs.collection\(db,'reservas'\)\)/);assert.match(sdk,/fs.runTransaction/);assert.match(sdk,/tx.update\(fs.doc\(db,'reservas',id\),payload\)/);assert.match(view,/if\(busy\|\|!selection\|\|!store\)return/);assert.match(view,/dialog.showModal\(\)/);assert(!/\.php|data-uid|\?uid=/.test(html));
for(const suffix of ['store','firebase','view','ui']){const source=await read('public/assets/js/admin-reservations-'+suffix+'.js');assert(!/deleteDoc|\bremove\s*\(|setDoc|addDoc|tx.set\(|localStorage|sessionStorage|URLSearchParams|location.search|innerHTML|\.php|PRIVATE KEY|private_key|service_account|client_secret|192\.168\.|\/var\/www|[A-Z]:\\/.test(source),suffix);}
const auth=await read('public/assets/js/auth-view.js');assert.match(auth,/!authenticated \|\| !isAdminRole\(state.profile\?\.role\)/);
for(const name of await readdir(new URL('../public/assets/js/',import.meta.url))){if(name==='admin-reservations-firebase.js')continue;const source=await read('public/assets/js/'+name);assert(!/getDocsFromServer\(fs.collection\(db,'reservas'\)\)/.test(source),name);}
assert.match(await read('public/assets/js/reservations-firebase.js'),/where\('usuarioId','==',auth.currentUser.uid\)/);
console.log('OK: guard admin/admin_principal, cliente/bloqueo denegados antes de lectura global, búsqueda/filtros, estado actual, terminales, doble envío, reintento concurrente, rol/identidad revocados y actualización parcial sin eliminar. Sin red ni escrituras reales.');
