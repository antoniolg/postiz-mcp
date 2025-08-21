import axios from 'axios';
import { log, logRequest, logResponse } from './logger.js';
export class PostizApiClientAlternative {
    apiKey;
    baseUrl;
    client;
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        log('INFO', 'Initializing PostizApiClientAlternative', { baseUrl });
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 30000,
        });
        // Add request interceptor for debugging
        this.client.interceptors.request.use((config) => {
            logRequest(config.method?.toUpperCase() || 'UNKNOWN', `${config.baseURL}${config.url}`, config.headers, config.data);
            return config;
        });
        // Add response interceptor for debugging
        this.client.interceptors.response.use((response) => {
            const isHtml = typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>');
            logResponse(response.status, response.headers, response.data, isHtml);
            return response;
        }, (error) => {
            log('ERROR', 'API Request failed', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data || error.message
            });
            throw error;
        });
    }
    // Strategy 1: Same as your working code (Authorization header only)
    async getChannelsStrategy1() {
        log('INFO', 'Trying Strategy 1: Authorization header only');
        const response = await this.client.get('/integrations', {
            headers: {
                'Authorization': this.apiKey,
            },
        });
        return response.data;
    }
    // Strategy 2: Bearer token
    async getChannelsStrategy2() {
        log('INFO', 'Trying Strategy 2: Bearer token');
        const response = await this.client.get('/integrations', {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });
        return response.data;
    }
    // Strategy 3: X-API-Key header
    async getChannelsStrategy3() {
        log('INFO', 'Trying Strategy 3: X-API-Key header');
        const response = await this.client.get('/integrations', {
            headers: {
                'X-API-Key': this.apiKey,
            },
        });
        return response.data;
    }
    // Strategy 4: Query parameter
    async getChannelsStrategy4() {
        log('INFO', 'Trying Strategy 4: Query parameter');
        const response = await this.client.get('/integrations', {
            params: {
                apiKey: this.apiKey,
            },
        });
        return response.data;
    }
    // Strategy 5: Different endpoint paths
    async getChannelsStrategy5() {
        log('INFO', 'Trying Strategy 5: /api/integrations path');
        const response = await this.client.get('/api/integrations', {
            headers: {
                'Authorization': this.apiKey,
            },
        });
        return response.data;
    }
    // Strategy 6: Public API path specifically
    async getChannelsStrategy6() {
        log('INFO', 'Trying Strategy 6: /public/v1/integrations path');
        const response = await this.client.get('/public/v1/integrations', {
            headers: {
                'Authorization': this.apiKey,
            },
        });
        return response.data;
    }
    // Try all strategies sequentially
    async tryAllStrategies() {
        const strategies = [
            { name: 'Strategy 1 (Authorization header)', fn: () => this.getChannelsStrategy1() },
            { name: 'Strategy 2 (Bearer token)', fn: () => this.getChannelsStrategy2() },
            { name: 'Strategy 3 (X-API-Key)', fn: () => this.getChannelsStrategy3() },
            { name: 'Strategy 4 (Query param)', fn: () => this.getChannelsStrategy4() },
            { name: 'Strategy 5 (/api/integrations)', fn: () => this.getChannelsStrategy5() },
            { name: 'Strategy 6 (/public/v1/integrations)', fn: () => this.getChannelsStrategy6() },
        ];
        for (const strategy of strategies) {
            try {
                log('INFO', `Attempting ${strategy.name}`);
                const result = await strategy.fn();
                // Check if result looks like valid JSON (not HTML)
                if (typeof result === 'object' && !result.toString().includes('<!DOCTYPE html>')) {
                    log('INFO', `SUCCESS with ${strategy.name}!`);
                    return { strategy: strategy.name, result };
                }
                else {
                    log('ERROR', `${strategy.name} returned HTML instead of JSON`);
                }
            }
            catch (error) {
                log('ERROR', `${strategy.name} failed`, {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText
                });
            }
        }
        throw new Error('All strategies failed');
    }
}
//# sourceMappingURL=postiz-api-alternative.js.map