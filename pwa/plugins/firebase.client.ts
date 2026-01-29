import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    // Only initialize if no app exists
    if (getApps().length > 0) {
        return {
            provide: {
                firebaseAuth: getAuth(getApps()[0])
            }
        }
    }

    // Get config from runtime config (populated from NUXT_PUBLIC_* env vars)
    // Falls back to hardcoded values for development if env vars not loaded
    const firebaseConfig = {
        apiKey: config.public.firebaseApiKey,
        authDomain: config.public.firebaseAuthDomain,
        projectId: config.public.firebaseProjectId,
        storageBucket: config.public.firebaseStorageBucket,
        messagingSenderId: config.public.firebaseMessagingSenderId,
        appId: config.public.firebaseAppId
    }

    try {
        const app = initializeApp(firebaseConfig)
        const auth = getAuth(app)

        console.log('[Firebase] ✓ Initialized')

        return {
            provide: {
                firebaseAuth: auth
            }
        }
    } catch (error) {
        console.error('[Firebase] Failed to initialize:', error)
    }
})
