import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Ejecutar con el servidor estático activo. No visita enlaces externos.
const root = fileURLToPath(new URL('../public/', import.meta.url));
const origin = process.argv[2] || 'http://localhost:8080';
const pages = ['index.html', 'nosotros.html', 'informacion.html', 'productos.html', 'login.html', 'registro.html'];
const resources = new Set(pages);
for (const page of pages) {
  const html = await readFile(resolve(root, page), 'utf8');
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html lang="es">/);
  assert.match(html, /charset="utf-8"/i);
  assert.match(html, /name="viewport"/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /name="description" content="[^"]+"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, page + ': un solo h1');
  assert(!/<\?|\.php(?:["#?])|192\.168\.|\/var\/www|localhost|[A-Z]:\\|rel="canonical"/.test(html), page + ': sin dependencias físicas/PHP');
  for (const image of html.matchAll(/<img\b[^>]*>/g)) assert.match(image[0], /\balt="[^"]*"/);
  for (const match of html.matchAll(/(?:src|href|value)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(https?:|tel:)/.test(ref)) continue;
    assert.notEqual(ref, '#', page + ': no enlaces vacíos');
    const [file, hash] = ref.split('#');
    const target = file || page;
    assert(!relative(root, resolve(root, target)).startsWith('..'));
    const content = await readFile(resolve(root, target));
    resources.add(target);
    if (hash) assert(content.toString().includes(`id="${hash}"`), `${page}: ancla ausente ${ref}`);
  }
}
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else {
      assert(['.html', '.css', '.js', '.png', '.jpeg', '.jpg', '.mp3'].includes(extname(path)), 'Archivo inesperado en public');
      resources.add(relative(root, path).replaceAll('\\', '/'));
    }
  }
}
await inspect(root);
for (const resource of resources) {
  const response = await fetch(`${origin}/${encodeURI(resource)}`, { method: 'HEAD' });
  assert.equal(response.status, 200, resource);
}
const home = await fetch(origin + '/', { redirect: 'manual' });
assert.equal(home.status, 200, 'La raíz debe servir Inicio sin redirección');
assert.equal(await home.text(), await readFile(resolve(root, 'index.html'), 'utf8'));
for (const path of ['/.env', '/config/mail.php', '/api/auth/session-login.php', '/README.md']) {
  assert.equal((await fetch(origin + path)).status, 404, 'No exponer ' + path);
}
const script = await readFile(resolve(root, 'assets/js/pilot.js'), 'utf8');
assert(!/\bfetch\s*\(|XMLHttpRequest|firebasejs|signInWith/.test(script), 'Sin APIs ni autenticación');
// El catálogo dinámico puede importar el SDK, pero no operaciones de escritura.
for (const name of ['firebase-config.js', 'productos.js']) {
  const module = await readFile(resolve(root, 'assets/js', name), 'utf8');
  assert(!/\b(?:addDoc|setDoc|updateDoc|deleteDoc|writeBatch|runTransaction|onSnapshot|signInWith\w*)\s*\(/.test(module), 'Catálogo solo lectura: ' + name);
}
console.log(`OK: ${pages.length} páginas, ${resources.size} recursos HTTP 200, anclas válidas, raíz Inicio y 4 rutas privadas bloqueadas.`);
