import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || '',
  authDomain: firebaseConfigJson.authDomain || '',
  projectId: firebaseConfigJson.projectId || '',
  storageBucket: firebaseConfigJson.storageBucket || '',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '',
  appId: firebaseConfigJson.appId || '',
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with auto-detect long polling for resilient connection behind proxies/iframes
const dbId =
  firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
    ? firebaseConfigJson.firestoreDatabaseId
    : undefined;

let firestoreInstance;
try {
  firestoreInstance = dbId
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, dbId)
    : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch {
  firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = firestoreInstance;

// Initialize Storage
export const storage = getStorage(app);

export default app;
