import axios from 'axios';
import FormData from 'form-data';
export class PostizApiClient {
    apiKey;
    baseUrl;
    client;
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
        // Add response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            const isHtml = typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>');
            if (isHtml) {
                throw new Error('Received HTML instead of JSON - Authentication likely failed');
            }
            return response;
        }, (error) => {
            throw error;
        });
    }
    async getChannels() {
        const response = await this.client.get('/integrations');
        return response.data;
    }
    async uploadFile(fileBuffer, filename) {
        const formData = new FormData();
        formData.append('file', fileBuffer, filename);
        const response = await this.client.post('/upload', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': this.apiKey,
            },
        });
        return response.data;
    }
    async listPosts(query) {
        const response = await this.client.get('/posts', {
            params: query,
        });
        return response.data;
    }
    async createPost(postData) {
        const response = await this.client.post('/posts', postData);
        return response.data;
    }
    async updatePost(id, postData) {
        const response = await this.client.put(`/posts/${id}`, postData);
        return response.data;
    }
    async deletePost(id) {
        await this.client.delete(`/posts/${id}`);
    }
    async generateVideo(videoData) {
        const response = await this.client.post('/generate-video', videoData);
        return response.data;
    }
}
//# sourceMappingURL=postiz-api.js.map