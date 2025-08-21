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
export declare class PostizApiClient {
    private apiKey;
    private baseUrl;
    private client;
    constructor(apiKey: string, baseUrl: string);
    getChannels(): Promise<PostizChannel[]>;
    uploadFile(fileBuffer: Buffer, filename: string): Promise<UploadFileResponse>;
    listPosts(query: ListPostsQuery): Promise<PostizPost[]>;
    createPost(postData: CreatePostRequest): Promise<PostizPost>;
    updatePost(id: string, postData: UpdatePostRequest): Promise<PostizPost>;
    deletePost(id: string): Promise<void>;
    generateVideo(videoData: GenerateVideoRequest): Promise<any>;
}
//# sourceMappingURL=postiz-api.d.ts.map