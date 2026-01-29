import { useFirebase } from '../utils/firebase';

export default defineEventHandler(async (event) => {
    const db = useFirebase();
    const log = [];

    try {
        const usersRef = db.collection('users');
        const usersSnapshot = await usersRef.listDocuments();

        log.push(`Found ${usersSnapshot.length} users.`);

        const results = [];

        for (const userDoc of usersSnapshot) {
            const collections = await userDoc.listCollections();
            const colNames = collections.map(c => c.id);

            results.push({
                uid: userDoc.id,
                collections: colNames
            });

            log.push(`User ${userDoc.id} has collections: ${colNames.join(', ')}`);
        }

        return {
            success: true,
            results,
            logs: log
        };

    } catch (e: any) {
        return {
            success: false,
            error: e.message,
            stack: e.stack
        };
    }
});
