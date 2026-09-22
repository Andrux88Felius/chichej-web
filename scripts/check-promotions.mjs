import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {visiblePromotions} from '../public/assets/js/promotions-view.js';
const docs=[{id:'p',data:{tipo:'promocion',activo:true,titulo:'Ejemplo de prueba',mensaje:'Texto',fechaCreacion:'2026-01-01'}},{id:'off',data:{tipo:'promocion',activo:false}},{id:'text',data:{tipo:'promocion',activo:'true'}},{id:'info',data:{tipo:'informativo',activo:true}},{id:'missing',data:{tipo:'promocion'}}];
assert.deepEqual(visiblePromotions(docs).map(x=>x.id),['p']);assert.deepEqual(visiblePromotions(docs,true).map(x=>x.id),['p','info']);assert(!('creadoPorUid' in visiblePromotions(docs)[0]));
const base=new URL('../public/assets/js/',import.meta.url);
for(const name of ['promotions-firebase','promotions-view','promotions-ui']){const source=await readFile(new URL(name+'.js',base),'utf8');assert(!/addDoc|setDoc|updateDoc|deleteDoc|runTransaction|writeBatch|increment\(|uploadBytes|innerHTML|\.php|localStorage|sessionStorage|PRIVATE KEY|private_key/.test(source));}
const sdk=await readFile(new URL('promotions-firebase.js',base),'utf8');assert.match(sdk,/where\('activo','==',true\)/);assert.match(sdk,/where\('tipo','==','promocion'\)/);assert.match(sdk,/'mensajes'/);
console.log('OK: promociones públicas activas, avisos solo con sesión, booleano estricto, datos administrativos excluidos y módulos solo lectura. Sin conexión Firebase.');
