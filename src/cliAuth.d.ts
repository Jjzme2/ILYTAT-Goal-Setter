/**
 * CLI Authentication Module
 * Handles email/password login via Firebase Auth REST API
 * Stores credentials securely in ~/.config/ilytat-goal-setter/auth.json
 */
export interface StoredAuth {
    uid: string;
    email: string;
    displayName?: string | undefined;
    idToken: string;
    refreshToken: string;
    expiresAt: number;
}
/**
 * Load stored authentication data
 */
export declare function getStoredAuth(): StoredAuth | null;
/**
 * Clear stored authentication data (logout)
 */
export declare function clearAuth(): void;
/**
 * Refresh the ID token using the refresh token
 */
export declare function refreshToken(auth: StoredAuth): Promise<StoredAuth | null>;
/**
 * Get valid authentication (refreshes if needed)
 */
export declare function getValidAuth(): Promise<StoredAuth | null>;
/**
 * Login with email and password
 */
export declare function login(email: string, password: string): Promise<StoredAuth>;
/**
 * Logout - clears stored credentials
 */
export declare function logout(): void;
//# sourceMappingURL=cliAuth.d.ts.map