/**
 * Firebase Client Configuration
 * Compatible with standard Vite/React deployments on Vercel and Google Cloud.
 * Reads public client credentials from VITE_FIREBASE_* environment variables.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  type Firestore,
} from 'firebase/firestore';

// Suppress noisy internal offline/unavailable logs from @firebase/firestore
try {
  setLogLevel('silent');
} catch {
  // Ignore if already set
}

interface FirebaseConfigObject {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const envConfig: FirebaseConfigObject = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let isConfigured = false;

// Check if valid Firebase configuration is provided
if (envConfig.projectId && envConfig.apiKey && envConfig.projectId !== 'tu-equipo-futbol') {
  try {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(envConfig);
    
    // Initialize Firestore with ignoreUndefinedProperties and robust connection settings
    try {
      firestoreInstance = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
      });
    } catch {
      // In case initializeFirestore was already called on this app instance
      firestoreInstance = getFirestore(app);
    }
    
    isConfigured = true;
    console.info('Firebase Firestore initialized successfully with project:', envConfig.projectId);
  } catch (err) {
    console.warn('Could not initialize Firebase Firestore with env vars:', err);
    app = null;
    firestoreInstance = null;
    isConfigured = false;
  }
} else {
  console.info(
    'Firebase Firestore is in standard preview/local-storage mode. Add VITE_FIREBASE_* in Vercel or .env to persist to live Cloud Firestore.'
  );
}

export const firebaseApp = app;
export const db = firestoreInstance;
export const isFirebaseConfigured = isConfigured;

