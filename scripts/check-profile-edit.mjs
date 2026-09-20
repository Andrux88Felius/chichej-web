import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { allowedChanges, EDITABLE_PROFILE_FIELDS, createProfileEditor, editableValues, editMessage } from '../public/assets/js/profile-edit-state.js';
import { createAuthState } from '../public/assets/js/auth-state.js';
assert.deepEqual(EDITABLE_PROFILE_FIELDS, ['nombre', 'telefono', 'avatarPath']);
const forbidden = ['uid','id','_id','correo','email','rol','role','bloqueado','blocked','admin','permisos','claims','regalos','regalosDisponibles','muestras','beneficios','creadoEn','actualizadoEn','fechaRegistro','muestrasGratisDisponibles','muestrasGratisUtilizadas','usuarios/otro/nombre','nombre/rol','__proto__'];
const injected = Object.fromEntries(forbidden.map(key => [key, 'injected']));
assert.deepEqual(allowedChanges({...injected, nombre:'  Eduardo  '}), {nombre:'Eduardo'});
assert.deepEqual(allowedChanges(injected), {});
assert.deepEqual(allowedChanges(Object.create({nombre:'Heredado'})), {});
for (const nombre of ['', ' ', 'A', 'a'.repeat(81), null, {}, 123]) assert.throws(() => allowedChanges({nombre}));
for (const telefono of ['', '+591 (700) 12-345', '70012345']) assert.deepEqual(allowedChanges({telefono}), {telefono});
for (const telefono of ['abc', '<script>', '1'.repeat(21), 123]) assert.throws(() => allowedChanges({telefono}));
for (const avatarPath of ['assets/avatares/invitado.png', ...Array.from({length:9}, (_,i)=>`assets/avatares/avatar${i+1}.png`)]) assert.deepEqual(allowedChanges({avatarPath}), {avatarPath});
for (const avatarPath of ['../secret', 'https://example.invalid/a.png', 'data:image/png;base64,x', 'assets/avatares/avatar10.png']) assert.throws(()=>allowedChanges({avatarPath}));
assert.equal(editableValues({telefono:70012345}).telefono, '70012345');
assert.match(editMessage({code:'PERMISSION_DENIED'}), /permiso/);
let calls=0, release;
const gate = new Promise(resolve=>{release=resolve;});
const editor=createProfileEditor({load:async()=>({nombre:'Actual'}),save:async payload=>{calls++;assert.deepEqual(payload,{nombre:'Nuevo'});await gate;}});
await editor.load(); assert.equal(calls,0);
const first=editor.save({...injected,nombre:'Nuevo'});
assert.equal(await editor.save({nombre:'Duplicado'}),null); assert.equal(calls,1);
release(); assert.deepEqual(await first,{changed:true});
assert.deepEqual(await editor.save(injected),{changed:false}); assert.equal(calls,1);
let failures=0;
const retry=createProfileEditor({save:async()=>{if(++failures===1)throw Error('simulated');}});
await assert.rejects(retry.save({nombre:'Nuevo'})); await retry.save({nombre:'Nuevo'}); assert.equal(failures,2);
let raw={nombre:'Antes',rol:'cliente'}, user={uid:'mock_self',email:'qa@example.invalid'}, observed, signouts=0;
const session=createAuthState({currentUser:()=>user,onChange:fn=>{observed=fn;queueMicrotask(()=>fn(user));},readProfile:async()=>raw,signOut:async()=>{signouts++;user=null;await observed(null);}});
await session.ready; raw={...raw,nombre:'Después'}; await session.refresh(); assert.equal(session.getState().profile.name,'Después');
raw={...raw,bloqueado:true}; await session.refresh(); assert.equal(signouts,1); assert.equal(session.getState().profile,null);
const read = name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const html=await read('public/usuario/perfil.html');
const names=[...html.matchAll(/<(?:input|select)\b[^>]*\bname="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(names,EDITABLE_PROFILE_FIELDS);
assert(!/type="(?:hidden|file|password|email)"|data-uid|\?uid=|\.php/.test(html));
const sdk=await read('public/assets/js/profile-edit-firebase.js');
assert.match(sdk,/update\(ref\(database, 'usuarios\/' \+ auth.currentUser.uid\), payload\)/);
assert.match(sdk,/auth.currentUser !== editingUser/);
assert.match(sdk,/profileForUser\(user, profile\)/);
assert.equal((sdk.match(/\bupdate\(/g)||[]).length,1);
for(const name of ['state','firebase','view','ui']) {
 const source=await read('public/assets/js/profile-edit-'+name+'.js');
 assert(!/URLSearchParams|location.search|localStorage|sessionStorage|innerHTML|\.php|\b(?:set|setDoc|addDoc|updateDoc|deleteDoc|push|remove|writeBatch|runTransaction|updateEmail|verifyBeforeUpdateEmail|updatePassword|uploadBytes)\s*\(|PRIVATE KEY|private_key|client_secret|service_account|\/var\/www|192\.168\.|[A-Z]:\\/.test(source),name);
}
const view=await read('public/assets/js/profile-edit-view.js');
assert.match(view,/if \(busy \|\| !baseline/);
assert.match(view,/form.elements\[field\].value !== baseline\[field\]/);
assert.match(view,/await session.refresh\(\)/);
assert(!/FormData|JSON.parse/.test(view));
console.log('OK: allowlist, validaciones, payload parcial, identidad Auth, protección de campos y doble envío; refresco y bloqueo con datos simulados. Sin escrituras Firebase.');

// Ejecutar el adaptador de producción con importaciones SDK sustituidas por dobles locales.
// Su cuerpo de lectura/validación/update permanece intacto; nunca se importa Firebase.
const {authError,profileForUser}=await import('../public/assets/js/auth-state.js');
const adapterSource=sdk.replace(/^import .*;\r?\n/gm,'')
 .replace('export async function getProfileEditor()', 'async function getProfileEditor()')
 .replace(/const \[app, session, \{ getAuth \}, \{ getDatabase, ref, get, update \}\] = await Promise.all\(\[[\s\S]*?\]\);/, 'const {app,session,getAuth,getDatabase,ref,get,update}=deps;');
assert(!adapterSource.includes('import('));
const build = new Function('deps','authError','profileForUser','allowedChanges','createProfileEditor','editableValues',adapterSource+'; return getProfileEditor();');
const identity={uid:'own_uid',email:'qa@example.invalid'};
let current=identity, stored={nombre:'Anterior',rol:'cliente',telefono:'70012345',bloqueado:false,muestrasGratisDisponibles:9}, writes=[], duringRead=null;
const deps={app:{},session:{refresh:async()=>{}},getAuth:()=>({get currentUser(){return current;}}),getDatabase:()=>({}),ref:(_db,path)=>path,
 get:async path=>{assert.equal(path,'usuarios/'+current.uid);if(duringRead)duringRead();return {val:()=>stored};},
 update:async(path,payload)=>{writes.push({path,payload});stored={...stored,...payload};}};
const realAdapter=await build(deps,authError,profileForUser,allowedChanges,createProfileEditor,editableValues);
await assert.rejects(realAdapter.save({nombre:'Nuevo'})); // Se requiere abrir un perfil válido.
await realAdapter.load(); await realAdapter.save({...injected,nombre:'Nuevo'});
assert.deepEqual(writes,[{path:'usuarios/own_uid',payload:{nombre:'Nuevo'}}]);
assert.equal(stored.muestrasGratisDisponibles,9); assert.equal(stored.rol,'cliente'); assert.equal(stored.bloqueado,false);
current={uid:'another_uid'}; await assert.rejects(realAdapter.save({nombre:'No transferir borrador'}));
current=identity; stored={...stored,bloqueado:true}; await assert.rejects(realAdapter.save({nombre:'Bloqueado'}));
stored=null; await assert.rejects(realAdapter.save({nombre:'Inexistente'}));
stored={rol:'admin_principal',nombre:'Admin propio'}; await realAdapter.load(); await realAdapter.save({telefono:'+591 70012345',rol:'cliente'});
assert.deepEqual(writes[1],{path:'usuarios/own_uid',payload:{telefono:'+591 70012345'}});assert.equal(stored.rol,'admin_principal');
duringRead=()=>{current={uid:'different_during_read'};}; await assert.rejects(realAdapter.save({nombre:'Respuesta tardía'}));
assert.equal(writes.length,2);
console.log('OK: adaptador RTDB probado con dobles locales: UID propio, perfil existente/no bloqueado, admin propio y cambio de identidad antes/durante la lectura.');
