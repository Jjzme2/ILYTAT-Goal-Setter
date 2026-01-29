import { IlytatConfig } from '../config';

export class MediaService {
    private config: IlytatConfig;

    constructor(config: IlytatConfig) {
        this.config = config;
    }

    getUrl(path: string): string {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        const base = this.config.apiBaseMedia.endsWith('/')
            ? this.config.apiBaseMedia.slice(0, -1)
            : this.config.apiBaseMedia;

        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${base}${cleanPath}`;
    }

    getLogoUrl(): string {
        return this.getUrl('logo.png');
    }
}
