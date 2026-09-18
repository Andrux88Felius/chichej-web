// Configuración pública Web oficial proporcionada por Eduardo. No contiene privilegios administrativos.
export const firebaseConfig = Object.freeze({
  apiKey: 'AIzaSyBlEAKk8ipnVA__EStSCJQ0sZEXlQd0Mec',
  authDomain: 'chichej-2026.firebaseapp.com',
  databaseURL: 'https://chichej-2026-default-rtdb.firebaseio.com',
  projectId: 'chichej-2026',
  storageBucket: 'chichej-2026.firebasestorage.app',
  messagingSenderId: '152737624623',
  appId: '1:152737624623:web:3b3dc92078dd21484e4cda',
});
export let db = null;

export async function getProductsDatabase() {
  if (!['apiKey', 'projectId', 'appId'].every(key => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim())) {
    const error = new Error('Firebase Web configuration unavailable');
    error.code = 'configuration-missing';
    throw error;
  }
  // Versión fija oficial; no Auth, Analytics, RTDB ni persistencia local.
  const [{ initializeApp }, { getFirestore, collection, getDocs }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js'),
  ]);
  db ??= getFirestore(initializeApp(firebaseConfig, 'chichej-public-catalog'));
  return { db, collection, getDocs };
}
