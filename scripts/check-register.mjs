import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRegistration, validateRegistration, newCustomerProfile, createOnly, matchesCreatedProfile } from '../public/assets/js/register-state.js';
import { createRecovery, recoveryConfirmation } from '../public/assets/js/recovery-state.js';

// Valores sintéticos solo para validadores. Ninguna importación del adaptador Firebase ni red.
const transient = String.fromCharCode(65, 98, 51, 33).repeat(3);
const input = { nombre: '  Prueba local  ', email: ' example@example.invalid ', password: transient, confirmation: transient };
assert.deepEqual(validateRegistration(input), { nombre: 'Prueba local', email: 'example@example.invalid' });
for (const changes of [{ nombre: ' ' }, { nombre: 'a' }, { nombre: 'x'.repeat(81) }, { email: 'invalid' }, { password: 'a'.repeat(8), confirmation: 'a'.repeat(8) }, { confirmation: '' }]) assert.throws(() => validateRegistration({ ...input, ...changes }));
const profile = newCustomerProfile('Nombre', 'example@example.invalid', 123);
assert.deepEqual(Object.keys(profile).sort(), ['avatarPath', 'bloqueado', 'email', 'fechaRegistro', 'nombre', 'rol']);
assert.equal(profile.rol, 'cliente');
assert.equal(profile.bloqueado, false);
assert.equal(createOnly(null, profile), profile);
for (const existing of [profile, {}, false, '', { rol: 'admin_principal' }]) assert.equal(createOnly(existing, profile), undefined, 'Nunca reemplaza un nodo existente');
assert(matchesCreatedProfile(profile, profile));
assert(!matchesCreatedProfile({ ...profile, rol: 'admin_principal' }, profile));

function fixture() {
  const calls = { create: 0, write: 0, remove: 0, activate: 0, release: 0 };
  const user = Object.freeze({ uid: 'only_new_uid', email: 'example@example.invalid' });
  const adapter = {
    async canRegister() { return true; },
    async createUser() { calls.create++; return user; },
    timestamp: () => 123,
    async createProfile(received, data) { assert.equal(received, user); calls.write++; return data; },
    async deleteNewUser(received) { assert.equal(received, user); calls.remove++; },
    async activate(received) { assert.equal(received, user); calls.activate++; return true; },
    async release(received) { assert.equal(received, user); calls.release++; },
  };
  return { calls, adapter, service: createRegistration(adapter) };
}
const normal = fixture();
assert.equal((await normal.service.register({ ...input, rol: 'admin_principal', uid: 'existing' })).status, 'success');
assert.deepEqual(normal.calls, { create: 1, write: 1, remove: 0, activate: 1, release: 1 });
assert.equal(await normal.service.register(input), null, 'No segunda cuenta tras éxito');

const double = fixture();
await Promise.all([double.service.register(input), double.service.register(input)]);
assert.equal(double.calls.create, 1);
const existing = fixture();
existing.adapter.createUser = async () => { throw { code: 'auth/email-already-in-use' }; };
assert.equal((await existing.service.register(input)).status, 'error');
assert.equal(existing.calls.write + existing.calls.remove + existing.calls.activate, 0, 'No adoptar ni modificar cuentas preexistentes');

const signedIn = fixture();
signedIn.adapter.canRegister = async () => false;
assert.equal((await signedIn.service.register(input)).status, 'error');
assert.equal(signedIn.calls.create, 0);

const denied = fixture();
denied.adapter.createProfile = async () => { throw { code: 'PERMISSION_DENIED' }; };
assert.equal((await denied.service.register(input)).status, 'error');
assert.equal(denied.calls.remove, 1, 'Rollback solo de la cuenta recién devuelta');
assert.equal(denied.calls.activate, 0);

const failedRollback = fixture();
failedRollback.adapter.createProfile = denied.adapter.createProfile;
failedRollback.adapter.deleteNewUser = async () => { throw new Error('Local failure'); };
assert.equal((await failedRollback.service.register(input)).status, 'partial');
assert.equal(await failedRollback.service.register(input), null);

