import assert from 'node:assert/strict';
import {mountMonitor} from '../public/assets/js/monitor-view.js';
class Element {
  constructor(){this.children=[];this.value='';this.listeners={};this.hidden=false;this.textContent='';}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;this.textContent='';}
  addEventListener(name,fn){this.listeners[name]=fn;}
}
globalThis.Option=class extends Element {constructor(text,value){super();this.textContent=text;this.value=value;}};
async function setup({admin=true,records=[],delay=false,denied=false}={}){
  const elements=Object.fromEntries(['content','list','status','search','filter','refresh'].map(key=>[key,new Element()]));
  globalThis.document={body:{dataset:{monitorAdmin:String(admin),monitorKind:'orders'}},querySelector:selector=>elements[selector.match(/monitor-(\w+)/)[1]],createElement:()=>new Element()};
  globalThis.window={addEventListener(){}};
  let observe,reads=0,query,finish;
  const sdk={getFirestore:()=>({}),collection:()=>({collection:'pedidos'}),where:(...args)=>args,query:(source,where)=>({source,where}),getDocsFromServer:async value=>{reads++;query=value;if(denied)throw {code:'permission-denied'};if(delay)await new Promise(resolve=>finish=resolve);return {docs:records.map(row=>({id:row.id,data:()=>row}))};}};
  mountMonitor({getSession:async()=>({subscribe:fn=>observe=fn,refresh:async()=>{}}),getFirebaseApp:async()=>({}),loadSDK:async()=>sdk});
  await Promise.resolve();
  return {elements,state:state=>observe(state),reads:()=>reads,query:()=>query,finish:()=>finish()};
}
const auth=role=>({status:'authenticated',profile:{uid:'own',role}});
for(const state of [{status:'anonymous'},auth('cliente'),{status:'error'}]){
  const test=await setup();await test.state(state);assert.equal(test.reads(),0);assert(test.elements.content.hidden);
}
for(const role of ['admin','admin_principal']){
  const test=await setup({records:[{id:'physical',tipoUsuario:'fisico',origenPedido:'pulsador',estado:'entregado'}]});await test.state(auth(role));assert.equal(test.reads(),1);assert.equal(test.elements.list.children.length,1);
}
const own=await setup({admin:false,records:[{id:'mine',usuarioId:'own'}]});await own.state(auth('cliente'));assert.deepEqual(own.query().where,['usuarioId','==','own']);
const foreign=await setup({admin:false,records:[{id:'other',usuarioId:'other'}]});await foreign.state(auth('cliente'));assert.equal(foreign.elements.list.children.length,0);
const denied=await setup({denied:true});await denied.state(auth('admin'));assert.match(denied.elements.status.textContent,/denegó/);
const stale=await setup({delay:true,records:[{id:'private'}]});const pending=stale.state(auth('admin'));await Promise.resolve();await Promise.resolve();await stale.state({status:'anonymous'});stale.finish();await pending;assert.equal(stale.elements.list.children.length,0);assert(stale.elements.content.hidden);
console.log('OK: monitoreo sin lecturas anónimas/cliente admin, ambos roles, pedidos físicos, UID propio, denegación y respuesta tardía tras logout. Dobles locales sin red.');
