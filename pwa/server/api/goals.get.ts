import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js';
import { useFirebase } from '../utils/firebase';
import { requireAuth } from '../utils/auth';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

const COLLECTIONS = {
    daily: 'daily-logs',
    weekly: 'weekly-logs',
    monthly: 'monthly-logs',
    quarterly: 'quarterly-logs',
    yearly: 'yearly-logs'
};

function getDocId(timeframe: string, dateStr?: string) {
    const now = dateStr ? dayjs(dateStr) : dayjs();
    switch (timeframe) {
        case 'daily': return now.format('YYYY-MM-DD');
        case 'weekly': return `${now.isoWeekYear()}-W${String(now.isoWeek()).padStart(2, '0')}`;
        case 'monthly': return now.format('YYYY-MM');
        case 'quarterly': return `${now.year()}-Q${now.quarter()}`;
        case 'yearly': return now.format('YYYY');
        default: throw new Error(`Unknown timeframe: ${timeframe}`);
    }
}

async function carryOverGoals(db: any, uid: string, todayDocId: string) {
    // 1. Find last available daily log
    const dailyRef = db.collection('users').doc(uid).collection('daily-logs');
    const snapshot = await dailyRef
        .where('id', '<', todayDocId)
        .orderBy('id', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const lastDoc = snapshot.docs[0];
    const lastData = lastDoc.data();

    if (!lastData.goals || !Array.isArray(lastData.goals)) return null;

    // 2. Filter incompletes that haven't been rolled over yet
    const incompleteGoals = lastData.goals.filter((g: any) => !g.completed && !g.rolledOver);

    if (incompleteGoals.length === 0) return null;

    const todayDate = dayjs(todayDocId);
    const promotedGoals: any[] = [];
    const rolloverGoals: any[] = [];

    const goalsToMarkRolledOver: any[] = [];

    // 3. Process each goal
    for (const goal of incompleteGoals) {
        // Mark for update in source doc
        goalsToMarkRolledOver.push(goal);

        // Clone goal for new destination to avoid reference issues
        const newGoal = { ...goal };

        // Use createdAt if available, otherwise assume it was created on the day of the last log
        // IMPORTANT: If we backfill it here, we must ensure 'goal' object is updated so it carries over with the date
        if (!newGoal.createdAt) {
            newGoal.createdAt = dayjs(lastData.id).toISOString();
        }

        const createdDate = dayjs(newGoal.createdAt);
        const ageInDays = todayDate.diff(createdDate, 'day');

        if (ageInDays >= 7) {
            promotedGoals.push(newGoal);
        } else {
            rolloverGoals.push(newGoal);
        }
    }

    // 4. Save updates
    const batch = db.batch();

    // Add rollovers to today
    // Add rollovers to today
    if (rolloverGoals.length > 0) {
        const todayRef = dailyRef.doc(todayDocId);
        const todayDoc = await todayRef.get();
        const existingTodayDetails = todayDoc.exists ? todayDoc.data().goals || [] : [];

        // Avoid adding if already somehow present (though rolledOver flag should prevent this)
        const newGoals = [...existingTodayDetails, ...rolloverGoals];

        batch.set(todayRef, {
            id: todayDocId,
            goals: newGoals,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }

    // Add promoted to current weekly
    if (promotedGoals.length > 0) {
        const weekId = getDocId('weekly', todayDocId);
        const weeklyRef = db.collection('users').doc(uid).collection('weekly-logs').doc(weekId);

        // We need to use arrayUnion, but we don't have the explicit firebase-admin import here typically
        // So we'll read, append, write for simplicity/reliability in this context or use FieldValue if available
        // Let's check imports. We don't have FieldValue imported. Let's try read-modify-write for weekly.
        const weeklyDoc = await weeklyRef.get();
        const existingWeekly = weeklyDoc.exists ? weeklyDoc.data().goals || [] : [];
        const mergedWeekly = [...existingWeekly, ...promotedGoals];

        batch.set(weeklyRef, {
            id: weekId,
            goals: mergedWeekly,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }

    // Mark items as rolledOver in the source doc
    if (goalsToMarkRolledOver.length > 0) {
        const updatedSourceGoals = lastData.goals.map((g: any) => {
            const isRolled = goalsToMarkRolledOver.find(r => r.id === g.id);
            if (isRolled) {
                return { ...g, rolledOver: true };
            }
            return g;
        });

        batch.update(lastDoc.ref, {
            goals: updatedSourceGoals,
            updatedAt: new Date().toISOString()
        });
    }

    await batch.commit();

    return {
        daily: rolloverGoals.length > 0 ? { goals: rolloverGoals } : { goals: [] },
        promotedCount: promotedGoals.length
    };
}

export default defineEventHandler(async (event) => {
    // Require authentication
    const user = await requireAuth(event);

    const db = useFirebase();
    const query = getQuery(event);
    const dateStr = query.date as string | undefined;

    const timeframes = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    const results: Record<string, any> = {};

    // Fetch from user-scoped subcollections
    await Promise.all(timeframes.map(async (tf) => {
        try {
            const docId = getDocId(tf, dateStr);
            const collectionName = COLLECTIONS[tf as keyof typeof COLLECTIONS];

            // User-scoped path: users/{uid}/{timeframe}-logs/{docId}
            const docRef = db.collection('users').doc(user.uid)
                .collection(collectionName).doc(docId);
            const doc = await docRef.get();

            if (tf === 'daily') {
                // Check if the requested date is actually "Today"
                // getDocId('daily') returns today's ID by default
                const isToday = docId === getDocId('daily');

                if (isToday) {
                    // Trigger rollover check EVERY time we load "Today", 
                    // regardless of whether today's doc exists or not.
                    const carried = await carryOverGoals(db, user.uid, docId);

                    // If we did a rollover, we need to explicitly return the MERGED result
                    // because doc.data() above (if doc existed) would be stale.
                    if (carried && (carried.daily || carried.promotedCount > 0)) {
                        // Refetch today to get the fresh state including rollovers
                        // (Optimization: we could construct it manually but refetch is safer)
                        const freshDoc = await docRef.get();
                        results[tf] = freshDoc.exists ? freshDoc.data() : { goals: [] };
                        return;
                    }
                }
            }

            results[tf] = doc.exists ? doc.data() : { goals: [] };
        } catch (e) {
            console.error(`Error fetching ${tf}`, e);
            results[tf] = { goals: [] };
        }
    }));

    return results;
});
