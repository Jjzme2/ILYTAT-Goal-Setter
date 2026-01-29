/**
 * CLI Authentication Module
 * Handles email/password login via Firebase Auth REST API
 * Stores credentials securely in ~/.config/ilytat-goal-setter/auth.json
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Firebase Auth REST API endpoints
const FIREBASE_AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
const FIREBASE_TOKEN_URL = 'https://securetoken.googleapis.com/v1/token';

export interface StoredAuth {
    uid: string;
    email: string;
    displayName?: string | undefined;
    idToken: string;
    refreshToken: string;
    expiresAt: number; // Unix timestamp in ms
}

interface FirebaseAuthResponse {
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    displayName?: string;
}

interface FirebaseRefreshResponse {
    id_token: string;
    refresh_token: string;
    expires_in: string;
    user_id: string;
}

// Config directory and file paths
const CONFIG_DIR = path.join(os.homedir(), '.config', 'ilytat-goal-setter');
const AUTH_FILE = path.join(CONFIG_DIR, 'auth.json');

/**
 * Get the Firebase API key from environment
 */
function getApiKey(): string {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
        throw new Error('FIREBASE_API_KEY not set in environment');
    }
    return apiKey;
}

/**
 * Ensure config directory exists with proper permissions
 */
function ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
}

/**
 * Save authentication data securely
 */
function saveAuth(auth: StoredAuth): void {
    ensureConfigDir();
    fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), { mode: 0o600 });
}

/**
 * Load stored authentication data
 */
export function getStoredAuth(): StoredAuth | null {
    if (!fs.existsSync(AUTH_FILE)) {
        return null;
    }

    try {
        const data = fs.readFileSync(AUTH_FILE, 'utf-8');
        return JSON.parse(data) as StoredAuth;
    } catch {
        return null;
    }
}

/**
 * Clear stored authentication data (logout)
 */
export function clearAuth(): void {
    if (fs.existsSync(AUTH_FILE)) {
        fs.unlinkSync(AUTH_FILE);
    }
}

/**
 * Check if token is expired (with 5 min buffer)
 */
function isTokenExpired(auth: StoredAuth): boolean {
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    return Date.now() >= auth.expiresAt - bufferMs;
}

/**
 * Refresh the ID token using the refresh token
 */
export async function refreshToken(auth: StoredAuth): Promise<StoredAuth | null> {
    const apiKey = getApiKey();

    try {
        const response = await fetch(`${FIREBASE_TOKEN_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=refresh_token&refresh_token=${auth.refreshToken}`
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Token refresh failed:', error);
            return null;
        }

        const data: FirebaseRefreshResponse = await response.json();

        const updatedAuth: StoredAuth = {
            ...auth,
            idToken: data.id_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + parseInt(data.expires_in) * 1000
        };

        saveAuth(updatedAuth);
        return updatedAuth;
    } catch (error) {
        console.error('Token refresh error:', error);
        return null;
    }
}

/**
 * Get valid authentication (refreshes if needed)
 */
export async function getValidAuth(): Promise<StoredAuth | null> {
    const auth = getStoredAuth();
    if (!auth) return null;

    if (isTokenExpired(auth)) {
        return await refreshToken(auth);
    }

    return auth;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<StoredAuth> {
    const apiKey = getApiKey();

    const response = await fetch(`${FIREBASE_AUTH_BASE}/accounts:signInWithPassword?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            returnSecureToken: true
        })
    });

    if (!response.ok) {
        const error = await response.json();
        const errorCode = error?.error?.message || 'UNKNOWN_ERROR';

        // User-friendly error messages
        switch (errorCode) {
            case 'INVALID_LOGIN_CREDENTIALS':
            case 'EMAIL_NOT_FOUND':
            case 'INVALID_PASSWORD':
                throw new Error('Invalid email or password');
            case 'USER_DISABLED':
                throw new Error('This account has been disabled');
            case 'TOO_MANY_ATTEMPTS_TRY_LATER':
                throw new Error('Too many attempts. Please try again later.');
            default:
                throw new Error(`Login failed: ${errorCode}`);
        }
    }

    const data: FirebaseAuthResponse = await response.json();

    const auth: StoredAuth = {
        uid: data.localId,
        email: data.email,
        displayName: data.displayName,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + parseInt(data.expiresIn) * 1000
    };

    saveAuth(auth);
    return auth;
}

/**
 * Logout - clears stored credentials
 */
export function logout(): void {
    clearAuth();
}
