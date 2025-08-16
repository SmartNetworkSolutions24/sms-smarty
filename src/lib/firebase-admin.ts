// src/lib/firebase-admin.ts
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Leemos variables de entorno que definiste en apphosting.yaml
 * y normalizamos la private_key para soportar "\n" literales.
 */
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

// Evita re-inicializar en entornos con hot-reload
if (!getApps().length) {
  if (!projectId || !clientEmail || !privateKey) {
    // No lanzamos error para no romper el webhook; solo log útil.
    console.warn('[firebase-admin] Missing env vars. Check apphosting.yaml');
  } else {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

// Exporta una instancia lista para usar en endpoints/server
export const db = getFirestore();
