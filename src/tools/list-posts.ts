import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { z } from 'zod';
import { PostizToolDefinition } from './tool-definition.js';

const schema = {
    startDate: z
        .string()
        .describe(
            'Start date in YYYY-MM-DD or ISO 8601 datetime. Date-only inputs are expanded to 00:00:00.'
        ),
    endDate: z
        .string()
        .describe(
            'End date in YYYY-MM-DD or ISO 8601 datetime. Date-only inputs are expanded to 23:59:59.999.'
        ),
    customer: z.string().optional().describe('Optional customer filter')
} satisfies z.ZodRawShape;

export const listPostsTool: PostizToolDefinition<typeof schema> = {
    name: 'postiz-list-posts',
    description:
        'List posts from Postiz with date range filtering. Date-only inputs are expanded to the full day.',
    schema,
    cli: {
        command: 'posts',
        aliases: ['list-posts']
    },
    execute: async ({ startDate, endDate, customer }, { apiClient }) => {
        try {
            const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
            const startIsDateOnly = dateOnlyRegex.test(startDate);
            const endIsDateOnly = dateOnlyRegex.test(endDate);

            if (!startIsDateOnly && isNaN(Date.parse(startDate))) {
                throw new Error('Invalid startDate. Use YYYY-MM-DD or ISO 8601 datetime');
            }

            if (!endIsDateOnly && isNaN(Date.parse(endDate))) {
                throw new Error('Invalid endDate. Use YYYY-MM-DD or ISO 8601 datetime');
            }

            const normalizedStartDate = startIsDateOnly ? `${startDate}T00:00:00` : startDate;
            const normalizedEndDate = endIsDateOnly ? `${endDate}T23:59:59.999` : endDate;

            const query = {
                startDate: normalizedStartDate,
                endDate: normalizedEndDate,
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
                                    startDate: normalizedStartDate,
                                    endDate: normalizedEndDate
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
