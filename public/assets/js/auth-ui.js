import { getSession } from './auth-firebase.js';
import { mountAuthUI } from './auth-view.js';

await mountAuthUI(getSession);
