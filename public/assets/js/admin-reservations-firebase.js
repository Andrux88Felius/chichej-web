import {getFirebaseApp} from './firebase-config.js';
import {getSession} from './auth-firebase.js';
import {requireAdminProfile} from './admin-guard.js';
import {createAdminReservationsStore} from './admin-reservations-store.js';
export async function getAdminReservations() {
  const [app,session,authSDK,rtdb,fs]=await Promise.all([getFirebaseApp(),getSession(),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')]);
  const auth=authSDK.getAuth(app),database=rtdb.getDatabase(app),db=fs.getFirestore(app);
  return createAdminReservationsStore({
    currentUser:()=>auth.currentUser,
    async profile(user) {
      try {const snapshot=await rtdb.get(rtdb.ref(database,'usuarios/'+user.uid));return requireAdminProfile(user,snapshot.val());}
      catch(error) {await session.refresh();throw error;}
    },
    async listAll() {
      const snapshot=await fs.getDocsFromServer(fs.collection(db,'reservas'));
      return snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
    },
    serverTime:()=>fs.serverTimestamp(),
    transaction:operation=>fs.runTransaction(db,tx=>operation({
      get:id=>tx.get(fs.doc(db,'reservas',id)),
      updateState:(id,payload)=>tx.update(fs.doc(db,'reservas',id),payload),
    })),
  });
}
