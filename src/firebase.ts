import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDfPI7Ly-FwZd0f6dBQcRZgBApbhAx79V0",
  authDomain: "webhook-4dd1d.firebaseapp.com",
  projectId: "webhook-4dd1d",
  storageBucket: "webhook-4dd1d.firebasestorage.app",
  messagingSenderId: "320393731957",
  appId: "1:320393731957:web:cbbaec8d985634d03abd3c"
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
