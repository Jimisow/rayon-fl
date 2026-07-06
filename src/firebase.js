import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3IRp17CEjcVPz64_nqlTMOauAfWPO6o8",
  authDomain: "amour-pei.firebaseapp.com",
  projectId: "amour-pei",
  storageBucket: "amour-pei.firebasestorage.app",
  messagingSenderId: "451458426014",
  appId: "1:451458426014:web:9351a61f012b853912878f",
};

export const app = initializeApp(firebaseConfig);

// Persistance hors-ligne (IndexedDB) avec resynchronisation automatique au retour réseau.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
