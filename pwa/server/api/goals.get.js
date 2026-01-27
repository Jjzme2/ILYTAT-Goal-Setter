import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js';
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
function getDocId(timeframe, dateStr) {
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
    const query = getQuery(event);
    const dateStr = query.date;
    const timeframes = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    const results = {};
    await Promise.all(timeframes.map(async (tf) => {
        try {
            const docId = getDocId(tf, dateStr);
            const docRef = db.collection(COLLECTIONS[tf]).doc(docId);
            const doc = await docRef.get();
            results[tf] = doc.exists ? doc.data() : { goals: [] };
        }
        catch (e) {
            console.error(`Error fetching ${tf}`, e);
            results[tf] = { goals: [] };
        }
    }));
    return results;
});
//# sourceMappingURL=goals.get.js.map