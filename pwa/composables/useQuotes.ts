import { ref } from 'vue'
import { QuotesService } from '../ilytat-common/src/services/Quotes'
import { IlytatConfig } from '../ilytat-common/src/config'
import type { Quote } from '../ilytat-common/src/types'

// Initialize configuration and service
// We can use default config which points to prod API for now, or use runtime config if needed.
const config = new IlytatConfig()
const quotesService = new QuotesService(config)

export function useQuotes() {
    const quote = ref<Quote | null>(null)
    const loading = ref(false)

    async function fetchRandomQuote() {
        if (quote.value) return // Already loaded

        loading.value = true
        console.log('[useQuotes] Fetching quotes...')
        try {
            const quotes = await quotesService.getAll()
            console.log('[useQuotes] Fetched quotes:', quotes)

            if (quotes && quotes.length > 0) {
                // Select quote based on today's date to make it "Daily"
                const today = new Date().toISOString().split('T')[0]
                const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % quotes.length
                quote.value = quotes[index]
                console.log('[useQuotes] Selected quote:', quote.value)
            } else {
                console.warn('[useQuotes] No quotes found.')
            }
        } catch (e) {
            console.error('[useQuotes] Failed to fetch quotes', e)
        } finally {
            loading.value = false
        }
    }

    return {
        quote,
        loading,
        fetchRandomQuote
    }
}
