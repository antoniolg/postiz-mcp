import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { z } from 'zod';

export function registerCreatePost(server: McpServer, apiClient: PostizApiClient) {
    server.tool(
        'postiz-create-post',
        'Create a new post in Postiz (draft, scheduled, or immediate)',
        {
            content: z.array(z.string()).describe('Array of text content for posts (one item = single post, multiple items = thread/multiple posts). IMPORTANT: If user wants to add comments to posts, each comment is a separate post in this array.'),
            integrations: z.array(z.string()).describe('Array of channel/integration IDs to post to'),
            status: z.enum(['draft', 'scheduled', 'now']).optional().describe('Post status: draft (save as draft), scheduled (schedule for later), or now (publish immediately)'),
            scheduledDate: z.string().optional().describe('ISO 8601 date string for when to schedule the post (required if status is "scheduled"). IMPORTANT: Use local timezone format like "2024-01-15T15:00:00" - the system will handle timezone conversion. Do NOT use UTC format.'),
            images: z.array(z.string()).optional().describe('Array of image PUBLIC URLs (not IDs) to include with the first post. IMPORTANT: When uploading images via postiz-upload-file, use the returned public URL, not the file ID.')
        },
        async (args) => {
            try {
                const { content, integrations, status = 'draft', scheduledDate, images } = args;
                
                // Validate required fields
                if (!content || content.length === 0) {
                    throw new Error('Content array cannot be empty');
                }
                
                if (content.some(c => !c.trim())) {
                    throw new Error('Post content items cannot be empty');
                }
                
                if (!integrations || integrations.length === 0) {
                    throw new Error('At least one integration/channel ID is required');
                }
                
                // Validate scheduled date if status is scheduled
                if (status === 'scheduled') {
                    if (!scheduledDate) {
                        throw new Error('scheduledDate is required when status is "scheduled"');
                    }
                    
                    // Check if date is valid and in the future
                    const scheduleDateTime = new Date(scheduledDate);
                    if (isNaN(scheduleDateTime.getTime())) {
                        throw new Error('Invalid scheduledDate format. Use ISO 8601 format (e.g., "2024-01-15T10:00:00Z")');
                    }
                    
                    if (scheduleDateTime <= new Date()) {
                        throw new Error('scheduledDate must be in the future');
                    }
                }
                
                // Transform to the correct Postiz API format
                const postData = {
                    type: status === 'scheduled' ? 'schedule' as const : 'now' as const,
                    ...(scheduledDate && status === 'scheduled' && { date: scheduledDate }),
                    shortLink: false,
                    tags: [],
                    posts: integrations.map(integrationId => ({
                        integration: {
                            id: integrationId
                        },
                        value: content.map((postContent, index) => ({
                            content: postContent,
                            image: (index === 0 && images && images.length > 0) ? 
                                images.map(img => ({
                                    id: img,
                                    path: img
                                })) : []
                        })),
                        group: Date.now().toString(),
                        settings: {}
                    }))
                };
                
                const result = await apiClient.createPost(postData);
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                post: result,
                                message: `Post ${status === 'now' ? 'published' : status === 'scheduled' ? 'scheduled' : 'saved as draft'} successfully`
                            }, null, 2)
                        }
                    ]
                };
            } catch (error: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: error.response?.data?.message || error.message,
                                statusCode: error.response?.status
                            }, null, 2)
                        }
                    ],
                    isError: true
                };
            }
        }
    );
}