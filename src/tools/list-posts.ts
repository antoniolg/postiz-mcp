import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { z } from 'zod';
import { PostizToolDefinition } from './tool-definition.js';

const schema = {
    startDate: z.string().describe('Start date in YYYY-MM-DD format'),
    endDate: z.string().describe('End date in YYYY-MM-DD format'),
    customer: z.string().optional().describe('Optional customer filter')
} satisfies z.ZodRawShape;

export const listPostsTool: PostizToolDefinition<typeof schema> = {
    name: 'postiz-list-posts',
    description: 'List posts from Postiz with date range filtering',
    schema,
    cli: {
        command: 'posts',
        aliases: ['list-posts']
    },
    execute: async ({ startDate, endDate, customer }, { apiClient }) => {
        try {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
                throw new Error('Invalid date format. Use YYYY-MM-DD format for both startDate and endDate');
            }

            const query = {
                startDate,
                endDate,
                ...(customer && { customer })
            };

            const posts = await apiClient.listPosts(query);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                success: true,
                                posts,
                                count: posts.length,
                                dateRange: {
                                    startDate,
                                    endDate
                                }
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

export function registerListPosts(server: McpServer, apiClient: PostizApiClient) {
    server.tool(
        listPostsTool.name,
        listPostsTool.description,
        listPostsTool.schema,
        async (args) => listPostsTool.execute(args, { apiClient })
    );
}
