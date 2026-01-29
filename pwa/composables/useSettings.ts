import { ref, computed } from 'vue'
import { useAuth } from './useAuth'

export function useSettings() {
    const { isLoggedIn, getIdToken } = useAuth()

    // Default categories
    const defaultCategories = ['Work', 'Personal', 'Family', 'Health']

    const settings = ref({
        categories: [...defaultCategories]
    })

    const loading = ref(false)

    async function fetchSettings() {
        if (!isLoggedIn.value) return

        loading.value = true
        try {
            const token = await getIdToken()
            const data: any = await $fetch('/api/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (data && data.categories) {
                settings.value.categories = data.categories
            }
        } catch (e) {
            console.error('Error fetching settings', e)
        } finally {
            loading.value = false
        }
    }

    async function updateCategories(newCategories: string[]) {
        if (!isLoggedIn.value) {
            // Local update if not logged in (though typically settings require auth)
            settings.value.categories = newCategories
            return
        }

        const previous = [...settings.value.categories]
        settings.value.categories = newCategories

        try {
            const token = await getIdToken()
            await $fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: {
                    categories: newCategories
                }
            })
        } catch (e) {
            console.error('Error updating categories', e)
            settings.value.categories = previous // Revert on error
        }
    }

    async function addCategory(category: string) {
        const trimmed = category.trim()
        if (!trimmed || settings.value.categories.includes(trimmed)) return

        const newCats = [...settings.value.categories, trimmed]
        await updateCategories(newCats)
    }

    async function removeCategory(category: string) {
        const newCats = settings.value.categories.filter(c => c !== category)
        await updateCategories(newCats)
    }

    return {
        categories: computed(() => settings.value.categories),
        loading,
        fetchSettings,
        addCategory,
        removeCategory
    }
}
