import { IlytatConfig, IlytatConfigOptions } from './config';
import { NavigationService } from './services/Navigation';
import { QuotesService } from './services/Quotes';
import { MediaService } from './services/Media';

export class IlytatClient {
    public readonly config: IlytatConfig;
    public readonly navigation: NavigationService;
    public readonly quotes: QuotesService;
    public readonly media: MediaService;

    constructor(options: IlytatConfigOptions = {}) {
        this.config = new IlytatConfig(options);

        this.navigation = new NavigationService(this.config);
        this.quotes = new QuotesService(this.config);
        this.media = new MediaService(this.config);
    }
}
