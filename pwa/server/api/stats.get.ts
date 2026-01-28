import { useFirebase } from '../utils/firebase';
import { requireAuth } from '../utils/auth';

interface UserStats {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string | null;
    badges: string[];
    totalGoalsCompleted: number;
    dailyCompletions: Record<string, boolean>;
}

const DEFAULT_STATS: UserStats = {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    badges: [],
    totalGoalsCompleted: 0,
    dailyCompletions: {}
};

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const db = useFirebase();

    const statsRef = db.collection('users').doc(user.uid).collection('meta').doc('stats');
    const doc = await statsRef.get();

    if (doc.exists) {
        return doc.data() as UserStats;
    }

    return DEFAULT_STATS;
});
