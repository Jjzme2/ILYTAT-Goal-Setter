/**
 * ILYTAT Goal Setter - Shared Configuration
 * Used by both CLI and PWA
 */
export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export interface TimeFrameConfig {
    key: TimeFrame;
    label: string;
    icon: string;
    collection: string;
    description: string;
    color: string;
}
export declare const TIMEFRAMES: TimeFrameConfig[];
export declare function getTimeframeConfig(key: TimeFrame): TimeFrameConfig;
export declare const TIMEFRAME_KEYS: TimeFrame[];
export declare const FIREBASE_CONFIG: {
    serviceAccountPath: string;
    client: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
    };
};
export declare const APP_CONFIG: {
    name: string;
    shortName: string;
    description: string;
    themeColor: string;
    backgroundColor: string;
};
//# sourceMappingURL=config.d.ts.map