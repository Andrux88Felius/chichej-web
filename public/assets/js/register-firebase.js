import { firebaseConfig, getFirebaseApp } from './firebase-config.js';
import { getSession } from './auth-firebase.js';
import { createRegistration, createOnly } from './register-state.js';

let registrationPromise;
export function getRegistration() {
  registrationPromise ??= connect().catch(error => { registrationPromise = undefined; throw error; });
  return registrationPromise;
}

async function connect() {
  const [mainApp, session, { initializeApp }, authSdk, databaseSdk] = await Promise.all([
    getFirebaseApp(), getSession(),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js'),
  ]);
  const { getAuth, setPersistence, inMemoryPersistence, createUserWithEmailAndPassword, deleteUser, signOut } = authSdk;
  const { getDatabase, ref, runTransaction, serverTimestamp } = databaseSdk;
  // Misma configuración y proyecto; Auth aislado para no publicar un usuario aún sin perfil.
  const stagingApp = initializeApp(firebaseConfig, 'chichej-registration');
  const stagingAuth = getAuth(stagingApp);
  await setPersistence(stagingAuth, inMemoryPersistence);
  const mainAuth = getAuth(mainApp);
  const database = getDatabase(stagingApp);
  let createdUser = null;
  function requireNewUser(user) {
    if (!user || user !== createdUser || stagingAuth.currentUser !== user || !/^[A-Za-z0-9_-]{1,128}$/.test(user.uid)) throw new Error('New account unavailable');
  }
  return createRegistration({
    async canRegister() { await session.ready; return mainAuth.currentUser === null; },
    async createUser(email, password) {
      const credential = await createUserWithEmailAndPassword(stagingAuth, email, password);
      createdUser = credential.user;
      return createdUser;
    },
    timestamp: () => serverTimestamp(),
    async createProfile(user, profile) {
      requireNewUser(user);
      const outcome = await runTransaction(ref(database, 'usuarios/' + user.uid), current => createOnly(current, profile), { applyLocally: false });
      return outcome.snapshot.val();
    },
    async deleteNewUser(user) {
      requireNewUser(user);
      await deleteUser(user);
      createdUser = null;
    },
    async activate(user, password) {
      requireNewUser(user);
      // No sustituir una sesión que se abrió en otra pestaña durante el registro.
      if (mainAuth.currentUser !== null) return false;
      await session.login(user.email, password, true);
      return session.getState().profile?.uid === user.uid;
    },
    async release(user) {
      requireNewUser(user);
      await signOut(stagingAuth);
      createdUser = null;
    },
  });
}
