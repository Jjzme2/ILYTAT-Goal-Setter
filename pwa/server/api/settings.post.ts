import { useFirebase } from '../utils/firebase';
import { requireAuth } from '../utils/auth';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const db = useFirebase();
    const body = await readBody(event);
    const { categories } = body;

    if (!Array.isArray(categories)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid categories format',
        });
    }

    const settingsRef = db.collection('users').doc(user.uid).collection('meta').doc('settings');
    await settingsRef.set({ categories }, { merge: true });

    return { success: true };
});
