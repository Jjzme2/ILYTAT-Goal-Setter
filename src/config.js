/**
 * ILYTAT Goal Setter - Shared Configuration
 * Used by both CLI and PWA
 */
export const TIMEFRAMES = [
    {
        key: 'daily',
        label: 'Daily',
        icon: '📅',
        collection: 'daily-logs',
        description: "Today's focus",
        color: '#00BCD4' // Cyan
    },
    {
        key: 'weekly',
        label: 'Weekly',
        icon: '📆',
        collection: 'weekly-logs',
        description: "This week's targets",
        color: '#E040FB' // Magenta
    },
    {
        key: 'monthly',
        label: 'Monthly',
        icon: '🗓️',
        collection: 'monthly-logs',
        description: "This month's milestones",
        color: '#FFEB3B' // Yellow
    },
    {
        key: 'quarterly',
        label: 'Quarterly',
        icon: '📊',
        collection: 'quarterly-logs',
        description: "This quarter's objectives",
        color: '#FF9800' // Orange
    },
    {
        key: 'yearly',
        label: 'Yearly',
        icon: '🎯',
        collection: 'yearly-logs',
        description: "This year's vision",
        color: '#4CAF50' // Green
    }
];
// Helper to get timeframe config by key
export function getTimeframeConfig(key) {
    const config = TIMEFRAMES.find(t => t.key === key);
    if (!config)
        throw new Error(`Unknown timeframe: ${key}`);
    return config;
}
// All valid timeframe keys
export const TIMEFRAME_KEYS = TIMEFRAMES.map(t => t.key);
// Firebase configuration
export const FIREBASE_CONFIG = {
    // Path to service account for CLI (Admin SDK)
    serviceAccountPath: '~/.config/ilytat goal setter/service-account.json',
    // Client config for PWA (to be filled with your Firebase project details)
    client: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: ''
    }
};
// App metadata
export const APP_CONFIG = {
    name: 'ILYTAT Goal Protocol',
    shortName: 'ILYTAT',
    description: 'Daily, Weekly, Monthly, Quarterly, and Yearly goal tracking',
    themeColor: '#1a1a2e',
    backgroundColor: '#0f0f1a'
};
//# sourceMappingURL=config.js.map