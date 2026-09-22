// El PHP controla disponibilidad con activo booleano; no existe un campo de vencimiento.
export function visiblePromotions(documents,authenticated=false) {
  return documents.filter(({data})=>data?.activo===true && (authenticated||data.tipo==='promocion'))
    .map(({id,data})=>({id,titulo:typeof data.titulo==='string'?data.titulo:'Publicación CHICHEJ',mensaje:typeof data.mensaje==='string'?data.mensaje:'',tipo:data.tipo==='promocion'?'promocion':'informativo',fecha:typeof data.fechaCreacion?.toMillis==='function'?data.fechaCreacion.toMillis():Date.parse(data.fechaCreacion)||0}))
    .sort((a,b)=>b.fecha-a.fecha);
}
export function renderPromotions(container,items) {
  const node=(tag,value,style)=>{const el=document.createElement(tag);el.textContent=value;if(style)el.className=style;return el;};
  container.replaceChildren();
  if(!items.length){container.append(node('p','No hay promociones activas disponibles en este momento.'));return;}
  for(const item of items){const card=node('article','','promotion-live-card');card.append(node('p',item.tipo==='promocion'?'Promoción':'Informativo','eyebrow'),node('h2',item.titulo),node('p',item.mensaje,'promotion-live-message'));
    card.append(node('p','Vigencia: no especificada en la publicación.','promotion-live-meta'));
    if(item.fecha)card.append(node('p','Publicada el '+new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',dateStyle:'medium'}).format(item.fecha),'promotion-live-meta'));
    container.append(card);
  }
}
export async function mountPromotions(read,getSession) {
  const list=document.querySelector('[data-promotions-list]'),status=document.querySelector('[data-promotions-status]');let epoch=0;
  async function load(authenticated){const ticket=++epoch;list.replaceChildren();status.textContent='Cargando publicaciones…';try{const docs=await read(authenticated);if(ticket!==epoch)return;const items=visiblePromotions(docs,authenticated);renderPromotions(list,items);const promos=items.filter(item=>item.tipo==='promocion').length;status.textContent=promos+' promociones activas'+(authenticated?' · '+(items.length-promos)+' avisos informativos':'')+'.';}catch(error){if(ticket===epoch)status.textContent=error?.code==='permission-denied'?'No se pudieron consultar las promociones: permiso denegado.':'No se pudieron cargar las promociones. Revisa la conexión y recarga la página.';}}
  window.addEventListener('pagehide',()=>{epoch++;list.replaceChildren();});
  await load(false);
  try{const session=await getSession();let previous=false;session.subscribe(state=>{const active=state.status==='authenticated';if(active!==previous){previous=active;void load(active);}});}catch{/* La lectura pública no depende de iniciar sesión. */}
}
