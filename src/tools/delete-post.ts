import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { z } from 'zod';
import { PostizToolDefinition } from './tool-definition.js';

const schema = {
    id: z.string().describe('The ID of the post to delete')
} satisfies z.ZodRawShape;

export const deletePostTool: PostizToolDefinition<typeof schema> = {
    name: 'postiz-delete-post',
    description: 'Delete a post from Postiz',
    schema,
    execute: async ({ id }, { apiClient }) => {
        try {
            if (!id.trim()) {
                throw new Error('Post ID is required');
            }

            await apiClient.deletePost(id);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                success: true,
                                message: `Post ${id} deleted successfully`
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

export function registerDeletePost(server: McpServer, apiClient: PostizApiClient) {
    server.tool(
        deletePostTool.name,
        deletePostTool.description,
        deletePostTool.schema,
        async (args) => deletePostTool.execute(args, { apiClient })
    );
}
