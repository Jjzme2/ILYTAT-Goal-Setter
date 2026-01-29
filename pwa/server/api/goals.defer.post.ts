import dayjs from 'dayjs'
import { useFirebase } from '../utils/firebase'
import { requireAuth } from '../utils/auth'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const db = useFirebase()
    const body = await readBody(event)
    const { goal, sourceDate, targetDate, timeframe } = body

    if (!goal || !goal.id || !sourceDate || !targetDate || timeframe !== 'daily') {
        throw createError({ statusCode: 400, statusMessage: 'Invalid parameters. Only daily lists support deferral.' })
    }

    const dailyRef = db.collection('users').doc(user.uid).collection('daily-logs')
    const sourceDocRef = dailyRef.doc(sourceDate)
    const targetDocRef = dailyRef.doc(targetDate)

    try {
        await db.runTransaction(async (t) => {
            const sourceDoc = await t.get(sourceDocRef)
            const targetDoc = await t.get(targetDocRef)

            if (!sourceDoc.exists) {
                throw new Error('Source document does not exist')
            }

            const sourceData = sourceDoc.data()
            const sourceGoals = sourceData?.goals || []

            // Remove from source
            const updatedSourceGoals = sourceGoals.filter((g: any) => g.id !== goal.id)

            // Add to target
            const targetGoals = targetDoc.exists ? (targetDoc.data()?.goals || []) : []

            // Re-id collision check (unlikely but safe)
            const newId = targetGoals.length > 0
                ? String(Math.max(...targetGoals.map((g: any) => parseInt(g.id) || 0)) + 1)
                : '1'

            const newGoal = {
                ...goal,
                id: newId,
                createdAt: new Date().toISOString(), // Reset creation date for the new day? Or keep original? Let's reset to avoid immediate rollover logic triggering again.
                // actually, let's keep original creation date but update it to now so it doesn't get auto-rolled-over immediately if we run logic again.
            }

            // Update source
            t.set(sourceDocRef, { goals: updatedSourceGoals, updatedAt: new Date().toISOString() }, { merge: true })

            // Update target
            t.set(targetDocRef, {
                id: targetDate,
                goals: [...targetGoals, newGoal],
                updatedAt: new Date().toISOString()
            }, { merge: true })
        })

        return { success: true }
    } catch (e: any) {
        console.error('Defer error', e)
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
