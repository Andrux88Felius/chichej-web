import { getSession } from './auth-firebase.js';
import { mountAccount } from './account-view.js';

await mountAccount(getSession);
