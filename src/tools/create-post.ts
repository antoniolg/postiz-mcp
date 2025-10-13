import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { z } from 'zod';
import { PostizToolDefinition } from './tool-definition.js';

const schema = {
    content: z.array(z.string()).describe('Array of text content for posts (one item = single post, multiple items = thread/multiple posts). IMPORTANT: If user wants to add comments to posts, each comment is a separate post in this array.'),
    integrations: z.array(z.string()).describe('Array of channel/integration IDs to post to'),
    status: z.enum(['draft', 'scheduled', 'now']).optional().describe('Post status: draft (save as draft), scheduled (schedule for later), or now (publish immediately)'),
    scheduledDate: z.string().optional().describe('ISO 8601 date string for scheduling. IMPORTANT: Always include timezone offset (e.g., "2024-01-15T17:15:00+01:00" for CET or "2024-01-15T17:15:00+02:00" for CEST). Without timezone specification, the system defaults to UTC which may cause incorrect scheduling. Use IANA timezone names in documentation but ISO format with offset in actual parameter.'),
    images: z.array(z.string()).optional().describe('Array of image PUBLIC URLs (not IDs) to include with the first post. IMPORTANT: When uploading images via postiz-upload-file, use the returned public URL, not the file ID.')
} satisfies z.ZodRawShape;

export const createPostTool: PostizToolDefinition<typeof schema> = {
    name: 'postiz-create-post',
    description: 'Create a new post in Postiz (draft, scheduled, or immediate)',
    schema,
    execute: async (args, { apiClient }) => {
        try {
            const { content, integrations, status = 'draft', scheduledDate, images } = args;

            if (!content || content.length === 0) {
                throw new Error('Content array cannot be empty');
            }

            if (content.some((c) => !c.trim())) {
                throw new Error('Post content items cannot be empty');
            }

            if (!integrations || integrations.length === 0) {
                throw new Error('At least one integration/channel ID is required');
            }

            if (status === 'scheduled') {
                if (!scheduledDate) {
                    throw new Error('scheduledDate is required when status is "scheduled"');
                }

                const scheduleDateTime = new Date(scheduledDate);
                if (isNaN(scheduleDateTime.getTime())) {
                    throw new Error('Invalid scheduledDate format. Use ISO 8601 format with timezone offset (e.g., "2024-01-15T17:15:00+01:00")');
                }

                if (scheduleDateTime <= new Date()) {
                    throw new Error('scheduledDate must be in the future');
                }
            }

            const postData = {
                type: status === 'scheduled' ? 'schedule' as const : 'now' as const,
                date: status === 'scheduled' ? scheduledDate : new Date().toISOString(),
                shortLink: false,
                tags: [],
                posts: integrations.map((integrationId) => ({
                    integration: {
                        id: integrationId
                    },
                    value: content.map((postContent, index) => ({
                        content: postContent,
                        image: index === 0 && images && images.length > 0
                            ? images.map((img) => ({
                                  id: img,
                                  path: img
                              }))
                            : []
                    })),
                    group: Date.now().toString(),
                    settings: {
                        post_type: 'post'
                    }
                }))
            };

            const result = await apiClient.createPost(postData);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                success: true,
                                post: result,
                                message: `Post ${status === 'now' ? 'published' : status === 'scheduled' ? 'scheduled' : 'saved as draft'} successfully`
                            },
                            null,
                            2
                        )
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                success: false,
                                error: error.response?.data?.message || error.message,
                                statusCode: error.response?.status
                            },
                            null,
                            2
                        )
                    }
                ],
                isError: true
            };
        }
    }
};

export function registerCreatePost(server: McpServer, apiClient: PostizApiClient) {
    server.tool(
        createPostTool.name,
        createPostTool.description,
        createPostTool.schema,
        async (args) => createPostTool.execute(args, { apiClient })
    );
}
