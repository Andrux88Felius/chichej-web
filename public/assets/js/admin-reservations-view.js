import {protectAdmin} from './admin-guard.js';
import {canonicalState,reservationDate} from './reservations-data.js';
import {filterAdminReservations,adminMessage} from './admin-reservations-store.js';
export async function mountAdminReservations(getStore,getSession,navigate=url=>location.replace(url)) {
  const root=document.querySelector('[data-admin-reservations]'),list=document.querySelector('[data-admin-list]');
  const status=document.querySelector('[data-admin-status]'),search=document.querySelector('[data-admin-search]'),filter=document.querySelector('[data-admin-filter]'),count=document.querySelector('[data-admin-count]');
  const dialog=document.querySelector('[data-admin-dialog]'),confirm=dialog.querySelector('[data-admin-confirm]'),dismiss=dialog.querySelector('[data-admin-dismiss]');
  let store=null,rows=[],busy=false,epoch=0,selection=null,lastFocus=null,session;
  const scalar=value=>typeof value==='string'||typeof value==='number'?String(value):'Sin datos';
  const text=(tag,value,style)=>{const node=document.createElement(tag);node.textContent=value;if(style)node.className=style;return node;};
  function lock(value){busy=value;root.setAttribute('aria-busy',String(value));root.querySelectorAll('button,input,select').forEach(node=>{node.disabled=value;});confirm.disabled=value;dismiss.disabled=value;}
  function render() {
    list.replaceChildren();const visible=filterAdminReservations(rows,search.value,filter.value);count.textContent=visible.length+' de '+rows.length+' reservas';
    if(!visible.length){list.append(text('p',rows.length?'No hay reservas que coincidan con los filtros.':'Sin reservas disponibles.'));return;}
    for(const row of visible){
      const card=text('article','','reservation-client-card');card.append(text('h2',scalar(row.nombreCliente??row.usuarioId)),text('small','Reserva '+row.id));
      const state=canonicalState(row.estado);card.append(text('p',state?state[0].toUpperCase()+state.slice(1):scalar(row.estado)+' (histórico)','reservation-client-badge'));
      card.append(text('p',scalar(row.detalle)),text('p',reservationDate(row.fechaSolicitada)+' · '+scalar(row.telefono)),text('p',scalar(row.direccion||row.lugarEvento)),text('p','Referencia: '+(scalar(row.referenciasLugar)||'Sin datos')));
      const details=document.createElement('details');details.append(text('summary','Ver detalle'));const dl=document.createElement('dl');
      for(const [label,value] of [['Cliente',row.nombreCliente],['Correo',row.correoCliente??row.email],['UID del cliente',row.usuarioId],['Teléfono',row.telefono],['Fecha solicitada',reservationDate(row.fechaSolicitada)],['Cantidad',row.cantidadSolicitada??row.cantidad],['Lugar',row.lugarEvento],['Dirección',row.direccion],['Referencias',row.referenciasLugar],['Observaciones',row.observaciones],['Creación',reservationDate(row.fechaCreacion)],['Última actualización',reservationDate(row.fechaActualizacion)]]){const pair=document.createElement('div');pair.append(text('dt',label),text('dd',scalar(value)||'Sin datos'));dl.append(pair);}
      details.append(dl);card.append(details);
      if(state==='pendiente'){
        const actions=text('div','','edit-actions');
        for(const [action,label] of [['aceptar','Aceptar'],['rechazar','Rechazar']]){const button=text('button',label,'button '+(action==='aceptar'?'button--primary':'button--ghost'));button.type='button';button.addEventListener('click',()=>{if(busy)return;selection={id:row.id,action};lastFocus=button;dialog.querySelector('h2').textContent=label+' reserva';dialog.querySelector('[data-admin-description]').textContent='¿'+label+' esta reserva? '+scalar(row.nombreCliente)+' · '+scalar(row.detalle)+' · '+reservationDate(row.fechaSolicitada);confirm.textContent='Sí, '+action;dialog.showModal();dismiss.focus();});actions.append(button);}card.append(actions);
      }else card.append(text('p','Sin acciones disponibles.'));
      list.append(card);
    }
  }
  async function reload(ticket){const result=await store.list();if(ticket===epoch){rows=result;render();}}
  async function refresh(){if(busy)return;const ticket=epoch;lock(true);status.textContent='Cargando reservas…';try{if(!store){const next=await getStore();if(ticket!==epoch)return;store=next;}await reload(ticket);if(ticket===epoch)status.textContent='Listado actualizado.';}catch(error){if(ticket===epoch){rows=[];render();status.textContent=adminMessage(error);}}finally{if(ticket===epoch)lock(false);}}
  search.addEventListener('input',()=>{if(!busy)render();});filter.addEventListener('change',()=>{if(!busy)render();});
  document.querySelector('[data-admin-refresh]').addEventListener('click',refresh);
  dismiss.addEventListener('click',()=>dialog.close());dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});dialog.addEventListener('close',()=>{selection=null;if(lastFocus?.isConnected)lastFocus.focus();});
  confirm.addEventListener('click',async()=>{
    if(busy||!selection||!store)return;
    const ticket=epoch,{id,action}=selection;lock(true);status.textContent='Procesando reserva…';
    let message;
    try{const state=await store.change(id,action);message='Reserva '+state+' correctamente.';}
    catch(error){message=adminMessage(error);}
    if(ticket!==epoch)return;
    dialog.close();
    try{await reload(ticket);}catch(error){if(ticket===epoch){rows=[];render();message+=' No se pudo actualizar el listado. '+adminMessage(error);}}
    if(ticket===epoch){status.textContent=message;lock(false);status.focus();}
  });
  function clear(){epoch++;root.hidden=true;rows=[];list.replaceChildren();count.textContent='';search.value='';filter.value='';store=null;busy=false;selection=null;if(dialog.open)dialog.close();}
  window.addEventListener('pagehide',clear);window.addEventListener('pageshow',event=>{if(event.persisted){clear();location.reload();}});
  try{session=await getSession();protectAdmin(session,{clear,message:value=>{status.textContent=value;},show:()=>{root.hidden=false;void refresh();}},navigate);}
  catch{clear();status.textContent='No se pudo comprobar el acceso administrativo. Revisa la conexión y recarga la página.';}
}
