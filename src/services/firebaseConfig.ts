/**
 * Firebase Client Configuration
 * Compatible with standard Vite/React deployments on Vercel and Google Cloud.
 * Reads configuration from bundled firebase-applet-config.json and/or VITE_FIREBASE_* environment variables.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  type Firestore,
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

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
  databaseId?: string;
}

// Prefer provisioned appletConfig from Google Cloud / Firebase setup, with env var override support
const finalConfig: FirebaseConfigObject = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId,
};

let app: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let isConfigured = false;

if (finalConfig.projectId && finalConfig.apiKey && finalConfig.projectId !== 'tu-equipo-futbol') {
  try {
    const existingApps = getApps();
    app =
      existingApps.length > 0
        ? existingApps[0]
        : initializeApp({
            apiKey: finalConfig.apiKey,
            authDomain: finalConfig.authDomain,
            projectId: finalConfig.projectId,
            storageBucket: finalConfig.storageBucket,
            messagingSenderId: finalConfig.messagingSenderId,
            appId: finalConfig.appId,
          });

    // Initialize Firestore with named database if provided and ignoreUndefinedProperties
    try {
      if (finalConfig.databaseId) {
        firestoreInstance = initializeFirestore(
          app,
          { ignoreUndefinedProperties: true },
          finalConfig.databaseId
        );
      } else {
        firestoreInstance = initializeFirestore(app, {
          ignoreUndefinedProperties: true,
        });
      }
    } catch {
      // In case initializeFirestore was already called on this app instance
      firestoreInstance = finalConfig.databaseId
        ? getFirestore(app, finalConfig.databaseId)
        : getFirestore(app);
    }

    isConfigured = true;
    console.info(
      'Firebase Firestore initialized successfully with project:',
      finalConfig.projectId,
      'database:',
      finalConfig.databaseId || '(default)'
    );
  } catch (err) {
    console.warn('Could not initialize Firebase Firestore:', err);
    app = null;
    firestoreInstance = null;
    isConfigured = false;
  }
} else {
  console.info('Firebase Firestore is in standard preview/local-storage mode.');
}

export const firebaseApp = app;
export const db = firestoreInstance;
export const isFirebaseConfigured = isConfigured;
export const activeFirebaseConfig = finalConfig;
