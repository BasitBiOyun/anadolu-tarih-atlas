import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const FIREBASE_PROJECT_ID = 'hiddenfeed';
export const FIRESTORE_DATABASE_ID = 'ai-studio-anadolutarihnces-f71dcc77-2c3d-464d-a885-67c82d256cf1';

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        projectId: FIREBASE_PROJECT_ID
      });

/**
 * Privileged server-only Firestore client.
 *
 * Cloud Run supplies Application Default Credentials through its service identity.
 * This client bypasses browser Firestore Security Rules, so public rules can remain
 * read-only while ingestion writes stay restricted to the authenticated server API.
 */
export const serverDb = getFirestore(adminApp, FIRESTORE_DATABASE_ID);
