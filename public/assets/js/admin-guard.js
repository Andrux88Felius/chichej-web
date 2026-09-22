import {profileForUser} from './auth-state.js';
import {protectAccount} from './auth-guard.js';
export const ADMIN_ROLES = Object.freeze(['admin','admin_principal']);
export const isAdminRole = role => ADMIN_ROLES.includes(role);
export function requireAdminProfile(user,raw) {
  const profile=profileForUser(user,raw);
  if(!isAdminRole(profile.role)) throw Object.assign(new Error('Administrative access unavailable'),{code:'admin-denied'});
  return profile;
}
export function protectAdmin(session,view,navigate) {
  return protectAccount(session,{clear:view.clear,message:view.message,show:profile=>{
    if(isAdminRole(profile.role)) view.show(profile);
    else {view.message('Esta sección requiere una cuenta administrativa. Volviendo a Mi Cuenta…');navigate('../usuario/index.html');}
  }},navigate);
}
