import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {isAdminRole} from '../public/assets/js/admin-guard.js';
const root=new URL('../public/',import.meta.url);
for(const dir of ['','admin/','usuario/'])for(const name of await readdir(new URL(dir,root))){
  if(!name.endsWith('.html'))continue;
  const html=await readFile(new URL(dir+name,root),'utf8');
  for(const route of ['contacto','dispensar','promociones'])assert.match(html,new RegExp('href="(?:../)?'+route+'\\.html"'),dir+name);
  if(dir==='admin/')assert(!html.includes('data-sound-player'),name);
}
const monitor=await readFile(new URL('assets/js/monitor-view.js',root),'utf8');
const dispenser=await readFile(new URL('assets/js/dispenser-ui.js',root),'utf8');
const contact=await readFile(new URL('assets/js/contact-ui.js',root),'utf8');
for(const source of [monitor,dispenser,contact])assert(!/\b(?:addDoc|setDoc|updateDoc|deleteDoc|writeBatch|runTransaction|push|update|set)\s*\(/.test(source));
assert.match(monitor,/sdk\.where\('usuarioId','==',state.profile.uid\)/);
assert.match(monitor,/ticket!==epoch/);
assert.match(monitor,/admin&&!isAdminRole/);
assert.equal(isAdminRole('cliente'),false);assert.equal(isAdminRole('admin'),true);assert.equal(isAdminRole('admin_principal'),true);
assert.match(contact,/Todavía no se ha enviado/);
assert.match(contact,/encodeURIComponent/);
console.log('OK: navegación portable, admin sin música, nuevas consultas sin escrituras y contacto sin confirmación falsa de envío.');
