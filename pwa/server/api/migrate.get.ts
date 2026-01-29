import { useFirebase } from '../utils/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export default defineEventHandler(async (event) => {
    const db = useFirebase();
    // Target date: 2026-01-28
    const TARGET_DATE = '2026-01-28';
    const log = [];

    try {
        // 1. Get all users
        const usersRef = db.collection('users');
        const usersSnapshot = await usersRef.listDocuments();

        log.push(`Found ${usersSnapshot.length} users.`);

        for (const userDoc of usersSnapshot) {
            const userId = userDoc.id;
            log.push(`Processing user: ${userId}`);

            // 2. Get daily-logs collection
            const dailyLogsRef = userDoc.collection('daily-logs');
            const dailyLogsSnapshot = await dailyLogsRef.get();

            if (dailyLogsSnapshot.empty) {
                log.push(`  - No daily logs found.`);
                continue;
            }

            let allGoals: any[] = [];

            // 3. Collect goals from non-target dates
            for (const doc of dailyLogsSnapshot.docs) {
                if (doc.id === TARGET_DATE) continue; // Skip target date for now

                const data = doc.data();
                if (data.goals && Array.isArray(data.goals)) {
                    allGoals = [...allGoals, ...data.goals];
                    log.push(`  - Collected ${data.goals.length} goals from ${doc.id}`);
                }
            }

            if (allGoals.length === 0) {
                log.push(`  - No goals to migrate.`);
                continue;
            }

            // 4. Merge into Target Document
            const targetDocRef = dailyLogsRef.doc(TARGET_DATE);
            const targetDoc = await targetDocRef.get();

            let existingGoals: any[] = [];
            if (targetDoc.exists) {
                const data = targetDoc.data();
                if (data?.goals && Array.isArray(data.goals)) {
                    existingGoals = data.goals;
                }
            }

            // Simple merge: Append migrated goals to existing ones
            // (Optional: Dedup logic could go here, but plan said merge)
            const finalGoals = [...existingGoals, ...allGoals];

            await targetDocRef.set({
                goals: finalGoals,
                id: TARGET_DATE,
                migratedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            log.push(`  - SAVED ${finalGoals.length} total goals to ${TARGET_DATE}`);
        }

        return {
            success: true,
            message: 'Migration complete',
            logs: log
        };

    } catch (e: any) {
        return {
            success: false,
            error: e.message,
            stack: e.stack,
            logs: log
        };
    }
});
