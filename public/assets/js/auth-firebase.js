import { getFirebaseApp } from './firebase-config.js';
import { createAuthState } from './auth-state.js';

let sessionPromise;
export function getSession() {
  sessionPromise ??= connect().catch(error => { sessionPromise = undefined; throw error; });
  return sessionPromise;
}

async function connect() {
  const [app, authSdk, databaseSdk] = await Promise.all([
    getFirebaseApp(),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js'),
  ]);
  const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } = authSdk;
  const { getDatabase, ref, get } = databaseSdk;
  const auth = getAuth(app);
  const database = getDatabase(app);
  return createAuthState({
    currentUser: () => auth.currentUser,
    onChange: callback => onAuthStateChanged(auth, callback),
    async signIn(email, password, remember) {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    },
    signOut: () => signOut(auth),
    async readProfile(uid) {
      // Solo el nodo del usuario autenticado. Nunca se consulta la colección completa.
      let timer;
      try {
        const snapshot = await Promise.race([
          get(ref(database, 'usuarios/' + uid)),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Profile timeout')), 15000); }),
        ]);
        return snapshot.val();
      } finally { clearTimeout(timer); }
    },
  });
}
