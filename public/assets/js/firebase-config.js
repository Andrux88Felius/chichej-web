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
let appPromise;

export function getFirebaseApp() {
  appPromise ??= import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js')
    .then(({ initializeApp }) => initializeApp(firebaseConfig, 'chichej-public-catalog'))
    .catch(error => { appPromise = undefined; throw error; });
  return appPromise;
}

export async function getProductsDatabase() {
  if (!['apiKey', 'projectId', 'appId'].every(key => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim())) {
    const error = new Error('Firebase Web configuration unavailable');
    error.code = 'configuration-missing';
    throw error;
  }
  // El catálogo comparte la aplicación Web con Authentication, sin escribir datos.
  const [app, { getFirestore, collection, getDocs }] = await Promise.all([
    getFirebaseApp(),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js'),
  ]);
  db ??= getFirestore(app);
  return { db, collection, getDocs };
}
