import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { accountDetails, avatarFile } from '../public/assets/js/account-data.js';
import { profileForUser } from '../public/assets/js/auth-state.js';
import { protectAccount } from '../public/assets/js/auth-guard.js';

const user = { uid: 'authenticated_uid', email: 'example@example.invalid' };
for (const role of ['cliente', 'admin', 'admin_principal']) {
  const profile = profileForUser(user, { rol: ' ' + role + ' ' });
  assert.equal(profile.role, role);
  assert.equal(profile.details.telefono, 'No registrado');
  assert.equal(profile.details.disponibles, 'No registrado');
}
assert.throws(() => profileForUser(user, { rol: 'cliente', bloqueado: true }));
assert.equal(avatarFile('assets/avatares/avatar3.png'), 'avatar3.png');
for (const path of ['https://example.invalid/unknown.png', '../secret', 'javascript:alert(1)', undefined]) assert.equal(avatarFile(path), 'invitado.png');
const details = accountDetails({ telefono: ' 123456 ', fechaRegistro: 1700000000000, muestrasGratisDisponibles: 0, muestrasGratisUtilizadas: 2 });
assert.equal(details.telefono, '123456');
assert.equal(accountDetails({ telefono: 123456 }).telefono, '123456');
assert.equal(details.disponibles, '0');
assert.equal(details.utilizadas, '2');
assert.notEqual(details.fecha, 'No registrado');
for (const value of [null, '', 'invalid', 0, -1, Infinity]) assert.equal(accountDetails({ fechaRegistro: value }).fecha, 'No registrado');
let callback, shown = null, message = '', destination = '', clears = 0;
const session = { subscribe(listener) { callback = listener; listener({ status: 'loading' }); return () => {}; } };
protectAccount(session, { clear() { shown = null; clears++; }, show(profile) { shown = profile; }, message(value) { message = value; } }, value => { destination = value; });
assert.equal(shown, null);
assert.match(message, /sesión/);
const profile = profileForUser(user, { rol: 'cliente', nombre: '<script>local</script>' });
callback({ status: 'authenticated', profile });
assert.equal(shown.uid, user.uid);
callback({ status: 'checking' });
assert.equal(shown, null);
callback({ status: 'error', message: 'No se pudo verificar el perfil' });
assert.equal(shown, null);
assert.equal(message, 'No se pudo verificar el perfil');
callback({ status: 'anonymous' });
assert.equal(destination, '../login.html');
assert(clears >= 5);

for (const page of ['index', 'perfil']) {
  const html = await readFile(new URL('../public/usuario/' + page + '.html', import.meta.url), 'utf8');
  assert.match(html, /data-account-content hidden/);
  assert.match(html, /src="\.\.\/assets\/js\/account-ui.js"/);
  assert.match(html, /data-auth-logout/);
  if (page === 'index') assert(!/<input|<form/.test(html));
  if (page === 'perfil') assert.match(html, /data-profile-edit method="post" hidden/);
  assert.match(html, /data-public-root="\.\.\/"/);
  assert(!/\.php|\?uid=|href="(?:pedidos)/.test(html));
}
for (const module of ['account-data', 'account-view', 'account-ui', 'auth-guard']) {
  const source = await readFile(new URL('../public/assets/js/' + module + '.js', import.meta.url), 'utf8');
  assert(!/URLSearchParams|location\.search|localStorage|sessionStorage|innerHTML|\.php|fetch\s*\(|\b(?:set|update|push|remove|addDoc|setDoc|updateDoc|deleteDoc|uploadBytes|createUserWithEmailAndPassword|sendPasswordResetEmail)\s*\(/.test(source), module);
}
const view = await readFile(new URL('../public/assets/js/account-view.js', import.meta.url), 'utf8');
assert.match(view, /addEventListener\('pagehide', view.clear\)/);
assert.match(view, /event.persisted/);
const sdk = await readFile(new URL('../public/assets/js/auth-firebase.js', import.meta.url), 'utf8');
assert.match(sdk, /onAuthStateChanged\(auth, callback\)/);
assert.match(sdk, /get\(ref\(database, 'usuarios\/' \+ uid\)\)/);
const origin = process.argv[2] || 'http://localhost:8080';
assert.equal((await fetch(origin + '/usuario/')).status, 200);
assert.equal((await fetch(origin + '/usuario', { redirect: 'manual' })).status, 308);
console.log('OK: guard, identidad de sesión, roles históricos, bloqueo, campos opcionales, avatar seguro, limpieza, rutas privadas y ausencia de escrituras. Sin credenciales ni conexión Firebase.');
