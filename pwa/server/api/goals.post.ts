import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js';
import { FieldValue } from 'firebase-admin/firestore';
import { useFirebase } from '../utils/firebase';

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

export default defineEventHandler(async (event) => {
    const db = useFirebase();
    const body = await readBody(event);
    const { timeframe, data, date } = body;

    if (!timeframe || !data) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing timeframe or data',
        });
    }

    try {
        const docId = getDocId(timeframe, date);
        const tfKey = timeframe as keyof typeof COLLECTIONS;

        if (!COLLECTIONS[tfKey]) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid timeframe' });
        }

        const docRef = db.collection(COLLECTIONS[tfKey]).doc(docId);

        // Ensure critical fields
        const payload = {
            ...data,
            id: docId,
            updatedAt: FieldValue.serverTimestamp()
        };

        // If creating new, add createdAt if not present
        if (!data.createdAt) {
            payload.createdAt = FieldValue.serverTimestamp();
        }

        await docRef.set(payload, { merge: true });

        return { success: true, id: docId };
    } catch (e: unknown) {
        const error = e as Error & { code?: string };
        console.error('=== GOAL API ERROR ===');
        console.error('Error Name:', error?.name);
        console.error('Error Message:', error?.message);
        console.error('Error Code:', error?.code);
        console.error('Error Stack:', error?.stack);
        console.error('Request Body:', JSON.stringify(body, null, 2));
        console.error('=== END ERROR ===');

        throw createError({
            statusCode: 500,
            statusMessage: error?.message || 'Internal Server Error',
        });
    }
});
