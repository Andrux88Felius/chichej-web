import {getAdminReservations} from './admin-reservations-firebase.js';
import {getSession} from './auth-firebase.js';
import {mountAdminReservations} from './admin-reservations-view.js';
await mountAdminReservations(getAdminReservations,getSession);
