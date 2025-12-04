import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import serviceAccount from './service_account.json';
import type { ServiceAccount } from 'firebase-admin/app';

let db: Firestore;
try {
  const app = initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
  });
  db = getFirestore(app);
  console.log('Firebase Admin initialized ');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

export { db };
