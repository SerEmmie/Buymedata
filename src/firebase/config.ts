import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress Firestore internal idle stream housekeeping messages from surfacing as errors
setLogLevel('silent');

// Filter out benign Google Cloud Firestore idle stream timeout notices from console.error/warn
const filterFirestoreIdleLog = (originalFn: (...args: any[]) => void) => {
  return (...args: any[]) => {
    if (
      args.length > 0 &&
      typeof args[0] === 'string' &&
      args[0].includes('@firebase/firestore') &&
      args[0].includes('Disconnecting idle stream')
    ) {
      // Ignored: Benign Firestore gRPC stream disconnection during idle periods.
      return;
    }
    originalFn(...args);
  };
};

if (typeof console !== 'undefined') {
  console.error = filterFirestoreIdleLog(console.error);
  console.warn = filterFirestoreIdleLog(console.warn);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Firestore with explicit database ID from config (CRITICAL: Required by Firebase skill)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity check as required by Firebase skill (run once upon client boot)
let connectionTested = false;
export async function testConnection() {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline. Please check network connectivity.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}
