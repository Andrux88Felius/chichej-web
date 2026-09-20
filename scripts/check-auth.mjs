import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createAuthState, profileForUser, isBlocked, errorMessage } from '../public/assets/js/auth-state.js';

// Dobles locales sin credenciales, red ni almacenamiento. No autentican cuentas.
const user = { uid: 'local_test_uid', email: 'example@example.invalid' };
for (const bloqueado of [undefined, null, '', false, 0, '0', 'false', ' FALSE ']) assert.equal(isBlocked({ bloqueado }), false);
for (const bloqueado of [true, 1, '1', 'true', ' TRUE ', ' ', 'unknown', [], {}, 2]) assert.equal(isBlocked({ bloqueado }), true);
for (const role of ['cliente', 'admin', 'admin_principal']) assert.equal(profileForUser(user, { rol: ' ' + role + ' ' }).role, role);
assert.equal(profileForUser(user, { rol: 'cliente' }).name, user.email);
for (const profile of [null, [], {}, { rol: 'owner' }, { rol: 'Admin' }, { rol: 'cliente', bloqueado: true }]) assert.throws(() => profileForUser(user, profile));
assert.throws(() => profileForUser({ uid: '../another' }, { rol: 'cliente' }));
assert.equal(errorMessage({ code: 'auth/user-not-found' }), errorMessage({ code: 'auth/wrong-password' }));
assert(!errorMessage({ code: 'unknown', message: 'private-detail' }).includes('private-detail'));

function fixture(profile = { rol: 'cliente', nombre: 'Prueba local' }) {
  let observer;
  const calls = { signIn: 0, signOut: 0, reads: [] };
  const adapter = {
    onChange(callback) { observer = callback; queueMicrotask(() => observer(null)); },
    async signIn() { calls.signIn++; void observer(user); },
    async signOut() { calls.signOut++; await observer(null); },
    async readProfile(uid) { calls.reads.push(uid); return profile; },
  };
  const session = createAuthState(adapter);
  return { session, adapter, calls, emit: value => observer(value) };
}
const valid = fixture();
await valid.session.ready;
await Promise.all([valid.session.login(), valid.session.login()]);
assert.equal(valid.calls.signIn, 1, 'Doble envío bloqueado');
assert.equal(valid.session.getState().status, 'authenticated');
assert.deepEqual(valid.calls.reads, [user.uid]);
assert.equal(await valid.session.logout(), true);
assert.equal(valid.session.getState().profile, null);
assert.equal(valid.session.getState().status, 'anonymous');

for (const profile of [null, { rol: 'cliente', bloqueado: true }, { rol: 'unknown' }]) {
  const denied = fixture(profile);
  await denied.session.ready;
  await denied.session.login();
  assert.equal(denied.calls.signOut, 1);
  assert.equal(denied.session.getState().status, 'error');
  assert.equal(denied.session.getState().profile, null);
}
const unavailable = fixture();
unavailable.adapter.readProfile = async () => { throw new Error('permission-denied'); };
await unavailable.session.ready;
await unavailable.session.login();
assert.equal(unavailable.calls.signOut, 1);
assert.match(unavailable.session.getState().message, /verificar tu perfil/);

const late = fixture();
await late.session.ready;
let finish;
late.adapter.readProfile = () => new Promise(resolve => { finish = resolve; });
const pending = late.emit(user);
await late.emit(null); // Salida en otra pestaña mientras se lee el perfil.
finish({ rol: 'admin' });
await pending;
assert.equal(late.session.getState().status, 'anonymous');
assert.equal(late.session.getState().profile, null);

const failed = fixture();
await failed.session.ready;
failed.adapter.signIn = async () => { throw { code: 'auth/network-request-failed' }; };
await failed.session.login();
assert.equal(failed.session.getState().status, 'error');
failed.adapter.signIn = async () => { await failed.emit(user); };
await failed.session.login();
assert.equal(failed.session.getState().status, 'authenticated', 'Se permite reintentar');
failed.adapter.signOut = async () => { throw new Error('local failure'); };
assert.equal(await failed.session.logout(), false);
assert.equal(failed.session.getState().status, 'logout-error');
assert.equal(failed.session.getState().profile, null);

const blockedLogout = fixture({ rol: 'cliente', bloqueado: true });
await blockedLogout.session.ready;
blockedLogout.adapter.signOut = async () => { throw new Error('Local failure'); };
await blockedLogout.session.login();
assert.equal(blockedLogout.session.getState().status, 'logout-error');
assert.equal(blockedLogout.session.getState().profile, null);
const restored = createAuthState({
  onChange(callback) { queueMicrotask(() => callback(user)); },
  async readProfile() { return { rol: ' admin_principal ' }; },
  async signOut() { throw new Error('No debe cerrar una sesión válida'); },
});
await restored.ready;
assert.equal(restored.getState().profile.role, 'admin_principal');
for (const code of ['auth/invalid-email', 'auth/too-many-requests', 'auth/network-request-failed', 'auth/user-disabled']) {
  assert(!errorMessage({ code }).includes(code));
  assert.notEqual(errorMessage({ code }), errorMessage({ code: 'unknown' }));
}

const scripts = new URL('../public/assets/js/', import.meta.url);
for (const name of await readdir(scripts)) {
  const source = await readFile(new URL(name, scripts), 'utf8');
  assert(!/(?<![.\w])(?:updateProfile|updateEmail|updatePassword|setCustomUserClaims|addDoc|setDoc|updateDoc|deleteDoc|writeBatch|push|remove|set)\s*\(/.test(source), name + ': sin escrituras fuera del alcance');
  if (name !== 'profile-edit-firebase.js') assert(!/(?<![.\w])update\s*\(/.test(source), name + ': edición propia aislada');
  if (name !== 'register-firebase.js') assert(!/\b(?:createUserWithEmailAndPassword|deleteUser)\s*\(/.test(source), name + ': registro aislado');
  if (!['register-firebase.js','reservations-firebase.js'].includes(name)) assert(!/\brunTransaction\s*\(/.test(source), name + ': transacciones aisladas');
  if (name !== 'recovery-firebase.js') assert(!/\bsendPasswordResetEmail\s*\(/.test(source), name + ': recuperación aislada');
  assert(!/localStorage|sessionStorage|getIdToken|192\.168\.|\/var\/www|[A-Z]:\\/.test(source), name + ': sin credenciales/rutas/almacenamiento manual');
  if (name.startsWith('auth-')) assert(!/console\.(log|error|warn)/.test(source), 'Auth no registra datos');
}
for (const page of ['index', 'nosotros', 'productos', 'informacion', 'login', 'registro']) {
  const html = await readFile(new URL('../public/' + page + '.html', import.meta.url), 'utf8');
  assert.match(html, /src="assets\/js\/auth-ui.js"/);
  assert.match(html, /href="login.html" data-auth-login/);
  assert.match(html, /data-auth-logout/);
}
const adapterSource = await readFile(new URL('auth-firebase.js', scripts), 'utf8');
for (const api of ['getAuth', 'onAuthStateChanged', 'signInWithEmailAndPassword', 'signOut', 'setPersistence']) assert(adapterSource.includes(api));
assert.match(adapterSource, /get\(ref\(database, 'usuarios\/' \+ uid\)\)/);
console.log('OK: roles, bloqueo histórico, perfil propio, denegación, doble envío, respuesta tardía, errores, logout y restricciones estáticas. Sin red ni credenciales.');
