import { BaseService } from './_BaseService';
import { CommonResponse, Quote } from '../types';

export class QuotesService extends BaseService {
    async getAll(): Promise<Quote[]> {
        const result = await this.fetch<CommonResponse<Quote[]>>('/quotes');
        return result?.payload || [];
    }
}
