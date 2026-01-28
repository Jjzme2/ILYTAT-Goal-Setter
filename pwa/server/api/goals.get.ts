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

            results[tf] = doc.exists ? doc.data() : { goals: [] };
        } catch (e) {
            console.error(`Error fetching ${tf}`, e);
            results[tf] = { goals: [] };
        }
    }));

    return results;
});
