import { useFirebase } from '../utils/firebase';
import { requireAuth } from '../utils/auth';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const db = useFirebase();

    const settingsRef = db.collection('users').doc(user.uid).collection('meta').doc('settings');
    const doc = await settingsRef.get();

    if (doc.exists) {
        return doc.data();
    }

    return {
        categories: ['Work', 'Personal', 'Family', 'Health']
    };
});
