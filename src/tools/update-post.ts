import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient, UpdatePostRequest } from '../postiz-api.js';
import { z } from 'zod';
import { PostizToolDefinition } from './tool-definition.js';

const schema = {
    id: z.string().describe('The ID of the post to update'),
    content: z.string().optional().describe('New text content for the post'),
    integrations: z.array(z.string()).describe('Array of channel/integration IDs (required for updates)'),
    status: z.enum(['draft', 'scheduled', 'now']).optional().describe('New post status'),
    scheduledDate: z.string().optional().describe('ISO 8601 date string for scheduling. IMPORTANT: Always include timezone offset (e.g., "2024-01-15T17:15:00+01:00" for CET or "2024-01-15T17:15:00+02:00" for CEST). Without timezone specification, the system defaults to UTC which may cause incorrect scheduling. Use IANA timezone names in documentation but ISO format with offset in actual parameter.'),
    images: z.array(z.string()).optional().describe('New array of image URLs or file IDs')
} satisfies z.ZodRawShape;

export const updatePostTool: PostizToolDefinition<typeof schema> = {
    name: 'postiz-update-post',
    description: 'Update an existing post in Postiz',
    schema,
    cli: {
        command: 'update',
        aliases: ['update-post']
    },
    execute: async ({ id, content, integrations, status, scheduledDate, images }, { apiClient }) => {
        try {
            if (!id.trim()) {
                throw new Error('Post ID is required');
            }

            if (!integrations || integrations.length === 0) {
                throw new Error('At least one integration/channel ID is required');
            }

            const updateData: UpdatePostRequest = {
                integrations
            };

            if (content !== undefined) {
                if (!content.trim()) {
                    throw new Error('Post content cannot be empty');
                }
                updateData.content = content;
            }

            if (status !== undefined) {
                updateData.status = status;

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
            }

            if (scheduledDate !== undefined) {
                updateData.scheduledDate = scheduledDate;
            }

            if (images !== undefined) {
                updateData.images = images;
            }

            if (Object.keys(updateData).length === 1 && updateData.integrations) {
                throw new Error('At least one field must be provided for update');
            }

            const result = await apiClient.updatePost(id, updateData);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                success: true,
                                post: result,
                                message: `Post ${id} updated successfully`
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

export function registerUpdatePost(server: McpServer, apiClient: PostizApiClient) {
    server.tool(
        updatePostTool.name,
        updatePostTool.description,
        updatePostTool.schema,
        async (args) => updatePostTool.execute(args, { apiClient })
    );
}
