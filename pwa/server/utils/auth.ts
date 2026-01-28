import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { H3Event } from 'h3';
import { useFirebase } from './firebase';

/**
 * Extract and verify the Firebase ID token from the request
 * Returns the decoded token with user info, or null if not authenticated
 */
export async function getUserFromRequest(event: H3Event) {
    const authHeader = getHeader(event, 'authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const idToken = authHeader.slice(7);

    try {
        // Ensure Firebase Admin is initialized
        useFirebase();

        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(idToken);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture
        };
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

/**
 * Require authentication - throws 401 if not authenticated
 */
export async function requireAuth(event: H3Event) {
    const user = await getUserFromRequest(event);

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized - Please sign in'
        });
    }

    return user;
}
