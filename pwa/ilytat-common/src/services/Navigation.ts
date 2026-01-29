import { BaseService } from './_BaseService';
import { CommonResponse, NavigationPayload } from '../types';

export class NavigationService extends BaseService {
    async get(): Promise<NavigationPayload | null> {
        const result = await this.fetch<CommonResponse<NavigationPayload>>('/navigation');
        return result?.payload || null;
    }
}
