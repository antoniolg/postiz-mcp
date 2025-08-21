import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';

export interface PostizChannel {
    id: string;
    name: string;
    provider: string;
    profile?: {
        id: string;
        name: string;
        picture?: string;
    };
}

export interface PostizPost {
    id: string;
    content: string;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    scheduledDate?: string;
    publishedDate?: string;
    integrations: string[];
    images?: string[];
}

export interface CreatePostRequest {
    type: 'schedule' | 'now';
    date?: string;
    shortLink: boolean;
    tags: string[];
    posts: Array<{
        integration: {
            id: string;
        };
        value: Array<{
            content: string;
            image?: Array<{
                id: string;
                path: string;
            }>;
        }>;
        group: string;
        settings: Record<string, any>;
    }>;
}

export interface UpdatePostRequest {
    content?: string;
    integrations?: string[];
    scheduledDate?: string;
    images?: string[];
    status?: 'draft' | 'scheduled' | 'now';
}

export interface ListPostsQuery {
    startDate: string;
    endDate: string;
    customer?: string;
}

export interface UploadFileResponse {
    id: string;
    path: string;
    url: string;
    filename: string;
    size: number;
}

export interface GenerateVideoRequest {
    slides?: Array<{
        image: string;
        text?: string;
    }>;
    prompt?: string;
    voice?: string;
    duration?: number;
}

export class PostizApiClient {
    private client: AxiosInstance;

    constructor(private apiKey: string, private baseUrl: string) {
        this.client = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => {
                const isHtml = typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>');
                
                if (isHtml) {
                    throw new Error('Received HTML instead of JSON - Authentication likely failed');
                }
                
                return response;
            },
            (error) => {
                throw error;
            }
        );
    }

    async getChannels(): Promise<PostizChannel[]> {
        const response: AxiosResponse<PostizChannel[]> = await this.client.get('/integrations');
        return response.data;
    }

    async uploadFile(fileBuffer: Buffer, filename: string): Promise<UploadFileResponse> {
        const formData = new FormData();
        formData.append('file', fileBuffer, filename);

        const response: AxiosResponse<UploadFileResponse> = await this.client.post('/upload', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': this.apiKey,
            },
        });
        
        return response.data;
    }

    async listPosts(query: ListPostsQuery): Promise<PostizPost[]> {
        const response: AxiosResponse<PostizPost[]> = await this.client.get('/posts', {
            params: query,
        });
        return response.data;
    }

    async createPost(postData: CreatePostRequest): Promise<PostizPost> {
        const response: AxiosResponse<PostizPost> = await this.client.post('/posts', postData);
        return response.data;
    }

    async updatePost(id: string, postData: UpdatePostRequest): Promise<PostizPost> {
        const response: AxiosResponse<PostizPost> = await this.client.put(`/posts/${id}`, postData);
        return response.data;
    }

    async deletePost(id: string): Promise<void> {
        await this.client.delete(`/posts/${id}`);
    }

    async generateVideo(videoData: GenerateVideoRequest): Promise<any> {
        const response: AxiosResponse<any> = await this.client.post('/generate-video', videoData);
        return response.data;
    }
}