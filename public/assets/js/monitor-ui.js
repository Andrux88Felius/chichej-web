import {getFirebaseApp} from './firebase-config.js';
import {getSession} from './auth-firebase.js';
import {mountMonitor} from './monitor-view.js';
mountMonitor({getFirebaseApp,getSession,loadSDK:kind=>kind==='database'?import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js'):import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')});
