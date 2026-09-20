import {getReservations} from './reservations-firebase.js';
import {getSession} from './auth-firebase.js';
import {mountReservations} from './reservations-view.js';
await mountReservations(getReservations,getSession);
