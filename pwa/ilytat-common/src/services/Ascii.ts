import { IlytatConfig } from '../config';
import { CommonResponse, AsciiArt } from '../types';

export class AsciiService {
    private config: IlytatConfig;

    constructor(config?: IlytatConfig) {
        this.config = config || new IlytatConfig();
    }

    /**
     * Fetches all available ASCII arts from the API
     */
    async getAll(): Promise<AsciiArt[]> {
        try {
            const url = `${this.config.apiBaseCommon}/ascii-arts`;
            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`[AsciiService] Failed to fetch from ${url}: Status ${response.status}`);
                return [];
            }

            const data = await response.json() as CommonResponse<AsciiArt[]>;
            return data.payload || [];
        } catch (e) {
            console.error("[AsciiService] Error fetching ASCII arts:", e);
            return [];
        }
    }

    /**
     * Gets a random ASCII art piece
     */
    async getRandom(): Promise<AsciiArt | null> {
        const collection = await this.getAll();
        if (collection.length === 0) return null;
        return collection[Math.floor(Math.random() * collection.length)];
    }

    /**
     * Returns a standard fallback ASCII art banner
     */
    getFallback(): string {
        return `
      (  )   (   )  )
       ) (   )  (  (
       ( )  (    ) )
       _____________
      <_____________> ___
      |             |/ _ \\
      |               | | |
      |               |_| |
      |             |\\___/
      \\_____________/
`.trim()
    }
}

export const asciiService = new AsciiService();
