import dayjs from 'dayjs';
import { FieldValue } from 'firebase-admin/firestore';
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

const STREAK_BADGES = [
    { id: 'streak-3', requirement: 3 },
    { id: 'streak-7', requirement: 7 },
    { id: 'streak-14', requirement: 14 },
    { id: 'streak-30', requirement: 30 },
    { id: 'streak-60', requirement: 60 },
    { id: 'streak-100', requirement: 100 },
];

const TOTAL_BADGES = [
    { id: 'total-10', requirement: 10 },
    { id: 'total-50', requirement: 50 },
    { id: 'total-100', requirement: 100 },
];

function calculateStreak(dailyCompletions: Record<string, boolean>, todayStr: string): number {
    let streak = 0;
    let checkDate = dayjs(todayStr);

    // Check today and go backwards
    while (true) {
        const dateStr = checkDate.format('YYYY-MM-DD');
        if (dailyCompletions[dateStr]) {
            streak++;
            checkDate = checkDate.subtract(1, 'day');
        } else {
            break;
        }
    }

    return streak;
}

function checkBadges(stats: UserStats): string[] {
    const badges = [...stats.badges];

    // Check streak badges
    for (const badge of STREAK_BADGES) {
        if (stats.currentStreak >= badge.requirement && !badges.includes(badge.id)) {
            badges.push(badge.id);
        }
    }

    // Check total badges
    for (const badge of TOTAL_BADGES) {
        if (stats.totalGoalsCompleted >= badge.requirement && !badges.includes(badge.id)) {
            badges.push(badge.id);
        }
    }

    return badges;
}

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const db = useFirebase();
    const body = await readBody(event);

    const { date, allCompleted, goalsCompleted = 0 } = body;

    if (!date) {
        throw createError({ statusCode: 400, statusMessage: 'Date is required' });
    }

    const statsRef = db.collection('users').doc(user.uid).collection('meta').doc('stats');
    const doc = await statsRef.get();

    let stats: UserStats = doc.exists ? doc.data() as UserStats : {
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        badges: [],
        totalGoalsCompleted: 0,
        dailyCompletions: {}
    };

    // Update daily completions
    stats.dailyCompletions[date] = allCompleted;

    // Update total if goals were completed
    if (goalsCompleted > 0) {
        stats.totalGoalsCompleted += goalsCompleted;
    }

    // Recalculate streak
    if (allCompleted) {
        stats.currentStreak = calculateStreak(stats.dailyCompletions, date);
        stats.lastCompletedDate = date;

        // Update longest if current is longer
        if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
        }
    } else {
        // Recalculate from yesterday if today not complete
        const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
        stats.currentStreak = calculateStreak(stats.dailyCompletions, yesterday);
    }

    // Check for new badges
    stats.badges = checkBadges(stats);

    // Save
    await statsRef.set(stats, { merge: true });

    return stats;
});
