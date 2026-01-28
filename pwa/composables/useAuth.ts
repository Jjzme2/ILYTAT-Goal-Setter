import { ref, computed } from 'vue'
import { getApps } from 'firebase/app'
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User,
    type Auth
} from 'firebase/auth'

const user = ref<User | null>(null)
const loading = ref(true)
const initialized = ref(false)
const authError = ref<string | null>(null)

// Helper to safely get auth instance
function getFirebaseAuth(): Auth | null {
    if (getApps().length === 0) {
        return null
    }
    return getAuth()
}

export function useAuth() {
    const isLoggedIn = computed(() => !!user.value)
    const displayName = computed(() => user.value?.displayName || user.value?.email?.split('@')[0] || 'User')
    const photoURL = computed(() => user.value?.photoURL || null)
    const email = computed(() => user.value?.email || null)
    const uid = computed(() => user.value?.uid || null)

    async function login(emailInput: string, password: string) {
        const auth = getFirebaseAuth()
        if (!auth) {
            authError.value = 'Authentication not available'
            throw new Error('Firebase not initialized')
        }

        authError.value = null

        try {
            const result = await signInWithEmailAndPassword(auth, emailInput, password)
            user.value = result.user
            return result.user
        } catch (error: any) {
            console.error('Login error:', error)
            // User-friendly error messages
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                authError.value = 'Invalid email or password'
            } else if (error.code === 'auth/user-not-found') {
                authError.value = 'No account found with this email'
            } else if (error.code === 'auth/too-many-requests') {
                authError.value = 'Too many attempts. Please try again later.'
            } else {
                authError.value = 'Login failed. Please try again.'
            }
            throw error
        }
    }

    async function logout() {
        const auth = getFirebaseAuth()
        if (!auth) return

        try {
            await signOut(auth)
            user.value = null
        } catch (error) {
            console.error('Logout error:', error)
            throw error
        }
    }

    async function getIdToken(): Promise<string | null> {
        if (!user.value) return null
        try {
            return await user.value.getIdToken()
        } catch (error) {
            console.error('Error getting ID token:', error)
            return null
        }
    }

    function initAuth() {
        if (initialized.value) return

        const auth = getFirebaseAuth()
        if (!auth) {
            loading.value = false
            console.warn('Firebase not configured - sign in unavailable')
            return
        }

        onAuthStateChanged(auth, (firebaseUser) => {
            user.value = firebaseUser
            loading.value = false
        })
        initialized.value = true
    }

    function clearError() {
        authError.value = null
    }

    return {
        user,
        loading,
        authError,
        isLoggedIn,
        displayName,
        photoURL,
        email,
        uid,
        login,
        logout,
        getIdToken,
        initAuth,
        clearError
    }
}
