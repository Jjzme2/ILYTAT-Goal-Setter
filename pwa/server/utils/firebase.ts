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
        db = getFirestore(apps[0]);
        return db;
    }

    let serviceAccount;

    // 1. Try individual environment variables (Vercel/Netlify/Heroku)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // If the key is wrapped in quotes (JSON string), parse it to decode \n properly
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            try {
                privateKey = JSON.parse(privateKey);
            } catch {
                // If parse fails, try the replace method
                privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
            }
        } else {
            // No quotes - just replace escaped newlines
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
        };
    }

    // 2. Fallback: Local file (for local dev compatibility with CLI)
    if (!serviceAccount) {
        const localPath = path.join(os.homedir(), '.config/ilytat goal setter/service-account.json');
        if (fs.existsSync(localPath)) {
            try {
                serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
            } catch (e) {
                console.error('Failed to read local service account', e);
            }
        }
    }

    if (!serviceAccount) {
        throw new Error('Firebase Config Missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars.');
    }

    initializeApp({
        credential: cert(serviceAccount)
    });

    db = getFirestore();
    return db;
}
