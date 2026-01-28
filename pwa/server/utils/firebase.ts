import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let db: FirebaseFirestore.Firestore;

export const useFirebase = () => {
    if (db) return db;

    const apps = getApps();

    if (apps.length) {
        console.log('[Firebase] Using existing app');
        db = getFirestore(apps[0]);
        return db;
    }

    let serviceAccount;
    let credSource = 'none';

    // 1. Try individual environment variables (Vercel/Netlify/Heroku)
    const hasEnvVars = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
    console.log('[Firebase] Env vars present:', hasEnvVars);
    console.log('[Firebase] PROJECT_ID exists:', !!process.env.FIREBASE_PROJECT_ID);
    console.log('[Firebase] CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log('[Firebase] PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    console.log('[Firebase] PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length || 0);

    if (hasEnvVars) {
        credSource = 'env';
        const rawKey = process.env.FIREBASE_PRIVATE_KEY!;
        const processedKey = rawKey.replace(/\\n/g, '\n');

        console.log('[Firebase] Raw key starts with:', rawKey.substring(0, 30));
        console.log('[Firebase] Raw key contains literal \\n:', rawKey.includes('\\n'));
        console.log('[Firebase] Processed key starts with:', processedKey.substring(0, 30));

        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: processedKey
        };
    }

    // 2. Fallback: Local file (for local dev compatibility with CLI)
    if (!serviceAccount) {
        const localPath = path.join(os.homedir(), '.config/ilytat goal setter/service-account.json');
        console.log('[Firebase] Checking local path:', localPath);
        if (fs.existsSync(localPath)) {
            try {
                serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
                credSource = 'local-file';
                console.log('[Firebase] Loaded from local file');
            } catch (e) {
                console.error('[Firebase] Failed to read local service account', e);
            }
        }
    }

    if (!serviceAccount) {
        console.error('[Firebase] No credentials found!');
        throw new Error('Firebase Config Missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars.');
    }

    console.log('[Firebase] Credential source:', credSource);
    console.log('[Firebase] Project ID:', serviceAccount.projectId);
    console.log('[Firebase] Client Email:', serviceAccount.clientEmail);

    try {
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('[Firebase] App initialized successfully');
    } catch (initError) {
        console.error('[Firebase] App initialization failed:', initError);
        throw initError;
    }

    db = getFirestore();
    console.log('[Firebase] Firestore instance created');
    return db;
}
