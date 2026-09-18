import assert from 'node:assert/strict';
import { normalizeProduct, publicProducts, productImage, productPrice } from '../public/assets/js/productos.js';

assert.equal(normalizeProduct(null), null);
assert.equal(normalizeProduct([]), null);
const old = normalizeProduct({ _id: 'legacy', activo: '1', agotado: 'true', esGratis: '0', precio: '12.50', cantidadMl: '500', opcion: '2' }, 'doc');
assert.equal(old.id, 'legacy');
assert.equal(old.agotado, true);
assert.equal(old.precio, 12.5);
assert.equal(old.opcion, 2);
assert.equal(normalizeProduct({}, 'doc').id, 'doc');
assert.equal(normalizeProduct({ productoId: 'preferred', _id: 'old' }, 'doc').id, 'preferred');
for (const value of [false, 0, '0', 'false']) assert.equal(normalizeProduct({ activo: value }).activo, false);
for (const value of [undefined, null, 'unknown']) assert.equal(normalizeProduct({ activo: value }).activo, true, 'Compatibilidad PHP');
for (const value of [true, [], {}, '', '   ', 'NaN', Infinity, '0x10']) assert.equal(normalizeProduct({ precio: value }).precio, null);
assert.equal(normalizeProduct({ precio: '0' }).precio, 0);
assert.equal(productPrice(normalizeProduct({ esGratis: 'true', precio: 0 })), 'Gratis');
assert.equal(productPrice(normalizeProduct({})), 'Precio no disponible');
const result = publicProducts([
  { id: 'last', data: { nombre: 'Sin orden' } },
  { id: 'b', data: { opcion: '2', agotado: true } },
  { id: 'a', data: { opcion: 2 } },
  { id: 'hidden', data: { opcion: 0, activo: 'false' } },
  { id: 'first', data: { opcion: 1 } },
]);
assert.deepEqual(result.map(p => p.documentId), ['first', 'a', 'b', 'last']);
assert.equal(result[2].agotado, true, 'Agotado no significa inactivo');
assert.equal(productImage('assets/productos/500ml.png'), 'assets/img/productos/500ml.png');
assert.equal(productImage('/assets\\img\\productos\\150ml.png'), 'assets/img/productos/150ml.png');
assert.equal(productImage('assets/garapiña.png'), 'assets/img/garapiña.png');
for (const value of ['https://example.com/a.png', '../secret.png', 'assets/img/productos/../../a.png', 'data:image/svg+xml,test', 'assets/img/productos/unknown.png', {}, null]) assert.equal(productImage(value), '');
console.log('OK: compatibilidad histórica, IDs, booleanos, precios, filtro, orden estable y rutas seguras. Sin red ni Firebase.');
