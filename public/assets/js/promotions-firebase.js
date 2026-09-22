import {getFirebaseApp} from './firebase-config.js';
export async function readPromotions(authenticated=false) {
  const [app,fs]=await Promise.all([getFirebaseApp(),import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')]);
  const constraints=[fs.where('activo','==',true)];
  if(!authenticated)constraints.push(fs.where('tipo','==','promocion'));
  const snapshot=await fs.getDocsFromServer(fs.query(fs.collection(fs.getFirestore(app),'mensajes'),...constraints));
  return snapshot.docs.map(doc=>({id:doc.id,data:doc.data()}));
}
