import { getFirebaseApp } from './firebase-config.js';
import { createRecovery } from './recovery-state.js';

export async function getRecovery() {
  const [app, { getAuth, sendPasswordResetEmail }] = await Promise.all([
    getFirebaseApp(), import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
  ]);
  return createRecovery(email => sendPasswordResetEmail(getAuth(app), email));
}
