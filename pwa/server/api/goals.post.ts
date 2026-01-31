import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js';
import { FieldValue } from 'firebase-admin/firestore';
import { useFirebase } from '../utils/firebase';
import { requireAuth } from '../utils/auth';
import type { GoalOperation, Goal, GoalCollection } from '@ilytat/common';

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
    const now = dateStr ? dayjs(dateStr) : dayjs(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })); // Simple fix for timezone or just use utc by default if prefer
    // Actually, stick to existing logic but maybe default to now if no date provided
    const d = dateStr ? dayjs(dateStr) : dayjs();

    switch (timeframe) {
        case 'daily': return d.format('YYYY-MM-DD');
        case 'weekly': return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`;
        case 'monthly': return d.format('YYYY-MM');
        case 'quarterly': return `${d.year()}-Q${d.quarter()}`;
        case 'yearly': return d.format('YYYY');
        default: throw new Error(`Unknown timeframe: ${timeframe}`);
    }
}

export default defineEventHandler(async (event) => {
    // Require authentication
    const user = await requireAuth(event);
    const db = useFirebase();
    const body = await readBody(event);

    // Detect if this is a legacy payload or new operation
    // Legacy: { timeframe, data: { goals: [...] }, date }
    // New: { operation, timeframe, goal?, goals?, date? }

    let operation: string = 'set';
    let timeframe: string;
    let date: string | undefined;
    let goal: Goal | undefined;
    let goals: Goal[] | undefined;

    if (body.operation) {
        // New Mode
        const op = body as GoalOperation;
        operation = op.operation;
        timeframe = op.timeframe;
        date = op.date;
        goal = op.goal;
        goals = op.goals;
    } else {
        // Legacy Mode
        timeframe = body.timeframe;
        date = body.date;
        if (body.data && body.data.goals) {
            goals = body.data.goals;
        }
        operation = 'set';
    }

    if (!timeframe) {
        throw createError({ statusCode: 400, statusMessage: 'Missing timeframe' });
    }

    const tfKey = timeframe as keyof typeof COLLECTIONS;
    if (!COLLECTIONS[tfKey]) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid timeframe' });
    }

    try {
        const docId = getDocId(timeframe, date);
        const docRef = db.collection('users').doc(user.uid)
            .collection(COLLECTIONS[tfKey]).doc(docId);

        // Handle Operations
        const timestamp = FieldValue.serverTimestamp();

        if (operation === 'set') {
            // Full replace/merge of the doc
            if (!goals) throw createError({ statusCode: 400, statusMessage: 'Missing goals for set operation' });

            const payload = {
                id: docId,
                goals,
                updatedAt: timestamp
            };

            // Legacy handling implies we might be sending other fields in 'data', but broadly we just care about goals
            // If body.data had other props, we might lose them if we strictly use 'goals' variable. 
            // But strict typing is better.

            await docRef.set(payload, { merge: true });

        } else if (operation === 'add') {
            if (!goal) throw createError({ statusCode: 400, statusMessage: 'Missing goal for add operation' });

            // Ensure goal has ID
            if (!goal.id) {
                // Generate ID if missing (though client should ideally provide uuid)
                goal.id = crypto.randomUUID();
            }
            if (!goal.createdAt) {
                goal.createdAt = new Date().toISOString();
            }

            // Use arrayUnion to append atomically
            await docRef.set({
                id: docId,
                updatedAt: timestamp
            }, { merge: true }); // Ensure doc exists

            await docRef.update({
                goals: FieldValue.arrayUnion(goal)
            });

        } else if (operation === 'update') {
            if (!goal) throw createError({ statusCode: 400, statusMessage: 'Missing goal for update operation' });

            // Read-modify-write is safest for updating an item in an array in Firestore 
            // unless we structure goals as a subcollection or map (which we don't, it's an array)
            await db.runTransaction(async (t) => {
                const doc = await t.get(docRef);
                if (!doc.exists) throw new Error('Document does not exist');

                const data = doc.data() as GoalCollection;
                const existingGoals = data.goals || [];
                const idx = existingGoals.findIndex(g => g.id === goal!.id);

                if (idx > -1) {
                    existingGoals[idx] = { ...existingGoals[idx], ...goal }; // Merge updates
                    t.update(docRef, {
                        goals: existingGoals,
                        updatedAt: timestamp
                    });
                } else {
                    // Goal not found, maybe add it? Or fail. Let's fail or ignore.
                    // For robustness, if not found, let's treat update as add? No, 'update' implies existence.
                }
            });

        } else if (operation === 'delete') {
            if (!goal || !goal.id) throw createError({ statusCode: 400, statusMessage: 'Missing goal ID for delete operation' });

            await db.runTransaction(async (t) => {
                const doc = await t.get(docRef);
                if (!doc.exists) return;

                const data = doc.data() as GoalCollection;
                const existingGoals = data.goals || [];
                const newGoals = existingGoals.filter(g => g.id !== goal!.id);

                if (newGoals.length !== existingGoals.length) {
                    t.update(docRef, {
                        goals: newGoals,
                        updatedAt: timestamp
                    });
                }
            });
        }

        return { success: true, id: docId, operation };

    } catch (e: any) {
        console.error('Goal API Error:', e);
        throw createError({
            statusCode: e.statusCode || 500,
            statusMessage: e.statusMessage || 'Internal Server Error'
        });
    }
});
