export interface IlytatConfigOptions {
    env?: string;
    apiBaseCommon?: string;
    apiBaseMedia?: string;
}

export class IlytatConfig {
    public readonly env: string;
    public readonly apiBaseCommon: string;
    public readonly apiBaseMedia: string;

    constructor(options: IlytatConfigOptions = {}) {
        this.env = options.env || 'development';
        this.apiBaseCommon = options.apiBaseCommon || 'https://common.ilytat.com/api';
        this.apiBaseMedia = options.apiBaseMedia || 'https://media.ilytat.com/';
    }
}
