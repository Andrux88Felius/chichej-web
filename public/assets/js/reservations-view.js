import {protectAccount} from './auth-guard.js';
import {RESERVATION_FIELDS,dateBounds,canCancel,canonicalState,reservationDate,reservationMessage} from './reservations-data.js';
export async function mountReservations(getStore,getSession,navigate=url=>location.replace(url)) {
  const root=document.querySelector('[data-reservations-content]'),status=document.querySelector('[data-reservations-status]');
  const form=document.querySelector('[data-reservation-form]'),list=document.querySelector('[data-reservations-list]');
  const dialog=document.querySelector('[data-cancel-dialog]'),confirm=dialog.querySelector('[data-confirm-cancel]');
  let session,store,profile,epoch=0,busy=false,target=null,lastFocus=null;
  const text=(tag,value,className)=>{const node=document.createElement(tag);node.textContent=value; if(className)node.className=className;return node;};
  const scalar=value=>typeof value==='string'||typeof value==='number'?String(value):'Sin datos';
  function lock(value) {busy=value;form.querySelector('fieldset').disabled=value||!store; root.querySelectorAll('button').forEach(b=>{b.disabled=value;}); confirm.disabled=value; dialog.querySelector('[data-dismiss-cancel]').disabled=value;root.setAttribute('aria-busy',String(value));}
  function reset() {form.reset();form.elements.telefono.value=profile?.details.telefono==='No registrado'?'':profile?.details.telefono||'';const bounds=dateBounds();form.elements.fechaSolicitada.min=bounds.min;form.elements.fechaSolicitada.max=bounds.max;}
  function render(rows) {
    list.replaceChildren();
    if(!rows.length){list.append(text('p','Sin reservas registradas. Tu primera solicitud aparecerá aquí.'));return;}
    for(const row of rows) {
      const card=text('article','', 'reservation-client-card');
      card.append(text('h3',scalar(row.detalle)),text('small','Reserva '+row.id));
      const state=canonicalState(row.estado);
      card.append(text('p',state?state[0].toUpperCase()+state.slice(1):scalar(row.estado)+' (histórico)','reservation-client-badge'));
      card.append(text('p',reservationDate(row.fechaSolicitada)+' · '+scalar(row.lugarEvento??row.direccion)));
      const detail=document.createElement('details');detail.append(text('summary','Ver detalle'));
      const dl=document.createElement('dl');
      for(const [label,value] of [['Fecha solicitada',reservationDate(row.fechaSolicitada)],['Cantidad',row.cantidadSolicitada??row.cantidad],['Teléfono',row.telefono],['Lugar',row.lugarEvento],['Dirección',row.direccion],['Referencia',row.referenciasLugar],['Observaciones',row.observaciones],['Creación',reservationDate(row.fechaCreacion)],['Última actualización',reservationDate(row.fechaActualizacion)]]) {
        const pair=document.createElement('div');pair.append(text('dt',label),text('dd',scalar(value)||'Sin datos'));dl.append(pair);
      }
      detail.append(dl);card.append(detail);
      if(canCancel(row)) {
        const button=text('button','Cancelar reserva','button button--ghost');button.type='button';
        button.addEventListener('click',()=>{if(busy)return;target=row.id;lastFocus=button;dialog.querySelector('[data-cancel-description]').textContent='¿Deseas cancelar esta reserva? '+scalar(row.detalle)+' · '+reservationDate(row.fechaSolicitada);dialog.showModal();dialog.querySelector('[data-dismiss-cancel]').focus();});
        card.append(button);
      }
      list.append(card);
    }
  }
  async function reload(ticket) {const rows=await store.list();if(ticket===epoch)render(rows);}
  async function act(operation,success,clearForm=false) {
    if(busy||!store)return;
    const ticket=epoch;lock(true);status.textContent=clearForm?'Creando reserva…':'Cancelando reserva…';
    try {
      await operation();if(ticket!==epoch)return;
      if(dialog.open)dialog.close();if(clearForm)reset();
      status.textContent=success;
      try {await reload(ticket);} catch(error) {if(ticket===epoch)status.textContent=success+' No se pudo actualizar el listado. '+reservationMessage(error);}
    } catch(error) {if(ticket===epoch){if(dialog.open)dialog.close();status.textContent=reservationMessage(error);}}
    finally {if(ticket===epoch)lock(false);}
  }
  form.addEventListener('submit',event=>{event.preventDefault();if(busy||!form.reportValidity())return;const input={};for(const key of RESERVATION_FIELDS)input[key]=form.elements[key].value;void act(()=>store.create(input),'Reserva registrada correctamente.',true);});
  document.querySelector('[data-discard-reservation]').addEventListener('click',()=>{if(!busy){reset();status.textContent='Formulario descartado. No se guardaron cambios.';}});
  document.querySelector('[data-refresh-reservations]').addEventListener('click',async()=>{if(busy)return;const ticket=epoch;lock(true);status.textContent='Cargando reservas…';try{if(!store){const next=await getStore();if(ticket!==epoch)return;store=next;}await reload(ticket);if(ticket===epoch)status.textContent='Listado actualizado.';}catch(error){if(ticket===epoch)status.textContent=reservationMessage(error);}finally{if(ticket===epoch)lock(false);}});
  confirm.addEventListener('click',()=>{if(target)void act(()=>store.cancel(target),'Reserva cancelada correctamente.');});
  dialog.querySelector('[data-dismiss-cancel]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  dialog.addEventListener('close',()=>{target=null;if(lastFocus?.isConnected)lastFocus.focus();});
  function clear() {epoch++;root.hidden=true;list.replaceChildren();form.reset();store=null;profile=null;target=null;busy=false;if(dialog.open)dialog.close();}
  window.addEventListener('pagehide',clear);
  window.addEventListener('pageshow',event=>{if(event.persisted){clear();location.reload();}});
  try {
    session=await getSession();
    protectAccount(session,{clear,message:value=>{status.textContent=value;},show:current=>{
      profile=current;root.hidden=false;reset();const ticket=epoch;lock(true);status.textContent='Cargando reservas…';
      void (async()=>{try{const next=await getStore();if(ticket!==epoch)return;store=next;await reload(ticket);if(ticket===epoch)status.textContent='';}catch(error){if(ticket===epoch)status.textContent=reservationMessage(error);}finally{if(ticket===epoch)lock(false);}})();
    }},navigate);
  } catch {clear();status.textContent='No se pudo cargar la sesión. Revisa la conexión y recarga la página.';}
}
