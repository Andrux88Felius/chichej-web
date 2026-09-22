import {getSession} from './auth-firebase.js';
const form=document.querySelector('[data-contact-form]');
const status=form.querySelector('[data-contact-status]');
const link=form.querySelector('[data-contact-open]');
form.addEventListener('input',()=>{link.hidden=true;link.removeAttribute('href');status.textContent='';});
form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity()) return;
  const fields=form.elements;
  if(fields.name.value.trim().length<2 || fields.message.value.trim().length<10){status.textContent='Completa tu nombre y un mensaje de al menos 10 caracteres.';return;}
  const text=`Consulta CHICHEJ\nNombre: ${fields.name.value.trim()}\nCorreo: ${fields.email.value.trim()}\nOrganización: ${fields.organization.value.trim()}\nMotivo: ${fields.reason.value}\n\n${fields.message.value.trim()}`;
  link.href='https://wa.me/59177271557?text='+encodeURIComponent(text);
  link.hidden=false;
  status.textContent='Mensaje preparado. Continúa en WhatsApp y confirma allí el envío. Todavía no se ha enviado.';
});
getSession().then(session=>session.subscribe(state=>{
  if(state.status==='authenticated'){
    if(!form.elements.name.value) form.elements.name.value=state.profile.name||'';
    if(!form.elements.email.value) form.elements.email.value=state.profile.email||'';
  }
})).catch(()=>{});
