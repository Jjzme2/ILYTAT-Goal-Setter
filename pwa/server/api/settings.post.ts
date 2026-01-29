import { useFirebase } from '../utils/firebase';
import { requireAuth } from '../utils/auth';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const db = useFirebase();
    const body = await readBody(event);
    const { categories, templates } = body;

    const updates: any = {};

    if (categories) {
        if (!Array.isArray(categories)) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid categories format' });
        }
        updates.categories = categories;
    }

    if (templates) {
        if (!Array.isArray(templates)) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid templates format' });
        }
        updates.templates = templates;
    }

    const settingsRef = db.collection('users').doc(user.uid).collection('meta').doc('settings');
    await settingsRef.set(updates, { merge: true });

    return { success: true };
});
