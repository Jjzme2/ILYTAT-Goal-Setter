import { ref, computed } from 'vue'
import { useAuth } from './useAuth'

interface UserStats {
    currentStreak: number
    longestStreak: number
    lastCompletedDate: string | null
    badges: string[]
    totalGoalsCompleted: number
    dailyCompletions: Record<string, boolean>
}

interface Badge {
    id: string
    name: string
    icon: string
    description: string
    requirement: number
    type: 'streak' | 'total'
}

const BADGES: Badge[] = [
    { id: 'streak-3', name: 'Getting Started', icon: '🌱', description: '3-day streak', requirement: 3, type: 'streak' },
    { id: 'streak-7', name: 'Week Warrior', icon: '🔥', description: '7-day streak', requirement: 7, type: 'streak' },
    { id: 'streak-14', name: 'Two Week Titan', icon: '⚡', description: '14-day streak', requirement: 14, type: 'streak' },
    { id: 'streak-30', name: 'Monthly Master', icon: '🏆', description: '30-day streak', requirement: 30, type: 'streak' },
    { id: 'streak-60', name: 'Unstoppable', icon: '💎', description: '60-day streak', requirement: 60, type: 'streak' },
    { id: 'streak-100', name: 'Century Club', icon: '👑', description: '100-day streak', requirement: 100, type: 'streak' },
    { id: 'total-10', name: 'First Steps', icon: '✅', description: '10 goals completed', requirement: 10, type: 'total' },
    { id: 'total-50', name: 'Goal Getter', icon: '🎯', description: '50 goals completed', requirement: 50, type: 'total' },
    { id: 'total-100', name: 'Centurion', icon: '💯', description: '100 goals completed', requirement: 100, type: 'total' },
]

const stats = ref<UserStats>({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    badges: [],
    totalGoalsCompleted: 0,
    dailyCompletions: {}
})

const loading = ref(false)

export function useStreaks() {
    const { getIdToken, isLoggedIn } = useAuth()

    const earnedBadges = computed(() => {
        return BADGES.filter(badge => stats.value.badges.includes(badge.id))
    })

    const nextBadge = computed(() => {
        const unearnedStreakBadges = BADGES
            .filter(b => b.type === 'streak' && !stats.value.badges.includes(b.id))
            .sort((a, b) => a.requirement - b.requirement)
        return unearnedStreakBadges[0] || null
    })

    const streakProgress = computed(() => {
        if (!nextBadge.value) return 100
        return Math.min(100, Math.round((stats.value.currentStreak / nextBadge.value.requirement) * 100))
    })

    async function fetchStats() {
        if (!isLoggedIn.value) return
        loading.value = true

        try {
            const token = await getIdToken()
            const data = await $fetch<UserStats>('/api/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            stats.value = data
        } catch (e) {
            console.error('Error fetching stats:', e)
        } finally {
            loading.value = false
        }
    }

    async function recordDailyCompletion(date: string, allCompleted: boolean) {
        if (!isLoggedIn.value) return

        try {
            const token = await getIdToken()
            const data = await $fetch<UserStats>('/api/stats', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: { date, allCompleted }
            })
            stats.value = data
        } catch (e) {
            console.error('Error recording completion:', e)
        }
    }

    function checkNewBadges(oldBadges: string[]): Badge[] {
        return BADGES.filter(badge =>
            stats.value.badges.includes(badge.id) && !oldBadges.includes(badge.id)
        )
    }

    return {
        stats,
        loading,
        earnedBadges,
        nextBadge,
        streakProgress,
        BADGES,
        fetchStats,
        recordDailyCompletion,
        checkNewBadges
    }
}
