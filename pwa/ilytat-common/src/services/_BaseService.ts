import { IlytatConfig } from '../config';

export abstract class BaseService {
    protected config: IlytatConfig;

    constructor(config: IlytatConfig) {
        this.config = config;
    }

    protected async fetch<T>(endpoint: string): Promise<T | null> {
        try {
            const url = `${this.config.apiBaseCommon}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-ILYTAT-ENV': this.config.env
                }
            });

            if (!response.ok) {
                console.error(`[IlytatCommon] Failed to fetch ${endpoint}: ${response.statusText}`);
                return null;
            }

            // Assume standard response wrapper from API
            const data = await response.json();
            return data;
        } catch (e) {
            console.error(`[IlytatCommon] Exception fetching ${endpoint}:`, e);
            return null;
        }
    }
}
