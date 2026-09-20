import {getFirebaseApp} from './firebase-config.js';
import {getSession} from './auth-firebase.js';
import {profileForUser} from './auth-state.js';
import {createReservationsStore} from './reservations-store.js';
export async function getReservations() {
  const [app,session,authSDK,rtdb,fs]=await Promise.all([getFirebaseApp(),getSession(),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')]);
  const auth=authSDK.getAuth(app),database=rtdb.getDatabase(app),db=fs.getFirestore(app);
  return createReservationsStore({
    currentUser:()=>auth.currentUser,
    async profile(user) {
      const snapshot=await rtdb.get(rtdb.ref(database,'usuarios/'+user.uid));
      try {return profileForUser(user,snapshot.val());} catch(error) {await session.refresh();throw error;}
    },
    async listOwn() {
      const snapshot=await fs.getDocsFromServer(fs.query(fs.collection(db,'reservas'),fs.where('usuarioId','==',auth.currentUser.uid)));
      return snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
    },
    newId:()=> 'res_'+Array.from(crypto.getRandomValues(new Uint8Array(12)),byte=>byte.toString(16).padStart(2,'0')).join(''),
    requestedDate:value=>fs.Timestamp.fromDate(new Date(value+'T16:00:00Z')),
    serverTime:()=>fs.serverTimestamp(),
    transaction:operation=>fs.runTransaction(db,tx=>operation({
      get:id=>tx.get(fs.doc(db,'reservas',id)),
      create:(id,payload)=>tx.set(fs.doc(db,'reservas',id),payload),
      cancel:(id,payload)=>tx.update(fs.doc(db,'reservas',id),payload),
    })),
  });
}
