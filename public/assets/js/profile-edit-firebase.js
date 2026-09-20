import { getFirebaseApp } from './firebase-config.js';
import { getSession } from './auth-firebase.js';
import { authError, profileForUser } from './auth-state.js';
import { allowedChanges, createProfileEditor, editableValues } from './profile-edit-state.js';

export async function getProfileEditor() {
  const [app, session, { getAuth }, { getDatabase, ref, get, update }] = await Promise.all([
    getFirebaseApp(), getSession(),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js'),
  ]);
  const auth = getAuth(app);
  const database = getDatabase(app);
  let editingUser = null;
  async function readOwn() {
    const user = auth.currentUser;
    if (!user || !/^[A-Za-z0-9_-]{1,128}$/.test(user.uid)) throw authError('edit/session');
    const snapshot = await get(ref(database, 'usuarios/' + user.uid));
    if (auth.currentUser !== user) throw authError('edit/session');
    const profile = snapshot.val();
    try { profileForUser(user, profile); }
    catch (error) { await session.refresh(); throw error; }
    return { user, profile };
  }
  return createProfileEditor({
    async load() {
      editingUser = null;
      const { user, profile } = await readOwn();
      editingUser = user;
      return editableValues(profile);
    },
    async save(input) {
      if (!editingUser || auth.currentUser !== editingUser) throw authError('edit/session');
      const payload = allowedChanges(input); // Segunda frontera: el adaptador tampoco acepta campos extra.
      const { user } = await readOwn();
      if (auth.currentUser !== user || user !== editingUser) throw authError('edit/session');
      if (!Object.keys(payload).length) return;
      // No hay await entre la comprobación y la emisión de la escritura al UID actual.
      await update(ref(database, 'usuarios/' + auth.currentUser.uid), payload);
      if (auth.currentUser !== user) throw authError('edit/session');
    },
  });
}
