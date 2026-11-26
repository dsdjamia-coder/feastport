// firebase-config.js
// Centralized Firebase Configuration File

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQgPVNSb2egQK2CHtGCwituXNH5dCNk0g",
  authDomain: "fast-portal-003.firebaseapp.com",
  projectId: "fast-portal-003",
  storageBucket: "fast-portal-003.firebasestorage.app",
  messagingSenderId: "815494478086",
  appId: "1:815494478086:web:b2fcdaa0adde8cf8fa4687",
  measurementId: "G-H3SDSG82Z7"
};

const useEmulators = import.meta.env?.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === '1';
const emulatorHost = '127.0.0.1';
const demoProject = 'demo-feastport';
const app = initializeApp(useEmulators ? {
  apiKey: 'demo-api-key',
  projectId: demoProject,
  storageBucket: `${demoProject}.appspot.com`
} : firebaseConfig);

function configureFirebaseAuth(auth) {
  if (useEmulators) connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
  return auth;
}

const auth = configureFirebaseAuth(getAuth(app));
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

if (useEmulators) {
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectStorageEmulator(storage, emulatorHost, 9199);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
} else {
  enableIndexedDbPersistence(db).catch((error) => {
    if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
      console.info('Offline persistence is unavailable in this browser session.');
    } else {
      console.warn('Unable to enable offline persistence.', error);
    }
  });
}

export { app, auth, db, storage, functions, configureFirebaseAuth };
