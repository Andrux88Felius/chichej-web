import { getRegistration } from './register-firebase.js';
import { getSession } from './auth-firebase.js';
import { mountRegistration } from './register-view.js';

await mountRegistration(getRegistration, getSession);