const uncertain = fixture();
let fail = true;
let saved;
uncertain.adapter.createProfile = async (_, data) => {
  saved ??= data;
  if (fail) { fail = false; throw { code: 'network-error' }; }
  return saved; // El servidor pudo confirmar la primera escritura aunque se perdiera la respuesta.
};
assert.equal((await uncertain.service.register(input)).status, 'partial');
assert.equal(uncertain.calls.remove, 0, 'Nunca borrar Auth por un resultado incierto');
assert.equal((await uncertain.service.retry()).status, 'success');
assert.equal(uncertain.calls.create, 1, 'Reintento con el mismo usuario');
assert.equal(uncertain.calls.activate, 0, 'Reintento no conserva contraseña');

const uncertainThenDenied = fixture();
uncertainThenDenied.adapter.createProfile = async () => { throw { code: 'network-error' }; };
assert.equal((await uncertainThenDenied.service.register(input)).status, 'partial');
uncertainThenDenied.adapter.createProfile = async () => { throw { code: 'PERMISSION_DENIED' }; };
assert.equal((await uncertainThenDenied.service.retry()).status, 'partial');
assert.equal(uncertainThenDenied.calls.remove, 0, 'Una denegación posterior no justifica borrar una cuenta con escritura previa incierta');

const collision = fixture();
collision.adapter.createProfile = async () => ({ ...profile, rol: 'admin_principal' });
assert.equal((await collision.service.register(input)).status, 'conflict');
assert.equal(collision.calls.remove + collision.calls.activate, 0);

const loginFails = fixture();
loginFails.adapter.activate = async () => { throw new Error('Local failure'); };
assert.equal((await loginFails.service.register(input)).status, 'success');
assert.equal(loginFails.calls.remove, 0, 'No rollback tras perfil confirmado');

const resetSuccess = await createRecovery(async () => {})('example@example.invalid');
for (const code of ['auth/user-not-found', 'auth/user-disabled']) {
  assert.deepEqual(await createRecovery(async () => { throw { code }; })('example@example.invalid'), resetSuccess);
}
assert.equal(resetSuccess.message, recoveryConfirmation);
let emails = 0;
const recover = createRecovery(async () => { emails++; });
await Promise.all([recover('example@example.invalid'), recover('example@example.invalid')]);
assert.equal(emails, 1);
assert.equal((await recover('invalid')).ok, false);
for (const code of ['auth/network-request-failed', 'auth/too-many-requests', 'unknown']) assert.equal((await createRecovery(async () => { throw { code }; })('example@example.invalid')).ok, false);

const root = new URL('../public/', import.meta.url);
const html = await readFile(new URL('registro.html', root), 'utf8');
assert(!/name="(?:uid|rol|role|bloqueado)"|\.php|admin_principal|localStorage|sessionStorage/.test(html));
for (const field of ['nombre', 'email', 'password', 'confirmation']) assert(html.includes(`name="${field}"`));
assert.match(html, /autocomplete="new-password"/);
assert.match(html, /src="assets\/js\/register-ui.js"/);
for (const file of await readdir(new URL('assets/js/', root))) {
  if (!/^(register|recovery)-/.test(file)) continue;
  const source = await readFile(new URL('assets/js/' + file, root), 'utf8');
  assert(!/localStorage|sessionStorage|console\.|getIdToken|fetch\s*\(|\.php|192\.168\.|\/var\/www|[A-Z]:\\/.test(source), file);
}
const sdk = await readFile(new URL('assets/js/register-firebase.js', root), 'utf8');
assert.match(sdk, /createUserWithEmailAndPassword\(stagingAuth, email, password\)/);
assert.match(sdk, /user !== createdUser/);
assert.match(sdk, /requireNewUser\(user\);\s+await deleteUser\(user\)/);
assert.match(sdk, /runTransaction\(ref\(database, 'usuarios\/' \+ user.uid\)/);
assert.match(sdk, /applyLocally: false/);
assert.match(sdk, /inMemoryPersistence/);
assert(!/signInWithEmailAndPassword/.test(sdk), 'El registro no adopta cuentas existentes');
console.log('OK: registro local, esquema PHP, rol cliente fijo, no sobrescritura, doble envío, rollback restringido, reintentos inciertos y privacidad de recuperación. Sin red, cuentas ni correos reales.');
