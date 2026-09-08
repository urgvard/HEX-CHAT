import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  Auth
} from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseCustomConfig } from '../types';

const PLACEHOLDER_API_KEY = 'AIzaSyDemoCommunityKey_Placeholder123';

// True only for the non-functional built-in placeholder config (no real
// VITE_FIREBASE_* env vars set and no custom config saved via the Setup
// modal). Used to decide whether the "instant explore" demo fallback
// profile is appropriate to show, versus a real deployment where it would
// just mask a genuine connection/auth problem.
export function isPlaceholderConfig(config: FirebaseCustomConfig): boolean {
  return config.apiKey === PLACEHOLDER_API_KEY;
}

// Baked in at build time from Netlify/Vite env vars when present (see .env.example).
// Falls back to a non-functional placeholder for local dev without a .env file —
// the app then runs in local-storage demo mode until a user configures Firebase
// at runtime via the Setup modal.
const ENV_FIREBASE_CONFIG: FirebaseCustomConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoCommunityKey_Placeholder123",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "community-app-hub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "community-app-hub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "community-app-hub.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
};

export const DEFAULT_FIREBASE_CONFIG: FirebaseCustomConfig = ENV_FIREBASE_CONFIG;

const STORAGE_KEY = 'community_hub_firebase_config';

export function getStoredFirebaseConfig(): FirebaseCustomConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not read stored Firebase config', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveStoredFirebaseConfig(config: FirebaseCustomConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

export function initFirebase(config: FirebaseCustomConfig = getStoredFirebaseConfig()) {
  try {
    let isNewApp = false;
    if (!getApps().length) {
      appInstance = initializeApp(config);
      isNewApp = true;
    } else {
      appInstance = getApp();
    }
    // initializeAuth() (like initializeFirestore() below) can only be called once
    // per app. The explicit persistence fallback chain matters on iOS
    // Safari/WKWebView and some restrictive Android WebViews, where IndexedDB can
    // be unavailable or blocked (Private Browsing, storage quota, older WebKit
    // versions) -- getAuth()'s implicit default can fail outright there instead
    // of degrading gracefully to a working (if less persistent) option.
    authInstance = isNewApp
      ? initializeAuth(appInstance, {
          persistence: [
            indexedDBLocalPersistence,
            browserLocalPersistence,
            browserSessionPersistence,
            inMemoryPersistence
          ]
        })
      : getAuth(appInstance);
    // initializeFirestore() can only be called once per app (it throws on a second
    // call, unlike getFirestore()); ignoreUndefinedProperties lets writes include
    // optional fields left as `undefined` (e.g. no attachment on a notice/message)
    // without addDoc/setDoc throwing "Unsupported field value: undefined".
    // experimentalAutoDetectLongPolling works around certain mobile/cellular
    // carriers and proxies that silently break Firestore's default WebChannel
    // streaming transport -- onSnapshot listeners hang forever (stuck loading
    // skeletons) instead of erroring, with no console signal, until this falls
    // back to long-polling automatically.
    dbInstance = isNewApp
      ? initializeFirestore(appInstance, {
          ignoreUndefinedProperties: true,
          experimentalAutoDetectLongPolling: true
        })
      : getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
    return { app: appInstance, auth: authInstance, db: dbInstance, storage: storageInstance, isLive: true };
  } catch (err) {
    if (isPlaceholderConfig(config)) {
      console.info('No Firebase config set -- running in local-storage demo mode.', err);
    } else {
      // A real project is configured but init genuinely failed (e.g. storage
      // APIs blocked/unavailable on this browser). Surface this loudly --
      // silently falling back to demo mode here would otherwise look
      // identical to a working live app, just with fake data.
      console.error('Firebase initialization failed for a configured live project:', err);
    }
    return { app: null, auth: null, db: null, storage: null, isLive: false };
  }
}

// Error handling standard conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentAuth?.uid || null,
      email: currentAuth?.email || null,
      emailVerified: currentAuth?.emailVerified || null,
      isAnonymous: currentAuth?.isAnonymous || null,
    }
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}
