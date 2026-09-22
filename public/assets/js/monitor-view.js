import {isAdminRole} from './admin-guard.js';
export function mountMonitor({getFirebaseApp,getSession,loadSDK}) {
const root=document.querySelector('[data-monitor-content]'),list=document.querySelector('[data-monitor-list]'),status=document.querySelector('[data-monitor-status]');
const admin=document.body.dataset.monitorAdmin==='true',kind=document.body.dataset.monitorKind;
const search=document.querySelector('[data-monitor-search]'),filter=document.querySelector('[data-monitor-filter]');
const labels={estado:'Estado registrado',bomba:'Bomba',agitador:'Agitador',nivelliquido:'Nivel registrado',distanciaCm:'Distancia (cm)',productoactual:'Producto actual',usuarioId:'Identificador de usuario',nombreUsuario:'Cliente',tipoUsuario:'Tipo de usuario',origenPedido:'Origen del pedido',origen:'Origen histórico',estadoPago:'Estado del pago',metodoPago:'Método de pago',total:'Total (Bs)',fechaCreacion:'Fecha de creación',procesado:'Procesado'};
let epoch=0,rows=[],session;
const text=value=>value?.toDate?value.toDate().toLocaleString('es-BO',{timeZone:'America/La_Paz'}):['string','number','boolean'].includes(typeof value)?String(value):'Sin datos';
function render(){
  list.replaceChildren();
  for(const row of rows.filter(row=>(!filter?.value||row.estado===filter.value)&&(!search?.value||[...Object.values(row).map(text),...(Array.isArray(row.items)?row.items.map(item=>text(item?.nombre)):[])].join(' ').toLowerCase().includes(search.value.toLowerCase())))){
    const card=document.createElement('article');card.className='data-card';
    const heading=document.createElement('h2');heading.textContent=kind==='machine'?'Último estado disponible':text(row.pedidoId||row.id);card.append(heading);
    if(kind==='orders'){const overview=document.createElement('p');overview.textContent=`${text(row.nombreUsuario||row.tipoUsuario)} · ${text(row.estado)} · Bs ${text(row.total)}`;card.append(overview);}
    const fields=kind==='machine'?['estado','bomba','agitador','nivelliquido','distanciaCm','productoactual']:['usuarioId','nombreUsuario','tipoUsuario','origenPedido','origen','estado','estadoPago','metodoPago','total','fechaCreacion','procesado'];
    const dl=document.createElement('dl');
    for(const key of fields){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=labels[key];dd.textContent=text(row[key]);div.append(dt,dd);dl.append(div);}
    const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Ver detalles';details.append(summary,dl);if(kind==='machine')card.append(dl);else card.append(details);
    if(Array.isArray(row.items)) for(const item of row.items){if(!item||typeof item!=='object')continue;const p=document.createElement('p');p.textContent=[item.nombre,item.cantidad,item.cantidadMl,item.precio].map(text).join(' · ');details.append(p);}
    list.append(card);
  }
  if(!list.children.length) list.textContent='No hay registros para esta consulta.';
}
async function read(state){
  const ticket=++epoch;rows=[];list.replaceChildren();root.hidden=true;
  if(state.status!=='authenticated'){status.textContent='Inicia sesión para consultar estos datos.';return;}
  if(admin&&!isAdminRole(state.profile.role)){status.textContent='Esta sección requiere una cuenta administrativa.';return;}
  status.textContent='Consultando…';
  try{
    const app=await getFirebaseApp();let data;
    if(ticket!==epoch)return;
    if(kind==='machine'){
      const sdk=await loadSDK('database');
      if(ticket!==epoch)return;
      const snap=await sdk.get(sdk.ref(sdk.getDatabase(app),'dispensador/principal'));
      data=snap.exists()?[snap.val()]:[];
    }else{
      const sdk=await loadSDK('firestore');
      if(ticket!==epoch)return;
      const source=sdk.collection(sdk.getFirestore(app),'pedidos');
      const query=admin?source:sdk.query(source,sdk.where('usuarioId','==',state.profile.uid));
      const snap=await sdk.getDocsFromServer(query);
      data=snap.docs.map(doc=>({...doc.data(),id:doc.id}));
      if(!admin&&data.some(row=>row.usuarioId!==state.profile.uid))throw new Error('owner mismatch');
    }
    if(ticket!==epoch)return;
    rows=data;root.hidden=false;
    if(filter){filter.replaceChildren(new Option('Todos',''),...Array.from(new Set(rows.map(row=>row.estado).filter(value=>typeof value==='string'))).map(value=>new Option(value,value)));}
    render();status.textContent='Consulta completada. '+(kind==='machine'?'No se puede confirmar conexión actual ni detectar pedidos atascados sin una señal reciente verificada.':'No se modifica ningún pedido.');
  }catch(error){if(ticket!==epoch)return;status.textContent=/permission|denied/i.test(error.code||'')?'Firebase denegó la lectura. No se modificaron permisos.':'No se pudo completar la consulta. Revisa tu conexión e intenta actualizar.';root.hidden=false;}
}
search?.addEventListener('input',render);filter?.addEventListener('change',render);
document.querySelector('[data-monitor-refresh]').addEventListener('click',async event=>{event.target.disabled=true;try{await session?.refresh();}finally{event.target.disabled=false;}});
window.addEventListener('pagehide',()=>{epoch++;rows=[];list.replaceChildren();root.hidden=true;});
getSession().then(value=>{session=value;session.subscribe(read);}).catch(()=>{status.textContent='No se pudo comprobar la sesión. Recarga la página.';});

}
