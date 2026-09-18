import { getRecovery } from './recovery-firebase.js';
import { mountRecovery } from './recovery-view.js';

await mountRecovery(getRecovery);
