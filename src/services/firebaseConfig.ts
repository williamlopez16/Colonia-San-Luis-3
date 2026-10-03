/**
 * Firebase Client Configuration
 * Connects to the central Cloud Firestore database.
 * Uses provisioned credentials from firebase-applet-config.json.
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

export interface FirebaseConfigObject {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseId: string;
}

// Canonical provisioned configuration
const finalConfig: FirebaseConfigObject = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId,
  databaseId: appletConfig.firestoreDatabaseId,
};

// Allow valid production overrides, while explicitly ignoring obsolete/invalid project IDs
const envProject = import.meta.env.VITE_FIREBASE_PROJECT_ID;
if (
  envProject &&
  envProject !== 'colonia-san-luis-perla-v-15cb7' &&
  envProject !== 'tu-equipo-futbol'
) {
  finalConfig.projectId = envProject;
  if (import.meta.env.VITE_FIREBASE_API_KEY) finalConfig.apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) finalConfig.authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  if (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) finalConfig.storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  if (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) finalConfig.messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  if (import.meta.env.VITE_FIREBASE_APP_ID) finalConfig.appId = import.meta.env.VITE_FIREBASE_APP_ID;
  if (import.meta.env.VITE_FIREBASE_DATABASE_ID) finalConfig.databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
}

let app: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let isConfigured = false;

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

  // Initialize Firestore with the named database ID
  try {
    firestoreInstance = initializeFirestore(
      app,
      { ignoreUndefinedProperties: true },
      finalConfig.databaseId
    );
  } catch {
    firestoreInstance = getFirestore(app, finalConfig.databaseId);
  }

  isConfigured = true;
  console.info(
    'Firebase Firestore conectado centralmente al proyecto:',
    finalConfig.projectId,
    'base de datos:',
    finalConfig.databaseId
  );
} catch (err) {
  console.error('Error al inicializar Firebase Firestore:', err);
  app = null;
  firestoreInstance = null;
  isConfigured = false;
}

export const firebaseApp = app;
export const db = firestoreInstance;
export const isFirebaseConfigured = isConfigured;
export const activeFirebaseConfig = finalConfig;
